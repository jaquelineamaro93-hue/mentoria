const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
function compile(file,mocks,extra={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,{exports,require:name=>mocks[name]??require(name),...extra});return exports;}
const json=(body,options)=>({body,status:options.status});
const modules=['autoconhecimento','diagnostico','percepcao-360','curriculo-ats','linkedin','entrevistas','desenvolvimento','networking','vagas'];
function guard(state,{user={id:'owner'},error=null}={}){
 return compile('lib/security/require-product-access.ts',{'next/server':{NextResponse:{json}},'@/lib/saas-access':{SAAS_MODULES:modules},'@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user}})},rpc:async()=>({data:state,error})})}}).requireProductAccess;
}
test('each individual module cannot unlock any other module or human mentorship',async()=>{
 for(const own of modules){const authorize=guard({saas:true,mentorship:false,modules:[own],iris:false,whatsapp:false});
  for(const target of modules)assert.equal((await authorize(target)).ok,own===target,`${own} -> ${target}`);
  for(const target of ['iris','mentorship'])assert.equal((await authorize(target)).response.status,403);
 }
});
test('agent permission, expired trial, paused mentorship, admin, missing session and database outage',async()=>{
 assert.equal((await guard({saas:true,mentorship:false,modules:[],iris:true})('iris')).ok,true);
 assert.equal((await guard({saas:true,mentorship:false,modules:[],iris:false})('curriculo-ats')).response.status,403);
 assert.equal((await guard({saas:false,mentorship:false,modules:[]})('desenvolvimento')).response.status,403);
 assert.equal((await guard({saas:false,mentorship:true,modules:[]})('desenvolvimento')).ok,true);
 assert.equal((await guard(null,{user:null})('iris')).response.status,401);
 assert.equal((await guard(null,{error:new Error('offline')})('iris')).response.status,503);
});
test('shared career tool authorization checks its body without consuming it or trusting a supplied user',async()=>{
 const request=new Request('https://somamentoria.com/api/ferramentas-soma/analisar',{method:'POST',body:JSON.stringify({ferramenta:'linkedin',user_id:'victim'})});
 const result=await guard({saas:true,mentorship:false,modules:['curriculo-ats']})('career-tool',request);assert.equal(result.response.status,403);
 assert.equal((await request.json()).user_id,'victim');
 assert.equal((await guard({saas:true,mentorship:false,modules:['linkedin']})('career-tool',new Request('https://test',{method:'POST',body:JSON.stringify({ferramenta:'linkedin'})}))).userId,'owner');
});
test('denied direct API requests do not parse bodies, query private records or call AI',async()=>{
 const refusal={status:403};
 for(const [path,method] of [['app/api/pdi/acoes/route.ts','PATCH'],['app/api/diario/analisar/route.ts','POST']]){
  const exports=compile(path,{'@/lib/security/require-product-access':{requireProductAccess:async()=>({ok:false,response:refusal})},'next/server':{NextResponse:{json}},'@/lib/supabase/server':{createClient:()=>{throw Error('Private database reached');}},'@/lib/security/rate-limit':{},'@anthropic-ai/sdk':class{constructor(){throw Error('AI reached');}}});
  assert.equal(await exports[method]({json:()=>{throw Error('Body reached');}}),refusal);
 }
});
test('Vercel IP identity ignores spoofed forwarding chains, validates addresses and fails to a stable bucket',async()=>{
 const env={VERCEL:'1',SUPABASE_SERVICE_ROLE_KEY:'fixture'};const calls=[];
 const r=compile('lib/security/rate-limit.ts',{'@/lib/supabase/admin':{createAdminClient:()=>({rpc:async(name,args)=>{calls.push(args);return {data:true};}})}},{process:{env},console});
 const request=headers=>new Request('https://test',{headers});
 assert.equal(r.getClientIp(request({'x-forwarded-for':'1.1.1.1','x-vercel-forwarded-for':'203.0.113.5'})),'203.0.113.5');
 assert.equal(r.getClientIp(request({'x-forwarded-for':'1.1.1.1'})),'unknown');
 assert.equal(r.getClientIp(request({'x-vercel-forwarded-for':'1.1.1.1,2.2.2.2'})),'unknown');
 assert.equal(r.getClientIp(request({'x-vercel-forwarded-for':'2001:db8::1'})),'2001:db8::1');
 await r.consumeSecurityRateLimit({request:request({'x-vercel-forwarded-for':'203.0.113.5'}),scope:'login',identifier:'owner',limit:5,windowSeconds:60});
 assert.equal(calls.length,2);assert.equal(calls[1].p_scope,'login:identity');
 env.VERCEL='0';assert.equal(r.getClientIp(request({'x-vercel-forwarded-for':'203.0.113.5'})),'unknown');
});
