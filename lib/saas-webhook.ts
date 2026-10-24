import { reconcileSaasRecovery } from '@/lib/saas-recovery';
import { createAdminClient } from '@/lib/supabase/admin';
/** Called only after signature validation and provider-side resource retrieval. */
export async function syncSaasSubscription(subscription: { id: string; external_reference: string; status: string }) {
  const admin = createAdminClient();
  const { data: order, error } = await admin.from('soma_module_orders').select('id,provider_subscription_id').eq('id', subscription.external_reference).maybeSingle();
  if (error) throw error;
  if (!order) return false;
  if (order.provider_subscription_id !== String(subscription.id)) throw new Error('Assinatura divergente.');
  const result = await admin.rpc('soma_sync_module_preapproval', { p_order: order.id, p_preapproval_id: String(subscription.id), p_mp_status: subscription.status });
  if (result.error) throw result.error;
  return true;
}
export async function syncSaasPayment(payment: { id: string | number; status: string; transaction_amount: number; currency_id: string; date_approved?: string }, reference: string, subscriptionId?: string) {
  const admin = createAdminClient();
  const { data: order, error } = await admin.from('soma_module_orders').select('id,provider_subscription_id').eq('id', reference).maybeSingle();
  if (error) throw error;
  if (!order) return false;
  // Initial approval must arrive through its verified subscription charge.
  // Later refund/payment notifications may refer to an already recorded payment.
  if (!subscriptionId) {
    const { data: known, error: lookupError } = await admin.from('soma_module_payment_events').select('order_id').eq('payment_id', String(payment.id)).eq('order_id', order.id).maybeSingle();
    if (lookupError) throw lookupError;
    if (!known) return true;
  } else if (subscriptionId !== order.provider_subscription_id) throw new Error('Assinatura divergente.');
  const result = await admin.rpc('soma_process_module_payment', {
    p_order: order.id, p_preapproval_id: order.provider_subscription_id, p_payment_id: String(payment.id),
    p_status: payment.status, p_amount: payment.transaction_amount, p_currency: payment.currency_id,
    p_paid_at: payment.date_approved || null,
  });
  if (result.error || result.data === 'unknown_order') throw new Error('Pagamento não reconciliado.');
  if (payment.status === 'approved') await reconcileSaasRecovery(order.id);
  return true;
}
