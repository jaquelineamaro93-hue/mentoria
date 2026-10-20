const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');

function load(source,mocks={},globals={}){
 const exports={};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(source,'utf8'),{
   compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,target:ts.ScriptTarget.ES2022}
 }).outputText,{exports,require:n=>mocks[n]??require(n),console,process,URL,...globals});
 return exports;
}

const routes=load('lib/modules/routes.ts');
test('unknown routes stay out of modular paywall',()=>{
 for(const path of ['/modulos','/planos','/gravacoes','/admin','/api/mercadopago/webhook'])
  assert.equal(routes.moduleForRequest(path,new URLSearchParams()),null);
});
test('modular routes and legacy aliases use stable slug',()=>{
 const cases=[
  ['/quem-sou-eu','','autoconhecimento'],
  ['/api/gerar-mapa-essencia','','autoconhecimento'],
  ['/exercicios','','diagnostico'],
  ['/percepcao-360','','percepcao-360'],
  ['/carreira','etapa=cv','curriculo-ats'],
  ['/carreira','etapa=vagas','vagas'],
  ['/carreira','etapa=entrevista','entrevistas'],
  ['/simulador-cv','','curriculo-ats'],
  ['/linkedin','','linkedin'],
  ['/conteudo-linkedin','','linkedin'],
  ['/entrevista','','entrevistas'],
  ['/pdi','','desenvolvimento'],
  ['/meu-pdi','','desenvolvimento'],
  ['/network','','networking'],
 ];
 for(const [path,query,want] of cases)
  assert.equal(routes.moduleForRequest(path,new URLSearchParams(query)),want);
});

test('Mercado Pago modular preapproval contains only server-defined monthly terms',async()=>{
 let payload;
 const mp=load('lib/mercadopago-modules.ts',{},{
  fetch:async (url,opts)=>{
   assert.equal(url,'https://api.mercadopago.com/preapproval');
   payload=JSON.parse(opts.body);
   return{ok:true,json:async()=>({id:'sub123',init_point:'https://www.mercadopago.com.br/subscriptions/checkout'})};
  },
 });
 process.env.MERCADOPAGO_ACCESS_TOKEN='test-only';
 process.env.NEXT_PUBLIC_SITE_URL='https://somamentoria.com';
 const result=await mp.criarAssinaturaModuloMP({
  email:'fake@example.com',valorMensal:19.9,titulo:'Currículo e ATS',
  externalReference:'00000000-0000-0000-0000-000000000111',
 });
 assert.equal(result.id,'sub123');
 assert.equal(payload.status,'pending');
 assert.equal(payload.auto_recurring.transaction_amount,19.9);
 assert.equal(payload.auto_recurring.frequency_type,'months');
 assert.equal(payload.external_reference,'00000000-0000-0000-0000-000000000111');
 assert.equal(Object.hasOwn(payload.auto_recurring,'end_date'),false);
});
test('cancel only succeeds with explicit Mercado Pago canceled confirmation',async()=>{
 const mp=load('lib/mercadopago-modules.ts',{},{
  fetch:async()=>({ok:true,json:async()=>({status:'authorized'})}),
 });
 process.env.MERCADOPAGO_ACCESS_TOKEN='test-only';
 await assert.rejects(mp.cancelarAssinaturaModuloMP('sub123'),/não confirmou/);
});
