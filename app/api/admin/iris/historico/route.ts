import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { irisAutomacaoConfigurada, whatsappCanalConfigurado } from '@/lib/iris-integracoes';

export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'private, no-store' };
async function autorizacaoAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: perfil } = await supabase.from('profiles').select('is_admin').eq('id',user.id).single();
  return !!perfil?.is_admin;
}
const idValido = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export async function GET(request: NextRequest) {
  if (!(await autorizacaoAdmin())) return NextResponse.json({error:'Sem permissão'},{status:403,headers});
  const userId = request.nextUrl.searchParams.get('userId') || '';
  if (!idValido(userId)) return NextResponse.json({error:'ID inválido'},{status:400,headers});
  const db = createAdminClient();
  const [recebidas, enviadas, passos, turnos, estado, perfil] = await Promise.all([
    db.from('whatsapp_respostas_mentoria').select('id,conteudo,recebido_em,meta_message_id')
      .eq('user_id',userId).order('recebido_em',{ascending:false}).limit(35),
    db.from('iris_mensagens_enviadas').select('id,conteudo,enviado_em,meta_message_id,tipo,status_entrega')
      .eq('user_id',userId).order('enviado_em',{ascending:false}).limit(35),
    db.from('iris_proximos_passos').select('id,acao,insight,situacao,criado_em')
      .eq('user_id',userId).order('criado_em',{ascending:false}).limit(15),
    db.from('iris_turnos').select('id,origem_tipo,status,criado_em,erro_resumido')
      .eq('user_id',userId).order('criado_em',{ascending:false}).limit(25),
    db.from('iris_estado').select('pausado,objetivo_atual,proximo_passo,ultimo_envio_em,ultima_interacao_em')
      .eq('user_id',userId).maybeSingle(),
    db.from('profiles').select('iris_ia_consentimento_em,whatsapp_consentimento_em,whatsapp_numero')
      .eq('id',userId).maybeSingle(),
  ]);
  if ([recebidas.error,enviadas.error,passos.error,turnos.error,estado.error,perfil.error].some(Boolean)) {
    return NextResponse.json({error:'Histórico temporariamente indisponível'},{status:503,headers});
  }
  const mensagens = [
    ...(recebidas.data??[]).map(x=>({id:'entrada-'+x.id, tipo:'recebida',
      texto:x.conteudo, data:x.recebido_em})),
    ...(enviadas.data??[]).map(x=>({id:'saida-'+x.id, tipo:'enviada',
      texto:x.conteudo, data:x.enviado_em,status:x.status_entrega})),
  ].sort((a,b)=>new Date(b.data).getTime()-new Date(a.data).getTime()).slice(0,60);
  return NextResponse.json({
    consentimentoIA:!!perfil.data?.iris_ia_consentimento_em,
    contatoAutorizado:!!perfil.data?.whatsapp_numero&&!!perfil.data?.whatsapp_consentimento_em,
    canalPronto:whatsappCanalConfigurado(),automacaoAtiva:irisAutomacaoConfigurada(),
    estado:estado.data??null,
    mensagens,passos:passos.data??[],turnos:turnos.data??[],
  },{headers});
}

export async function POST(request:NextRequest) {
  if (!(await autorizacaoAdmin())) return NextResponse.json({error:'Sem permissão'},{status:403,headers});
  const body=await request.json().catch(()=>null) as {userId?:string;paused?:boolean}|null;
  if (!body||!idValido(body.userId??'')||typeof body.paused!=='boolean')
    return NextResponse.json({error:'Parâmetros inválidos'},{status:400,headers});
  const db=createAdminClient();
  const {error}=await db.from('iris_estado').upsert({
    user_id:body.userId!,pausado:body.paused,updated_at:new Date().toISOString(),
  },{onConflict:'user_id'});
  if(error)return NextResponse.json({error:'Não foi possível atualizar o acompanhamento'},{status:503,headers});
  if(body.paused) await db.from('iris_turnos').update({status:'cancelado',erro_resumido:'Acompanhamento pausado pela administração.'})
    .eq('user_id',body.userId!).in('status',['fila','aguardando_agente','pronto']);
  return NextResponse.json({ok:true,pausado:body.paused},{headers});
}
