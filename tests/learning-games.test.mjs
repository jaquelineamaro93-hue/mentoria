import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {parseGames,publicGame,gradeGame} from '../lib/learning/games.ts';
const base={id:'desafio-1',kind:'sequence',title:'Monte seu plano',prompt:'Organize as etapas',items:['Objetivo','Ação','Evidência','Revisão'],matches:[],answer:0,explanation:'Conecte o objetivo à ação e avalie o que mudou.'};
test('game validation rejects malformed content, duplicate IDs, blank items, repeated choices and bad answers',()=>{
 assert.equal(parseGames(undefined).length,0);
 assert.deepEqual(parseGames([base]),[base]);
 for(const games of [[{...base,kind:'other'}],[{...base,items:['A']}],[{...base,items:['A','A']}],[{...base,items:['A','']}],[base,base],[{...base,kind:'decision',answer:9}],[{...base,kind:'matching',matches:['Só uma']}],[{...base,explanation:''}],Array(7).fill(base)])assert.throws(()=>parseGames(games));
});
test('all game types are graded on the server without trusting client correctness',()=>{
 assert.equal(gradeGame(base,base.items),true);assert.equal(gradeGame(base,[...base.items].reverse()),false);
 const match={...base,kind:'matching',items:['Objetivo','Ação'],matches:['O que desenvolver','O que fazer']};
 assert.equal(gradeGame(match,match.matches),true);assert.equal(gradeGame(match,[...match.matches].reverse()),false);
 const decision={...base,kind:'decision',answer:2};assert.equal(gradeGame(decision,['Evidência']),true);assert.equal(gradeGame(decision,['Ação']),false);
 for(const answers of [null,{},[],['Objetivo','Objetivo','Evidência','Revisão'],['Inventado'],[1]])assert.throws(()=>gradeGame(base,answers));
});
test('public payloads strip solutions and explanations and sequences never start already solved',()=>{
 for(const g of [base,{...base,kind:'matching',matches:['A','B','C','D']},{...base,kind:'decision',answer:1}]){
  for(let i=0;i<25;i++){const p=publicGame(g);assert.equal('answer' in p,false);assert.equal('matches' in p,false);assert.equal('explanation' in p,false);if(g.kind==='sequence'){assert.notDeepEqual(p.items,g.items);assert.deepEqual([...p.items].sort(),[...g.items].sort());}}
 }
});
function loadRoute(stubs){const module={exports:{}};const js=ts.transpileModule(readFileSync(new URL('../app/api/aprender/jogo/route.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('require','module','exports',js)(name=>stubs[name]||{},module,module.exports);return module.exports;}
function setup({user={id:'owner'},visible=true,rate=true,readError=null}={}){
 let privilegedReads=0;
 const db={auth:{getUser:async()=>({data:{user}})},from:()=>({select(){return this;},eq(){return this;},maybeSingle:async()=>({data:visible?{id:'lesson'}:null,error:null})})};
 const admin={from:()=>{privilegedReads++;return {select(){return this;},eq(){return this;},single:async()=>({data:{minigames:[base]},error:readError})};}};
 const route=loadRoute({'next/server':{NextResponse:{json:(b,o)=>Response.json(b,o)}},'@/lib/supabase/server':{createClient:async()=>db},'@/lib/supabase/admin':{createAdminClient:()=>admin},'@/lib/learning/validation':{isId:v=>v==='lesson'},'@/lib/learning/games':{parseGames,gradeGame},'@/lib/security/rate-limit':{consumeIdentifierRateLimit:async()=>rate}});
 const request=(body,origin='https://soma.example')=>new Request('https://soma.example/api/aprender/jogo',{method:'POST',headers:{'Content-Type':'application/json',origin},body:JSON.stringify(body)});
 return {route,request,reads:()=>privilegedReads};
}
test('game API rejects anonymous, inaccessible lessons, foreign origins and rate limits before privileged reads',async()=>{
 for(const [options,status] of [[{user:null},401],[{visible:false},404],[{rate:false},429]]){const s=setup(options);assert.equal((await s.route.POST(s.request({lesson_id:'lesson',game_id:base.id}))).status,status);assert.equal(s.reads(),0);}
 const s=setup();assert.equal((await s.route.POST(s.request({},'https://other.example'))).status,403);assert.equal(s.reads(),0);
});
test('game API validates known answers, returns educational feedback and never awards XP',async()=>{
 const s=setup();
 const call=answers=>s.route.POST(s.request({lesson_id:'lesson',game_id:base.id,answers,correct:true,points:9000,user_id:'victim'}));
 assert.deepEqual(await (await call(base.items)).json(),{correct:true,explanation:base.explanation});
 assert.equal((await (await call([...base.items].reverse())).json()).correct,false);
 assert.equal((await call(['forged'])).status,400);
 assert.equal((await s.route.POST(s.request({lesson_id:'lesson',game_id:'unknown',answers:base.items}))).status,404);
 assert.equal((await setup({readError:{}}).route.POST(s.request({lesson_id:'lesson',game_id:base.id,answers:base.items}))).status,503);
});
