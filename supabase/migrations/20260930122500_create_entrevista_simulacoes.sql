-- Persiste simulações de entrevista para acompanhar evolução do mentorado.

create table if not exists public.entrevista_simulacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  candidatura_id uuid null references public.vagas_candidatura(id) on delete set null,
  titulo text null,
  perguntas jsonb not null default '[]'::jsonb,
  respostas jsonb not null default '[]'::jsonb,
  feedbacks jsonb not null default '[]'::jsonb,
  score_final integer null check (score_final is null or (score_final >= 0 and score_final <= 100)),
  status text not null default 'em_andamento' check (status in ('em_andamento', 'concluida')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.entrevista_simulacoes enable row level security;

drop policy if exists "Mentorados veem próprias simulações de entrevista" on public.entrevista_simulacoes;
drop policy if exists "Mentorados criam próprias simulações de entrevista" on public.entrevista_simulacoes;
drop policy if exists "Mentorados atualizam próprias simulações de entrevista" on public.entrevista_simulacoes;
drop policy if exists "Mentorados apagam próprias simulações de entrevista" on public.entrevista_simulacoes;

create policy "Mentorados veem próprias simulações de entrevista"
on public.entrevista_simulacoes
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Mentorados criam próprias simulações de entrevista"
on public.entrevista_simulacoes
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Mentorados atualizam próprias simulações de entrevista"
on public.entrevista_simulacoes
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Mentorados apagam próprias simulações de entrevista"
on public.entrevista_simulacoes
for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists entrevista_simulacoes_user_created_idx
  on public.entrevista_simulacoes(user_id, created_at desc);

create index if not exists entrevista_simulacoes_candidatura_idx
  on public.entrevista_simulacoes(candidatura_id);
