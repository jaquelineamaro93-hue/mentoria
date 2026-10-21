import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const file = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('login does not expose F12 tips, session tokens or email in console', () => {
  const auth = file('app/(dashboard)/auth/confirm/page.tsx');
  assert.doesNotMatch(auth, /F12|logs completos|console\.(log|warn|error)/);
  assert.doesNotMatch(auth, /hash\.substring\(/);
  assert.match(auth, /supabase\.auth\.getUser\(\)/);
  assert.match(auth, /window\.history\.replaceState\(/);
  assert.match(auth, /AuthJourneyLoading/);
});

test('dashboard uses batched independent queries with ownership filter', () => {
  const dashboard = file('app/(dashboard)/dashboard/page.tsx');
  assert.match(dashboard, /\] = await Promise\.all\(\[/);
  assert.match(dashboard, /\.eq\('user_id', user\.id\)/);
  assert.match(dashboard, /\.eq\('mentorado_id', user\.id\)/);
});

test('SaaS pricing remains a proposal with no purchase link enabled', () => {
  const plans = file('app/(public)/planos/page.tsx');
  const saas = file('components/public/SomaSaasShowcase.tsx');
  assert.match(plans, /SomaSaasShowcase/);
  assert.match(saas, /valor proposto para lançamento/);
  assert.match(saas, /Contratação disponível após validação de segurança/);
  assert.doesNotMatch(saas, /\/api\/mercadopago|href=.*checkout/);
});

test('Copilot queries only caller-owned records and requires authentication', () => {
  const api = file('app/api/copiloto/route.ts');
  assert.match(api, /db\.auth\.getUser\(\)/);
  assert.match(api, /\.eq\('mentorado_id', user\.id\)/);
  assert.match(api, /\.eq\('user_id', user\.id\)/);
  assert.match(api, /classificarComJev\(pedido\)/);
  assert.match(api, /validar/);
  assert.doesNotMatch(api, /execute_sql|query\(body\.|eval\(/);
});

test('security audit documents unresolved access gating and no guarantee', () => {
  const audit = file('docs/soma-saas-auditoria-seguranca-20261021.md');
  assert.match(audit, /enforce_access=false/);
  assert.match(audit, /NÃO|não foi realizado pentest/i);
  assert.match(audit, /product_events/);
  assert.match(audit, /Não liberar cobranças SaaS/);
});
