create table if not exists public.linkedin_content_idea_banks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pilares jsonb not null default '[]'::jsonb,
  ideias jsonb not null default '[]'::jsonb,
  contexto_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.linkedin_content_idea_banks enable row level security;

drop policy if exists "linkedin_idea_banks_select_own" on public.linkedin_content_idea_banks;
create policy "linkedin_idea_banks_select_own"
  on public.linkedin_content_idea_banks for select
  using (auth.uid() = user_id);

drop policy if exists "linkedin_idea_banks_insert_own" on public.linkedin_content_idea_banks;
create policy "linkedin_idea_banks_insert_own"
  on public.linkedin_content_idea_banks for insert
  with check (auth.uid() = user_id);

drop policy if exists "linkedin_idea_banks_update_own" on public.linkedin_content_idea_banks;
create policy "linkedin_idea_banks_update_own"
  on public.linkedin_content_idea_banks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "linkedin_idea_banks_delete_own" on public.linkedin_content_idea_banks;
create policy "linkedin_idea_banks_delete_own"
  on public.linkedin_content_idea_banks for delete
  using (auth.uid() = user_id);
