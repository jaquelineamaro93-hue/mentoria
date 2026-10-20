import { NextRequest,NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cancelarAssinaturaModuloMP } from '@/lib/mercadopago-modules';
import { buscarPreapprovalMercadoPago } from '@/lib/mercadopago';
import { syncModulePreapproval } from '@/lib/modules/payment';
import { consumeSecurityRateLimit } from '@/lib/security/rate-limit';

export const runtime='nodejs';
const headers={'Cache-Control':'private, no-store'};

export async function POST(request:NextRequest){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:'Não autenticado.'},{status:401,headers});
 const allowed=await consumeSecurityRateLimit({
  request,scope:'payment_create',identifier:user.id,limit:10,windowSeconds:900,
 });
 if(!allowed)return NextResponse.json({error:'Aguarde alguns minutos.'},{status:429,headers});

 let input:{subscriptionId?:unknown};
 try{input=await request.json();}catch{return NextResponse.json({error:'Dados inválidos.'},{status:400,headers});}
 if(typeof input?.subscriptionId!=='string'||
   !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.subscriptionId))
  return NextResponse.json({error:'Assinatura inválida.'},{status:400,headers});

 const admin=createAdminClient();
 const {data:sub,error:subError}=await admin.from('soma_module_subscriptions')
  .select('id,order_id,module_slug,provider_subscription_id,status')
  .eq('id',input.subscriptionId).eq('user_id',user.id).maybeSingle();
 if(subError||!sub)return NextResponse.json({error:'Assinatura não encontrada.'},{status:404,headers});
 if(sub.status==='CANCELED'||sub.status==='EXPIRED')
  return NextResponse.json({ok:true,alreadyCanceled:true},{headers});
 try{
  const {data:order,error:orderError}=await admin.from('soma_module_orders')
    .select('id,user_id,module_slug,amount,provider_subscription_id,status')
    .eq('id',sub.order_id).eq('user_id',user.id).maybeSingle();
  if(orderError||!order||order.provider_subscription_id!==sub.provider_subscription_id)
    throw Error('Vínculo financeiro inválido.');

  const mpSubscription=await buscarPreapprovalMercadoPago(sub.provider_subscription_id);
  if(String(mpSubscription.id)!==sub.provider_subscription_id||
    String(mpSubscription.external_reference)!==order.id)
    throw Error('O Mercado Pago não confirmou o vínculo do pedido.');

  if(!['cancelled','canceled'].includes(mpSubscription.status)){
    await cancelarAssinaturaModuloMP(sub.provider_subscription_id);
  }
  const result=await syncModulePreapproval(order as Parameters<typeof syncModulePreapproval>[0],{
    id:sub.provider_subscription_id,status:'cancelled',external_reference:order.id,
  });
  return NextResponse.json({ok:true,result},{headers});
 }catch(err){
  console.error('[MODULO] Cancelamento:',err instanceof Error?err.message:'Erro');
  return NextResponse.json({error:'Não foi possível confirmar o cancelamento com o Mercado Pago. Nenhum acesso foi alterado; tente novamente.'},{status:503,headers});
 }
}
