-- Fonte confiável de atividade real no portal.
-- Preserva todo o histórico existente e corrige falsos "Nunca acessou".
-- Eventos ocorridos logo após uma impersonação de admin são ignorados no backfill.

alter table public.profiles
  add column if not exists last_activity_at timestamptz;

with raw_events as (
  select id as user_id, last_login_at as ts
  from public.profiles
  where last_login_at is not null

  union all
  select id, last_sign_in_at
  from auth.users
  where last_sign_in_at is not null

  union all
  select user_id, greatest(created_at, updated_at)
  from public.diagnostics

  union all
  select user_id, greatest(created_at, updated_at)
  from public.journal_notes

  union all
  select user_id, updated_at
  from public.pdi_respostas

  union all
  select user_id, greatest(created_at, updated_at)
  from public.quem_sou_eu_respostas

  union all
  select user_id, created_at
  from public.via_resultados

  union all
  select user_id, gerado_em
  from public.mapa_essencia

  union all
  select user_id, gerado_em
  from public.resumo_perfil

  union all
  select user_id, gerado_em
  from public.bussola_posicionamento

  union all
  select user_id, created_at
  from public.soma_analises

  union all
  select user_id, greatest(created_at, updated_at)
  from public.linkedin_content_drafts

  union all
  select user_id, created_at
  from public.contatos_rede
),
clean_events as (
  select e.*
  from raw_events e
  where e.ts is not null
    and not exists (
      select 1
      from public.admin_impersonacoes_log i
      where i.usuario_alvo_id = e.user_id
        and e.ts >= i.criado_em
        and e.ts <= i.criado_em + interval '2 hours'
    )
),
latest as (
  select user_id, max(ts) as last_activity_at
  from clean_events
  group by user_id
)
update public.profiles p
set last_activity_at = greatest(
  coalesce(p.last_activity_at, '-infinity'::timestamptz),
  l.last_activity_at
)
from latest l
where l.user_id = p.id
  and (
    p.last_activity_at is null
    or l.last_activity_at > p.last_activity_at
  );

-- Corrige o campo legado de login quando o Supabase possui um login real
-- que não coincide com uma impersonação de admin.
update public.profiles p
set last_login_at = u.last_sign_in_at
from auth.users u
where u.id = p.id
  and u.last_sign_in_at is not null
  and (p.last_login_at is null or u.last_sign_in_at > p.last_login_at)
  and not exists (
    select 1
    from public.admin_impersonacoes_log i
    where i.usuario_alvo_id = p.id
      and u.last_sign_in_at >= i.criado_em
      and u.last_sign_in_at <= i.criado_em + interval '10 minutes'
  );

create index if not exists idx_profiles_activity
  on public.profiles (is_admin, status_assinatura, last_activity_at desc);

create or replace function public.registrar_atividade_portal()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz := now();
  v_last timestamptz;
begin
  if v_user_id is null then
    raise exception 'Não autenticado';
  end if;

  select last_activity_at
    into v_last
  from public.profiles
  where id = v_user_id;

  -- Reduz escrita no banco: no máximo uma atualização a cada 10 minutos.
  if v_last is null or v_last < v_now - interval '10 minutes' then
    update public.profiles
      set last_activity_at = v_now
    where id = v_user_id;
    return v_now;
  end if;

  return v_last;
end;
$$;

create or replace function public.registrar_login_portal()
returns timestamptz
language plpgsql
security definer
set search_path = public
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

revoke all on function public.registrar_atividade_portal() from public, anon;
revoke all on function public.registrar_login_portal() from public, anon;
grant execute on function public.registrar_atividade_portal() to authenticated;
grant execute on function public.registrar_login_portal() to authenticated;

-- Login passa a ser registrado apenas pelas funções acima, evitando que
-- um usuário altere manualmente o próprio histórico de acesso.
revoke update(last_login_at) on public.profiles from authenticated;
