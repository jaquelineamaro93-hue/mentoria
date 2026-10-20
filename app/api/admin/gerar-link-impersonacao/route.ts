import { randomBytes, createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const SEM_CACHE={'Cache-Control':'private, no-store'};
const MAX_INSPECAO_SEGUNDOS=2*60*60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error:authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401, headers:SEM_CACHE });
  }

  const { data: meuPerfil } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).maybeSingle();

  if (!meuPerfil?.is_admin) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403, headers:SEM_CACHE });
  }

  let body: { userId?:unknown };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Requisição inválida.' }, { status:400, headers:SEM_CACHE });
  }
  const targetUserId = body?.userId;

  if (typeof targetUserId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId) ||
      targetUserId===user.id) {
    return NextResponse.json({ error: 'Usuário inválido para inspeção.' }, { status: 400, headers:SEM_CACHE });
  }

  try {
    const admin = createAdminClient();
    const { data: targetProfile, error:targetError } = await admin
      .from('profiles')
      .select('id,nome,is_admin')
      .eq('id', targetUserId)
      .maybeSingle();

    // Inspeção de outro admin somente para a conta de teste explicitamente
    // identificada. Nunca oferece entrada como outros administradores.
    const contaTeste = /^(jaque|jaqueline)\s+teste$/i.test(targetProfile?.nome?.trim()??'');
    if (targetError || !targetProfile || (targetProfile.is_admin && !contaTeste)) {
      return NextResponse.json({ error: 'Usuário inválido para essa ação.' }, { status: 400, headers:SEM_CACHE });
    }

    const {data:authUser,error:lookupError} = await admin.auth.admin.getUserById(targetUserId);
    const email = authUser?.user?.email;
    if(lookupError || !email)
      return NextResponse.json({ error:'Conta sem autenticação válida.' },{status:422,headers:SEM_CACHE});

    const { data: linkData, error:generateError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });
    if (generateError || !linkData?.properties?.hashed_token) {
      throw generateError ?? new Error('Não foi possível gerar o acesso de inspeção.');
    }

    // O token de retorno não contém credenciais e só existe em cookie HttpOnly
    // + hash no banco, por 2 horas, com uso único.
    const tokenRetorno=randomBytes(32).toString('base64url');
    const tokenHash=createHash('sha256').update(tokenRetorno).digest('hex');
    const {error:sessionError}=await admin.from('admin_inspecoes_sessoes').insert({
      admin_id:user.id,
      usuario_alvo_id:targetUserId,
      token_hash:tokenHash,
      expira_em:new Date(Date.now()+MAX_INSPECAO_SEGUNDOS*1000).toISOString(),
    });
    if(sessionError)throw sessionError;

    // Auditoria anterior preservada, sem bloquear retorno se a tabela de logs falhar.
    const {error:logError}=await admin.from('admin_impersonacoes_log').insert({
      admin_id:user.id,
      usuario_alvo_id:targetUserId,
    });
    if(logError)console.error('[INSPECAO] Falha no log de entrada:',logError.message);

    const response=NextResponse.json({
      tokenHash:linkData.properties.hashed_token,
    },{headers:SEM_CACHE});

    const opts={
      httpOnly:true,
      secure:process.env.NODE_ENV==='production',
      sameSite:'lax' as const,
      path:'/',
      maxAge:MAX_INSPECAO_SEGUNDOS,
    };
    response.cookies.set('soma_admin_inspection',tokenRetorno,opts);
    response.cookies.set('soma_impersonation_target',targetUserId,opts);
    return response;
  } catch(err){
    console.error('[INSPECAO] Não foi possível iniciar:', err instanceof Error?err.message:'Erro inesperado');
    return NextResponse.json({ error:'Não foi possível iniciar a inspeção.' },{status:500,headers:SEM_CACHE});
  }
}
