create table if not exists public.linkedin_content_voice_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  sample_posts text[] not null default '{}',
  profile_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.linkedin_content_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  titulo text,
  ideia text not null default '',
  objetivo text,
  audiencia text,
  formato text,
  angulo text,
  cta_tipo text,
  hook_escolhido text,
  conteudo text not null default '',
  resultado_json jsonb not null default '{}'::jsonb,
  status text not null default 'rascunho' check (status in ('rascunho','salvo','publicado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists linkedin_content_drafts_user_created_idx
  on public.linkedin_content_drafts (user_id, created_at desc);

alter table public.linkedin_content_voice_profiles enable row level security;
alter table public.linkedin_content_drafts enable row level security;

drop policy if exists "linkedin_voice_select_own" on public.linkedin_content_voice_profiles;
create policy "linkedin_voice_select_own"
  on public.linkedin_content_voice_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "linkedin_voice_insert_own" on public.linkedin_content_voice_profiles;
create policy "linkedin_voice_insert_own"
  on public.linkedin_content_voice_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "linkedin_voice_update_own" on public.linkedin_content_voice_profiles;
create policy "linkedin_voice_update_own"
  on public.linkedin_content_voice_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "linkedin_voice_delete_own" on public.linkedin_content_voice_profiles;
create policy "linkedin_voice_delete_own"
  on public.linkedin_content_voice_profiles for delete
  using (auth.uid() = user_id);

drop policy if exists "linkedin_drafts_select_own" on public.linkedin_content_drafts;
create policy "linkedin_drafts_select_own"
  on public.linkedin_content_drafts for select
  using (auth.uid() = user_id);

drop policy if exists "linkedin_drafts_insert_own" on public.linkedin_content_drafts;
create policy "linkedin_drafts_insert_own"
  on public.linkedin_content_drafts for insert
  with check (auth.uid() = user_id);

drop policy if exists "linkedin_drafts_update_own" on public.linkedin_content_drafts;
create policy "linkedin_drafts_update_own"
  on public.linkedin_content_drafts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "linkedin_drafts_delete_own" on public.linkedin_content_drafts;
create policy "linkedin_drafts_delete_own"
  on public.linkedin_content_drafts for delete
  using (auth.uid() = user_id);
