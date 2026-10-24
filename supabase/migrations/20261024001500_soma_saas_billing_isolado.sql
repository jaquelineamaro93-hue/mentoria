-- Contratos SaaS isolados da mentoria. Nenhuma cobrança é criada por esta migração.
-- Todos os valores são recalculados pelo servidor antes da criação no MP.
create table if not exists public.soma_saas_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  plan_code text not null check (plan_code in ('avulso','essencial','pro')),
  module_slug text references public.soma_modules(slug) on delete restrict,
  iris_enabled boolean not null default false,
  whatsapp_enabled boolean not null default false,
  amount numeric(10,2) not null check (amount>0 and amount<=10000),
  currency text not null default 'BRL' check (currency='BRL'),
  provider text not null default 'mercadopago' check (provider='mercadopago'),
  provider_subscription_id text unique,
  status text not null default 'PENDING'
    check (status in ('PENDING','AUTHORIZED','ACTIVE','PAST_DUE','CANCELED','EXPIRED')),
  paid_through timestamptz,
  last_paid_at timestamptz,
  last_paid_payment_id text,
  terms_version text not null default 'saas-v1' check (terms_version='saas-v1'),
  terms_accepted_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint soma_saas_orders_module_choice check (
    (plan_code='avulso' and module_slug is not null)
    or (plan_code in ('essencial','pro') and module_slug is null)
  ),
  constraint soma_saas_orders_paid_check check (
    status <> 'ACTIVE' or paid_through is not null
  )
);
create index if not exists soma_saas_orders_user_idx on public.soma_saas_orders(user_id,created_at desc);
create unique index if not exists soma_saas_one_current_order_per_user
  on public.soma_saas_orders(user_id)
  where status in ('PENDING','AUTHORIZED','ACTIVE');

create table if not exists public.soma_saas_payment_events (
  payment_id text primary key,
  order_id uuid not null references public.soma_saas_orders(id) on delete restrict,
  status text not null,
  amount numeric(10,2) not null,
  processed_at timestamptz not null default now()
);
create index if not exists soma_saas_payment_order_idx on public.soma_saas_payment_events(order_id);

alter table public.soma_saas_orders enable row level security;
alter table public.soma_saas_payment_events enable row level security;
revoke all on public.soma_saas_orders from public,anon,authenticated;
revoke all on public.soma_saas_payment_events from public,anon,authenticated;
grant select on public.soma_saas_orders to authenticated;
grant all on public.soma_saas_orders, public.soma_saas_payment_events to service_role;
create policy soma_saas_orders_owner_read on public.soma_saas_orders
  for select to authenticated using ((select auth.uid())=user_id);
-- Não existe política para leitura pública dos eventos de pagamento.

-- Nenhum usuário pode criar uma concessão no navegador.
create unique index if not exists soma_saas_access_once_per_order_module
  on public.soma_user_module_access (user_id,module_slug,reason)
  where reason like 'saas_order:%';

create or replace function public.soma_process_saas_payment(
  p_order uuid, p_preapproval text, p_payment_id text,
  p_status text, p_amount numeric, p_currency text,
  p_paid_at timestamptz default null
) returns text
language plpgsql security definer set search_path = public, pg_temp
as $function$
declare
  v_order public.soma_saas_orders%rowtype;
  v_prev public.soma_saas_payment_events%rowtype;
  v_paid timestamptz;
  v_until timestamptz;
  v_module text;
begin
  if coalesce(auth.role(),'') <> 'service_role' then
    raise exception 'Somente backend' using errcode='42501';
  end if;
  if length(coalesce(p_payment_id,'')) < 1 then return 'invalid_payment'; end if;
  select * into v_order from public.soma_saas_orders where id=p_order for update;
  if not found then return 'unknown_order'; end if;
  if v_order.provider_subscription_id is distinct from p_preapproval then
    raise exception 'Assinatura diferente do pedido';
  end if;
  if p_amount is distinct from v_order.amount or p_currency is distinct from v_order.currency then
    raise exception 'Valor ou moeda divergente';
  end if;
  select * into v_prev from public.soma_saas_payment_events where payment_id=p_payment_id for update;
  if found and v_prev.order_id<>p_order then raise exception 'Pagamento de outro pedido'; end if;
  if found and v_prev.status=p_status then return 'duplicated'; end if;
  if found and v_prev.status in ('refunded','charged_back') then return 'stale_payment'; end if;
  insert into public.soma_saas_payment_events(payment_id,order_id,status,amount)
  values(p_payment_id,p_order,p_status,p_amount)
  on conflict (payment_id) do update set status=excluded.status,processed_at=now();

  if p_status='approved' then
    v_paid := coalesce(p_paid_at,now());
    if v_paid > now()+interval '5 minutes' then raise exception 'Pagamento com data futura'; end if;
    if v_order.last_paid_at is null or v_paid >= v_order.last_paid_at then
      v_until := greatest(coalesce(v_order.paid_through,'epoch'::timestamptz),v_paid + interval '1 month');
      update public.soma_saas_orders
      set status='ACTIVE',paid_through=v_until,last_paid_at=v_paid,
        last_paid_payment_id=p_payment_id,updated_at=now() where id=p_order;

      for v_module in select m.slug from public.soma_modules m
        where m.enabled and (
          v_order.plan_code='pro'
          or (v_order.plan_code='essencial' and m.slug in ('autoconhecimento','diagnostico','desenvolvimento'))
          or (v_order.plan_code='avulso' and m.slug=v_order.module_slug)
        )
      loop
        insert into public.soma_user_module_access
          (user_id,module_slug,status,starts_at,expires_at,reason)
        values(v_order.user_id,v_module,'ACTIVE',v_paid,v_until,'saas_order:'||p_order::text)
        on conflict (user_id,module_slug,reason) where reason like 'saas_order:%'
        do update set status='ACTIVE',
          expires_at=greatest(excluded.expires_at,public.soma_user_module_access.expires_at),
          updated_at=now();
      end loop;
    end if;
  elsif p_status in ('refunded','charged_back') then
    if v_order.last_paid_payment_id=p_payment_id then
      update public.soma_saas_orders set status='PAST_DUE',paid_through=now(),updated_at=now()
      where id=p_order;
      update public.soma_user_module_access
        set status='CANCELED',expires_at=greatest(now(),starts_at + interval '1 second'),updated_at=now()
        where user_id=v_order.user_id and reason='saas_order:'||p_order::text;
    end if;
  elsif p_status in ('rejected','cancelled') then
    if v_order.last_paid_at is null then
      update public.soma_saas_orders set status='PAST_DUE',updated_at=now() where id=p_order;
    end if;
  end if;
  return 'processed';
end;
$function$;
revoke all on function public.soma_process_saas_payment(uuid,text,text,text,numeric,text,timestamptz)
  from public,anon,authenticated;
grant execute on function public.soma_process_saas_payment(uuid,text,text,text,numeric,text,timestamptz)
  to service_role;
