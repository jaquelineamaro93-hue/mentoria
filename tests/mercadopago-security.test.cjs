const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const crypto=require('node:crypto');
function load(file,mocks={}) {
 const exports={};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,
 {exports,require:n=>mocks[n]||require(n),process,console,URL,Response,Buffer});
 return exports;
}
const next={NextResponse:{json:(body,options)=>Response.json(body,options)}};
const security=load('lib/mercadopago-webhook-security.ts');
function signature(id){const ts='1710000000';return `ts=${ts},v1=${crypto.createHmac('sha256',process.env.MERCADOPAGO_WEBHOOK_SECRET).update(`id:${id.toLowerCase()};request-id:request;ts:${ts};`).digest('hex')}`;}
process.env.MERCADOPAGO_WEBHOOK_SECRET='unit-test-only-secret';
test('signature rejects altered ID and accepts signed ID',()=>{
 assert.equal(security.verificarAssinaturaWebhook(signature('ABC'),'request','ABC').valido,true);
 assert.equal(security.verificarAssinaturaWebhook(signature('ABC'),'request','other').valido,false);
});
function route(overrides={}){return load('app/api/mercadopago/webhook/route.ts',{
 'next/server':next,'@/lib/supabase/admin':{createAdminClient:()=>({rpc:async()=>({data:'processado',error:null}),...overrides.admin})},
 '@/lib/mercadopago-webhook-security':security,
 '@/lib/modules/payment':{
   findModuleOrder:async()=>null,
   findModuleOrderByKnownPayment:async()=>null,
   syncModulePayment:async()=> 'processed',
   syncModulePreapproval:async()=> 'processed',
   ...(overrides.modules||{}),
 },
 '@/lib/mercadopago':{buscarPagamentoMercadoPago:async id=>({id,external_reference:'order',status:'approved',transaction_amount:5,currency_id:'BRL'}),...overrides.mp},
});}
function request(id='123',body={type:'payment',data:{id}}){return new Request(`https://test.invalid/api/mercadopago/webhook?data.id=${id}`,{method:'POST',headers:{'x-signature':signature(id),'x-request-id':'request'},body:JSON.stringify(body)});}
test('malformed JSON returns 400',async()=>assert.equal((await route().POST(new Request('https://test.invalid',{method:'POST',body:'{'}))).status,400));
test('body ID cannot replace signed query ID',async()=>assert.equal((await route().POST(request('123',{type:'payment',data:{id:'456'}}))).status,400));
test('unsigned requests do not process payments',async()=>assert.equal((await route().POST(new Request('https://test.invalid?data.id=123',{method:'POST',body:JSON.stringify({type:'payment'})}))).status,401));
test('verified payment uses atomic persistence with server amount',async()=>{
 let params;
 const r=await route({admin:{rpc:async(n,p)=>{assert.equal(n,'processar_mp_pagamento');params=p;return {data:'processado',error:null};}}}).POST(request());
 assert.equal(r.status,200);assert.equal(params.p_valor,5);assert.equal(params.p_currency,'BRL');assert.equal(params.p_payment_id,'123');
});
test('database failure returns retryable 500',async()=>assert.equal((await route({admin:{rpc:async()=>({error:{message:'failure'}})}}).POST(request())).status,500));
test('subscription charge topic resolves payment before processing',async()=>{
 let called;
 const r=await route({admin:{from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{mp_resource_id:'subscription'},error:null})})})})},mp:{buscarPreapprovalMercadoPago:async()=>({id:'subscription',external_reference:'order'}),buscarPagamentoAssinaturaMercadoPago:async()=>({payment:{id:789}}),buscarPagamentoMercadoPago:async id=>{called=id;return {id,external_reference:'order',status:'approved',transaction_amount:5,currency_id:'BRL'};}}}).POST(request('123',{type:'subscription_authorized_payment',data:{id:'123'}}));
 assert.equal(r.status,200);assert.equal(called,'789');
});
test('legacy preference rejects arbitrary client items',async()=>{
 const mocks={'next/server':next,'@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'user',email:'user@example.com'}}})}})},'@/lib/mercadopago-orders':{},'@/lib/mercadopago':{}};
 const checkout=load('app/api/mercadopago/criar-assinatura/route.ts',mocks);
 const r=await checkout.POST(new Request('https://test.invalid',{method:'POST',body:JSON.stringify({items:[{unit_price:.01}],external_reference:'victim'})}));
 assert.equal(r.status,400);
});

test('modular subscription preapproval does not call legacy payment reconciliation',async()=>{
 const order={id:'00000000-0000-0000-0000-000000000111',provider_subscription_id:'mod-sub',amount:9.99};
 let called=0;
 const r=await route({
  admin:{from:()=>{throw Error('Legacy table touched');}},
  modules:{
   findModuleOrder:async ref=>ref===order.id?order:null,
   syncModulePreapproval:async (o,s)=>{called++;assert.equal(o.id,order.id);assert.equal(s.status,'authorized');return 'processed';},
  },
  mp:{buscarPreapprovalMercadoPago:async()=>({id:'mod-sub',external_reference:order.id,status:'authorized'})},
 }).POST(request('mod-sub',{type:'subscription_preapproval',data:{id:'mod-sub'}}));
 assert.equal(r.status,200);assert.equal(called,1);
});

test('a modular authorized charge grants access only after resolving preapproval and payment',async()=>{
 const order={id:'00000000-0000-0000-0000-000000000111',provider_subscription_id:'mod-sub',amount:9.99};
 let paid=false;
 const r=await route({
  admin:{from:()=>{throw Error('Legacy order was touched');}},
  modules:{
   findModuleOrder:async ref=>ref===order.id?order:null,
   syncModulePayment:async (o,sub,p)=>{paid=true;assert.equal(sub,'mod-sub');assert.equal(p.id,'789');return 'processed';},
  },
  mp:{
   buscarPreapprovalMercadoPago:async()=>({id:'mod-sub',external_reference:order.id,status:'authorized'}),
   buscarPagamentoAssinaturaMercadoPago:async()=>({payment:{id:789},preapproval_id:'mod-sub'}),
   buscarPagamentoMercadoPago:async id=>({id,external_reference:order.id,status:'approved',transaction_amount:9.99,currency_id:'BRL'}),
  },
 }).POST(request('321',{type:'subscription_authorized_payment',data:{id:'321'}}));
 assert.equal(r.status,200);assert.equal(paid,true);
});

test('unsigned modular webhooks cannot reach reconciliation',async()=>{
 let called=false;
 const r=await route({modules:{findModuleOrder:async()=>{called=true;return null;}}})
  .POST(new Request('https://test.invalid?data.id=234',{
   method:'POST',body:JSON.stringify({type:'subscription_preapproval',data:{id:'234'}}),
  }));
 assert.equal(r.status,401);assert.equal(called,false);
});
