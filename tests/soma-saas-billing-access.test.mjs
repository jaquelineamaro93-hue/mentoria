import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const f=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const migrations=[
 f('supabase/migrations/20261023235000_soma_saas_trial_isolado.sql'),
 f('supabase/migrations/20261024001500_soma_saas_billing_isolado.sql'),
 f('supabase/migrations/20261024003000_soma_saas_module_entitlements.sql'),
];
const resolver=f('lib/soma-saas-entitlements.ts');
const mp=f('lib/mercadopago.ts');
const webhook=f('app/api/mercadopago/webhook/route.ts');
const checkout=f('app/api/saas/checkout/route.ts');
const trial=f('app/api/saas/trial/start/route.ts');
const logged=f('app/(dashboard)/minha-assinatura-saas/page.tsx');
const nav=f('lib/config/portalNavigation.ts');

test('SaaS tem trials e pedidos próprios e não altera status nem trial da mentoria',()=>{
 const all=migrations.join('\n');
 assert.match(all,/create table if not exists public\.soma_saas_trials/);
 assert.match(all,/create table if not exists public\.soma_saas_orders/);
 assert.match(all,/create table if not exists public\.soma_saas_payment_events/);
 assert.match(all,/plan_code in \('avulso','essencial','pro'\)/);
 assert.match(all,/ends_at <= started_at \+ interval '7 days'/);
 assert.doesNotMatch(all,/update\s+(?:public\.)?profiles\s+set|update\s+(?:public\.)?planos_mentoria/i);
 assert.doesNotMatch(all,/drop table|truncate table|delete from public\.profiles/i);
 assert.match(resolver,/SAAS_TRIAL_DIAS = 7/);
 assert.match(trial,/SOMA_SAAS_TRIAL_GATES_READY !== 'true'/);
 assert.match(trial,/\.from\('soma_saas_trials'\)\.insert/);
 assert.match(trial,/error\?\.code === '23505'/);
});

test('RLS do produto SaaS não permite escrever assinaturas ou iniciar trial pelo navegador',()=>{
 const [t,s]=migrations;
 assert.match(t,/enable row level security/);
 assert.match(t,/revoke all on public\.soma_saas_trials from public, anon, authenticated/);
 assert.match(t,/for select to authenticated/);
 assert.match(t,/\(select auth\.uid\(\)\)=user_id/);
 assert.match(s,/revoke all on public\.soma_saas_orders from public,anon,authenticated/);
 assert.match(s,/revoke all on public\.soma_saas_payment_events from public,anon,authenticated/);
 assert.match(s,/create policy soma_saas_orders_owner_read/);
 assert.doesNotMatch(s,/for insert to authenticated/);
});

test('SaaS avulso nunca ganha módulos de Pro nem sessões humanas por trial',()=>{
 assert.match(resolver,/MODULOS_ESSENCIAL = \['autoconhecimento', 'diagnostico', 'desenvolvimento'\]/);
 assert.match(resolver,/if \(plano === 'avulso'\) return modulo/);
 assert.match(resolver,/plano === 'essencial' \? \[\.\.\.MODULOS_ESSENCIAL\]/);
 const gate=migrations[2];
 assert.match(gate,/if v_is_saas then/);
 assert.match(gate,/v_trial\.plan_code='avulso' and v_trial\.module_slug=p_slug/);
 assert.match(gate,/v_trial\.plan_code='essencial'/);
 assert.match(gate,/return false;/);
 assert.match(gate,/if not v_mod\.enforce_access then return true;/);
 assert.ok(gate.indexOf('if v_is_saas then') < gate.indexOf('if not v_mod.enforce_access'));
 assert.doesNotMatch(gate,/update\s+public\.profiles\s+set/i);
});

test('Preço e extras são calculados no servidor e cliente não cria assinatura no banco',()=>{
 assert.match(checkout,/SOMA_SAAS_CHECKOUT_GATES_READY !== 'true'/);
 assert.match(checkout,/const mensal=calcularPrecoSaas\(plano as PlanoSaas,\{iris:b\.iris,whatsapp:b\.whatsapp\}\)/);
 assert.match(checkout,/aceite!==true/);
 assert.match(checkout,/soma_saas_orders/);
 assert.match(checkout,/criarAssinaturaSaasMercadoPago/);
 assert.doesNotMatch(checkout,/valor\s*=\s*b\.(?:total|price|preco|amount)/);
 assert.match(mp,/export async function criarAssinaturaSaasMercadoPago/);
 assert.match(mp,/frequency: 1, frequency_type: 'months'/);
 assert.match(mp,/status: 'pending'/);
});

test('Webhook MP assinado separa contrato SaaS de mentoria, não dá acesso no retorno do navegador',()=>{
 assert.match(webhook,/verificarAssinaturaWebhook/);
 assert.match(webhook,/soma_process_saas_payment/);
 assert.match(webhook,/buscarPagamentoAssinaturaMercadoPago/);
 assert.match(webhook,/buscarPagamentoMercadoPago/);
 assert.match(webhook,/if \(!subscriptionReference\) return NextResponse\.json\(\{ignorado:true\}\)/);
 assert.match(webhook,/processar_mp_pagamento/);
 const sql=migrations[1];
 assert.match(sql,/status='approved'/);
 assert.match(sql,/p_amount is distinct from v_order\.amount/);
 assert.match(sql,/p_currency is distinct from v_order\.currency/);
 assert.match(sql,/return 'duplicated'/);
 assert.match(sql,/p_status in \('refunded','charged_back'\)/);
 assert.match(sql,/status='CANCELED'/);
 assert.match(sql,/revoke all on function public\.soma_process_saas_payment/);
 assert.match(sql,/grant execute on function public\.soma_process_saas_payment[\s\S]*to service_role/);
});

test('Página privada SOMA mostra somente acessos próprios e novo link do menu',()=>{
 assert.match(logged,/db\.auth\.getUser\(\)/);
 assert.match(logged,/resolverAcessoSaas\(user\.id\)/);
 assert.match(logged,/Minha assinatura SaaS/);
 assert.match(logged,/SaasTrialControl/);
 assert.match(logged,/SaasCheckoutControl/);
 assert.match(logged,/SOMA_SAAS_TRIAL_GATES_READY === 'true'/);
 assert.match(logged,/SOMA_SAAS_CHECKOUT_GATES_READY === 'true'/);
 assert.match(nav,/href: '\/minha-assinatura-saas'/);
 const components=f('components/saas/SaasCheckoutControl.tsx');
 assert.match(components,/fetch\('\/api\/saas\/checkout'/);
 assert.match(components,/Continuar no Mercado Pago/);
 assert.match(components,/calcularPrecoSaas/);
});

test('Feature flags bloqueiam pagamentos e trials até verificação de isolamento',()=>{
 assert.match(checkout,/return json\(\{ error: 'A contratação automática da Plataforma não está disponível neste momento\.'/);
 assert.match(trial,/return json\(\{ error: 'O teste gratuito da Plataforma ainda não está disponível\.'/);
 assert.doesNotMatch(logged,/liberado=\{true\}|disponivel=\{true\}/);
});
