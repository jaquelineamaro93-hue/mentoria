-- Independent SaaS account/trial; never mutate mentorship payment/profile fields.
create table public.soma_saas_accounts (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 plan_code text not null check(plan_code in ('avulso','essencial','pro')),
 modules text[] not null, iris boolean not null default false, whatsapp boolean not null default false,
 trial_started_at timestamptz, trial_ends_at timestamptz,
 terms_version text not null default 'saas-2026-10-24', terms_accepted_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
alter table public.soma_saas_accounts enable row level security;
revoke all on public.soma_saas_accounts from anon,authenticated;
grant select on public.soma_saas_accounts to authenticated;
grant all on public.soma_saas_accounts to service_role;
create policy own_saas_account on public.soma_saas_accounts for select to authenticated using(user_id=(select auth.uid()));
alter table public.soma_module_orders add column plan_code text,
 add column modules text[], add column iris boolean not null default false,
 add column whatsapp boolean not null default false, add column checkout_url text, add column checkout_started_at timestamptz;
alter table soma_module_orders drop constraint soma_module_orders_explicit_consent;
alter table soma_module_orders add constraint soma_module_orders_explicit_consent check(terms_version in ('modular-1.0','saas-2026-10-24') and terms_accepted_at is not null);
create index soma_saas_orders_user_status on public.soma_module_orders(user_id,status) where plan_code is not null;

create or replace function public.soma_saas_register(p_user uuid,p_config jsonb,p_trial boolean)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare a public.soma_saas_accounts%rowtype; mods text[]; c text:=p_config->>'plan_code';
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Backend only' using errcode='42501'; end if;
 mods:=array(select jsonb_array_elements_text(p_config->'modules'));
 if c not in ('avulso','essencial','pro') or cardinality(mods)<1 or not mods <@ array['autoconhecimento','diagnostico','percepcao-360','curriculo-ats','linkedin','entrevistas','desenvolvimento','networking','vagas'] then raise exception 'Invalid configuration'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 select * into a from soma_saas_accounts where user_id=p_user for update;
 if not found then
  insert into soma_saas_accounts(user_id,plan_code,modules,iris,whatsapp,trial_started_at,trial_ends_at)
  values(p_user,c,mods,(p_config->>'iris')::boolean,(p_config->>'whatsapp')::boolean,
    case when p_trial then now() end,case when p_trial then now()+interval '7 days' end) returning * into a;
 elsif p_trial and a.trial_started_at is null then
  update soma_saas_accounts set trial_started_at=now(),trial_ends_at=now()+interval '7 days',
   plan_code=c,modules=mods,iris=(p_config->>'iris')::boolean,whatsapp=(p_config->>'whatsapp')::boolean
  where user_id=p_user returning * into a;
 end if;
 -- Retries never reset the trial or change its modules. Expiry is evaluated at read time.
 return to_jsonb(a);
end $$;
revoke all on function soma_saas_register(uuid,jsonb,boolean) from public,anon,authenticated;
grant execute on function soma_saas_register(uuid,jsonb,boolean) to service_role;

create or replace function public.soma_saas_create_order(p_user uuid,p_config jsonb,p_amount numeric)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare o public.soma_module_orders%rowtype; mods text[]; expected numeric;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Backend only' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 mods:=array(select jsonb_array_elements_text(p_config->'modules'));
 expected:=case p_config->>'plan_code' when 'avulso' then 24.90 when 'essencial' then 34.90 when 'pro' then 69.90 end
  + case when (p_config->>'iris')::boolean and (p_config->>'whatsapp')::boolean then 250
    when (p_config->>'iris')::boolean or (p_config->>'whatsapp')::boolean then 150 else 0 end;
 if expected is null or expected<>p_amount or cardinality(mods)<1 then raise exception 'Invalid amount'; end if;
 select * into o from soma_module_orders where user_id=p_user and plan_code is not null
  and status not in ('CANCELED','EXPIRED','FAILED') order by created_at desc limit 1 for update;
 if found then
  if o.status='PENDING' and o.plan_code=p_config->>'plan_code' and o.modules=mods
   and o.iris=(p_config->>'iris')::boolean and o.whatsapp=(p_config->>'whatsapp')::boolean then return o.id; end if;
  raise exception 'Existing subscription';
 end if;
 insert into soma_module_orders(user_id,module_slug,amount,terms_version,terms_accepted_at,plan_code,modules,iris,whatsapp)
 values(p_user,mods[1],p_amount,'saas-2026-10-24',now(),p_config->>'plan_code',mods,(p_config->>'iris')::boolean,(p_config->>'whatsapp')::boolean)
 returning id into o.id;
 return o.id;
end $$;
revoke all on function soma_saas_create_order(uuid,jsonb,numeric) from public,anon,authenticated;
grant execute on function soma_saas_create_order(uuid,jsonb,numeric) to service_role;

create or replace function public.soma_has_mentorship_entitlement()
returns boolean language plpgsql stable security definer set search_path=public,pg_temp as $$
declare p public.profiles%rowtype; u uuid:=auth.uid();
begin
 if u is null then return false; end if;
 select * into p from profiles where id=u;
 if not found then return false; end if;
 if p.is_admin then return true; end if;
 if exists(select 1 from mentoria_pausas where user_id=u and status='ativa') then return false; end if;
 if p.plano_id is not null and p.status_assinatura='ativo' and (p.data_fim_acesso is null or p.data_fim_acesso>=(now() at time zone 'America/Sao_Paulo')::date) then return true; end if;
 -- A SaaS trial never grants human mentorship, including when the legacy profile says trial.
 return not exists(select 1 from soma_saas_accounts where user_id=u) and p.trial_status='active' and p.trial_ends_at>now();
end $$;
revoke all on function soma_has_mentorship_entitlement() from public,anon;
grant execute on function soma_has_mentorship_entitlement() to authenticated,service_role;

create or replace function public.soma_can_access_module_for(p_user uuid,p_slug text)
returns boolean language plpgsql stable security definer set search_path=public,pg_temp as $$
declare p public.profiles%rowtype; m public.soma_modules%rowtype; is_saas boolean;
begin
 if p_user is null or p_slug is null then return false; end if;
 if coalesce(auth.role(),'')<>'service_role' and auth.uid() is distinct from p_user then raise exception 'Unauthorized' using errcode='42501'; end if;
 select * into m from soma_modules where slug=p_slug and enabled;
 if not found then return false; end if;
 select * into p from profiles where id=p_user;
 if not found then return false; end if;
 if p.is_admin then return true; end if;
 if p.plano_id is not null and p.status_assinatura='ativo'
  and (p.data_fim_acesso is null or p.data_fim_acesso>=(now() at time zone 'America/Sao_Paulo')::date)
  and not exists(select 1 from mentoria_pausas where user_id=p_user and status='ativa') then return true; end if;
 is_saas:=exists(select 1 from soma_saas_accounts where user_id=p_user);
 if not is_saas and p.trial_status='active' and p.trial_ends_at>now() then return true; end if;
 if exists(select 1 from soma_saas_accounts a where user_id=p_user and a.trial_ends_at>now() and p_slug=any(a.modules)) then return true; end if;
 if exists(select 1 from soma_module_subscriptions s join soma_module_orders o on o.id=s.order_id
  where s.user_id=p_user and s.status='ACTIVE' and s.paid_through>now()
  and (case when o.plan_code is not null then p_slug=any(o.modules) else s.module_slug=p_slug end)) then return true; end if;
 if exists(select 1 from soma_user_module_access where user_id=p_user and module_slug=p_slug and status='ACTIVE'
  and starts_at<=now() and (expires_at is null or expires_at>now())) then return true; end if;
 -- Preserve legacy rollout only for accounts that have never entered SaaS.
 return not is_saas and not m.enforce_access;
end $$;
revoke all on function soma_can_access_module_for(uuid,text) from public,anon;
grant execute on function soma_can_access_module_for(uuid,text) to authenticated,service_role;

create or replace function public.soma_saas_feature_for(p_user uuid,p_feature text)
returns boolean language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
 if p_user is null or p_feature not in ('iris','whatsapp') then return false; end if;
 if coalesce(auth.role(),'')<>'service_role' and auth.uid() is distinct from p_user then raise exception 'Unauthorized' using errcode='42501'; end if;
 if exists(select 1 from profiles p where p.id=p_user and (p.is_admin or (p.plano_id is not null and p.status_assinatura='ativo' and (p.data_fim_acesso is null or p.data_fim_acesso>=(now() at time zone 'America/Sao_Paulo')::date))))
  and not exists(select 1 from mentoria_pausas where user_id=p_user and status='ativa') then return true; end if;
 if exists(select 1 from soma_saas_accounts where user_id=p_user and trial_ends_at>now()
   and case when p_feature='iris' then iris else whatsapp end) then return true; end if;
 if exists(select 1 from soma_module_orders o join soma_module_subscriptions s on s.order_id=o.id
   where o.user_id=p_user and o.plan_code is not null and s.status='ACTIVE' and s.paid_through>now()
   and case when p_feature='iris' then o.iris else o.whatsapp end) then return true; end if;
 return not exists(select 1 from soma_saas_accounts where user_id=p_user)
  and exists(select 1 from profiles where id=p_user and trial_status='active' and trial_ends_at>now());
end $$;
revoke all on function soma_saas_feature_for(uuid,text) from public,anon;
grant execute on function soma_saas_feature_for(uuid,text) to authenticated,service_role;

create or replace function public.soma_saas_state()
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare u uuid:=auth.uid(); mods jsonb; ends timestamptz;
begin
 if u is null then raise exception 'Authentication required' using errcode='42501'; end if;
 select coalesce(jsonb_agg(slug order by display_order),'[]'::jsonb) into mods from soma_modules where enabled and soma_can_access_module_for(u,slug);
 select trial_ends_at into ends from soma_saas_accounts where user_id=u;
 return jsonb_build_object('saas',exists(select 1 from soma_saas_accounts where user_id=u),
  'mentorship',soma_has_mentorship_entitlement(),'modules',mods,'iris',soma_saas_feature_for(u,'iris'),
  'whatsapp',soma_saas_feature_for(u,'whatsapp'),'trialEndsAt',ends);
end $$;
revoke all on function soma_saas_state() from public,anon;
grant execute on function soma_saas_state() to authenticated,service_role;

-- Additional restrictive policies AND with existing ownership policies.
-- Legacy users keep existing access; SaaS accounts get no mentorship by fallback.
create or replace function public.soma_saas_table_gate(p_modules text[])
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select auth.uid() is not null and (
 not exists(select 1 from soma_saas_accounts where user_id=auth.uid())
 or soma_has_mentorship_entitlement()
 or exists(select 1 from unnest(p_modules) m where soma_can_access_module_for(auth.uid(),m)));
$$;
revoke all on function soma_saas_table_gate(text[]) from public,anon;
grant execute on function soma_saas_table_gate(text[]) to authenticated,service_role;
do $$
declare r record; expr text;
begin
 for r in select * from (values
 ('quem_sou_eu_respostas',array['autoconhecimento']),('mapa_essencia',array['autoconhecimento']),('bussola_posicionamento',array['autoconhecimento']),
 ('diagnostics',array['diagnostico']),('via_resultados',array['diagnostico']),('via_evolucao_analises',array['diagnostico']),
 ('perfil_resumo',array['diagnostico']),('perfil_sintese',array['diagnostico']),('resumo_perfil',array['diagnostico']),
 ('cv_simulacoes',array['curriculo-ats']),('soar_analises',array['entrevistas']),('entrevista_simulacoes',array['entrevistas']),
 ('pdi_respostas',array['desenvolvimento']),('pdi_planos',array['desenvolvimento']),('pdi_acoes',array['desenvolvimento']),('pdi_goals',array['desenvolvimento']),('pdi_reflexoes_mensais',array['desenvolvimento']),('pdi_guia_secoes',array['desenvolvimento']),('primeiros_90_dias_respostas',array['desenvolvimento']),
 ('vagas_candidatura',array['vagas']),('vaga_readiness',array['vagas']),('contatos_rede',array['networking']),
 ('linkedin_content_drafts',array['linkedin']),('linkedin_content_idea_banks',array['linkedin']),('linkedin_content_voice_profiles',array['linkedin']),
 ('feedback_360_rounds',array['percepcao-360']),('feedback_360_answers',array['percepcao-360']),('feedback_360_questions',array['percepcao-360']),('feedback_360_respondents',array['percepcao-360']),('feedback_360_share_links',array['percepcao-360']),('feedback_360_summaries',array['percepcao-360']),
 ('recordings',array[]::text[]),('journal_notes',array[]::text[]),('feedback_sessoes',array[]::text[]),
 ('acompanhamentos_semanais',array[]::text[]),('announcements',array[]::text[]),('entrevistas_iniciais',array[]::text[]),('peer_feedbacks',array[]::text[]),('votos_encontro',array[]::text[]),('votos_enquete',array[]::text[]),('enquetes',array[]::text[]),('enquete_opcoes',array[]::text[]),('checkins_mensais',array[]::text[]),('documentos_mentorado',array[]::text[])
 ) as mapping(tab,mods) loop
 if to_regclass('public.'||r.tab) is not null then
  execute format('alter table public.%I enable row level security',r.tab);
  execute format('create policy saas_product_boundary on public.%I as restrictive for all to authenticated using (public.soma_saas_table_gate(%L::text[])) with check (public.soma_saas_table_gate(%L::text[]))',r.tab,r.mods,r.mods);
 end if;
 end loop;
end $$;
-- Shared analysis table needs a row-level feature discriminator.
create policy saas_analysis_boundary on soma_analises as restrictive for all to authenticated
 using(soma_saas_table_gate(array[case ferramenta when 'linkedin' then 'linkedin' when 'gupy' then 'curriculo-ats' when 'cenario' then 'desenvolvimento' else '' end]))
 with check(soma_saas_table_gate(array[case ferramenta when 'linkedin' then 'linkedin' when 'gupy' then 'curriculo-ats' when 'cenario' then 'desenvolvimento' else '' end]));

-- Copilot history cannot be used as an alternate feature entry point.
do $$ declare t text; begin
 foreach t in array array['iris_action_plans','iris_web_conversations','iris_web_messages','iris_web_privacy_preferences','soma_copilot_feedback'] loop
  execute format('create policy saas_iris_boundary on public.%I as restrictive for all to authenticated using (not exists(select 1 from public.soma_saas_accounts where user_id=(select auth.uid())) or public.soma_saas_feature_for((select auth.uid()),''iris'')) with check (not exists(select 1 from public.soma_saas_accounts where user_id=(select auth.uid())) or public.soma_saas_feature_for((select auth.uid()),''iris''))',t);
 end loop;
end $$;
