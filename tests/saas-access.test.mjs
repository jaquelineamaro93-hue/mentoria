import test from 'node:test';
import assert from 'node:assert/strict';
import { saasCanVisit, moduleForPath } from '../lib/saas-access.ts';
const access={saas:true,mentorship:false,modules:['curriculo-ats'],iris:false,whatsapp:false,trialEndsAt:null};
test('SaaS single module cannot access another tool, mentorship or unknown APIs',()=>{
 for(const path of ['/diario','/meu-pdi','/onboarding','/admin','/api/pdi/acoes','/api/trial/start','/api/mercadopago/sessao-extra','/api/copiloto','/api/unclassified']) assert.equal(saasCanVisit(access,path),false,path);
 for(const path of ['/gravacoes','/api/aprender/aula','/api/aprender/progresso','/plataforma','/gupy','/simulador-cv','/perfil','/api/saas','/api/gerar-simulacao-cv']) assert.equal(saasCanVisit(access,path),true,path);
 assert.equal(saasCanVisit(access,'/carreira','etapa=cv'),true);
 assert.equal(saasCanVisit(access,'/carreira','etapa=vagas'),false);
 assert.equal(saasCanVisit(access,'/carreira','etapa=entrevista'),false);
});
test('prefix lookalikes cannot bypass entitlement gates',()=>{
 assert.equal(moduleForPath('/meu-pdi-evil'),null);
 assert.equal(saasCanVisit(access,'/api/saas-evil'),false);
});
test('paid mentorship and existing legacy access are preserved',()=>{
 assert.equal(saasCanVisit({...access,mentorship:true},'/gravacoes'),true);
 assert.equal(saasCanVisit({...access,saas:false},'/diario'),true);
});

test('biblioteca entry does not unlock other learning-like or administrative routes',()=>{
 for(const path of ['/gravacoes-evil','/api/aprender-evil','/admin/biblioteca','/api/admin/biblioteca'])assert.equal(saasCanVisit(access,path),false);
});
