create table if not exists public.soma_analises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ferramenta text not null check (ferramenta in ('linkedin','gupy','cenario')),
  titulo text,
  entradas jsonb not null default '{}'::jsonb,
  resultado_markdown text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_soma_analises_user_tool_created
  on public.soma_analises(user_id, ferramenta, created_at desc);

alter table public.soma_analises enable row level security;

drop policy if exists "Users can view own soma analyses" on public.soma_analises;
drop policy if exists "Users can insert own soma analyses" on public.soma_analises;
drop policy if exists "Users can delete own soma analyses" on public.soma_analises;

create policy "Users can view own soma analyses"
on public.soma_analises
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own soma analyses"
on public.soma_analises
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can delete own soma analyses"
on public.soma_analises
for delete
to authenticated
using (auth.uid() = user_id);
