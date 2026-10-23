-- SOMA Mentoria: Plano de Ações da Íris, independente do PDI.
-- Tabela nova, nenhum dado existente é migrado ou sobrescrito.
-- A pessoa escolhe explicitamente salvar o rascunho. Escrita só no backend.

create table if not exists public.iris_action_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tema text not null check (tema in ('transicao','recolocacao','crescimento','monetizacao','entrevistas','outro')),
  titulo text not null check (char_length(titulo) between 5 and 130),
  diagnostico text not null check (char_length(diagnostico) between 10 and 1200),
  objetivo text not null check (char_length(objetivo) between 5 and 400),
  foco text not null check (char_length(foco) between 5 and 500),
  etapas jsonb not null check (jsonb_typeof(etapas) = 'array'
    and jsonb_array_length(etapas) between 3 and 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists iris_action_plans_owner_recent
  on public.iris_action_plans (user_id, updated_at desc);

alter table public.iris_action_plans enable row level security;
revoke all on public.iris_action_plans from public, anon, authenticated;
grant select on public.iris_action_plans to authenticated;
grant all on public.iris_action_plans to service_role;

do $iris_action_plan_rls$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public'
      and tablename = 'iris_action_plans'
      and policyname = 'iris_action_plans_select_owner'
  ) then
    create policy iris_action_plans_select_owner
      on public.iris_action_plans for select to authenticated
      using ((select auth.uid()) = user_id);
  end if;
end
$iris_action_plan_rls$;

comment on table public.iris_action_plans is
  'Planos de ações pessoais criados e confirmados na Íris Copilot web, separados do PDI e de outras trilhas SOMA.';
