import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};

export async function POST(request:NextRequest) {
  const token=request.cookies.get('soma_admin_inspection')?.value;
  if(!token || token.length<30)
    return NextResponse.json({error:'Sessão de inspeção não encontrada. Entre novamente como administradora.'},{status:403,headers});

  const supabase=await createClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)return NextResponse.json({error:'Sessão expirada. Faça login como administradora.'},{status:401,headers});

  const hash=createHash('sha256').update(token).digest('hex');
  const admin=createAdminClient();
  const {data:registro,error:queryError}=await admin.from('admin_inspecoes_sessoes')
    .select('id,admin_id,usuario_alvo_id')
    .eq('token_hash',hash)
    .eq('usuario_alvo_id',user.id)
    .is('encerrado_em',null)
    .gt('expira_em',new Date().toISOString())
    .maybeSingle();

  if(queryError||!registro)
    return NextResponse.json({error:'Inspeção inválida ou expirada. Faça login novamente como administradora.'},{status:403,headers});

  const {data:perfil,error:roleError}=await admin.from('profiles')
    .select('is_admin').eq('id',registro.admin_id).maybeSingle();
  if(roleError||!perfil?.is_admin)
    return NextResponse.json({error:'A conta original não possui mais acesso administrativo.'},{status:403,headers});

  // O email vem do Auth, não do campo de perfil editável pelo próprio usuário.
  const {data:authUser,error:userError}=await admin.auth.admin.getUserById(registro.admin_id);
  const adminEmail=authUser?.user?.email;
  if(userError||!adminEmail)
    return NextResponse.json({error:'Não foi possível localizar a conta original.'},{status:503,headers});

  const {data:link,error:linkError}=await admin.auth.admin.generateLink({
    type:'magiclink',email:adminEmail,
  });
  if(linkError||!link?.properties?.hashed_token)
    return NextResponse.json({error:'Não foi possível restaurar a conta agora. Tente novamente.'},{status:503,headers});

  // Consumo atômico do token, prevenindo reutilização. Nenhuma senha ou
  // sessão de admin é devolvida ao JavaScript do mentorado.
  const {data:consumido,error:consumeError}=await admin.from('admin_inspecoes_sessoes')
    .update({encerrado_em:new Date().toISOString()})
    .eq('id',registro.id).is('encerrado_em',null)
    .gt('expira_em',new Date().toISOString())
    .select('id').maybeSingle();
  if(consumeError||!consumido)
    return NextResponse.json({error:'Essa inspeção já foi encerrada.'},{status:409,headers});

  const {data:retorno,error:verifyError}=await supabase.auth.verifyOtp({
    token_hash:link.properties.hashed_token,type:'magiclink',
  });
  if(verifyError||retorno.user?.id!==registro.admin_id){
    console.error('[INSPECAO] Falha em restaurar sessão original:',verifyError?.message??'Identidade diferente');
    return NextResponse.json({error:'Não foi possível restaurar sua sessão. Faça login novamente.'},{status:503,headers});
  }

  const response=NextResponse.json({ok:true,destino:'/admin'},{headers});
  response.cookies.delete('soma_admin_inspection');
  response.cookies.delete('soma_impersonation_target');
  return response;
}
