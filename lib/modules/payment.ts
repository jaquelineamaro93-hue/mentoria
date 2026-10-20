import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type MpModuleOrder={
 id:string;user_id:string;module_slug:string;amount:number;
 provider_subscription_id:string|null;status:string;
};

export async function findModuleOrder(reference:unknown):Promise<MpModuleOrder|null>{
 if(typeof reference!=='string'||!UUID.test(reference))return null;
 const admin=createAdminClient();
 const {data,error}=await admin.from('soma_module_orders')
  .select('id,user_id,module_slug,amount,provider_subscription_id,status')
  .eq('id',reference).maybeSingle();
 if(error)throw Error('Não foi possível consultar o pedido modular.');
 return data as MpModuleOrder|null;
}

export async function syncModulePreapproval(
 order:MpModuleOrder,subscription:{id:unknown;status?:unknown;external_reference?:unknown}
){
 const subId=String(subscription.id??'');
 if(subId!==order.provider_subscription_id ||
    subscription.external_reference!==order.id)
   throw Error('O recurso do Mercado Pago não pertence ao pedido modular.');
 const admin=createAdminClient();
 const {data,error}=await admin.rpc('soma_sync_module_preapproval',{
  p_order:order.id,p_preapproval_id:subId,p_mp_status:String(subscription.status??''),
 });
 if(error)throw Error('Falha ao sincronizar assinatura modular: '+error.message);
 return data as string;
}

export async function syncModulePayment(
 order:MpModuleOrder,
 preapprovalId:string,
 payment:{
  id:unknown;status:unknown;transaction_amount:unknown;currency_id:unknown;
  date_approved?:unknown;external_reference?:unknown;
 }
){
 if(!order.provider_subscription_id||order.provider_subscription_id!==preapprovalId)
  throw Error('Cobrança de outra assinatura.');
 // A cobrança é consultada na API MP; a primeira associação entre paymentId
 // e preapprovalId deve ter vindo da notificação subscription_authorized_payment.
 if(payment.external_reference != null &&
    String(payment.external_reference)!==order.id)
  throw Error('Pagamento com referência externa divergente.');
 const id=String(payment.id??'');
 if(!/^[0-9]{1,30}$/.test(id))throw Error('Identificador de pagamento inválido.');
 const status=String(payment.status??'');
 const amount=Number(payment.transaction_amount);
 if(!Number.isFinite(amount)||String(payment.currency_id)!=='BRL')
  throw Error('Valor ou moeda do pagamento modular inválidos.');
 const date=typeof payment.date_approved==='string' && Number.isFinite(Date.parse(payment.date_approved))
  ? new Date(payment.date_approved).toISOString():null;
 const admin=createAdminClient();
 const {data,error}=await admin.rpc('soma_process_module_payment',{
  p_order:order.id,
  p_preapproval_id:preapprovalId,
  p_payment_id:id,
  p_status:status,
  p_amount:amount,
  p_currency:String(payment.currency_id),
  p_paid_at:date,
 });
 if(error)throw Error('Falha ao reconciliar pagamento modular: '+error.message);
 return data as string;
}

/** Payment topic notifies refunds and chargebacks; only accept known charges
 * first bound through subscription_authorized_payment from the official API.
 */
export async function findModuleOrderByKnownPayment(paymentId:string) {
 const admin=createAdminClient();
 const {data,eventError}=await admin.from('soma_module_payment_events')
  .select('order_id').eq('payment_id',paymentId).maybeSingle().then(
    ({data,error})=>({data,eventError:error})
  );
 if(eventError)throw Error('Falha ao consultar eventos modulares.');
 if(!data)return null;
 return findModuleOrder(data.order_id);
}
