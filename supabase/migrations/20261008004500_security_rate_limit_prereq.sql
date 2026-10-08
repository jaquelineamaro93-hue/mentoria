-- Prerequisite for application-level rate limiting.
-- Safe to apply before deploying the hardened application.

create schema if not exists private;
revoke all on schema private from public, anon;

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

revoke all on function public.consume_security_rate_limit(text,text,integer,integer)
from public, anon, authenticated;
grant execute on function public.consume_security_rate_limit(text,text,integer,integer)
to service_role;
