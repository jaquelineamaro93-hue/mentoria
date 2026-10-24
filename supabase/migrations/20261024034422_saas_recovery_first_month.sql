-- Additive only. No changes to legacy students, trial dates or academic data.
alter table public.soma_module_orders
 add column intro_amount numeric,
 add column intro_payment_id text,
 add column recurring_price_restored_at timestamptz,
 add constraint soma_intro_price_valid check (intro_amount is null or (plan_code is not null and intro_amount>0 and intro_amount<amount));

alter table public.soma_module_orders drop constraint soma_module_orders_explicit_consent;
alter table public.soma_module_orders add constraint soma_module_orders_explicit_consent check(terms_version in ('modular-1.0','saas-2026-10-24','saas-recovery-2026-10-24') and terms_accepted_at is not null);

create table public.soma_saas_recovery_offers (
 user_id uuid primary key references public.profiles(id) on delete restrict,
 source_order_id uuid not null unique references public.soma_module_orders(id),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '15 minutes',
 accepted_at timestamptz,
 order_id uuid unique references public.soma_module_orders(id),
 reason text not null default 'price' check(reason='price')
);
alter table public.soma_saas_recovery_offers enable row level security;
revoke all on public.soma_saas_recovery_offers from anon,authenticated;
grant all on public.soma_saas_recovery_offers to service_role;

create function public.soma_saas_recovery_offer(p_user uuid,p_order uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare o soma_module_orders%rowtype; a soma_saas_accounts%rowtype; f soma_saas_recovery_offers%rowtype;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Backend only' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 select * into a from soma_saas_accounts where user_id=p_user;
 if not found or a.trial_ends_at is null or a.trial_ends_at>now() then raise exception 'Trial not finished'; end if;
 if exists(select 1 from soma_legacy_student_registry where user_id=p_user)
 or exists(select 1 from profiles where id=p_user and (is_admin or plano_id is not null))
 or exists(select 1 from soma_module_payment_events e join soma_module_orders x on x.id=e.order_id where x.user_id=p_user and e.status in ('approved','refunded','charged_back'))
 or exists(select 1 from soma_module_orders where user_id=p_user and plan_code is not null and status not in ('CANCELED','EXPIRED'))
 then raise exception 'Not eligible'; end if;
 select * into o from soma_module_orders where id=p_order and user_id=p_user and plan_code is not null and status='CANCELED' and intro_amount is null;
 if not found then raise exception 'Invalid source'; end if;
 insert into soma_saas_recovery_offers(user_id,source_order_id) values(p_user,p_order) on conflict(user_id) do nothing;
 select * into f from soma_saas_recovery_offers where user_id=p_user;
 return to_jsonb(f);
end $$;

create function public.soma_saas_recovery_checkout(p_user uuid)
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
 result:=soma_saas_create_order(p_user,jsonb_build_object('plan_code',o.plan_code,'modules',o.modules,'iris',o.iris,'whatsapp',o.whatsapp),o.amount);
 -- An existing full-price checkout must never be silently repriced.
 if exists(select 1 from soma_module_orders where id=result and (provider_subscription_id is not null or checkout_started_at is not null)) then raise exception 'Checkout already started'; end if;
 update soma_module_orders set intro_amount=o.amount-discount,terms_version='saas-recovery-2026-10-24',terms_accepted_at=now() where id=result;
 update soma_saas_recovery_offers set accepted_at=now(),order_id=result where user_id=p_user;
 return result;
end $$;
revoke all on function public.soma_saas_recovery_offer(uuid,uuid),public.soma_saas_recovery_checkout(uuid) from public,anon,authenticated;
grant execute on function public.soma_saas_recovery_offer(uuid,uuid),public.soma_saas_recovery_checkout(uuid) to service_role;

CREATE OR REPLACE FUNCTION public.soma_process_module_payment(p_order uuid, p_preapproval_id text, p_payment_id text, p_status text, p_amount numeric, p_currency text, p_paid_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
 v_order public.soma_module_orders%rowtype;
 v_sub public.soma_module_subscriptions%rowtype;
 v_prev public.soma_module_payment_events%rowtype;
 v_approved timestamptz;
BEGIN
 IF coalesce(auth.role(),'')<>'service_role' THEN
   RAISE EXCEPTION 'Somente backend' USING errcode='42501';
 END IF;
 SELECT * INTO v_order FROM public.soma_module_orders WHERE id=p_order FOR UPDATE;
 IF NOT FOUND THEN RETURN 'unknown_order'; END IF;
 IF p_preapproval_id IS DISTINCT FROM v_order.provider_subscription_id THEN
   RAISE EXCEPTION 'Assinatura do pedido divergente';
 END IF;
 IF p_amount IS DISTINCT FROM (
 CASE WHEN v_order.intro_amount IS NOT NULL AND
   (v_order.intro_payment_id IS NULL OR v_order.intro_payment_id=p_payment_id
    OR EXISTS(SELECT 1 FROM soma_module_payment_events e WHERE e.payment_id=p_payment_id AND e.order_id=p_order AND e.amount=v_order.intro_amount))
 THEN v_order.intro_amount ELSE v_order.amount END
 ) OR p_currency IS DISTINCT FROM 'BRL' THEN
   RAISE EXCEPTION 'Valor ou moeda divergente';
 END IF;
 IF length(coalesce(p_payment_id,''))<1 OR p_status IS NULL THEN RAISE EXCEPTION 'Pagamento inválido'; END IF;
 SELECT * INTO v_prev FROM public.soma_module_payment_events WHERE payment_id=p_payment_id FOR UPDATE;
 IF FOUND AND v_prev.order_id<>p_order THEN RAISE EXCEPTION 'Pagamento de outro pedido'; END IF;
 IF FOUND AND v_prev.status=p_status THEN RETURN 'duplicated'; END IF;
 -- Estados terminais de um pagamento não retornam a APPROVED após estorno.
 IF FOUND AND v_prev.status IN ('refunded','charged_back') THEN RETURN 'stale_payment'; END IF;
 INSERT INTO public.soma_module_payment_events(payment_id,order_id,status,amount,currency,approved_at)
 VALUES(p_payment_id,p_order,p_status,p_amount,p_currency,p_paid_at)
 ON CONFLICT(payment_id) DO UPDATE SET status=excluded.status,
  approved_at=coalesce(excluded.approved_at,public.soma_module_payment_events.approved_at),
  processed_at=now();
 SELECT * INTO v_sub FROM public.soma_module_subscriptions
 WHERE order_id=p_order FOR UPDATE;
 IF NOT FOUND THEN
   INSERT INTO public.soma_module_subscriptions
   (order_id,user_id,module_slug,provider_subscription_id)
   VALUES(p_order,v_order.user_id,v_order.module_slug,p_preapproval_id)
   RETURNING * INTO v_sub;
 END IF;
 IF v_sub.status IN ('CANCELED','EXPIRED') THEN RETURN 'subscription_closed'; END IF;
 IF p_status='approved' THEN
  IF v_order.intro_amount IS NOT NULL AND v_order.intro_payment_id IS NULL THEN
   UPDATE soma_module_orders SET intro_payment_id=p_payment_id WHERE id=p_order;
  END IF;
  v_approved:=coalesce(p_paid_at,now());
  IF v_approved>now()+interval '5 minutes' THEN RAISE EXCEPTION 'Data futura'; END IF;
  -- Não estende recorrência por repetição do mesmo evento ou notificações
  -- antigas e atrasadas. Cada pagamento cobre até sua data + 1 mês.
  IF v_sub.last_paid_at IS NULL OR v_approved>=v_sub.last_paid_at THEN
    UPDATE public.soma_module_subscriptions SET status='ACTIVE',
      paid_through=greatest(coalesce(paid_through,'epoch'::timestamptz),v_approved+interval '1 month'),
      last_paid_at=v_approved,last_paid_payment_id=p_payment_id,updated_at=now()
    WHERE id=v_sub.id;
    UPDATE public.soma_module_orders SET status='ACTIVE',updated_at=now() WHERE id=p_order;
  END IF;
 ELSIF p_status IN ('refunded','charged_back') THEN
  IF v_sub.last_paid_payment_id=p_payment_id THEN
    UPDATE public.soma_module_subscriptions SET status='PAST_DUE',paid_through=now(),updated_at=now() WHERE id=v_sub.id;
    UPDATE public.soma_module_orders SET status='PAST_DUE',updated_at=now() WHERE id=p_order;
  END IF;
 ELSIF p_status IN ('rejected','cancelled') THEN
  IF v_sub.last_paid_at IS NULL OR coalesce(p_paid_at,now())>=v_sub.last_paid_at THEN
    UPDATE public.soma_module_subscriptions SET status='PAST_DUE',updated_at=now() WHERE id=v_sub.id;
    UPDATE public.soma_module_orders SET status='PAST_DUE',updated_at=now() WHERE id=p_order;
  END IF;
 END IF;
 RETURN 'processed';
END;
$function$;
