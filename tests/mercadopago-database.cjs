// Run with MP_TEST_PGLITE_PATH pointing to an isolated installation of @electric-sql/pglite.
const {PGlite}=require(process.env.MP_TEST_PGLITE_PATH || '@electric-sql/pglite');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 const db=new PGlite();
 await db.exec(`create role anon; create role authenticated; create role service_role;
 create schema auth; create function auth.uid() returns uuid language sql as 'select null::uuid';
 create function public.is_admin() returns boolean language sql as 'select false';
 create table profiles(id uuid primary key, creditos_simulacao_cv integer default 0, plano_id uuid, forma_pagamento_escolhida text,status_assinatura text,origem_assinatura text,trial_status text,trial_started_at timestamptz,trial_converted_at timestamptz);
 create table pagamentos_historico(user_id uuid,valor numeric,status text,mp_payment_id text);
 create table planos_mentoria(id uuid primary key);
 insert into profiles(id) values('00000000-0000-0000-0000-000000000001');`);
 await db.exec(fs.readFileSync('supabase/migrations/20261006190000_mp_orders_atomic.sql','utf8'));
 const user='00000000-0000-0000-0000-000000000001';
 async function order(tipo='credito_simulacao_cv',userId=user){const r=await db.query('insert into mp_pedidos(user_id,email,tipo,forma_pagamento,valor) values($1,$2,$3,$4,5) returning id',[userId,'test@example.com',tipo,'avista']);return r.rows[0].id;}
 const apply=(id,payment,status='approved',amount=5)=>db.query('select processar_mp_pagamento($1,$2,$3,$4,$5) as result',[id,payment,status,amount,'BRL']);
 const credits=async()=>(await db.query('select creditos_simulacao_cv from profiles')).rows[0].creditos_simulacao_cv;
 const id=await order();
 await assert.rejects(apply(id,'wrong','approved',.01));assert.equal(await credits(),0);
 await Promise.all([apply(id,'payment'),apply(id,'payment')]);assert.equal(await credits(),1);
 assert.equal((await db.query('select * from mp_eventos')).rows.length,1);
 await apply(id,'payment','refunded');await apply(id,'payment','refunded');assert.equal(await credits(),0);
 await apply(id,'payment','approved');assert.equal(await credits(),0);
 const guest=await order('plano',null);assert.equal((await apply(guest,'guest')).rows[0].result,'aguarda_vinculo');
 const session=await order('sessao_extra');await apply(session,'session');await apply(session,'session');
 assert.equal((await db.query('select * from mp_sessoes_extras')).rows.length,1);
 await apply(session,'session','charged_back');assert.equal((await db.query('select status from mp_sessoes_extras')).rows[0].status,'cancelado');
 // A failure during the grant rolls back both the event and the order status.
 await db.exec("create function fail_credit() returns trigger language plpgsql as $$ begin raise exception 'simulated persistence failure'; end $$; create trigger fail_credit before update on profiles for each row execute function fail_credit();");
 const broken=await order();await assert.rejects(apply(broken,'broken'));
 assert.equal((await db.query('select status from mp_pedidos where id=$1',[broken])).rows[0].status,'pendente');
 assert.equal((await db.query("select * from mp_eventos where resource_id='broken'")).rows.length,0);
 assert.equal((await db.query("select has_function_privilege('authenticated','processar_mp_pagamento(uuid,text,text,numeric,text)','execute') as allowed")).rows[0].allowed,false);
 await db.exec("drop trigger fail_credit on profiles; create or replace function auth.uid() returns uuid language sql as 'select nullif(current_setting(''test.uid'',true),'''')::uuid';");
 await db.query("select set_config('test.uid',$1,false)",[user]);
 await db.query('update profiles set creditos_simulacao_cv=10');assert.equal(await credits(),0);
 await db.query("select set_config('test.uid','',false)");await db.query('update profiles set creditos_simulacao_cv=2');
 await db.query("select set_config('test.uid',$1,false)",[user]);await db.query('update profiles set creditos_simulacao_cv=1');assert.equal(await credits(),1);
 console.log('PASS: migration, price validation, duplicate delivery, refund, stale event, guest isolation, session entitlement, transaction rollback, RPC permissions');
 await db.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
