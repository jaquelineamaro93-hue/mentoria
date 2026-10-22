-- Histórico exclusivo da Íris Copilot web. Não utiliza as tabelas da Íris WhatsApp.
create table if not exists public.soma_copilot_messages (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('iris','mentorado')),
  content text not null check (char_length(content) between 1 and 4000),
  href text,
  response_ref uuid,
  created_at timestamptz not null default now()
);
create index if not exists soma_copilot_messages_owner_time_idx
  on public.soma_copilot_messages (user_id, created_at desc, id desc);
alter table public.soma_copilot_messages enable row level security;
create policy "copilot messages select own" on public.soma_copilot_messages
  for select to authenticated using (user_id = (select auth.uid()));
create policy "copilot messages insert own" on public.soma_copilot_messages
  for insert to authenticated with check (user_id = (select auth.uid()));
-- Histórico imutável: atualizações e exclusões não são liberadas ao cliente.
