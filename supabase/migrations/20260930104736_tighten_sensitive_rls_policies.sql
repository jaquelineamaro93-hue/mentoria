-- Harden sensitive tables. Service-role clients bypass RLS and do not need permissive public policies.

drop policy if exists "Allow public select on profiles" on public.profiles;
drop policy if exists "Service role can manage candidaturas" on public.vagas_candidatura;
drop policy if exists "Service role can manage readiness" on public.vaga_readiness;
drop policy if exists "Service role pode gerenciar" on public.magic_codes;

revoke all on table public.magic_codes from anon, authenticated;
grant all on table public.magic_codes to service_role;

revoke all on table public.vagas_candidatura from anon;
revoke all on table public.vaga_readiness from anon;
grant select, insert, update, delete on table public.vagas_candidatura to authenticated;
grant select, insert, update, delete on table public.vaga_readiness to authenticated;

revoke select on table public.profiles from anon;
grant select, insert, update on table public.profiles to authenticated;
