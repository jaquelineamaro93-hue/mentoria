-- Verificação por módulo para clientes SaaS, preservando o modelo
-- legado de acesso para mentorados enquanto as policies por recurso são auditadas.
-- Sem abertura de gate a SaaS não-autorizados.
create or replace function public.soma_can_access_module_for(p_user uuid,p_slug text)
returns boolean language plpgsql stable security definer set search_path=public,pg_temp
as $function$
declare
  v_profile public.profiles%rowtype;
  v_mod public.soma_modules%rowtype;
  v_trial public.soma_saas_trials%rowtype;
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_is_saas boolean;
begin
  if p_user is null or p_slug is null then return false; end if;
  if coalesce(auth.role(),'') <> 'service_role' and auth.uid() is distinct from p_user then
    raise exception 'Não autorizado para consultar acesso de terceiros' using errcode='42501';
  end if;
  select * into v_mod from public.soma_modules where slug=p_slug and enabled;
  if not found then return false; end if;
  select * into v_profile from public.profiles where id=p_user;
  if not found then return false; end if;
  if v_profile.is_admin then return true; end if;
  if v_profile.plano_id is not null and v_profile.status_assinatura='ativo'
    and (v_profile.data_fim_acesso is null or v_profile.data_fim_acesso>=v_today)
    and not exists (select 1 from public.mentoria_pausas p
      where p.user_id=p_user and p.status='ativa')
    then return true; end if;
  if v_profile.trial_status='active' and v_profile.trial_ends_at>now() then
    return true;
  end if;

  -- Quem iniciou teste ou compra SaaS nunca usa o fallback público antigo.
  v_is_saas := exists(select 1 from public.soma_saas_trials t where t.user_id=p_user)
    or exists(select 1 from public.soma_saas_orders o where o.user_id=p_user)
    or exists(select 1 from public.soma_module_orders o where o.user_id=p_user);

  if v_is_saas then
    select * into v_trial from public.soma_saas_trials where user_id=p_user;
    if found and v_trial.ends_at>now() and (
      v_trial.plan_code='pro'
      or (v_trial.plan_code='essencial' and p_slug in
        ('autoconhecimento','diagnostico','desenvolvimento'))
      or (v_trial.plan_code='avulso' and v_trial.module_slug=p_slug)
    ) then return true; end if;
    if exists(select 1 from public.soma_user_module_access a
      where a.user_id=p_user and a.module_slug=p_slug and a.status='ACTIVE'
        and a.starts_at<=now() and (a.expires_at is null or a.expires_at>now()))
      then return true; end if;
    if exists(select 1 from public.soma_module_subscriptions s
      where s.user_id=p_user and s.module_slug=p_slug and s.status='ACTIVE'
        and s.paid_through>now()) then return true; end if;
    return false;
  end if;
  -- Compatibilidade temporária do legado, fora da base SaaS.
  if not v_mod.enforce_access then return true; end if;
  if exists(select 1 from public.soma_user_module_access a
    where a.user_id=p_user and a.module_slug=p_slug and a.status='ACTIVE'
      and a.starts_at<=now() and (a.expires_at is null or a.expires_at>now())) then return true; end if;
  if exists(select 1 from public.soma_module_subscriptions s
    where s.user_id=p_user and s.module_slug=p_slug and s.status='ACTIVE'
      and s.paid_through>now()) then return true; end if;
  return false;
end;
$function$;
revoke all on function public.soma_can_access_module_for(uuid,text) from public,anon;
grant execute on function public.soma_can_access_module_for(uuid,text) to authenticated,service_role;
