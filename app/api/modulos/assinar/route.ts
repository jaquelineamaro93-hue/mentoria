import { NextRequest,NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { criarAssinaturaModuloMP, cancelarAssinaturaModuloMP } from '@/lib/mercadopago-modules';
import { consumeSecurityRateLimit } from '@/lib/security/rate-limit';

export const runtime='nodejs';
const noStore={'Cache-Control':'private, no-store'};
export async function POST(request:NextRequest){
 const supabase=await createClient();
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user?.email)return NextResponse.json({error:'Faça login para assinar.'},{status:401,headers:noStore});
 const allowed=await consumeSecurityRateLimit({
  request,scope:'payment_create',identifier:user.id,limit:10,windowSeconds:900,
 });
 if(!allowed)return NextResponse.json({error:'Muitas tentativas. Aguarde alguns minutos.'},{status:429,headers:noStore});

 let input:{slug?:unknown};
 try{input=await request.json();}catch{return NextResponse.json({error:'Dados inválidos.'},{status:400,headers:noStore});}
 const slug=typeof input?.slug==='string'?input.slug.trim():'';
 if(!/^[a-z][a-z0-9-]{2,63}$/.test(slug))
  return NextResponse.json({error:'Módulo inválido.'},{status:400,headers:noStore});

 const admin=createAdminClient();
 const {data:modulo,error:moduleError}=await admin.from('soma_modules')
  .select('slug,title,monthly_price,enabled,purchasable,enforce_access')
  .eq('slug',slug).maybeSingle();
 if(moduleError||!modulo||!modulo.enabled||!modulo.purchasable||!modulo.enforce_access ||
   !Number.isFinite(Number(modulo.monthly_price))||Number(modulo.monthly_price)<5)
  return NextResponse.json({error:'Módulo ainda não está disponível para assinatura.'},{status:422,headers:noStore});

 const {data:profile}=await admin.from('profiles')
  .select('id,is_admin,status_assinatura,plano_id,data_fim_acesso')
  .eq('id',user.id).maybeSingle();
 const nowDate=new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
 if(profile?.is_admin || (profile?.plano_id && profile?.status_assinatura==='ativo' &&
  (!profile.data_fim_acesso||profile.data_fim_acesso>=nowDate)))
  return NextResponse.json({error:'Sua conta já possui acesso completo pela Mentoria ou administração.'},{status:409,headers:noStore});

 const {data:existing,error:existingError}=await admin.from('soma_module_subscriptions')
  .select('status,paid_through').eq('user_id',user.id).eq('module_slug',slug)
  .in('status',['PENDING','ACTIVE','PAST_DUE']).limit(10);
 if(existingError)return NextResponse.json({error:'Não foi possível consultar suas assinaturas.'},{status:503,headers:noStore});
 if(existing?.some(x=>x.status==='PENDING'||x.status==='PAST_DUE'||
   (x.status==='ACTIVE'&&x.paid_through&&Date.parse(x.paid_through)>Date.now())))
  return NextResponse.json({error:'Você já tem uma assinatura ou pagamento pendente deste módulo. Consulte seu acesso ou cancele a assinatura anterior antes de tentar novamente.'},{status:409,headers:noStore});

 const amount=Number(modulo.monthly_price);
 const {data:order,error:createError}=await admin.from('soma_module_orders')
  .insert({user_id:user.id,module_slug:slug,amount,currency:'BRL',status:'PENDING'})
  .select('id').single();
 if(createError||!order)return NextResponse.json({error:'Não foi possível reservar sua assinatura.'},{status:503,headers:noStore});

 let mpId:string|null=null;
 try{
  const checkout=await criarAssinaturaModuloMP({
   email:user.email,valorMensal:amount,titulo:modulo.title,externalReference:order.id,
  });
  mpId=checkout.id;
  // A assinatura MP é externa; só devolvemos o checkout após vínculo local.
  const {error:bindError}=await admin.from('soma_module_orders')
   .update({provider_subscription_id:checkout.id,updated_at:new Date().toISOString()})
   .eq('id',order.id);
  if(bindError)throw bindError;
  const {error:subscribeError}=await admin.from('soma_module_subscriptions')
   .insert({order_id:order.id,user_id:user.id,module_slug:slug,provider_subscription_id:checkout.id,status:'PENDING'});
  if(subscribeError)throw subscribeError;
  return NextResponse.json({init_point:checkout.init_point,orderId:order.id},{headers:noStore});
 }catch(e){
  // Sem persistência de vínculo completo, tentativa órfã NÃO é liberada.
  // Tenta cancelar o preapproval já criado para não cobrar uma assinatura
  // cujo histórico local não seja rastreável.
  if(mpId){try{await cancelarAssinaturaModuloMP(mpId);}catch(err){
   console.error('[MODULO] Falha ao cancelar cobrança órfã:',err);
  }}
  console.error('[MODULO] Falha ao preparar checkout:',e instanceof Error?e.message:'Erro desconhecido');
  return NextResponse.json({error:'Não foi possível preparar a cobrança. Nenhum acesso foi liberado. Tente novamente ou contate a SOMA.'},{status:503,headers:noStore});
 }
}
