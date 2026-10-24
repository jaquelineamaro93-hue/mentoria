const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
function compile(file,require,extra={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require,...extra});return exports;}
test('recovery discounts only software, all agent combinations retain their full recurring price',()=>{
 const p=compile('lib/soma-saas-pricing.ts',()=>{});
 for(const [plan,price] of Object.entries({avulso:1990,essencial:2790,pro:5590}))for(const agents of [{iris:false,whatsapp:false},{iris:true,whatsapp:false},{iris:false,whatsapp:true},{iris:true,whatsapp:true}]){
  const result=p.calcularRecuperacaoSaas(plan,agents);const regular=p.calcularPrecoSaas(plan,agents);
  assert.equal(result.primeira,price+regular.adicionais);assert.equal(result.recorrente,regular.total);
 }
});
function reconciliation({providerFails=false,saveFails=false,rows=[{id:'order',provider_subscription_id:'sub',amount:219.9}]}={}){
 const calls=[];const chain={not:()=>chain,is:()=>chain,eq:()=>chain,limit:async()=>({data:rows,error:null})};
 const db={from:()=>({select:()=>chain,update:value=>({eq:async()=>{calls.push(['saved',value]);return {error:saveFails?new Error('database'):null};}})})};
 const h=compile('lib/saas-recovery.ts',name=>name.includes('supabase')?{createAdminClient:()=>db}:{restaurarPrecoAssinaturaSaas:async(id,amount)=>{calls.push(['provider',id,amount]);if(providerFails)throw Error('provider');}});
 return {...h,calls};
}
test('only records restored price after provider confirmation; failures remain retryable',async()=>{
 for(const config of [{providerFails:true},{saveFails:true}])await assert.rejects(reconciliation(config).reconcileSaasRecovery('order'));
 const h=reconciliation();await h.reconcileSaasRecovery('order');assert.deepEqual(h.calls[0],['provider','sub',219.9]);assert.equal(h.calls[1][0],'saved');
 const failed=reconciliation({providerFails:true});await assert.rejects(failed.reconcileSaasRecovery());assert.equal(failed.calls.length,1);
});
test('provider restore rejects mismatched subscription and amount responses',async()=>{
 for(const response of [{id:'wrong',auto_recurring:{transaction_amount:219.9}},{id:'sub',auto_recurring:{transaction_amount:205.9}}]){
  const mp=compile('lib/mercadopago.ts',()=>({}),{process:{env:{MERCADOPAGO_ACCESS_TOKEN:'fixture'}},AbortSignal,fetch:async()=>({ok:true,json:async()=>response})});
  await assert.rejects(mp.restaurarPrecoAssinaturaSaas('sub',219.9));
 }
});
function checkoutApi({expired=false,user={id:'owner',email:'fixture@example.invalid'}}={}){
 const calls=[];
 const row=table=>table==='soma_saas_recovery_offers'?{source_order_id:'source'}:{plan_code:'pro',modules:['vagas'],iris:true,whatsapp:false,provider_subscription_id:'sub',checkout_url:'https://www.mercadopago.com.br/fixture',checkout_started_at:null,amount:219.9,intro_amount:205.9};
 const admin={from:table=>({select:()=>{const chain={eq:(...args)=>{calls.push(['filter',table,...args]);return chain;},single:async()=>({data:row(table)}),maybeSingle:async()=>({data:row(table)})};return chain;}}),rpc:async(name,args)=>{calls.push([name,args]);return name==='soma_saas_register'?{data:{trial_ends_at:'2026-01-01T00:00:00Z'}}:{data:expired?null:'recovery-order',error:expired?{message:'expired'}:null};}};
 const pricing=compile('lib/soma-saas-pricing.ts',()=>{});
 const handlers=compile('app/api/saas/route.ts',name=>{
  if(name==='next/server')return {NextResponse:{json:(body,opts)=>({body,status:opts.status})}};
  if(name.endsWith('supabase/server'))return {createClient:async()=>({auth:{getUser:async()=>({data:{user}})}})};
  if(name.endsWith('supabase/admin'))return {createAdminClient:()=>admin};
  if(name.includes('rate-limit'))return {consumeIdentifierRateLimit:async()=>true};
  if(name.includes('soma-saas-pricing'))return pricing;
  if(name.includes('saas-access'))return {SAAS_MODULES:['vagas','curriculo-ats']};
  return {criarAssinaturaSaasMercadoPago:async()=>{throw Error('Unexpected provider creation');}};
 },{URL,Date});
 return {...handlers,calls};
}
const recoveryRequest=()=>({url:'https://somamentoria.com/api/saas',headers:{get:()=>null},json:async()=>({action:'recovery_checkout',accepted:true,plan:'avulso',iris:false,whatsapp:false,amount:1})});
test('checkout ignores forged prices/configuration and uses the owned server offer',async()=>{
 const h=checkoutApi();const response=await h.POST(recoveryRequest());assert.equal(response.status,200);
 const register=h.calls.find(c=>c[0]==='soma_saas_register');assert.equal(register[1].p_config.plan_code,'pro');assert.equal(register[1].p_config.iris,true);assert.equal(register[1].p_trial,false);
 const claim=h.calls.find(c=>c[0]==='soma_saas_recovery_checkout');assert.deepEqual(Object.keys(claim[1]),['p_user']);assert.equal(claim[1].p_user,'owner');
 assert.ok(h.calls.some(c=>c[0]==='filter'&&c[1]==='soma_module_orders'&&c[2]==='user_id'&&c[3]==='owner'));
});
test('expired server offer blocks checkout; unauthenticated requests are refused',async()=>{
 assert.equal((await checkoutApi({expired:true}).POST(recoveryRequest())).status,409);
 assert.equal((await checkoutApi({user:null}).POST(recoveryRequest())).status,401);
});
