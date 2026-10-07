-- Security hotfix 2026-10-07
-- Harden authentication defaults and remove unnecessary RPC execution paths.

alter table public.magic_codes
  add column if not exists attempts integer not null default 0;

alter table public.profiles
  alter column status_pagamento set default 'pendente';

-- Trigger functions should not be callable directly through PostgREST RPC.
revoke execute on function public.feedback_360_create_share_link() from public, anon, authenticated;
revoke execute on function public.registrar_conversao_trial() from public, anon, authenticated;

grant execute on function public.feedback_360_create_share_link() to service_role;
grant execute on function public.registrar_conversao_trial() to service_role;
