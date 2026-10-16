import { createHmac,timingSafeEqual } from 'node:crypto';
import { NextRequest,NextResponse,after } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { irisAutomacaoConfigurada } from '@/lib/iris-integracoes';
import { processarFilaIris } from '@/lib/iris-automacao';
import { topsendRetornoConfigurado } from '@/lib/topsend';

export const runtime='nodejs';
export const maxDuration=120;
const same=(a:string,b:string)=>{
  const x=createHmac('sha256','soma-topsend').update(a).digest();
  const y=createHmac('sha256','soma-topsend').update(b).digest();
  return timingSafeEqual(x,y);
};
const number=(s:string)=>{
  const digits=s.replace(/\D/g,'');
  return digits.startsWith('55')?digits:'55'+digits;
};
type TopSendInbound={
  evento?:unknown; id_evento?:unknown; telefone?:unknown;
  mensagem?:unknown; data_hora?:unknown;
};
function parseEvento(x:TopSendInbound){
  if(x.evento!=='mensagem_recebida')throw Error('Evento não suportado');
  if(typeof x.id_evento!=='string'||!x.id_evento.trim()||x.id_evento.length>150)
    throw Error('ID de evento obrigatório para deduplicação');
  if(typeof x.telefone!=='string'||!/^55[1-9]\d{9,10}$/.test(number(x.telefone)))
    throw Error('Telefone inválido');
  if(typeof x.mensagem!=='string'||!x.mensagem.trim()||x.mensagem.length>10000)
    throw Error('Mensagem inválida');
  if(typeof x.data_hora!=='string'||!x.data_hora.includes('T'))
    throw Error('Data ISO-8601 com fuso é obrigatória');
  const ts=Date.parse(x.data_hora);
  if(!Number.isFinite(ts)||ts>Date.now()+5*60000||ts<Date.now()-31*86400000)
    throw Error('Data do evento fora da janela aceita');
  return {id:x.id_evento.trim(),telefone:number(x.telefone),
    mensagem:x.mensagem.trim(),timestamp:new Date(ts).toISOString(),ts};
}

/** Configure this as a TopSend OUTBOUND HTTP action on the
 * "mensagem recebida" trigger, if the plan supports that action.
 * It is not the webhook URL that TopSend generates for outbound sends.
 */
export async function POST(request:NextRequest) {
  const secret=process.env.TOPSEND_INBOUND_SECRET;
  if(!topsendRetornoConfigurado()||!secret)
    return NextResponse.json({error:'Recepção TopSend não configurada'},{status:503});
  const received=request.headers.get('x-soma-webhook-secret')||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i,'')||'';
  if(!same(received,secret))return NextResponse.json({error:'Não autorizado'},{status:401});
  const raw=await request.text();
  if(raw.length>25000)return NextResponse.json({error:'Evento muito grande'},{status:413});
  let body:TopSendInbound;
  try{body=JSON.parse(raw) as TopSendInbound;}catch{
    return NextResponse.json({error:'JSON inválido'},{status:400});
  }
  if(body.evento!=='mensagem_recebida')
    return NextResponse.json({ok:true,ignorado:true}); // never run AI on delivery status or outbound echoes
  let item:ReturnType<typeof parseEvento>;
  try{item=parseEvento(body);}catch(e){
    return NextResponse.json({error:e instanceof Error?e.message:'Evento inválido'},{status:422});
  }
  const db=createAdminClient();
  const {data:perfis,error:profileError}=await db.from('profiles')
    .select('id,whatsapp_consentimento_em,iris_ia_consentimento_em,is_admin')
    .eq('whatsapp_numero',item.telefone).eq('is_admin',false).limit(2);
  if(profileError)return NextResponse.json({error:'Erro de consulta'},{status:503});
  if(perfis?.length!==1||!perfis[0].whatsapp_consentimento_em)
    return NextResponse.json({ok:true,ignorado:true}); // no unknown persons or non-opted-in storage
  const p=perfis[0];
  const {error:insertError}=await db.from('topsend_eventos_recebidos').insert({
    user_id:p.id,id_evento:item.id,telefone:item.telefone,tipo:'texto',
    conteudo:item.mensagem,recebido_em:item.timestamp,
  });
  if(insertError) {
    if(insertError.code==='23505')return NextResponse.json({ok:true,duplicado:true});
    return NextResponse.json({error:'Não foi possível armazenar a resposta'},{status:503});
  }

  const isStop=/^(PARAR|PARE|SAIR|STOP|CANCELAR)$/i.test(item.mensagem);
  if(isStop){
    const {error:consentError}=await db.from('profiles').update({
      whatsapp_consentimento_em:null,iris_ia_consentimento_em:null,
    }).eq('id',p.id);
    if(consentError)return NextResponse.json({error:'Falha ao cancelar autorização'},{status:503});
    await db.from('iris_estado').upsert({
      user_id:p.id,pausado:true,updated_at:new Date().toISOString(),
    },{onConflict:'user_id'});
    await db.from('iris_turnos').update({
      status:'cancelado',erro_resumido:'Pedido de descadastramento no WhatsApp.',
    }).eq('user_id',p.id).in('status',['fila','aguardando_agente','pronto']);
    return NextResponse.json({ok:true,descadastrado:true});
  }
  if(!p.iris_ia_consentimento_em||!irisAutomacaoConfigurada())
    return NextResponse.json({ok:true,registrado:true,automacao:false});
  // Imported historical events do not trigger stale outbound messages.
  if(Date.now()-item.ts>23*3600000||Date.now()<item.ts)
    return NextResponse.json({ok:true,registrado:true,antigo:true});
  const {data:estado,error:estadoError}=await db.from('iris_estado').select('pausado')
    .eq('user_id',p.id).maybeSingle();
  if(estadoError)return NextResponse.json({error:'Falha ao consultar acompanhamento'},{status:503});
  if(estado?.pausado)return NextResponse.json({ok:true,pausado:true});
  const {data:existing,error:checkError}=await db.from('iris_turnos')
    .select('id').eq('user_id',p.id).in('status',['fila','aguardando_agente','pronto','enviando']).limit(1);
  if(checkError)return NextResponse.json({error:'Falha ao consultar fila'},{status:503});
  if(existing?.length)return NextResponse.json({ok:true,registrado:true,turno_em_andamento:true});
  const {error:queueError}=await db.from('iris_turnos').insert({
    user_id:p.id,origem_id:'topsend:'+item.id,origem_tipo:'whatsapp',status:'fila',
  });
  if(queueError&&queueError.code!=='23505')
    return NextResponse.json({error:'Falha na fila da Íris'},{status:503});
  after(async()=>{await processarFilaIris();});
  return NextResponse.json({ok:true,registrado:true,em_fila:true});
}