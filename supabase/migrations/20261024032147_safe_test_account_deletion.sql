-- Preserve pre-launch students. This registry does not change their permissions or plans.
create table public.soma_legacy_student_registry (
 user_id uuid primary key references public.profiles(id) on delete restrict,
 registered_at timestamptz not null default now(),
 source text not null default 'pre_saas_launch'
);
alter table public.soma_legacy_student_registry enable row level security;
revoke all on public.soma_legacy_student_registry from anon,authenticated;
grant all on public.soma_legacy_student_registry to service_role;
insert into public.soma_legacy_student_registry(user_id)
 select p.id from public.profiles p where not p.is_admin and p.created_at<'2026-10-24T03:00:00Z'
 and not exists(select 1 from public.soma_saas_accounts a where a.user_id=p.id);

create table public.soma_account_deletion_audit (
 id uuid primary key default gen_random_uuid(), actor_id uuid not null,
 deleted_user_id uuid not null, email_fingerprint text not null,
 deleted_at timestamptz not null default now(), retained_pending_orders integer not null
);
alter table public.soma_account_deletion_audit enable row level security;
revoke all on public.soma_account_deletion_audit from anon,authenticated;
grant select,insert on public.soma_account_deletion_audit to service_role;

-- Only empty, post-launch accounts can be removed through the admin shortcut.
-- The account, sessions and dependent metadata are removed in one transaction.
-- Orders are retained with no user association, rather than erased.
create or replace function public.soma_delete_empty_account(p_user uuid,p_actor uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare p public.profiles%rowtype; r record; n bigint; detached integer;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Backend only' using errcode='42501'; end if;
 if p_actor is null or not exists(select 1 from profiles where id=p_actor and is_admin) then
  raise exception 'Administrator required' using errcode='42501'; end if;
 if p_user is null or p_user=p_actor then return jsonb_build_object('deleted',false,'reason','protected_account'); end if;
 perform 1 from auth.users where id=p_user for update;
 select * into p from profiles where id=p_user for update;
 if not found then return jsonb_build_object('deleted',false,'reason','not_found'); end if;
 if p.is_admin or exists(select 1 from soma_legacy_student_registry where user_id=p_user) then
  return jsonb_build_object('deleted',false,'reason','historical_account'); end if;
 if p.status_assinatura='ativo' or p.plano_id is not null or p.mp_subscription_id is not null
  or exists(select 1 from soma_module_orders where user_id=p_user)
  or exists(select 1 from soma_module_subscriptions where user_id=p_user)
  or exists(select 1 from mp_pedidos where user_id=p_user and (concedido or status in ('approved','refunded','charged_back','authorized') or (forma_pagamento='recorrente' and mp_resource_id is not null)))
  or exists(select 1 from mp_eventos e join mp_pedidos o on o.id=e.pedido_id where o.user_id=p_user and e.status in ('approved','refunded','charged_back')) then
  return jsonb_build_object('deleted',false,'reason','financial_history'); end if;
 if nullif(trim(p.raw_resume),'') is not null or p.onboarding_concluido then
  return jsonb_build_object('deleted',false,'reason','saved_history'); end if;
 -- Discover every direct ownership/reference FK; do not maintain an incomplete list of exercises.
 for r in
  select distinct ns.nspname as schema_name,c.relname as table_name,a.attname as column_name
  from pg_constraint fk join pg_class c on c.oid=fk.conrelid
  join pg_namespace ns on ns.oid=c.relnamespace
  join pg_attribute a on a.attrelid=c.oid and a.attnum=fk.conkey[1]
  where fk.contype='f' and fk.confrelid in ('public.profiles'::regclass,'auth.users'::regclass)
   and ns.nspname='public' and cardinality(fk.conkey)=1
   and not (c.relname='profiles' and a.attname='id')
   and c.relname not in ('mp_pedidos','soma_saas_accounts','emails_enviados','product_events','product_experiment_assignments','user_xp','user_achievements','admin_inspecoes_sessoes','admin_impersonacoes_log')
 loop
  execute format('select count(*) from %I.%I where %I=$1',r.schema_name,r.table_name,r.column_name) into n using p_user;
  if n>0 then return jsonb_build_object('deleted',false,'reason','saved_history'); end if;
 end loop;
 if exists(select 1 from storage.objects where owner_id=p_user::text) then
  return jsonb_build_object('deleted',false,'reason','saved_files'); end if;
 update mp_pedidos set user_id=null where user_id=p_user;
 get diagnostics detached=row_count;
 insert into soma_account_deletion_audit(actor_id,deleted_user_id,email_fingerprint,retained_pending_orders)
 values(p_actor,p_user,encode(sha256(convert_to(lower(p.email),'UTF8')),'hex'),detached);
 delete from auth.users where id=p_user;
 return jsonb_build_object('deleted',true,'retained_pending_orders',detached);
end $$;
revoke all on function public.soma_delete_empty_account(uuid,uuid) from public,anon,authenticated;
grant execute on function public.soma_delete_empty_account(uuid,uuid) to service_role;
