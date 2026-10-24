const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
function compile(path,mocks={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,{exports,require:name=>mocks[name]??require(name),Date,console});return exports;}
const contracts=compile('lib/product-contracts.ts');
function checkout(){
 const orders=[];let queries=0;
 const plan={id:'plan',codigo:'valid',nome:'SOMA 6 meses',duracao_meses:6,preco_avista:800,preco_cartao:875,preco_recorrente_total:960,parcelas_recorrente:4};
 const db={auth:{getUser:async()=>({data:{user:{id:'owner',email:'owner@example.invalid'}}})},from:()=>{queries++;const chain={select:()=>chain,eq:()=>chain,single:async()=>({data:plan})};return chain;}};
 const api=compile('app/api/mercadopago/criar-assinatura/route.ts',{'@/lib/product-contracts':contracts,'next/server':{NextResponse:{json:(body,options={})=>({body,status:options.status||200})}},'@/lib/supabase/server':{createClient:async()=>db},'@/lib/security/rate-limit':{consumeSecurityRateLimit:async()=>true},'@/lib/mercadopago-orders':{registrarPedido:async input=>{orders.push(input);return {id:'order',admin:{}};},vincularCobranca:async()=>{}},'@/lib/mercadopago':{criarPagamentoUnicoMercadoPago:async()=>({id:'mp',init_point:'https://www.mercadopago.com.br/fixture'})}});
 return {...api,orders,queries:()=>queries};
}
const request=body=>({json:async()=>body});
test('missing, false or outdated contractual consent prevents order creation',async()=>{
 for(const body of [{},{contractAccepted:false},{contractAccepted:true,contractVersion:'old'}]){const h=checkout();assert.equal((await h.POST(request(body))).status,400);assert.equal(h.orders.length,0);assert.equal(h.queries(),0);}
});
test('new career purchase pins the contract, real account and server-priced commercial snapshot',async()=>{
 const h=checkout();const response=await h.POST(request({contractAccepted:true,contractVersion:contracts.PRODUCT_CONTRACTS.carreira.version,planoCodigo:'valid',formaPagamento:'avista',valor:.01,user_id:'victim',email:'victim@example.invalid'}));
 assert.equal(response.status,200);const order=h.orders[0];assert.equal(order.user_id,'owner');assert.equal(order.valor,800);assert.equal(order.email,'owner@example.invalid');assert.equal(order.terms_version,'carreira-2026-10-24');assert.ok(Date.parse(order.terms_accepted_at));assert.equal(order.contract_snapshot.valor_total,800);assert.equal(order.contract_snapshot.duracao_meses,6);
});
test('contract families separate human meetings, software, add-ons and the introductory charge',()=>{
 assert.notEqual(contracts.PRODUCT_CONTRACTS.carreira.version,contracts.PRODUCT_CONTRACTS.plataforma.version);
 assert.match(contracts.PRODUCT_CONTRACTS.plataforma.markdown,/não inclui encontros humanos/);
 assert.match(contracts.PRODUCT_CONTRACTS.carreira.markdown,/um encontro individual por mês/);
 assert.match(contracts.RECOVERY_CONTRACT_MARKDOWN,/Somente a primeira mensalidade/);
 assert.match(contracts.PRODUCT_CONTRACTS.adicionais.markdown,/Não há renovação automática/);
});
