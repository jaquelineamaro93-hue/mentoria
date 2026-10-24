-- Only synthetic accounts, every change rolled back.
begin;
select set_config('request.jwt.claims','{"role":"service_role"}',true);
insert into auth.users(id,email,raw_user_meta_data) values
 ('a8d30e35-0897-48f0-a6b1-5b5b5097a001','privacy-fixture-a@example.invalid','{}'),
 ('a8d30e35-0897-48f0-a6b1-5b5b5097a002','privacy-fixture-b@example.invalid','{}');
select soma_saas_register('a8d30e35-0897-48f0-a6b1-5b5b5097a001','{"plan_code":"essencial","modules":["autoconhecimento","diagnostico","desenvolvimento"],"iris":true,"whatsapp":false}',true);
select soma_saas_register('a8d30e35-0897-48f0-a6b1-5b5b5097a002','{"plan_code":"essencial","modules":["autoconhecimento","diagnostico","desenvolvimento"],"iris":true,"whatsapp":false}',true);
insert into iris_web_conversations(id,user_id,title) values
 ('a8d30e35-0897-48f0-a6b1-5b5b5097b001','a8d30e35-0897-48f0-a6b1-5b5b5097a001','fixture-a'),
 ('a8d30e35-0897-48f0-a6b1-5b5b5097b002','a8d30e35-0897-48f0-a6b1-5b5b5097a002','fixture-b');
insert into iris_web_messages(conversation_id,user_id,role,content) values
 ('a8d30e35-0897-48f0-a6b1-5b5b5097b001','a8d30e35-0897-48f0-a6b1-5b5b5097a001','user','private-a'),
 ('a8d30e35-0897-48f0-a6b1-5b5b5097b002','a8d30e35-0897-48f0-a6b1-5b5b5097a002','user','private-b');
insert into pdi_planos(id,mentorado_id) values
 ('a8d30e35-0897-48f0-a6b1-5b5b5097c001','a8d30e35-0897-48f0-a6b1-5b5b5097a001'),
 ('a8d30e35-0897-48f0-a6b1-5b5b5097c002','a8d30e35-0897-48f0-a6b1-5b5b5097a002');
insert into pdi_acoes(id,plano_id,mentorado_id,titulo,descricao,pilar_titulo) values
 ('a8d30e35-0897-48f0-a6b1-5b5b5097d001','a8d30e35-0897-48f0-a6b1-5b5b5097c001','a8d30e35-0897-48f0-a6b1-5b5b5097a001','fixture-a','fixture','Carreira'),
 ('a8d30e35-0897-48f0-a6b1-5b5b5097d002','a8d30e35-0897-48f0-a6b1-5b5b5097c002','a8d30e35-0897-48f0-a6b1-5b5b5097a002','fixture-b','fixture','Carreira');
set local role authenticated;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"a8d30e35-0897-48f0-a6b1-5b5b5097a001"}',true);
do $$ declare n integer; begin
 if (select count(*) from iris_web_messages where user_id in ('a8d30e35-0897-48f0-a6b1-5b5b5097a001','a8d30e35-0897-48f0-a6b1-5b5b5097a002'))<>1 then raise exception 'Conversation leak'; end if;
 if exists(select 1 from iris_web_conversations where id='a8d30e35-0897-48f0-a6b1-5b5b5097b002') then raise exception 'Other conversation reachable by ID'; end if;
 update pdi_acoes set concluida=true where id='a8d30e35-0897-48f0-a6b1-5b5b5097d002'; get diagnostics n=row_count;
 if n<>0 then raise exception 'Cross-user write'; end if;
 update pdi_acoes set concluida=true where id='a8d30e35-0897-48f0-a6b1-5b5b5097d001'; get diagnostics n=row_count;
 if n<>1 then raise exception 'Own action broken'; end if;
 update profiles set nome='fixture updated' where id=auth.uid();
 if has_column_privilege('authenticated','profiles','is_admin','INSERT') then raise exception 'Client can create admin profile'; end if;
 if has_table_privilege('authenticated','product_contract_versions','UPDATE') or has_table_privilege('authenticated','mp_pedidos','INSERT') then raise exception 'Client can forge purchase contract'; end if;
 if soma_has_career_contract() then raise exception 'SaaS masquerades as mentorship contract'; end if;
 if (select terms_version from soma_saas_accounts where user_id=auth.uid())<>'saas-2026-10-24-v2' then raise exception 'Wrong trial contract'; end if;
end $$;
reset role;
-- New career acceptance is account-bound, without fabricating a legacy signature.
insert into mp_pedidos(user_id,email,tipo,valor,forma_pagamento,terms_version,terms_accepted_at,contract_snapshot)
 values('a8d30e35-0897-48f0-a6b1-5b5b5097a001','privacy-fixture-a@example.invalid','plano',800,'avista','carreira-2026-10-24',now(),'{"plano":"fixture","duracao_meses":6}');
update profiles set status_assinatura='ativo',data_fim_acesso=current_date+180,plano_id=(select id from planos_mentoria where ativo order by duracao_meses limit 1) where id='a8d30e35-0897-48f0-a6b1-5b5b5097a001';
set local role authenticated;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"a8d30e35-0897-48f0-a6b1-5b5b5097a001"}',true);
select solicitar_pausa_mentoria(3,true);
do $$ begin if not soma_has_career_contract() then raise exception 'Own contract not recognized'; end if; end $$;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"a8d30e35-0897-48f0-a6b1-5b5b5097a002"}',true);
do $$ begin if soma_has_career_contract() then raise exception 'Other account contract recognized'; end if; end $$;
reset role;
rollback;
