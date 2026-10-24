-- Run as postgres in a single transaction. All synthetic data is rolled back.
begin;
select set_config('request.jwt.claims','{"role":"service_role"}',true);
insert into auth.users(id,email,raw_user_meta_data) values
 ('b7d30e35-0897-48f0-a6b1-5b5b5097a001','saas-fixture-a@example.invalid','{}'),
 ('b7d30e35-0897-48f0-a6b1-5b5b5097a002','saas-fixture-b@example.invalid','{}');
select soma_saas_register('b7d30e35-0897-48f0-a6b1-5b5b5097a001','{"plan_code":"avulso","modules":["curriculo-ats"],"iris":false,"whatsapp":false}',true);
select soma_saas_register('b7d30e35-0897-48f0-a6b1-5b5b5097a002','{"plan_code":"essencial","modules":["autoconhecimento","diagnostico","desenvolvimento"],"iris":true,"whatsapp":false}',true);
do $$ declare t timestamptz; o uuid; begin
 select trial_ends_at into t from soma_saas_accounts where user_id='b7d30e35-0897-48f0-a6b1-5b5b5097a001';
 perform soma_saas_register('b7d30e35-0897-48f0-a6b1-5b5b5097a001','{"plan_code":"pro","modules":["vagas"],"iris":true,"whatsapp":true}',true);
 if (select trial_ends_at<>t or modules<>array['curriculo-ats'] or iris from soma_saas_accounts where user_id='b7d30e35-0897-48f0-a6b1-5b5b5097a001') then raise exception 'Trial reset/config tampering'; end if;
 if abs(extract(epoch from (t-now()))-604800)>1 then raise exception 'Trial duration'; end if;
 o:=soma_saas_create_order('b7d30e35-0897-48f0-a6b1-5b5b5097a001','{"plan_code":"avulso","modules":["curriculo-ats"],"iris":false,"whatsapp":false}',24.90);
 if soma_saas_create_order('b7d30e35-0897-48f0-a6b1-5b5b5097a001','{"plan_code":"avulso","modules":["curriculo-ats"],"iris":false,"whatsapp":false}',24.90)<>o then raise exception 'Order duplicated'; end if;
 update soma_module_orders set provider_subscription_id='fixture-subscription' where id=o;
 perform soma_sync_module_preapproval(o,'fixture-subscription','authorized');
 if exists(select 1 from soma_module_subscriptions where order_id=o and status='ACTIVE') then raise exception 'Authorization grants paid access'; end if;
 perform soma_process_module_payment(o,'fixture-subscription','fixture-payment','approved',24.90,'BRL',now());
 perform soma_process_module_payment(o,'fixture-subscription','fixture-payment','approved',24.90,'BRL',now());
 if (select count(*) from soma_module_payment_events where order_id=o)<>1 then raise exception 'Duplicate event'; end if;
 update soma_saas_accounts set trial_ends_at=now()-interval '1 second' where user_id='b7d30e35-0897-48f0-a6b1-5b5b5097a001';
 if not soma_can_access_module_for('b7d30e35-0897-48f0-a6b1-5b5b5097a001','curriculo-ats') then raise exception 'Paid access missing'; end if;
 perform soma_process_module_payment(o,'fixture-subscription','fixture-payment','refunded',24.90,'BRL',now());
 if soma_can_access_module_for('b7d30e35-0897-48f0-a6b1-5b5b5097a001','curriculo-ats') then raise exception 'Refund still grants access'; end if;
 perform soma_process_module_payment(o,'fixture-subscription','fixture-payment','approved',24.90,'BRL',now());
 if soma_can_access_module_for('b7d30e35-0897-48f0-a6b1-5b5b5097a001','curriculo-ats') then raise exception 'Stale approved event reactivated'; end if;
end $$;
insert into mapa_essencia(user_id,conteudo_markdown) values
 ('b7d30e35-0897-48f0-a6b1-5b5b5097a001','fixture'),('b7d30e35-0897-48f0-a6b1-5b5b5097a002','fixture');
insert into pdi_planos(mentorado_id) values ('b7d30e35-0897-48f0-a6b1-5b5b5097a001'),('b7d30e35-0897-48f0-a6b1-5b5b5097a002');
insert into cv_simulacoes(user_id,curriculo_texto,vaga_texto,resultado_markdown) values ('b7d30e35-0897-48f0-a6b1-5b5b5097a002','fixture','fixture','fixture');
insert into recordings(titulo,drive_url) values ('fixture','https://example.invalid');
-- Real authenticated role, not a service_role simulation, exercises grants/RLS.
set local role authenticated;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"b7d30e35-0897-48f0-a6b1-5b5b5097a002"}',true);
do $$ begin
 if not soma_has_module('desenvolvimento') or soma_has_module('curriculo-ats') or soma_has_mentorship_entitlement() then raise exception 'Module boundary'; end if;
 if not soma_saas_feature_for(auth.uid(),'iris') or soma_saas_feature_for(auth.uid(),'whatsapp') then raise exception 'Agent boundary'; end if;
 if (select count(*) from soma_saas_accounts)<>1 then raise exception 'Cross-user account leak'; end if;
 if (select count(*) from mapa_essencia where user_id in ('b7d30e35-0897-48f0-a6b1-5b5b5097a001','b7d30e35-0897-48f0-a6b1-5b5b5097a002'))<>1 then raise exception 'Map ownership RLS'; end if;
 if (select count(*) from pdi_planos where mentorado_id in ('b7d30e35-0897-48f0-a6b1-5b5b5097a001','b7d30e35-0897-48f0-a6b1-5b5b5097a002'))<>1 then raise exception 'PDI ownership RLS'; end if;
 if exists(select 1 from cv_simulacoes) or exists(select 1 from recordings) then raise exception 'Unpurchased module/mentorship RLS'; end if;
 begin
  insert into cv_simulacoes(user_id,curriculo_texto,vaga_texto,resultado_markdown) values(auth.uid(),'fixture','fixture','fixture');
  raise exception 'Write bypass';
 exception when insufficient_privilege then null; end;
 if soma_saas_table_gate(array[]::text[]) then raise exception 'Mentorship fallback'; end if;
 begin
  perform soma_can_access_module_for('b7d30e35-0897-48f0-a6b1-5b5b5097a001','curriculo-ats');
  raise exception 'Cross-user RPC allowed';
 exception when insufficient_privilege then null; end;
 begin
  perform soma_saas_register(auth.uid(),'{"plan_code":"pro","modules":["vagas"],"iris":true,"whatsapp":true}',true);
  raise exception 'Client can create entitlements';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: 7-day trial, immutable retry, order idempotency, payment approval, duplicate, refund, stale event, module and agent isolation, cross-user RLS and RPC privileges' as result;
rollback;
