import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
 detectarPesquisaIris, areaDaBusca, filtrarConsultorias, filtrarVagas, pesquisarPublicamente,
} from '../lib/iris-pesquisa-publica.ts';

const read = p => readFileSync(new URL('../'+p,import.meta.url),'utf8');
const today = new Date().toISOString();

test('Detecta consultas concretas e continuação, mas não confunde análise pessoal com pesquisa pública',()=>{
 assert.equal(detectarPesquisaIris('Pode me trazer consultorias com foco em CRM?'),'consultorias');
 assert.equal(detectarPesquisaIris('Busque agências de CRM'),'consultorias');
 assert.equal(detectarPesquisaIris('Quero mais consultorias com foco em CRM'),'consultorias');
 assert.equal(detectarPesquisaIris('Traga outras','Íris: Consultorias de CRM encontradas: DTM CRM'),'consultorias');
 assert.equal(detectarPesquisaIris('Traga mais vagas','Íris: Vagas públicas encontradas para CRM'),'vagas');
 assert.equal(detectarPesquisaIris('Você pode buscar vagas de CRM abertas?'),'vagas');
 assert.equal(detectarPesquisaIris('Como mudar minha carreira?'),null);
 assert.equal(detectarPesquisaIris('Quero um currículo para vagas de CRM'),null);
 assert.equal(detectarPesquisaIris('Quero consultoria de carreira'),null);
 assert.equal(detectarPesquisaIris('Me indique consultorias de ERP'),null);
 assert.equal(areaDaBusca('Encontre vagas de Customer Success'),'cs');
 assert.equal(areaDaBusca('Encontre vagas de CRM'),'crm');
});

test('Consultorias CRM aprovadas aparecem; ERP puro, não aprovado e URLs perigosas são descartados',()=>{
 const companies=[
  {nome:'DTM CRM',especialidade:'Multi-plataforma',descricao:'Consultoria CRM e RevOps',site:'https://www.dtmcrm.com.br/',aprovado:true},
  {nome:'Consultoria ERP',especialidade:'ERP',descricao:'Gestão financeira e estoque',site:'https://erp.example.com',aprovado:true},
  {nome:'Empresa ainda em análise',especialidade:'CRM',descricao:'Automação CRM',site:'https://pending.example.com',aprovado:false},
  {nome:'Injeção',especialidade:'CRM',descricao:'Consultoria CRM',site:'javascript:alert(1)',aprovado:true},
 ];
 const first=filtrarConsultorias(companies);
 assert.equal(first[0].nome,'DTM CRM');
 assert.ok(first.every(x=>!x.nome.includes('ERP')&&!x.nome.includes('análise')&&!x.nome.includes('Injeção')));
 assert.equal(filtrarConsultorias(companies,'Íris: DTM CRM',true).some(x=>x.nome==='DTM CRM'),false);
 assert.ok(filtrarConsultorias(companies,'Íris: DTM CRM',true).length > 0);
});

test('Vagas só são sugeridas quando listadas, recentes e com URL real; nada sobre perfis individuais',()=>{
 const base={
  title:'Especialista de CRM',company:'Empresa A',url:'https://jobs.example.com/crm-1',
  availability_status:'listed',published_at:today,availability_checked_at:today,
  categoria_slug:'crm',job_origin:'automatic',
 };
 const rows=[
  base,
  {...base,title:'Consultor ERP',url:'https://jobs.example.com/erp',categoria_slug:'erp',descricao_resumo:'gestão de ERP'},
  {...base,title:'Especialista de CRM',url:'https://jobs.example.com/closed',availability_status:'closed'},
  {...base,title:'Analista CRM',url:'https://jobs.example.com/stale',availability_checked_at:'2025-01-01T00:00:00.000Z'},
  {...base,title:'Coordenador CRM',url:'javascript:alert(1)'},
  {...base,title:'Customer Success',url:'https://jobs.example.com/cs',categoria_slug:'customer-success',job_origin:'community',availability_checked_at:null},
 ];
 const jobs=filtrarVagas(rows,'crm');
 assert.equal(jobs.length,1);
 assert.equal(jobs[0].url,'https://jobs.example.com/crm-1');
 assert.equal(filtrarVagas(rows,'crm','Íris: https://jobs.example.com/crm-1',true).length,0);
 assert.equal(filtrarVagas(rows,'cs').length,1);
 const code=read('lib/iris-pesquisa-publica.ts');
 for(const banned of ['match_profiles','service_role','open_to_work','saved_jobs','curriculo','raw_resume']){
  assert.doesNotMatch(code,new RegExp("\\\\.from\\\\(['\\\"]"+banned+"['\\\"]\\\\)"));
 }
 assert.match(code,/credentials: 'omit'/);
 assert.match(code,/cache: 'no-store'/);
 assert.match(code,/select: 'title,cargo,company/);
});

test('Conecta a API pública somente com parâmetros genéricos e sem credenciais de mentorado',async()=>{
 const old=process.env.CONEXAO_CRM_PUBLIC_ANON_KEY;
 process.env.CONEXAO_CRM_PUBLIC_ANON_KEY='a'.repeat(80);
 const urls=[],configs=[];
 const fake=async(url,config)=>{urls.push(url);configs.push(config);return{ok:true,json:async()=>[
  {nome:'Oblyx Hub Estratégico de CRM',especialidade:'Multi-plataforma',descricao:'Atua em CRM',site:'https://oblyx.com.br',aprovado:true},
 ]};};
 try{
  const r=await pesquisarPublicamente('consultorias','Busque consultorias CRM','',fake);
  assert.match(r.resposta,/Oblyx/);
  assert.equal(urls.length,1);
  const u=new URL(urls[0]);
  assert.equal(u.origin,'https://rwkbpafpniwzvlkfngag.supabase.co');
  assert.equal(u.pathname,'/rest/v1/agencias_sugeridas');
  assert.equal(u.searchParams.get('select'),'nome,especialidade,descricao,site,aprovado');
  assert.equal(configs[0].credentials,'omit');
  assert.equal(configs[0].method,'GET');
  assert.equal(configs[0].cache,'no-store');
  assert.doesNotMatch(urls[0],/Oblyx|mentor|curric|user_id|perfil/);
 } finally {
  if(old===undefined) delete process.env.CONEXAO_CRM_PUBLIC_ANON_KEY;
  else process.env.CONEXAO_CRM_PUBLIC_ANON_KEY=old;
 }
});

test('Exibe limites e alternativa pública do LinkedIn sem fingir ter consultado o LinkedIn',async()=>{
 const old=process.env.CONEXAO_CRM_PUBLIC_ANON_KEY;
 delete process.env.CONEXAO_CRM_PUBLIC_ANON_KEY;
 try{
  const v=await pesquisarPublicamente('vagas','Encontre vagas de CRM');
  assert.match(v.resposta,/Não consegui consultar/);
  assert.match(v.resposta,/Não consultei os resultados do LinkedIn/);
  assert.match(v.resposta,/linkedin.com\/jobs\/search/);
 } finally {
  if(old!==undefined) process.env.CONEXAO_CRM_PUBLIC_ANON_KEY=old;
 }
});

test('Rota só compartilha contexto privado com a IA da própria SOMA, não com Conexão CRM',()=>{
 const route=read('app/api/copiloto/route.ts');
 assert.match(route,/detectarPesquisaIris\(pedido, contextoDaPesquisa\)/);
 assert.match(route,/pesquisarPublicamente\(tipoPesquisa, pedido, contextoDaPesquisa\)/);
 assert.match(route,/return responderComHistorico\(resultado\)/);
 assert.match(route,/recentIrisContext\(user.id, conversationId\)/);
 assert.match(route,/ownsIrisConversation\(user.id, conversationId\)/);
 assert.match(route,/if \(tipoPesquisa\) \{/);
 const source=read('lib/iris-mentoria-voz.ts');
 assert.match(source,/CRM é gestão do relacionamento com clientes e é diferente de ERP/);
 assert.match(source,/REVISÃO EDITORIAL/);
});
