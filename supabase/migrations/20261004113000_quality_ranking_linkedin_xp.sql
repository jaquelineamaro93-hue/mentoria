-- QA hardening: community ranking + LinkedIn import XP.
-- Non-destructive migration: adds only nullable columns/table/functions/indexes/policies.

alter table public.profiles
  add column if not exists raw_resume text,
  add column if not exists linkedin_updated_at timestamptz;

create table if not exists public.user_xp (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  points integer not null check (points > 0 and points <= 1000),
  created_at timestamptz not null default now(),
  unique (user_id, action)
);

create index if not exists idx_user_xp_user_id
  on public.user_xp(user_id, created_at desc);

alter table public.user_xp enable row level security;

drop policy if exists "Usuários veem o próprio XP" on public.user_xp;
create policy "Usuários veem o próprio XP"
  on public.user_xp for select
  using (auth.uid() = user_id);

revoke all on table public.user_xp from anon;
revoke insert, update, delete on table public.user_xp from authenticated;
grant select on table public.user_xp to authenticated;

create or replace function public.registrar_xp_linkedin_import()
returns boolean
language plpgsql
security definer
set search_path = public
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

revoke all on function public.registrar_xp_linkedin_import() from public, anon;
grant execute on function public.registrar_xp_linkedin_import() to authenticated;

create or replace function public.listar_ranking_comunidade()
returns table (
  user_id uuid,
  nome text,
  foto_url text,
  pontos integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id as user_id,
    coalesce(nullif(trim(p.nome), ''), 'Sem nome') as nome,
    p.foto_url,
    coalesce(p.pontos_total, 0)::integer as pontos
  from public.profiles p
  where coalesce(p.is_admin, false) = false
    and coalesce(p.status_assinatura, 'ativo') = 'ativo'
  order by coalesce(p.pontos_total, 0) desc, coalesce(p.nome, '') asc, p.id asc;
$$;

revoke all on function public.listar_ranking_comunidade() from public, anon;
grant execute on function public.listar_ranking_comunidade() to authenticated;
