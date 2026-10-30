import {NextResponse} from 'next/server';
import {requireAdmin} from '@/lib/security/require-admin';
import {createAdminClient} from '@/lib/supabase/admin';
import {enviarEmail} from '@/lib/sendgrid';
import {buildMinigamesNews,MINIGAMES_CAMPAIGN} from '@/lib/minigames-news-email';
import {newsletterToken} from '@/lib/newsletter-token';
export const maxDuration=120;
export async function GET(request:Request){const auth=await requireAdmin();if(!auth.ok)return auth.response;
 if(new URL(request.url).searchParams.get('preview')==='1')return new Response(buildMinigamesNews('Jaqueline','https://somamentoria.com/termos').html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
 const db=createAdminClient();const [recipients,dispatches]=await Promise.all([db.rpc('soma_newsletter_recipients'),db.from('soma_newsletter_dispatches').select('status,user_id').eq('campaign',MINIGAMES_CAMPAIGN)]);
 if(recipients.error||dispatches.error)return NextResponse.json({error:'Não foi possível consultar a campanha.'},{status:503});
 const done=new Set((dispatches.data??[]).map(d=>d.user_id));return NextResponse.json({eligible:recipients.data.length,pending:recipients.data.filter((p:{id:string})=>!done.has(p.id)).length,accepted:dispatches.data?.filter(d=>d.status==='accepted').length,unconfirmed:dispatches.data?.filter(d=>d.status!=='accepted').length},{headers:{'Cache-Control':'no-store'}});
}
export async function POST(request:Request){const auth=await requireAdmin();if(!auth.ok)return auth.response;
 if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return NextResponse.json({error:'Origem inválida.'},{status:403});
 if(!process.env.SENDGRID_API_KEY||!process.env.SUPABASE_SERVICE_ROLE_KEY)return NextResponse.json({error:'Envio indisponível por configuração.'},{status:503});
 const db=createAdminClient();const {data:recipients,error}=await db.rpc('soma_newsletter_recipients');if(error)return NextResponse.json({error:'Não foi possível validar destinatários.'},{status:503});
 const {data:dispatches,error:dispatchError}=await db.from('soma_newsletter_dispatches').select('user_id').eq('campaign',MINIGAMES_CAMPAIGN);if(dispatchError)return NextResponse.json({error:'Não foi possível verificar os envios.'},{status:503});
 const done=new Set((dispatches??[]).map(d=>d.user_id));const batch=(recipients as {id:string;nome:string;email:string}[]).filter(p=>!done.has(p.id)).slice(0,12);let accepted=0,unconfirmed=0;
 for(const p of batch){
  const {error:reserve}=await db.from('soma_newsletter_dispatches').insert({campaign:MINIGAMES_CAMPAIGN,user_id:p.id,email:p.email,status:'reserved'});if(reserve){if(reserve.code==='23505')continue;return NextResponse.json({error:'Falha ao reservar envio. Recarregue antes de continuar.'},{status:503});}
  const link='https://somamentoria.com/api/newsletter/unsubscribe?u='+p.id+'&sig='+newsletterToken(p.id,process.env.SUPABASE_SERVICE_ROLE_KEY);
  const mail=buildMinigamesNews(p.nome||'',link);const sent=await enviarEmail({to:p.email,from:'consultoria@camarocrm.com',subject:mail.subject,html:mail.html});
  const {error:markError}=await db.from('soma_newsletter_dispatches').update({status:sent?'accepted':'unconfirmed',sent_at:sent?new Date().toISOString():null}).eq('campaign',MINIGAMES_CAMPAIGN).eq('user_id',p.id).eq('status','reserved');
  if(sent&&!markError)accepted++;else unconfirmed++;
 }
 return NextResponse.json({processed:batch.length,accepted,unconfirmed},{headers:{'Cache-Control':'no-store'}});
}
