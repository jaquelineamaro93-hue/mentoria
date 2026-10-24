import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { moduloSaasParaRota, rotaBasicaSaas } from '../lib/soma-saas-routes.ts';

const file=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('páginas SaaS e serviços de conta sempre acessíveis',()=>{
 for(const route of ['/minha-assinatura-saas','/planos','/perfil','/termos','/api/saas/acesso','/api/saas/checkout','/api/auth/confirm']){
  assert.equal(rotaBasicaSaas(route),true,route);
 }
});
test('cada módulo tem rotas explícitas e nenhuma rota privada da mentoria se encaixa',()=>{
 const casos=[
  ['/quem-sou-eu','','autoconhecimento'],
  ['/exercicios','','diagnostico'],
  ['/percepcao-360','','percepcao-360'],
  ['/meu-pdi','','desenvolvimento'],
  ['/carreira','?etapa=cv','curriculo-ats'],
  ['/carreira','?etapa=vagas','vagas'],
  ['/carreira','?etapa=entrevista','entrevistas'],
  ['/network','','networking'],
  ['/linkedin','','linkedin'],
  ['/gupy','','curriculo-ats'],
  ['/api/pdi/acoes','','desenvolvimento'],
  ['/admin','',''],
  ['/gravacoes','',''],
  ['/minha-trilha','',''],
  ['/feedback-pares','',''],
  ['/api/admin/membros','',''],
  ['/api/ferramentas-soma/analisar','',''],
 ];
 for(const [path,query,required] of casos) {
  assert.equal(moduloSaasParaRota(path,query)||'',required,path);
  if (!required) assert.equal(rotaBasicaSaas(path),false,path);
 }
});
test('a autorização no servidor é independente do sidebar',()=>{
 const proxy=file('proxy.ts');
 const sidebar=file('components/CollapsibleSidebar.tsx');
 const nav=file('lib/config/portalNavigation.ts');
 assert.match(proxy,/const somenteSaas=/);
 assert.match(proxy,/if \(somenteSaas && !rotaBasicaSaas\(path\)\)/);
 assert.match(proxy,/moduloSaasParaRota\(path,request\.nextUrl\.search\)/);
 assert.match(proxy,/supabase\.rpc\('soma_has_module',\{p_slug:modulo\}\)/);
 assert.match(proxy,/Recurso não incluído no seu plano SaaS/);
 assert.match(proxy,/destino\.pathname='\/minha-assinatura-saas'/);
 assert.match(sidebar,/const gruposVisiveis = somenteSaas/);
 assert.match(nav,/Minha assinatura SaaS/);
});
test('acesso à Íris exige adicional pago e não acompanha módulo aleatório',()=>{
 const proxy=file('proxy.ts');
 const api=file('app/api/copiloto/route.ts');
 assert.match(proxy,/path\.startsWith\('\/api\/copiloto'\)/);
 assert.match(proxy,/iris_enabled/);
 assert.match(proxy,/paid_through/);
 assert.match(api,/resolverAcessoSaas\(user\.id\)/);
 assert.match(api,/if \(!acessoSaas\.irisPermitida\)/);
 assert.match(api,/!acessoSaas\.modulosPermitidos\.includes\('desenvolvimento'\)/);
});
