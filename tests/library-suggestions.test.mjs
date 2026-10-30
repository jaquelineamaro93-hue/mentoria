import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
function setup({user={id:'owner'},admin=false,allowed=true}={}){
 const writes=[];
 const db={
  auth:{getUser:async()=>({data:{user}})},
  from:()=>({
   select:()=>({order:()=>({limit:async()=>({data:[]})})}),
   insert:b=>{writes.push(b);return {select:()=>({single:async()=>({data:{id:'new'}})})};},
   update:b=>{writes.push(b);return {eq:()=>({select:()=>({maybeSingle:async()=>({data:{id:'updated'}})})})};}
  })
 };
 const module={exports:{}};const js=ts.transpileModule(readFileSync(new URL('../app/api/aprender/sugestoes/route.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const stubs={'next/server':{NextResponse:{json:(b,init)=>new Response(JSON.stringify(b),init)}},'@/lib/supabase/server':{createClient:async()=>db},'@/lib/supabase/admin':{createAdminClient:()=>db},'@/lib/security/require-admin':{requireAdmin:async()=>admin?{ok:true}:{ok:false,response:new Response('{}',{status:403})}},'@/lib/security/rate-limit':{consumeIdentifierRateLimit:async()=>allowed},'@/lib/learning/validation':{isId:v=>v==='11111111-1111-4111-8111-111111111111'}};
 new Function('require','module','exports',js)(n=>stubs[n],module,module.exports);
 return {route:module.exports,writes};
}
const request=(body,method='POST',origin='https://soma.example')=>new Request('https://soma.example/api/aprender/sugestoes',{method,headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
const valid={title:'Melhorar as aulas',description:'Uma explicação concreta da sugestão.',category:'conteudo'};
test('suggestions reject anonymous, cross-origin, invalid and excessive submissions before writing',async()=>{
 for(const [config,req,status] of [[{user:null},request(valid),401],[{},request(valid,'POST','https://other.example'),403],[{},request({...valid,title:'a'}),400],[{allowed:false},request(valid),429]]){
  const {route,writes}=setup(config);assert.equal((await route.POST(req)).status,status);assert.equal(writes.length,0);
 }
});
test('suggestions always derive the owner from session and discard client status/response',async()=>{
 const {route,writes}=setup();assert.equal((await route.POST(request({...valid,user_id:'other',status:'concluida',response:'false'}))).status,201);
 assert.deepEqual(writes[0],{user_id:'owner',...valid});
});
test('only administrators can classify and respond; no arbitrary fields get written',async()=>{
 const body={id:'11111111-1111-4111-8111-111111111111',status:'planejada',response:'Obrigada pela sugestão.',user_id:'other'};
 const user=setup();assert.equal((await user.route.PATCH(request(body,'PATCH'))).status,403);assert.equal(user.writes.length,0);
 const admin=setup({admin:true});assert.equal((await admin.route.PATCH(request(body,'PATCH'))).status,200);assert.deepEqual(admin.writes[0],{status:body.status,response:body.response});
});
test('storage stays private and clients cannot change suggestion status directly',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261030193550_learning_suggestions.sql',import.meta.url),'utf8');
 assert.match(sql,/enable row level security/);assert.match(sql,/auth.uid\(\).*user_id/);assert.doesNotMatch(sql,/grant (insert|update|all).*to authenticated/i);
});
