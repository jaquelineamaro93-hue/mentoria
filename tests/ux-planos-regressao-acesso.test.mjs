import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const file = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('login Google, magic link, recovery e trial preservam os fluxos existentes', () => {
  const auth = file('app/(dashboard)/auth/confirm/page.tsx');
  assert.match(auth, /onAuthStateChange/);
  assert.match(auth, /supabase\.auth\.verifyOtp/);
  assert.match(auth, /supabase\.auth\.setSession/);
  assert.match(auth, /supabase\.auth\.getSession/);
  assert.match(auth, /concluirTrial/);
  assert.match(auth, /registrar_login_portal/);
  assert.match(auth, /reset-password/);
  assert.match(auth, /router\.push\('\/dashboard'\)/);
  assert.match(auth, /AuthJourneyLoading/);
  assert.doesNotMatch(auth, /F12|console\.(?:log|warn|error)|Hash encontrada|Access token:/);
});

test('precificação SaaS é apenas vitrine e mentoria mantém checkout e trial', () => {
  const page = file('app/(public)/planos/page.tsx');
  const saas = file('components/public/SomaSaasShowcase.tsx');
  assert.match(page, /SomaSaasShowcase/);
  assert.match(page, /\/checkout\?plan=/);
  assert.match(page, /trial_plan=/);
  assert.match(saas, /R\$ 24,90/);
  assert.match(saas, /R\$ 34,90/);
  assert.match(saas, /R\$ 69,90/);
  assert.match(saas, /Contratação disponível após validação de segurança/);
  assert.doesNotMatch(saas, /href=.*\/checkout|fetch\(.*mercadopago/);
});

test('dashboard carrega em paralelo, mas mantém dados por conta', () => {
  const dash = file('app/(dashboard)/dashboard/page.tsx');
  assert.match(dash, /await Promise\.all\(\[/);
  assert.match(dash, /eq\('user_id', user\.id\)/);
  assert.match(dash, /eq\('mentorado_id', user\.id\)/);
  assert.match(dash, /supabase\.auth\.getUser/);
});

test('não modifica regras de plano e registra pendências reais', () => {
  const audit = file('docs/soma-saas-auditoria-seguranca-20261021.md');
  assert.match(audit, /enforce_access=false/);
  assert.match(audit, /Não liberar cobranças SaaS/);
  assert.match(audit, /RLS/);
});
