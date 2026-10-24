import { createAdminClient } from '@/lib/supabase/admin';
import { restaurarPrecoAssinaturaSaas } from '@/lib/mercadopago';

/** Both webhooks and the daily cron drain the durable reconciliation queue. */
export async function reconcileSaasRecovery(orderId?: string) {
 const admin = createAdminClient();
 let query = admin.from('soma_module_orders').select('id,amount,provider_subscription_id')
  .not('intro_payment_id', 'is', null).is('recurring_price_restored_at', null)
  .not('provider_subscription_id', 'is', null).not('status', 'in', '(CANCELED,EXPIRED)');
 if (orderId) query = query.eq('id', orderId);
 const { data, error } = await query.limit(100);
 if (error) throw error;
 let failed = 0;
 for (const order of data || []) {
  try {
   await restaurarPrecoAssinaturaSaas(order.provider_subscription_id, Number(order.amount));
   const saved = await admin.from('soma_module_orders').update({ recurring_price_restored_at: new Date().toISOString() }).eq('id', order.id);
   if (saved.error) throw saved.error;
  } catch { failed++; }
 }
 if (failed) throw new Error(`Recorrências aguardando conciliação: ${failed}`);
 return { reconciled: data?.length || 0 };
}
