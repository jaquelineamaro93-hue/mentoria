-- Never repurpose an unstarted regular checkout: another tab may be preparing its provider request.
create or replace function public.soma_saas_recovery_checkout(p_user uuid)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare f soma_saas_recovery_offers%rowtype; o soma_module_orders%rowtype; result uuid; discount numeric;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Backend only' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 select * into f from soma_saas_recovery_offers where user_id=p_user for update;
 if not found then raise exception 'Offer unavailable'; end if;
 if f.accepted_at is not null then
  select * into o from soma_module_orders where id=f.order_id;
  if o.status not in ('PENDING','AUTHORIZED') then raise exception 'Offer already used'; end if;
  return f.order_id;
 end if;
 if f.expires_at<=now() then raise exception 'Offer expired'; end if;
 if exists(select 1 from soma_module_payment_events e join soma_module_orders x on x.id=e.order_id where x.user_id=p_user and e.status in ('approved','refunded','charged_back')) then raise exception 'Already paid'; end if;
 select * into o from soma_module_orders where id=f.source_order_id;
 discount:=case o.plan_code when 'avulso' then 5.00 when 'essencial' then 7.00 when 'pro' then 14.00 end;
 if exists(select 1 from soma_module_orders where user_id=p_user and plan_code is not null and status not in ('CANCELED','EXPIRED')) then raise exception 'Existing subscription'; end if;
 result:=soma_saas_create_order(p_user,jsonb_build_object('plan_code',o.plan_code,'modules',o.modules,'iris',o.iris,'whatsapp',o.whatsapp),o.amount);
 -- An existing full-price checkout must never be silently repriced.
 if exists(select 1 from soma_module_orders where id=result and (provider_subscription_id is not null or checkout_started_at is not null)) then raise exception 'Checkout already started'; end if;
 update soma_module_orders set intro_amount=o.amount-discount,terms_version='saas-recovery-2026-10-24',terms_accepted_at=now() where id=result;
 update soma_saas_recovery_offers set accepted_at=now(),order_id=result where user_id=p_user;
 return result;
end $$;
