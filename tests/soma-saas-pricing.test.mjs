import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
 BASE_SAAS_CENTAVOS, calcularPrecoSaas, formatarReais,
 ADICIONAL_IA_CENTAVOS, DOIS_AGENTES_CENTAVOS,
 ADICIONAL_MENTORIA_EXISTENTE_CENTAVOS,
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
 assert.match(module,/Os planos de mentoria com encontros humanos são contratos separados/);
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
 assert.match(ui,/calcularPrecoSaas\(plano, \{ iris, whatsapp \}\)/);
 assert.match(ui,/linkContato/);
 assert.match(ui,/Solicitar contratação/);
 assert.match(ui,/Nenhuma cobrança acontece ao clicar/);
 assert.match(ui,/Sem agentes de IA inclusos|sem agentes de IA/);
 assert.match(ui,/Contratação disponível após validação de segurança/);
});

test('nenhuma compra SaaS é disponibilizada enquanto o backend não garante entitlements',()=>{
 const ui=file('components/public/SomaSaasShowcase.tsx');
 const audit=file('docs/soma-saas-auditoria-seguranca-20261021.md');
 assert.doesNotMatch(ui,/href=.*\/checkout\?plan=/);
 assert.doesNotMatch(ui,/fetch\(.*mercadopago/);
 assert.match(audit,/enforce_access=false/);
 assert.match(audit,/Não liberar cobranças SaaS/);
});
