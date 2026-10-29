import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {mediaFor,safeLink,parseCourse,parseLesson} from '../lib/learning/validation.ts';
const id='11111111-1111-4111-8111-111111111111';
test('canonical players reject folders, unsafe protocols and fake hosts',()=>{
 for(const value of ['javascript:alert(1)','https://youtube.com.evil.example/watch?v=abcdefghijk','https://drive.google.com/drive/folders/abcdef','https://example.com/player','https://user:pass@example.com/video.mp4'])assert.throws(()=>mediaFor(value));
 assert.deepEqual(mediaFor('https://youtu.be/abcdefghijk'),{kind:'iframe',url:'https://www.youtube-nocookie.com/embed/abcdefghijk'});
 assert.equal(mediaFor('https://drive.google.com/file/d/ABC_123/view').url,'https://drive.google.com/file/d/ABC_123/preview');
 assert.equal(mediaFor('https://example.com/video.mp4?signature=123').kind,'video');
 assert.equal(mediaFor(''),null);
});
test('safe cover and material links reject traversal and insecure protocols',()=>{
 assert.equal(safeLink('/images/test.webp',true),'/images/test.webp');
 for(const v of ['//evil.example','/../secret','http://example.com','data:text/html,hi'])assert.throws(()=>safeLink(v,true));
});
test('course and lesson forms validate access, correct answer and minimum learning content',()=>{
 assert.throws(()=>parseCourse({title:'Teste',description:'Uma descrição válida',category:'Carreira',required_module:'admin'}));
 const base={course_id:id,title:'Aula teste',module_title:'Módulo um',summary:'Um objetivo claro',body:'Conteúdo de aprendizagem com contexto e aplicação prática.',exercise:'Uma atividade para aplicar o conceito.',quiz_question:'Qual é a alternativa correta?',quiz_options:['A','B'],quiz_answer:1,duration_minutes:5};
 assert.equal(parseLesson(base).quiz_answer,1);
 for(const patch of [{quiz_answer:2},{quiz_options:['Só uma']},{duration_minutes:0},{body:'Curto'},{course_id:'outro'}])assert.throws(()=>parseLesson({...base,...patch}));
});
function loadRoute(path,stubs){const module={exports:{}};const js=ts.transpileModule(readFileSync(new URL('../'+path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('require','module','exports',js)(name=>stubs[name]||{},module,module.exports);return module.exports;}
function setup({user={id:'owner'},visible=true,readError=null,answer=1}={}){
 const calls=[];
 const db={auth:{getUser:async()=>({data:{user}})},from:()=>({select(){return this;},eq(){return this;},maybeSingle:async()=>({data:visible?{id}:null,error:readError})})};
 const admin={from:()=>({select(){return this;},eq(){return this;},single:async()=>({data:{quiz_answer:answer},error:null})}),rpc:async(name,args)=>{calls.push({name,args});return {data:{lesson_id:id,completed_at:args.p_complete?'now':null},error:null};}};
 const route=loadRoute('app/api/aprender/progresso/route.ts',{
 'next/server':{NextResponse:{json:(b,o)=>Response.json(b,o)}},'@/lib/supabase/server':{createClient:async()=>db},'@/lib/supabase/admin':{createAdminClient:()=>admin},'@/lib/learning/validation':{isId:v=>v===id},'@/lib/security/rate-limit':{consumeIdentifierRateLimit:async()=>true},
 });
 const request=(body,origin='https://soma.example')=>new Request('https://soma.example/api/aprender/progresso',{method:'POST',headers:{'Content-Type':'application/json',origin},body:JSON.stringify(body)});
 return {route,calls,request};
}
test('progress API rejects anonymous, inaccessible lesson and foreign origin before writing',async()=>{
 for(const [options,status] of [[{user:null},401],[{visible:false},404],[{readError:{}},503]]){const {route,calls,request}=setup(options);assert.equal((await route.POST(request({lesson_id:id}))).status,status);assert.equal(calls.length,0);}
 const {route,calls,request}=setup();assert.equal((await route.POST(request({lesson_id:id},'https://evil.example'))).status,403);assert.equal(calls.length,0);
});
test('completion requires reflection and correct answer and never trusts client points or owner',async()=>{
 const {route,calls,request}=setup();
 assert.equal((await route.POST(request({lesson_id:id,complete:true,answer:0,reflection:'Uma aplicação prática detalhada para esta aula.'}))).status,422);
 assert.equal((await route.POST(request({lesson_id:id,complete:true,answer:1,reflection:'curto'}))).status,422);
 assert.equal(calls.length,0);
 const r=await route.POST(request({lesson_id:id,complete:true,answer:1,reflection:'Uma aplicação prática detalhada para esta aula.',user_id:'victim',points:9000}));
 assert.equal(r.status,200);assert.equal(calls[0].args.p_user,'owner');assert.equal(calls[0].args.p_complete,true);assert.equal('points' in calls[0].args,false);
});
test('native video position and unfinished drafts save without completing',async()=>{
 const {route,calls,request}=setup();assert.equal((await route.POST(request({lesson_id:id,position_seconds:36.5,reflection:'Rascunho'}))).status,200);assert.equal(calls[0].args.p_complete,false);assert.equal(calls[0].args.p_position,36);
});
