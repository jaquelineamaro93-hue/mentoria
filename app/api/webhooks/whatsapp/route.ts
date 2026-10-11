import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

function comparar(a: string, b: string): boolean {
 const x=Buffer.from(a);const y=Buffer.from(b);
 return x.length===y.length && timingSafeEqual(x,y);
}
function telefone(valor: string): string {
 const digitos=valor.replace(/\D/g,'');
 return digitos.startsWith('55')?digitos:'55'+digitos;
}

export async function GET(request:NextRequest) {
 const segredo=process.env.WHATSAPP_VERIFY_TOKEN;
 if(!segredo)return new NextResponse('Webhook não configurado',{status:503});
 const url=request.nextUrl.searchParams;
 if(url.get('hub.mode')!=='subscribe'||!comparar(url.get('hub.verify_token')||'',segredo))
   return new NextResponse('Não autorizado',{status:403});
 const desafio=url.get('hub.challenge');
 if(!desafio)return new NextResponse('Desafio ausente',{status:400});
 return new NextResponse(desafio,{status:200,headers:{'Content-Type':'text/plain'}});
}

type Mensagem={id?:string;from?:string;type?:string;text?:{body?:string};button?:{text?:string};interactive?:{button_reply?:{title?:string};list_reply?:{title?:string}};timestamp?:string};
type Alteracao={field?:string;value?:{metadata?:{phone_number_id?:string};messages?:Mensagem[]}};
type Envelope={object?:string;entry?:Array<{changes?:Alteracao[]}>};

export async function POST(request:NextRequest) {
 const appSecret=process.env.WHATSAPP_APP_SECRET;
 const phoneId=process.env.WHATSAPP_PHONE_NUMBER_ID;
 if(!appSecret||!phoneId)return new NextResponse('Webhook não configurado',{status:503});
 const assinatura=request.headers.get('x-hub-signature-256')||'';
 const bruto=await request.text();
 if(bruto.length>512000)return new NextResponse('Payload muito grande',{status:413});
 const esperado='sha256='+createHmac('sha256',appSecret).update(bruto).digest('hex');
 if(!comparar(assinatura,esperado))return new NextResponse('Assinatura inválida',{status:403});
 let payload:Envelope;
 try{payload=JSON.parse(bruto) as Envelope;}catch{return new NextResponse('JSON inválido',{status:400});}
 if(payload.object!=='whatsapp_business_account')return NextResponse.json({ok:true});
 const admin=createAdminClient();
 for(const entrada of payload.entry||[])for(const alteracao of entrada.changes||[]){
  if(alteracao.field!=='messages'||alteracao.value?.metadata?.phone_number_id!==phoneId)continue;
  for(const mensagem of alteracao.value?.messages||[]){
   if(!mensagem.id||!mensagem.from)continue;
   const conteudo=mensagem.type==='text'?mensagem.text?.body:
    mensagem.type==='button'?mensagem.button?.text:
    mensagem.type==='interactive'?(mensagem.interactive?.button_reply?.title||mensagem.interactive?.list_reply?.title):null;
   if(!conteudo||conteudo.length>10000)continue; // anexos não são baixados
   const numero=telefone(mensagem.from);
   const {data:perfis,error:erroPerfis}=await admin.from('profiles')
    .select('id').eq('whatsapp_numero',numero).not('whatsapp_consentimento_em','is',null)
    .limit(2);
   if(erroPerfis)return new NextResponse('Falha ao identificar contato',{status:503});
   if(perfis?.length!==1)continue; // não vincular número desconhecido ou ambíguo
   const recebido=Number(mensagem.timestamp);
   const recebidoEm=Number.isFinite(recebido)&&recebido>0?new Date(recebido*1000).toISOString():new Date().toISOString();
   const {error}=await admin.from('whatsapp_respostas_mentoria').upsert({
    user_id:perfis[0].id,meta_message_id:mensagem.id,phone_number_id:phoneId,
    tipo:mensagem.type||'text',conteudo:conteudo.slice(0,10000),recebido_em:recebidoEm
   },{onConflict:'meta_message_id',ignoreDuplicates:true});
   if(error)return new NextResponse('Falha ao registrar resposta',{status:503});
  }
 }
 return NextResponse.json({ok:true});
}
