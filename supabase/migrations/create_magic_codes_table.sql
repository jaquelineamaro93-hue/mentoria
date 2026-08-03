-- Criar tabela para armazenar códigos mágicos
create table if not exists public.magic_codes (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  code text not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Índice para buscar por email
create index if not exists magic_codes_email_idx on public.magic_codes(email);

-- RLS policies
alter table public.magic_codes enable row level security;

-- Política para permitir operações do serviço
create policy "Service role pode gerenciar" on public.magic_codes
  for all using (auth.role() = 'service_role' or auth.role() = 'authenticated')
  with check (auth.role() = 'service_role' or auth.role() = 'authenticated');
