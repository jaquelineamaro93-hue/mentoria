-- Product analytics, configurable trial and lightweight A/B experiment layer.
-- Additive migration: no existing mentorado history is deleted or rewritten.

alter table public.profiles
  add column if not exists trial_status text not null default 'not_started',
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists trial_converted_at timestamptz,
  add column if not exists trial_plan_id uuid references public.planos_mentoria(id) on delete set null,
  add column if not exists trial_prompt_variant text,
  add column if not exists trial_prompted_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_trial_status_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_trial_status_check
      check (trial_status in ('not_started','active','converted','expired'));
  end if;
end $$;

alter table public.planos_mentoria
  add column if not exists trial_enabled boolean not null default false,
  add column if not exists trial_days smallint not null default 15,
  add column if not exists trial_label text not null default 'Teste grátis';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'planos_mentoria_trial_days_check'
      and conrelid = 'public.planos_mentoria'::regclass
  ) then
    alter table public.planos_mentoria
      add constraint planos_mentoria_trial_days_check
      check (trial_days between 1 and 15);
  end if;
end $$;

create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  event_name text not null,
  feature_key text,
  path text,
  session_id text,
  metadata jsonb not null default '{}'::jsonb,
  dedupe_key text,
  occurred_at timestamptz not null default now()
);

create unique index if not exists idx_product_events_dedupe
  on public.product_events(dedupe_key)
  where dedupe_key is not null;

create index if not exists idx_product_events_user_time
  on public.product_events(user_id, occurred_at desc);

create index if not exists idx_product_events_feature_time
  on public.product_events(feature_key, occurred_at desc);

create index if not exists idx_product_events_name_time
  on public.product_events(event_name, occurred_at desc);

alter table public.product_events enable row level security;

drop policy if exists "product_events_insert_own" on public.product_events;
create policy "product_events_insert_own"
  on public.product_events
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "product_events_select_own" on public.product_events;
create policy "product_events_select_own"
  on public.product_events
  for select
  to authenticated
  using (auth.uid() = user_id);

grant select, insert on public.product_events to authenticated;

create table if not exists public.product_experiments (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  hypothesis text,
  status text not null default 'draft'
    check (status in ('draft','running','paused','ended')),
  variants jsonb not null default '[]'::jsonb,
  primary_event text,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_experiment_assignments (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references public.product_experiments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  variant text not null,
  assigned_at timestamptz not null default now(),
  unique(experiment_id, user_id)
);

create index if not exists idx_product_experiment_assignments_user
  on public.product_experiment_assignments(user_id, assigned_at desc);

alter table public.product_experiments enable row level security;
alter table public.product_experiment_assignments enable row level security;

drop policy if exists "product_experiments_read_authenticated" on public.product_experiments;
create policy "product_experiments_read_authenticated"
  on public.product_experiments
  for select
  to authenticated
  using (true);

drop policy if exists "product_experiment_assignments_read_own" on public.product_experiment_assignments;
create policy "product_experiment_assignments_read_own"
  on public.product_experiment_assignments
  for select
  to authenticated
  using (auth.uid() = user_id);

grant select on public.product_experiments to authenticated;
grant select on public.product_experiment_assignments to authenticated;

insert into public.product_experiments(
  key,
  name,
  hypothesis,
  status,
  variants,
  primary_event,
  started_at
)
values (
  'trial_prompt_timing_v1',
  'Momento do convite de conversão no trial',
  'Mostrar o convite depois de sinais de valor percebido converte melhor do que esperar um dia fixo, sem reduzir os 15 dias máximos de acesso.',
  'running',
  '[
    {"key":"adaptive_value","label":"Depois de valor percebido"},
    {"key":"fixed_day_7","label":"Dia 7"}
  ]'::jsonb,
  'trial_converted',
  now()
)
on conflict (key) do nothing;

create index if not exists idx_profiles_trial_state
  on public.profiles(trial_status, trial_ends_at)
  where coalesce(is_admin,false) = false;
