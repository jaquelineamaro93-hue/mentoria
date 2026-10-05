create table if not exists public.via_evolucao_analises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  resultado_anterior_id uuid not null references public.via_resultados(id) on delete cascade,
  resultado_atual_id uuid not null references public.via_resultados(id) on delete cascade,
  analise_json jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, resultado_anterior_id, resultado_atual_id)
);

create index if not exists idx_via_evolucao_user_pair on public.via_evolucao_analises (user_id, resultado_atual_id, resultado_anterior_id);

alter table public.via_evolucao_analises enable row level security;

create policy "via_evolucao_select_own" on public.via_evolucao_analises for select using (auth.uid() = user_id);
create policy "via_evolucao_insert_own" on public.via_evolucao_analises for insert with check (auth.uid() = user_id);

grant select, insert on public.via_evolucao_analises to authenticated;
