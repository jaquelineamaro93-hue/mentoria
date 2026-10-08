-- Full security hardening for SOMA.
-- Non-destructive: preserves mentor, payment and audit history.

-- ---------------------------------------------------------------------------
-- 1) Least privilege defaults
-- ---------------------------------------------------------------------------
revoke create on schema public from public, anon, authenticated;

alter default privileges in schema public
  revoke all on tables from anon;

alter default privileges in schema public
  revoke execute on functions from public, anon, authenticated;

-- Anonymous visitors should not have direct table access except explicit
-- public read models used by public pages.
revoke all privileges on all tables in schema public from anon;

grant select on public.planos_mentoria to anon;
grant select on public.enquetes to anon;
grant select on public.enquete_opcoes to anon;
grant select on public.votos_enquete to anon;

-- Browser users never need DDL-like table privileges.
revoke truncate, references, trigger on all tables in schema public from authenticated;

-- Keep direct profile writes limited to fields a mentor can legitimately own.
revoke update on public.profiles from authenticated;
grant update (
  nome,
  foto_url,
  onboarding_concluido,
  updated_at,
  cpf,
  tour_concluido,
  genero,
  raw_resume,
  linkedin_updated_at
) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 2) Private privileged helpers + non-privileged public wrappers
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select p.is_admin
      from public.profiles p
      where p.id = (select auth.uid())
    ),
    false
  );
$$;

revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated, service_role;

create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.is_admin();
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

create or replace function private.listar_mentorados_publicos()
returns table(id uuid, nome text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.nome
  from public.profiles p
  where (select auth.uid()) is not null
    and coalesce(p.is_admin, false) = false
    and p.id <> (select auth.uid())
  order by p.nome;
$$;

revoke all on function private.listar_mentorados_publicos() from public, anon;
grant execute on function private.listar_mentorados_publicos() to authenticated, service_role;

create or replace function public.listar_mentorados_publicos()
returns table(id uuid, nome text)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.listar_mentorados_publicos();
$$;

revoke all on function public.listar_mentorados_publicos() from public, anon;
grant execute on function public.listar_mentorados_publicos() to authenticated, service_role;

create or replace function private.listar_ranking_comunidade()
returns table(user_id uuid, nome text, foto_url text, pontos integer)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    coalesce(nullif(trim(p.nome), ''), 'Sem nome'),
    p.foto_url,
    coalesce(p.pontos_total, 0)::integer
  from public.profiles p
  where (select auth.uid()) is not null
    and coalesce(p.is_admin, false) = false
    and coalesce(p.status_assinatura, 'ativo') = 'ativo'
  order by coalesce(p.pontos_total, 0) desc, coalesce(p.nome, '') asc, p.id asc;
$$;

revoke all on function private.listar_ranking_comunidade() from public, anon;
grant execute on function private.listar_ranking_comunidade() to authenticated, service_role;

create or replace function public.listar_ranking_comunidade()
returns table(user_id uuid, nome text, foto_url text, pontos integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.listar_ranking_comunidade();
$$;

revoke all on function public.listar_ranking_comunidade() from public, anon;
grant execute on function public.listar_ranking_comunidade() to authenticated, service_role;

create or replace function private.registrar_atividade_portal()
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz := now();
  v_last timestamptz;
begin
  if v_user_id is null then
    raise exception 'Não autenticado';
  end if;

  select p.last_activity_at into v_last
  from public.profiles p
  where p.id = v_user_id;

  if v_last is null or v_last < v_now - interval '10 minutes' then
    update public.profiles
      set last_activity_at = v_now
    where id = v_user_id;
    return v_now;
  end if;

  return v_last;
end;
$$;

revoke all on function private.registrar_atividade_portal() from public, anon;
grant execute on function private.registrar_atividade_portal() to authenticated, service_role;

create or replace function public.registrar_atividade_portal()
returns timestamptz
language sql
security invoker
set search_path = ''
as $$
  select private.registrar_atividade_portal();
$$;

revoke all on function public.registrar_atividade_portal() from public, anon;
grant execute on function public.registrar_atividade_portal() to authenticated, service_role;

create or replace function private.registrar_login_portal()
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz := now();
begin
  if v_user_id is null then
    raise exception 'Não autenticado';
  end if;

  update public.profiles
    set last_login_at = v_now,
        last_activity_at = v_now
  where id = v_user_id;

  return v_now;
end;
$$;

revoke all on function private.registrar_login_portal() from public, anon;
grant execute on function private.registrar_login_portal() to authenticated, service_role;

create or replace function public.registrar_login_portal()
returns timestamptz
language sql
security invoker
set search_path = ''
as $$
  select private.registrar_login_portal();
$$;

revoke all on function public.registrar_login_portal() from public, anon;
grant execute on function public.registrar_login_portal() to authenticated, service_role;

create or replace function private.registrar_xp_linkedin_import()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_rows integer := 0;
begin
  if v_user_id is null then
    raise exception 'Não autenticado';
  end if;

  insert into public.user_xp (user_id, action, points)
  values (v_user_id, 'linkedin_import', 50)
  on conflict (user_id, action) do nothing;

  get diagnostics v_rows = row_count;

  if v_rows = 1 then
    update public.profiles
      set pontos_total = coalesce(pontos_total, 0) + 50,
          updated_at = now()
    where id = v_user_id;
    return true;
  end if;

  return false;
end;
$$;

revoke all on function private.registrar_xp_linkedin_import() from public, anon;
grant execute on function private.registrar_xp_linkedin_import() to authenticated, service_role;

create or replace function public.registrar_xp_linkedin_import()
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select private.registrar_xp_linkedin_import();
$$;

revoke all on function public.registrar_xp_linkedin_import() from public, anon;
grant execute on function public.registrar_xp_linkedin_import() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3) Public Feedback 360 goes through a rate-limited server API
-- ---------------------------------------------------------------------------
revoke execute on function public.get_feedback_360_public(uuid) from anon, authenticated;
revoke execute on function public.submit_feedback_360_public(uuid,text,text,text,text,text,text,jsonb) from anon, authenticated;
grant execute on function public.get_feedback_360_public(uuid) to service_role;
grant execute on function public.submit_feedback_360_public(uuid,text,text,text,text,text,text,jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- 4) Central rate limiting for public / abuse-sensitive server endpoints
-- ---------------------------------------------------------------------------
create table if not exists private.security_rate_limits (
  scope text not null,
  key_hash text not null,
  window_started_at timestamptz not null default now(),
  hits integer not null default 0 check (hits >= 0),
  updated_at timestamptz not null default now(),
  primary key (scope, key_hash)
);

revoke all on private.security_rate_limits from public, anon, authenticated;

create or replace function public.consume_security_rate_limit(
  p_scope text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_hits integer;
begin
  if p_scope is null or length(p_scope) < 1 or length(p_scope) > 80
     or p_key_hash is null or length(p_key_hash) <> 64
     or p_limit < 1 or p_limit > 10000
     or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'Parâmetros de rate limit inválidos';
  end if;

  insert into private.security_rate_limits(scope, key_hash, window_started_at, hits, updated_at)
  values (p_scope, p_key_hash, v_now, 1, v_now)
  on conflict (scope, key_hash)
  do update set
    hits = case
      when private.security_rate_limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
        then 1
      else private.security_rate_limits.hits + 1
    end,
    window_started_at = case
      when private.security_rate_limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
        then v_now
      else private.security_rate_limits.window_started_at
    end,
    updated_at = v_now
  returning hits into v_hits;

  return v_hits <= p_limit;
end;
$$;

revoke all on function public.consume_security_rate_limit(text,text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_security_rate_limit(text,text,integer,integer) to service_role;

-- ---------------------------------------------------------------------------
-- 5) Explicit deny policies for backend-only public tables
-- ---------------------------------------------------------------------------
revoke all on public.magic_codes from anon, authenticated;
revoke all on public.mp_eventos from anon, authenticated;
revoke all on public.site_asset_chunks from anon, authenticated;
revoke all on public.transacoes from anon, authenticated;

drop policy if exists "deny_client_magic_codes" on public.magic_codes;
create policy "deny_client_magic_codes"
  on public.magic_codes
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists "deny_client_mp_eventos" on public.mp_eventos;
create policy "deny_client_mp_eventos"
  on public.mp_eventos
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists "deny_client_site_asset_chunks" on public.site_asset_chunks;
create policy "deny_client_site_asset_chunks"
  on public.site_asset_chunks
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists "deny_client_transacoes" on public.transacoes;
create policy "deny_client_transacoes"
  on public.transacoes
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

-- ---------------------------------------------------------------------------
-- 6) Personal/admin policies are explicitly authenticated and UPDATE has
--    an explicit WITH CHECK.
-- ---------------------------------------------------------------------------
do $$
declare
  p record;
begin
  for p in
    select tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and roles::text = '{public}'
      and (
        coalesce(qual, '') ilike '%auth.uid()%'
        or coalesce(with_check, '') ilike '%auth.uid()%'
        or coalesce(qual, '') ilike '%is_admin()%'
        or coalesce(with_check, '') ilike '%is_admin()%'
      )
  loop
    execute format('alter policy %I on public.%I to authenticated', p.policyname, p.tablename);
  end loop;
end
$$;

alter policy "Usuários atualizam os próprios contatos"
  on public.contatos_rede
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "Usuários atualizam os próprios diagnósticos"
  on public.diagnostics
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "Users can update their own documents"
  on public.documentos_mentorado
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "Usuários atualizam as próprias anotações"
  on public.journal_notes
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "Usuários atualizam as próprias metas de PDI"
  on public.pdi_goals
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "mentorado edita propria reflexao do mes"
  on public.pdi_reflexoes_mensais
  to authenticated
  using ((select auth.uid()) = mentorado_id)
  with check ((select auth.uid()) = mentorado_id);

alter policy "Usuários atualizam as próprias respostas do PDI guiado"
  on public.pdi_respostas
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "Users can update own data"
  on public.primeiros_90_dias_respostas
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "Usuários atualizam as próprias respostas do Quem Sou Eu"
  on public.quem_sou_eu_respostas
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "admin atualiza configuracoes financeiras"
  on public.configuracoes_financeiras
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

alter policy "admin_update_enquetes"
  on public.enquetes
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

alter policy "admin atualiza indicacoes"
  on public.indicacoes
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

alter policy "admin_update_votos_enquete"
  on public.votos_enquete
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- 7) Storage: remove anonymous writes and cross-user avatar replacement
-- ---------------------------------------------------------------------------
drop policy if exists "Allow authenticated users to update avatars" on storage.objects;
drop policy if exists "Allow authenticated users to upload avatars" on storage.objects;
drop policy if exists "Allow public read avatars" on storage.objects;
drop policy if exists "Give anon users access to JPG images in folder 1bs1gex_0" on storage.objects;
drop policy if exists "Give anon users access to JPG images in folder 1bs1gex_1" on storage.objects;
drop policy if exists "Give anon users access to JPG images in folder 1bs1gex_2" on storage.objects;
drop policy if exists "Give anon users access to JPG images in folder 1bs1gex_3" on storage.objects;
drop policy if exists "Give users access to own folder 1bs1gex_0" on storage.objects;
drop policy if exists "Give users access to own folder 1bs1gex_1" on storage.objects;
drop policy if exists "Give users access to own folder 1bs1gex_2" on storage.objects;
drop policy if exists "Give users access to own folder 1bs1gex_3" on storage.objects;
drop policy if exists "Give users authenticated access to folder 1bs1gex_0" on storage.objects;
drop policy if exists "Give users authenticated access to folder 1bs1gex_1" on storage.objects;

create policy "Avatar public read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'avatar');

create policy "Avatar owner insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatar'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and lower(storage.extension(name)) in ('jpg','jpeg','png','webp','gif')
  );

create policy "Avatar owner update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatar'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatar'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and lower(storage.extension(name)) in ('jpg','jpeg','png','webp','gif')
  );

create policy "Avatar owner delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatar'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif']
where id = 'avatar';
