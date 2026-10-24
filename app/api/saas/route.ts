import { PRODUCT_CONTRACTS, RECOVERY_CONTRACT_VERSION } from '@/lib/product-contracts';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { consumeIdentifierRateLimit } from '@/lib/security/rate-limit';
import { BASE_SAAS_CENTAVOS, calcularPrecoSaas, type PlanoSaas } from '@/lib/soma-saas-pricing';
import { SAAS_MODULES } from '@/lib/saas-access';
import { criarAssinaturaSaasMercadoPago, cancelarAssinaturaSaasMercadoPago, buscarCheckoutSaasMercadoPago, buscarPreapprovalMercadoPago } from '@/lib/mercadopago';
export const dynamic = 'force-dynamic';
const reply = (body: object, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
export async function GET() {
  const db = await createClient(); const { data: { user } } = await db.auth.getUser();
  if (!user) return reply({ error: 'Faça login.' }, 401);
  const [state, orders] = await Promise.all([db.rpc('soma_saas_state'), db.from('soma_module_orders').select('id,plan_code,amount,intro_amount,status,modules,iris,whatsapp,created_at').eq('user_id', user.id).not('plan_code', 'is', null).order('created_at', { ascending: false })]);
  if (state.error || orders.error) return reply({ error: 'Não foi possível consultar seu plano.' }, 503);
  const recovery = await createAdminClient().from('soma_saas_recovery_offers').select('expires_at,accepted_at,source_order_id,order_id').eq('user_id', user.id).maybeSingle();
  if (recovery.error) return reply({ error: 'Não foi possível consultar sua oferta.' }, 503);
  return reply({ access: state.data, orders: orders.data, recovery: recovery.data, serverNow: new Date().toISOString() });
}
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return reply({ error: 'Origem não autorizada.' }, 403);
  const db = await createClient(); const { data: { user } } = await db.auth.getUser();
  if (!user?.email) return reply({ error: 'Faça login.' }, 401);
  try {
    if (!(await consumeIdentifierRateLimit({ scope: 'saas_checkout', identifier: user.id, limit: 10, windowSeconds: 3600 }))) return reply({ error: 'Aguarde antes de tentar novamente.' }, 429);
    const body = await request.json();
    const admin = createAdminClient();
    if (body.action === 'recovery_offer') {
      const { data: source, error } = await admin.from('soma_module_orders').select('id,plan_code,status,provider_subscription_id,intro_amount').eq('id', body.orderId).eq('user_id', user.id).maybeSingle();
      if (error || !source?.plan_code || source.status !== 'PENDING' || source.intro_amount !== null || !source.provider_subscription_id) return reply({ error: 'Esta contratação não permite a oferta.' }, 409);
      const { data: account } = await admin.from('soma_saas_accounts').select('trial_ends_at').eq('user_id', user.id).maybeSingle();
      if (!account?.trial_ends_at || Date.parse(account.trial_ends_at) > Date.now()) return reply({ error: 'A oferta fica disponível após o teste.' }, 409);
      const provider = await buscarPreapprovalMercadoPago(source.provider_subscription_id);
      if (provider.status !== 'pending' || provider.external_reference !== source.id) return reply({ error: 'O pagamento já foi iniciado. Atualize o status da assinatura.' }, 409);
      await cancelarAssinaturaSaasMercadoPago(source.provider_subscription_id);
      const canceled = await admin.rpc('soma_sync_module_preapproval', { p_order: source.id, p_preapproval_id: source.provider_subscription_id, p_mp_status: 'cancelled' });
      if (canceled.error) throw canceled.error;
      const offer = await admin.rpc('soma_saas_recovery_offer', { p_user: user.id, p_order: source.id });
      if (offer.error) return reply({ error: 'A contratação foi cancelada. Não há oferta disponível para esta conta.' }, 409);
      return reply({ ok: true });
    }
    if (body.action === 'resume') {
      const { data: order, error } = await admin.from('soma_module_orders').select('checkout_url,status').eq('id', body.orderId).eq('user_id', user.id).not('plan_code', 'is', null).maybeSingle();
      if (error || !order?.checkout_url || !['PENDING','AUTHORIZED'].includes(order.status)) return reply({ error: 'Checkout indisponível. Tente novamente pelo botão Assinar.' }, 409);
      return reply({ checkoutUrl: order.checkout_url });
    }
    if (body.action === 'cancel') {
      const { data: order, error } = await admin.from('soma_module_orders').select('id,provider_subscription_id,plan_code,status,checkout_started_at').eq('id', body.orderId).eq('user_id', user.id).maybeSingle();
      if (error || !order?.plan_code) return reply({ error: 'Assinatura não encontrada.' }, 404);
      if (!order.provider_subscription_id) {
        if (order.checkout_started_at && Date.now() - Date.parse(order.checkout_started_at) < 60000) return reply({ error: 'Aguarde a preparação do checkout antes de cancelar.' }, 409);
        const recovered = order.checkout_started_at ? await buscarCheckoutSaasMercadoPago(order.id) : null;
        if (!recovered) {
          const { error: cancelError } = await admin.from('soma_module_orders').update({ status: 'CANCELED' }).eq('id', order.id);
          if (cancelError) throw cancelError;
          return reply({ ok: true });
        }
        const { error: linkError } = await admin.from('soma_module_orders').update({ provider_subscription_id: recovered.id, checkout_url: recovered.init_point }).eq('id', order.id);
        if (linkError) throw linkError;
        order.provider_subscription_id = recovered.id;
      }
      if (order.status !== 'CANCELED') {
        await cancelarAssinaturaSaasMercadoPago(order.provider_subscription_id);
        const result = await admin.rpc('soma_sync_module_preapproval', { p_order: order.id, p_preapproval_id: order.provider_subscription_id, p_mp_status: 'cancelled' });
        if (result.error) throw result.error;
      }
      return reply({ ok: true });
    }
    if (!['trial','checkout','recovery_checkout'].includes(body.action) || body.accepted !== true) return reply({ error: 'Aceite as condições para continuar.' }, 400);
    const recoveryCheckout = body.action === 'recovery_checkout';
    if(body.contractVersion !== (recoveryCheckout?RECOVERY_CONTRACT_VERSION:PRODUCT_CONTRACTS.plataforma.version)) return reply({error:'Leia e aceite o contrato atualizado antes de continuar.'},400);
    if (recoveryCheckout) {
      const { data: offer } = await admin.from('soma_saas_recovery_offers').select('source_order_id').eq('user_id', user.id).maybeSingle();
      if (!offer) return reply({ error: 'Oferta indisponível.' }, 409);
      const { data: source } = await admin.from('soma_module_orders').select('plan_code,modules,iris,whatsapp').eq('id', offer.source_order_id).eq('user_id', user.id).single();
      if (!source) return reply({ error: 'Oferta indisponível.' }, 409);
      Object.assign(body, { plan: source.plan_code, module: source.modules[0], iris: source.iris, whatsapp: source.whatsapp });
    }
    const plan = body.plan as PlanoSaas;
    if (!Object.hasOwn(BASE_SAAS_CENTAVOS, plan) || typeof body.iris !== 'boolean' || typeof body.whatsapp !== 'boolean') return reply({ error: 'Plano inválido.' }, 400);
    const modules = plan === 'pro' ? [...SAAS_MODULES] : plan === 'essencial' ? ['autoconhecimento','diagnostico','desenvolvimento'] : SAAS_MODULES.includes(body.module) ? [body.module] : [];
    if (!modules.length) return reply({ error: 'Selecione uma ferramenta.' }, 400);
    const config = { plan_code: plan, modules, iris: body.iris, whatsapp: body.whatsapp };
    const { data: account, error: accountError } = await admin.rpc('soma_saas_register', { p_user: user.id, p_config: config, p_trial: body.action === 'trial' });
    if (accountError) throw accountError;
    if (body.action === 'trial') return reply({ ok: true, trialEndsAt: account.trial_ends_at });
    const regularAmount = calcularPrecoSaas(plan, { iris: body.iris, whatsapp: body.whatsapp }).total / 100;
    // One live checkout/subscription per account. Concurrent requests serialize in SQL.
    const { data: orderId, error: orderError } = recoveryCheckout ? await admin.rpc('soma_saas_recovery_checkout', { p_user: user.id }) : await admin.rpc('soma_saas_create_order', { p_user: user.id, p_config: config, p_amount: regularAmount });
    if (orderError && recoveryCheckout) return reply({ error: 'A oferta expirou ou já foi utilizada. Consulte suas assinaturas.' }, 409);
    if (orderError) return reply({ error: 'Você já tem uma assinatura ou checkout em andamento. Consulte suas assinaturas abaixo.' }, 409);
    const { data: order, error: readError } = await admin.from('soma_module_orders').select('provider_subscription_id,checkout_url,checkout_started_at,amount,intro_amount').eq('id', orderId).single();
    if (readError) throw readError;
    const amount = Number(order.intro_amount ?? order.amount);
    if (order.checkout_url) return reply({ checkoutUrl: order.checkout_url });
    if (order.checkout_started_at) {
      if (Date.now() - Date.parse(order.checkout_started_at) < 60000) return reply({ error: 'Checkout em preparação. Aguarde um minuto.' }, 409);
      const recovered = await buscarCheckoutSaasMercadoPago(orderId);
      if (recovered) {
        const linked = await admin.from('soma_module_orders').update({ provider_subscription_id: recovered.id, checkout_url: recovered.init_point }).eq('id', orderId);
        if (linked.error) throw linked.error;
        return reply({ checkoutUrl: recovered.init_point });
      }
      const unlocked = await admin.from('soma_module_orders').update({ checkout_started_at: null }).eq('id', orderId).eq('checkout_started_at', order.checkout_started_at);
      if (unlocked.error) throw unlocked.error;
    }
    const lock = await admin.from('soma_module_orders').update({ checkout_started_at: new Date().toISOString() }).eq('id', orderId).is('checkout_started_at', null).select('id').maybeSingle();
    if (lock.error || !lock.data) return reply({ error: 'Seu checkout está sendo preparado. Aguarde alguns instantes e atualize a página.' }, 409);
    const checkout = await criarAssinaturaSaasMercadoPago({ email: user.email, valor: amount, regularAmount: order.intro_amount !== null ? Number(order.amount) : undefined, externalReference: orderId, startDate: account.trial_ends_at && Date.parse(account.trial_ends_at) > Date.now() ? account.trial_ends_at : undefined });
    const { error: linkError } = await admin.from('soma_module_orders').update({ provider_subscription_id: checkout.id, checkout_url: checkout.init_point }).eq('id', orderId).eq('user_id', user.id);
    if (linkError) { await cancelarAssinaturaSaasMercadoPago(checkout.id); throw linkError; }
    return reply({ checkoutUrl: checkout.init_point });
  } catch { return reply({ error: 'Não foi possível concluir. Tente novamente em alguns minutos.' }, 503); }
}
