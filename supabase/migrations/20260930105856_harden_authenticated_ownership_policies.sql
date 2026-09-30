-- Tighten ownership policies to signed-in users and prevent ownership reassignment.

drop policy if exists "Usuários veem o próprio perfil" on public.profiles;
drop policy if exists "Usuários criam o próprio perfil" on public.profiles;
drop policy if exists "Usuários atualizam o próprio perfil" on public.profiles;
drop policy if exists "Admins veem todos os perfis" on public.profiles;
drop policy if exists "Admins atualizam qualquer perfil" on public.profiles;

create policy "Usuários veem o próprio perfil" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "Usuários criam o próprio perfil" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "Usuários atualizam o próprio perfil" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
create policy "Admins veem todos os perfis" on public.profiles
  for select to authenticated using ((select public.is_admin()));
create policy "Admins atualizam qualquer perfil" on public.profiles
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Mentorados can view own candidaturas" on public.vagas_candidatura;
drop policy if exists "Mentorados can insert own candidaturas" on public.vagas_candidatura;
drop policy if exists "Mentorados can update own candidaturas" on public.vagas_candidatura;
drop policy if exists "Mentorados can delete own candidaturas" on public.vagas_candidatura;

create policy "Mentorados can view own candidaturas" on public.vagas_candidatura
  for select to authenticated using ((select auth.uid()) = mentorado_id);
create policy "Mentorados can insert own candidaturas" on public.vagas_candidatura
  for insert to authenticated with check ((select auth.uid()) = mentorado_id);
create policy "Mentorados can update own candidaturas" on public.vagas_candidatura
  for update to authenticated
  using ((select auth.uid()) = mentorado_id)
  with check ((select auth.uid()) = mentorado_id);
create policy "Mentorados can delete own candidaturas" on public.vagas_candidatura
  for delete to authenticated using ((select auth.uid()) = mentorado_id);

drop policy if exists "Mentorados can view own readiness" on public.vaga_readiness;
drop policy if exists "Mentorados can insert own readiness" on public.vaga_readiness;
drop policy if exists "Mentorados can update own readiness" on public.vaga_readiness;
drop policy if exists "Mentorados can delete own readiness" on public.vaga_readiness;

create policy "Mentorados can view own readiness" on public.vaga_readiness
  for select to authenticated using ((select auth.uid()) = mentorado_id);
create policy "Mentorados can insert own readiness" on public.vaga_readiness
  for insert to authenticated with check ((select auth.uid()) = mentorado_id);
create policy "Mentorados can update own readiness" on public.vaga_readiness
  for update to authenticated
  using ((select auth.uid()) = mentorado_id)
  with check ((select auth.uid()) = mentorado_id);
create policy "Mentorados can delete own readiness" on public.vaga_readiness
  for delete to authenticated using ((select auth.uid()) = mentorado_id);

alter function public.update_updated_at_column() set search_path = public;
