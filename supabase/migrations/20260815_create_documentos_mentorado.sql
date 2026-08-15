create table if not exists documentos_mentorado (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  categoria text not null default 'outro',
  url text not null,
  tamanho bigint,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table documentos_mentorado enable row level security;

create policy "Users can view their own documents"
  on documentos_mentorado for select
  using (auth.uid() = user_id);

create policy "Users can insert their own documents"
  on documentos_mentorado for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own documents"
  on documentos_mentorado for update
  using (auth.uid() = user_id);

create policy "Users can delete their own documents"
  on documentos_mentorado for delete
  using (auth.uid() = user_id);

create index idx_documentos_mentorado_user_id on documentos_mentorado(user_id);
create index idx_documentos_mentorado_created_at on documentos_mentorado(created_at desc);
