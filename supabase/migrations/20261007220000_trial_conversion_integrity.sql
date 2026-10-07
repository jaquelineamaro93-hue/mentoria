begin;
-- Trial dates are controlled by the server, not by editable profile requests.
create or replace function public.proteger_trial_profile() returns trigger
language plpgsql set search_path=public as $$
begin
 if auth.uid() is not null and not public.is_admin() then
  new.trial_status:=old.trial_status;
  new.trial_started_at:=old.trial_started_at;
  new.trial_ends_at:=old.trial_ends_at;
  new.trial_converted_at:=old.trial_converted_at;
  new.trial_plan_id:=old.trial_plan_id;
  new.trial_prompt_variant:=old.trial_prompt_variant;
  new.trial_prompted_at:=old.trial_prompted_at;
 end if;
 return new;
end; $$;
create trigger trg_proteger_trial_profile before update on public.profiles
for each row execute function public.proteger_trial_profile();
-- Payment RPC and conversion telemetry commit together. Repeated events are deduplicated.
create or replace function public.registrar_conversao_trial() returns trigger
language plpgsql security definer set search_path=public as $$
declare hours numeric;
begin
 if new.trial_status='converted' and old.trial_status is distinct from 'converted'
  and new.trial_started_at is not null and new.trial_converted_at is not null then
  hours:=greatest(0,extract(epoch from (new.trial_converted_at-new.trial_started_at))/3600);
  insert into public.product_events(user_id,event_name,feature_key,metadata,dedupe_key,occurred_at)
  values(new.id,'trial_converted','trial',jsonb_build_object('variant',new.trial_prompt_variant,
   'trial_plan_id',new.trial_plan_id,'conversion_day',floor(hours/24),
   'conversion_hours',round(hours,1)),new.id::text||':trial_converted',new.trial_converted_at)
  on conflict(dedupe_key) where dedupe_key is not null do nothing;
 end if;
 return new;
end; $$;
create trigger trg_registrar_conversao_trial after update on public.profiles
for each row execute function public.registrar_conversao_trial();
drop policy if exists product_events_insert_own on public.product_events;
create policy product_events_insert_own on public.product_events for insert to authenticated
with check(auth.uid()=user_id and event_name not in ('trial_started','trial_converted','trial_expired'));
-- Paid public packages only: courtesy and technical test products are excluded.
update public.planos_mentoria set trial_enabled=true,trial_days=7,trial_label='Teste grátis'
where ativo=true and visivel_checkout=true and preco_avista>1;
update public.planos_mentoria set trial_days=least(trial_days,7);
alter table public.planos_mentoria alter column trial_days set default 7;
alter table public.planos_mentoria drop constraint if exists planos_mentoria_trial_days_check;
alter table public.planos_mentoria add constraint planos_mentoria_trial_days_check check(trial_days between 1 and 7);
insert into public.product_experiments(key,name,hypothesis,status,variants,primary_event,started_at)
values('trial_prompt_timing_v2','Convite no dia 2 por uso ou dia 5','Comparar convites após valor percebido desde o dia 2 e convites no dia 5, mantendo 7 dias de acesso.','running','[{"key":"adaptive_value","label":"Desde o dia 2 por uso"},{"key":"fixed_day_5","label":"Dia 5"}]'::jsonb,'trial_converted',now()) on conflict(key) do nothing;
commit;
