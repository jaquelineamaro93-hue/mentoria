import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('welcome HTML preserves SOMA voice, branding and hand-lettered signature', () => {
  const mail = read('lib/welcome-email.ts');
  assert.match(mail, /buildWelcomeEmail/);
  assert.match(mail, /Segoe Script/);
  assert.match(mail, /Jaqueline Amaro/);
  assert.match(mail, /Começar minha jornada na SOMA/);
  assert.match(mail, /&amp;utm_medium=email/);
  assert.match(mail, /somamentoria\.com\/onboarding/);
  assert.doesNotMatch(mail, /🎉|<script/i);
  assert.doesNotMatch(mail, /Bem-vindo!|Parabéns!|Sua conta foi criada!/i);
});

test('welcome dispatch is authenticated and deduplicated', () => {
  const route = read('app/api/welcome/dispatch/route.ts');
  assert.match(route, /supabase\.auth\.getUser\(\)/);
  assert.match(route, /email_confirmed_at/);
  assert.match(route, /SOMA_WELCOME_MIN_CREATED_AT/);
  assert.match(route, /SOMA_WELCOME_ENABLED/);
  assert.match(route, /status: 'reserved'/);
  assert.match(route, /23505/);
  assert.match(route, /consultoria@camarocrm\.com/);
  assert.match(route, /user\.email/);
  assert.doesNotMatch(route, /request\.json\(\)/);
});

test('existing auth code route is not repurposed for welcome', () => {
  const code = read('app/api/auth/send-magic-code/route.ts');
  assert.match(code, /Seu código de acesso/);
  const dashboard = read('app/(dashboard)/dashboard/page.tsx');
  assert.match(dashboard, /WelcomeEmailTrigger/);
});

test('welcome log is private and unique to each user', () => {
  const schema = read('supabase/migrations/20261027014000_welcome_email_dispatches.sql');
  assert.match(schema, /user_id uuid PRIMARY KEY/);
  assert.match(schema, /ENABLE ROW LEVEL SECURITY/);
  assert.match(schema, /REVOKE ALL .* anon, authenticated/);
});
