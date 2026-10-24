const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(file,mocks={}) {const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>mocks[n]||require(n),URL,Headers,Response,process,console});return exports;}
const paths=load('lib/auth/saas-return.ts');
const access=load('lib/saas-access.ts');
const selected='/plataforma?plano=pro&modulo=curriculo-ats&iris=1&whatsapp=0';
test('SaaS selection survives authentication without allowing external or mentorship destinations',()=>{
 assert.equal(paths.safeSaasNext(selected),selected);
 for(const value of ['https://evil.invalid/plataforma','//evil.invalid','/renovar','/checkout?plan=mentoria','/plataforma/evil','/plataforma#extra','/plataforma?x=\\evil'])assert.equal(paths.safeSaasNext(value),null,value);
});
function proxyFor(user) {
 const db={auth:{getSession:async()=>({}),getUser:async()=>({data:{user}})},rpc:async()=>({data:{saas:false,mentorship:false,modules:[],iris:false,whatsapp:false},error:null}),from:()=>{const chain={select:()=>chain,eq:()=>chain,maybeSingle:async()=>({data:{status_assinatura:'inadimplente',origem_assinatura:'mercadopago',is_admin:false,trial_status:'not_started'}})};return chain;}};
 const withCookies=response=>{const deletedCookies=[];return Object.assign(response,{deletedCookies,cookies:{set(){},delete(name){deletedCookies.push(name);},getAll(){return [];}}});};
 return load('proxy.ts',{'@/lib/auth/saas-return':paths,'@/lib/saas-access':access,'@supabase/ssr':{createServerClient:()=>db},'next/server':{NextResponse:{next:()=>withCookies(new Response(null)),redirect:url=>withCookies(new Response(null,{status:307,headers:{location:String(url)}})),json:(body,init)=>withCookies(Response.json(body,init))}}}).proxy;
}
function request(path,cookie) {const url=new URL(path,'https://somamentoria.com');url.clone=()=>new URL(url);return {url:String(url),nextUrl:url,method:'GET',headers:new Headers(),cookies:{getAll:()=>[],set(){},get:()=>cookie?{value:encodeURIComponent(cookie)}:undefined}};}
test('new unpaid account can reach email verification and SaaS configuration without a renewal detour',async()=>{
 const proxy=proxyFor({id:'new-user'});
 for(const path of ['/magic-login?sent=1','/plataforma?plano=pro&iris=1','/auth/confirm?next='+encodeURIComponent(selected)]){
  const response=await proxy(request(path));assert.equal(response.status,200,path);assert.equal(response.headers.get('location'),null);
 }
});
test('pending SaaS intention redirects legacy dashboard or renewal route to the selected SaaS product',async()=>{
 const proxy=proxyFor({id:'new-user'});
 for(const path of ['/dashboard','/renovar']){const response=await proxy(request(path,selected));assert.equal(response.headers.get('location'),'https://somamentoria.com'+selected);}
});
test('anonymous SaaS entry carries the exact selection into login',async()=>{
 const response=await proxyFor(null)(request(selected));const target=new URL(response.headers.get('location'));
 assert.equal(target.pathname,'/login');assert.equal(target.searchParams.get('next'),selected);
});
test('ordinary inactive mentorship account keeps its existing renewal behavior',async()=>{
 const response=await proxyFor({id:'legacy-user'})(request('/dashboard'));assert.equal(new URL(response.headers.get('location')).pathname,'/renovar');
});

test('explicit mentorship purchase clears an older SaaS intention',async()=>{
 const response=await proxyFor({id:'user'})(request('/checkout?plan=chosen-mentorship',selected));
 assert.ok(response.deletedCookies.includes('soma_saas_intent'));
});
