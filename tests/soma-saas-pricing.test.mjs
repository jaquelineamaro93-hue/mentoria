import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
 BASE_SAAS_CENTAVOS, calcularPrecoSaas, formatarReais,
 ADICIONAL_IA_CENTAVOS, DOIS_AGENTES_CENTAVOS,
 ADICIONAL_MENTORIA_EXISTENTE_CENTAVOS, KIT_ONBOARDING_CENTAVOS,
 calcularResumoSaas, MODALIDADES_MENTORIA,
} from '../lib/soma-saas-pricing.ts';

const file = path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const base = { avulso: 2490, essencial: 3490, pro: 6990 };

test('planos base sem IA, preço em centavos sem arredondamento',()=>{
 assert.deepEqual(BASE_SAAS_CENTAVOS,base);
 for(const [plan,price] of Object.entries(base)){
  assert.deepEqual(calcularPrecoSaas(plan,{iris:false,whatsapp:false}),{base:price,adicionais:0,total:price});
 }
 assert.equal(formatarReais(2490),'R$ 24,90');
});

test('Íris ou WhatsApp custa 150 cada; ambos juntos custam 250, nunca 300',()=>{
 assert.equal(ADICIONAL_IA_CENTAVOS,15000);
 assert.equal(DOIS_AGENTES_CENTAVOS,25000);
 for(const [plan,price] of Object.entries(base)){
  assert.equal(calcularPrecoSaas(plan,{iris:true,whatsapp:false}).total,price+15000);
  assert.equal(calcularPrecoSaas(plan,{iris:false,whatsapp:true}).total,price+15000);
  assert.equal(calcularPrecoSaas(plan,{iris:true,whatsapp:true}).total,price+25000);
 }
 assert.equal(calcularPrecoSaas('pro',{iris:true,whatsapp:true}).total,31990);
});

test('adicional de R$50 para avaliação de mentoria existente não altera preço contratado automaticamente',()=>{
 assert.equal(ADICIONAL_MENTORIA_EXISTENTE_CENTAVOS,5000);
 const module=file('components/public/SomaSaasShowcase.tsx');
 const checkout=file('app/api/mercadopago/criar-assinatura/route.ts');
 assert.doesNotMatch(module,/Contratação disponível após validação de segurança/);
 assert.doesNotMatch(module,/Na revisão de novas ofertas de mentoria/);
 assert.doesNotMatch(module,/api\/mercadopago\/criar-assinatura/);
 assert.match(checkout,/\.from\('planos_mentoria'\)/);
 assert.doesNotMatch(checkout,/ADICIONAL_IA_CENTAVOS|DOIS_AGENTES_CENTAVOS/);
});

test('seleção funciona na UI e envia simulação comercial sem cobrar',()=>{
 const ui=file('components/public/SomaSaasShowcase.tsx');
 assert.match(ui,/setPlano\(codigo\)/);
 assert.match(ui,/setIris\(e.target.checked\)/);
 assert.match(ui,/setWhatsapp\(e.target.checked\)/);
 assert.match(ui,/setModulo\(e.target.value\)/);
 assert.match(ui,/calcularResumoSaas\(plano, \{ iris, whatsapp \}, kitOnboarding\)/);
 assert.match(ui,/linkContato/);
 assert.match(ui,/Continuar com Mercado Pago/);
 assert.match(ui,/minha-assinatura-saas\?/);
 assert.match(ui,/Acesse sua conta para revisar o plano e os agentes antes do pagamento/);
 assert.match(ui,/Sem agentes de IA inclusos|sem agentes de IA/);
 assert.doesNotMatch(ui,/Contratação disponível após validação de segurança/);
});

test('nenhuma compra SaaS é disponibilizada enquanto o backend não garante entitlements',()=>{
 const ui=file('components/public/SomaSaasShowcase.tsx');
 const audit=file('docs/soma-saas-auditoria-seguranca-20261021.md');
 assert.doesNotMatch(ui,/href=.*\/checkout\?plan=/);
 assert.doesNotMatch(ui,/fetch\(.*mercadopago/);
 assert.match(audit,/enforce_access=false/);
 assert.match(audit,/Não liberar cobranças SaaS/);
});

test('kit tem cobrança única de R$ 189,90 e não altera mensalidade',()=>{
 assert.equal(KIT_ONBOARDING_CENTAVOS,18990);
 const monthly=calcularResumoSaas('essencial',{iris:true,whatsapp:false},true);
 assert.equal(monthly.total,18490);
 assert.equal(monthly.kitAvulso,18990);
 assert.equal(monthly.estimativaPrimeiroMes,37480);
 assert.equal(calcularResumoSaas('essencial',{iris:true,whatsapp:false},false).total,18490);
});

test('mentoria em grupo, individual online, presencial e carreira completa têm condições sob consulta',()=>{
 const ui=file('components/public/SomaSaasShowcase.tsx');
 for(const key of ['grupo','online-1-1','presencial','carreira-completa']){
  assert.ok(Object.hasOwn(MODALIDADES_MENTORIA,key));
 }
 assert.match(ui,/SOMA Plataforma/);
 assert.match(ui,/SOMA Carreira/);
 assert.match(ui,/setMentoria\(item.tipo\)/);
 assert.match(ui,/setKitOnboarding\(e.target.checked\)/);
 assert.match(ui,/Kit Onboarding/);
 assert.match(ui,/Sob consulta/);
 assert.match(ui,/Pagamento único/);
 assert.doesNotMatch(ui,/checkout SaaS automático ainda não foi habilitado/);
 assert.doesNotMatch(ui,/Preços de referência mensais/);
 assert.doesNotMatch(ui,/Na revisão de novas ofertas/);
});
