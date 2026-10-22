-- Migracao aplicada ao projeto Supabase "mentoria-soma"
-- ID: nqmnszottjkmolatzxwt, nome: soma_iris_copilot_feedback_v1
-- Arquivo de referencia/auditoria. Nao reaplicar automaticamente.
-- A criacao da tabela nao faz deploy do aplicativo.
create table if not exists public.soma_copilot_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  response_id uuid not null,
  intent text not null check (intent in ('progresso','vaga','pdi','orientacao')),
  rating text not null check (rating in ('positivo','negativo')),
  reason text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint soma_copilot_feedback_reason_check check (
    (rating = 'positivo' and reason = '')
    or (rating = 'negativo' and char_length(btrim(reason)) between 8 and 800)
  ),
  constraint soma_copilot_feedback_unique_response unique (user_id, response_id)
);
alter table public.soma_copilot_feedback enable row level security;
revoke all on public.soma_copilot_feedback from anon;
grant select, insert, update on public.soma_copilot_feedback to authenticated;
create policy "soma_copilot_feedback_select_owner"
  on public.soma_copilot_feedback for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "soma_copilot_feedback_insert_owner"
  on public.soma_copilot_feedback for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "soma_copilot_feedback_update_owner"
  on public.soma_copilot_feedback for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create index if not exists soma_copilot_feedback_recent_idx
  on public.soma_copilot_feedback (created_at desc);
create index if not exists soma_copilot_feedback_bad_recent_idx
  on public.soma_copilot_feedback (created_at desc)
  where rating = 'negativo';
comment on table public.soma_copilot_feedback is
  'Feedback manual por resposta do copiloto web SOMA. Nao armazena o CV nem o texto integral da conversa. RLS por dono.';
