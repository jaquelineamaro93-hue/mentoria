import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {buildMinigamesNews,MINIGAMES_CAMPAIGN} from '../lib/minigames-news-email.ts';
import {newsletterToken,validNewsletterToken} from '../lib/newsletter-token.ts';
const help={};new Function('require','exports',ts.transpileModule(readFileSync(new URL('../lib/help-center/types.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(()=>({SAAS_MODULES:[]}),help);const {safeHelpPath}=help;
test('approved minigames campaign personalizes safely, links to games and replaces unsubscribe placeholder',()=>{
 const {html,subject}=buildMinigamesNews('<img> sobrenome','https://soma.example/?a=1&b=2');
 assert.match(subject,/jogo novo na SOMA/);assert.match(html,/&lt;img&gt;/);assert.ok(!html.includes('<img>'));
 assert.match(html,/somamentoria.com\/gravacoes/);assert.match(html,/CAÇA-PALAVRAS/);assert.match(html,/CORTE OS VÍRUS/);assert.match(html,/Pratique jogando/);
 assert.match(html,/a=1&amp;b=2/);assert.ok(!html.includes('{{unsubscribe_url}}'));assert.equal(MINIGAMES_CAMPAIGN,'minigames-20261030');
 assert.equal(safeHelpPath('/gravacoes'),'/gravacoes');
});
test('unsubscribe is bound to a recipient and newsletter scope',()=>{
 const id='11111111-1111-4111-8111-111111111111',sig=newsletterToken(id,'secret');
 assert.equal(validNewsletterToken(id,sig,'secret'),true);
 assert.equal(validNewsletterToken(id,sig,'other'),false);
 assert.equal(validNewsletterToken('22222222-2222-4222-8222-222222222222',sig,'secret'),false);
 assert.equal(validNewsletterToken(id,'bad','secret'),false);
});
function load(stubs){const m={exports:{}};const source=ts.transpileModule(readFileSync(new URL('../app/api/admin/minigames-news/route.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('require','module','exports',source)(name=>stubs[name]||{},m,m.exports);return m.exports;}
function setup({denied=false,duplicate=false,accepted=true}={}){
 const sent=[],writes=[];const db={rpc:async()=>({data:[{id:'member',nome:'Pessoa',email:'member@example.org'}],error:null}),from:()=>({select(){return this},eq(){return this},then(fn){return Promise.resolve({data:[],error:null}).then(fn)},insert:async value=>{writes.push(value);return {error:duplicate?{code:'23505'}:null}},update(value){writes.push(value);return this;}})};
 const route=load({'next/server':{NextResponse:{json:(b,o)=>Response.json(b,o)}},'@/lib/security/require-admin':{requireAdmin:async()=>denied?{ok:false,response:Response.json({error:'Denied'},{status:403})}:{ok:true,userId:'admin'}},'@/lib/supabase/admin':{createAdminClient:()=>db},'@/lib/sendgrid':{enviarEmail:async p=>{sent.push(p);return accepted}},'@/lib/minigames-news-email':{buildMinigamesNews,MINIGAMES_CAMPAIGN},'@/lib/newsletter-token':{newsletterToken:()=> 'signature'}});
 return {route,sent,writes};
}
test('only administrators can view or dispatch the campaign',async()=>{const {route,sent}=setup({denied:true});for(const action of ['GET','POST'])assert.equal((await route[action](new Request('https://soma.example/api/admin/minigames-news'))).status,403);assert.equal(sent.length,0);});
test('duplicate reserve never resends and caller cannot select recipients',async()=>{
 const key=process.env.SENDGRID_API_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY;process.env.SENDGRID_API_KEY='test';process.env.SUPABASE_SERVICE_ROLE_KEY='test';
 try{const {route,sent}=setup({duplicate:true});const r=await route.POST(new Request('https://soma.example/api/admin/minigames-news',{method:'POST',body:JSON.stringify({to:'attacker@example.org'})}));assert.equal(r.status,200);assert.equal(sent.length,0);}finally{if(key===undefined)delete process.env.SENDGRID_API_KEY;else process.env.SENDGRID_API_KEY=key;if(service===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;else process.env.SUPABASE_SERVICE_ROLE_KEY=service;}
});
test('foreign origin does not reserve or send emails',async()=>{const {route,sent,writes}=setup();const r=await route.POST(new Request('https://soma.example/api/admin/minigames-news',{method:'POST',headers:{origin:'https://evil.example'}}));assert.equal(r.status,403);assert.equal(sent.length,0);assert.equal(writes.length,0);});
test('dispatch uses the resolved roster, records provider acceptance and never invents delivery',async()=>{
 const key=process.env.SENDGRID_API_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY;process.env.SENDGRID_API_KEY='test';process.env.SUPABASE_SERVICE_ROLE_KEY='test';
 try{for(const ok of [true,false]){const {route,sent,writes}=setup({accepted:ok});const r=await route.POST(new Request('https://soma.example/api/admin/minigames-news',{method:'POST',body:JSON.stringify({to:'attacker@example.org'})}));const result=await r.json();assert.equal(sent.length,1);assert.equal(sent[0].to,'member@example.org');assert.equal(sent[0].from,'consultoria@camarocrm.com');assert.equal(result.accepted,ok?1:0);assert.equal(result.unconfirmed,ok?0:1);assert.equal(writes[1].status,ok?'accepted':'unconfirmed');}}finally{if(key===undefined)delete process.env.SENDGRID_API_KEY;else process.env.SENDGRID_API_KEY=key;if(service===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;else process.env.SUPABASE_SERVICE_ROLE_KEY=service;}
});
