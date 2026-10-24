-- Synthetic fixtures only, always rolled back. Run as postgres.
begin;
select set_config('request.jwt.claims','{"role":"service_role"}',true);
do $$
declare u uuid; o uuid; r uuid; cfg jsonb; f jsonb; deadline timestamptz; p text; v_amount numeric; intro numeric; v text;
begin
 foreach p in array array['avulso','essencial','pro'] loop
  u:=gen_random_uuid();
  insert into auth.users(id,email,raw_user_meta_data) values(u,u||'@example.invalid','{}');
  cfg:=jsonb_build_object('plan_code',p,'modules',case p when 'avulso' then array['curriculo-ats'] when 'essencial' then array['autoconhecimento','diagnostico','desenvolvimento'] else array['autoconhecimento','diagnostico','percepcao-360','curriculo-ats','linkedin','entrevistas','desenvolvimento','networking','vagas'] end,'iris',true,'whatsapp',false);
  perform soma_saas_register(u,cfg,true);
  v_amount:=case p when 'avulso' then 174.90 when 'essencial' then 184.90 else 219.90 end;
  intro:=case p when 'avulso' then 169.90 when 'essencial' then 177.90 else 205.90 end;
  o:=soma_saas_create_order(u,cfg,v_amount);
  update soma_module_orders set status='CANCELED' where id=o;
  begin perform soma_saas_recovery_offer(u,o); raise exception 'TEST: trial must block offer'; exception when others then if SQLERRM like 'TEST:%' then raise; end if; end;
  update soma_saas_accounts set trial_ends_at=now()-interval '1 minute' where user_id=u;
  f:=soma_saas_recovery_offer(u,o); deadline:=(f->>'expires_at')::timestamptz;
  if deadline<>now()+interval '15 minutes' then raise exception 'Wrong deadline'; end if;
  perform soma_saas_recovery_offer(u,o);
  if (select expires_at from soma_saas_recovery_offers where user_id=u)<>deadline then raise exception 'Deadline reset'; end if;
  update soma_saas_recovery_offers set expires_at=now()-interval '1 second' where user_id=u;
  begin perform soma_saas_recovery_checkout(u); raise exception 'TEST: expired accepted'; exception when others then if SQLERRM like 'TEST:%' then raise; end if; end;
  update soma_saas_recovery_offers set expires_at=deadline where user_id=u;
  r:=soma_saas_create_order(u,cfg,v_amount);
  begin perform soma_saas_recovery_checkout(u); raise exception 'TEST: repriced an existing regular checkout'; exception when others then if SQLERRM like 'TEST:%' then raise; end if; end;
  update soma_module_orders set status='CANCELED' where id=r;
  r:=soma_saas_recovery_checkout(u);
  if soma_saas_recovery_checkout(u)<>r then raise exception 'Duplicate recovery order'; end if;
  if (select intro_amount<>intro or soma_module_orders.amount<>v_amount from soma_module_orders where id=r) then raise exception 'Wrong software/agent price'; end if;
  update soma_module_orders set provider_subscription_id='recovery-'||u where id=r;
  perform soma_process_module_payment(r,'recovery-'||u,'first-'||u,'approved',intro,'BRL',now());
  v:=soma_process_module_payment(r,'recovery-'||u,'first-'||u,'approved',intro,'BRL',now());
  if v<>'duplicated' then raise exception 'Duplicate charge not idempotent'; end if;
  begin perform soma_process_module_payment(r,'recovery-'||u,'next-'||u,'approved',intro,'BRL',now()); raise exception 'TEST: repeated discount accepted'; exception when others then if SQLERRM like 'TEST:%' then raise; end if; end;
  perform soma_process_module_payment(r,'recovery-'||u,'next-'||u,'approved',v_amount,'BRL',now());
  perform soma_process_module_payment(r,'recovery-'||u,'first-'||u,'refunded',intro,'BRL',now());
  if (select status from soma_module_subscriptions where order_id=r)<>'ACTIVE' then raise exception 'Old refund removed latest paid month'; end if;
  if (select count(*) from soma_module_payment_events where order_id=r)<>2 then raise exception 'Wrong payment count'; end if;
  if (select trial_ends_at from soma_saas_accounts where user_id=u)>now() then raise exception 'Trial renewed'; end if;
  begin perform soma_saas_recovery_offer(u,o); raise exception 'TEST: paid account received another offer'; exception when others then if SQLERRM like 'TEST:%' then raise; end if; end;
 end loop;
 if has_table_privilege('authenticated','soma_saas_recovery_offers','INSERT') or has_function_privilege('authenticated','soma_saas_recovery_checkout(uuid)','EXECUTE') then raise exception 'Client can modify offers'; end if;
end $$;
rollback;
