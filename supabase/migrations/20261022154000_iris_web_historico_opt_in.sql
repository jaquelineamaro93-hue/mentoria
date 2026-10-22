-- SOMA: histórico do Copiloto web Íris.
-- NÃO altera o WhatsApp Íris, PDI, módulos, cobranças, ou tabelas existentes.
-- Três tabelas novas, privadas. Toda escrita de mensagens acontece apenas no servidor.
-- Sem public views, sem policies para anon, sem funções SECURITY DEFINER.

create table if not exists public.iris_web_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Nova conversa' check (char_length(title) between 1 and 120),
  consent_at timestamptz not null default now(),
  consent_version text not null default 'iris_web_v1' check (consent_version = 'iris_web_v1'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);
create index if not exists iris_web_conversations_owner_recent
  on public.iris_web_conversations (user_id, updated_at desc);

create table if not exists public.iris_web_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null check (char_length(content) between 1 and 5200),
  response_ref uuid unique,
  href text check (href is null or (char_length(href) <= 180 and href like '/%')),
  feedback_rating text check (feedback_rating is null or feedback_rating in ('util','nao_util')),
  feedback_reason text check (feedback_reason is null or char_length(feedback_reason) <= 300),
  created_at timestamptz not null default now(),
  constraint iris_web_messages_owner_fk
    foreign key (conversation_id, user_id)
    references public.iris_web_conversations(id,user_id) on delete cascade,
  constraint iris_web_ref_only_assistant
    check (response_ref is null or role='assistant')
);
create index if not exists iris_web_messages_thread_created
  on public.iris_web_messages (conversation_id, created_at, id);
create index if not exists iris_web_messages_owner
  on public.iris_web_messages (user_id, created_at desc);
create index if not exists iris_web_messages_negative
  on public.iris_web_messages (created_at desc)
  where feedback_rating = 'nao_util';

create table if not exists public.iris_web_admin_audit (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id),
  subject_user_id uuid references auth.users(id) on delete set null,
  conversation_id uuid,
  purpose text not null check (purpose in ('painel_qualidade','revisao_de_feedback')),
  action text not null check (action in ('summary','read_conversation')),
  created_at timestamptz not null default now()
);
create index if not exists iris_web_audit_actor_recent
  on public.iris_web_admin_audit (actor_id, created_at desc);

-- FORCE RLS and explicit grants: public/anon cannot query these tables.
alter table public.iris_web_conversations enable row level security;
alter table public.iris_web_messages enable row level security;
alter table public.iris_web_admin_audit enable row level security;
revoke all on public.iris_web_conversations, public.iris_web_messages,
  public.iris_web_admin_audit from public, anon, authenticated;
grant select on public.iris_web_conversations, public.iris_web_messages to authenticated;
grant all on public.iris_web_conversations, public.iris_web_messages,
  public.iris_web_admin_audit to service_role;

-- Instalado em alguns ambientes antes do merge: não recriar policies existentes.
do $iris_privacy_policy$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public'
      and tablename = 'iris_web_conversations'
      and policyname = 'iris_web_conversations_select_owner'
  ) then
    create policy iris_web_conversations_select_owner
      on public.iris_web_conversations for select to authenticated
      using ((select auth.uid()) = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public'
      and tablename = 'iris_web_messages'
      and policyname = 'iris_web_messages_select_owner'
  ) then
    create policy iris_web_messages_select_owner
      on public.iris_web_messages for select to authenticated
      using ((select auth.uid()) = user_id);
  end if;
end
$iris_privacy_policy$;

comment on table public.iris_web_conversations is
  'Conversa web SOMA de usuário; sem acesso público ou ao histórico WhatsApp.';
comment on table public.iris_web_messages is
  'Mensagens do copiloto web; escrita exclusivamente em servidor autenticado; RLS de leitura por dono.';
comment on table public.iris_web_admin_audit is
  'Rastro privado de leitura administrativa, sem conteúdo de mensagens ou acesso direto do mentorado.';
