import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = file => readFileSync(new URL('../'+file,import.meta.url),'utf8');
test('non-customer cart recovery is offered at both public buying surfaces', () => {
  const career = read('app/(public)/checkout/CheckoutClient.tsx');
  const saas = read('components/public/SomaSaasShowcase.tsx');
  assert.match(career,/GuestCheckoutRecovery/);
  assert.match(career,/product="carreira"/);
  assert.match(career,/!planoAtualCodigo/);
  assert.match(saas,/product="plataforma"/);
  assert.match(saas,/Guardar minha escolha por e-mail/);
});
test('guest recovery requires consent, verified Turnstile, rate limits and excludes paid members', () => {
  const api = read('app/api/checkout-recovery/route.ts');
  const dialog = read('components/public/GuestCheckoutRecovery.tsx');
  assert.match(api,/verifyTurnstile/);
  assert.match(api,/TURNSTILE_SECRET_KEY/);
  assert.match(api,/consumeSecurityRateLimit/);
  assert.match(api,/payload.consent !== true/);
  assert.match(api,/soma_module_subscriptions/);
  assert.match(api,/status_assinatura === 'ativo'/);
  assert.match(api,/emailHash/);
  assert.match(dialog,/NEXT_PUBLIC_TURNSTILE_SITE_KEY/);
  assert.match(dialog,/input type="checkbox" required/);
  assert.match(dialog,/role="alert"/);
  assert.doesNotMatch(dialog,/SUPABASE_SERVICE_ROLE_KEY/);
});
test('guest recovery never changes prices or charges and always explains manual promotion', () => {
  const api=read('app/api/checkout-recovery/route.ts');
  const dialog=read('components/public/GuestCheckoutRecovery.tsx');
  assert.match(api,/não é aplicada automaticamente no checkout/);
  assert.match(api,/sendEmail/);
  assert.doesNotMatch(api,/criarAssinaturaMercadoPago|criarPagamentoUnicoMercadoPago|recovery_checkout/);
  assert.match(dialog,/depende de confirmação antes do pagamento/);
});
test('unsubscribe is signed and GET does not mutate', () => {
 const code=read('app/api/checkout-recovery/unsubscribe/route.ts');
 const m=code.match(/export async function GET\(request: Request\) \{([\s\S]*?)\n\}\nexport async function POST/);
 assert.ok(m,'GET route and POST route must be separate');
 assert.doesNotMatch(m[1],/\.update\(|\.delete\(/);
 assert.match(code,/timingSafeEqual/);
 assert.match(code,/unsubscribed_at/);
});
test('guest lead table has RLS and is unavailable to anon and authenticated roles',()=>{
 const sql=read('supabase/migrations/20261029142548_soma_guest_checkout_abandonment_consent_20261028.sql');
 assert.match(sql,/enable row level security/);
 assert.match(sql,/revoke all on public.soma_guest_checkout_leads from public, anon, authenticated/);
 assert.match(sql,/unique\(email_hash, product\)/);
});
