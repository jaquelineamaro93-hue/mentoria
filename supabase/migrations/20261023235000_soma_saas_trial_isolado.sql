-- Trial SaaS isolado do trial de mentoria.
-- A compra de uma ferramenta não altera profiles.plano_id, status_assinatura
-- ou trial_status da mentoria e não concede sessões humanas.

create table if not exists public.soma_saas_trials (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  plan_code text not null check (plan_code in ('avulso','essencial','pro')),
  module_slug text references public.soma_modules(slug) on delete restrict,
  started_at timestamptz not null default now(),
  ends_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  constraint soma_saas_trial_module_choice check (
    (plan_code='avulso' and module_slug is not null)
    or (plan_code in ('essencial','pro') and module_slug is null)
  ),
  constraint soma_saas_trial_max_7_days check (
    ends_at > started_at and ends_at <= started_at + interval '7 days'
  )
);
alter table public.soma_saas_trials enable row level security;
revoke all on public.soma_saas_trials from public, anon, authenticated;
grant select on public.soma_saas_trials to authenticated;
grant all on public.soma_saas_trials to service_role;
create policy soma_saas_trials_owner_read
  on public.soma_saas_trials for select to authenticated
  using ((select auth.uid())=user_id);
create index if not exists soma_saas_trials_active_idx
  on public.soma_saas_trials (ends_at)
  where ends_at is not null;

comment on table public.soma_saas_trials is
  'Um único teste SaaS de até sete dias por conta; não concede mentoria nem altera o trial humano.';
