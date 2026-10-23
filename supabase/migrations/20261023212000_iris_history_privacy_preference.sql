-- Consentimento do histórico por conta, independente da conversa aberta.
-- Preserva a opção já manifestada pelas pessoas com conversas salvas.
-- Novos usuários não são considerados opt-in sem aceite explícito.

create table if not exists public.iris_web_privacy_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  consent_version text not null default 'iris_web_v1',
  accepted_at timestamptz not null default now(),
  history_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.iris_web_privacy_preferences enable row level security;

revoke all on public.iris_web_privacy_preferences from public, anon, authenticated;
grant select on public.iris_web_privacy_preferences to authenticated;
grant all on public.iris_web_privacy_preferences to service_role;

do $iris_web_privacy_pref_rls$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'iris_web_privacy_preferences'
      and policyname = 'iris_web_privacy_preferences_owner_read'
  ) then
    create policy iris_web_privacy_preferences_owner_read
      on public.iris_web_privacy_preferences
      for select to authenticated
      using ((select auth.uid()) = user_id);
  end if;
end
$iris_web_privacy_pref_rls$;

-- Aceites prévios associados às conversas são preservados. Nenhuma
-- mensagem ou conversa é copiada, apagada ou reatribuída.
insert into public.iris_web_privacy_preferences
  (user_id, consent_version, accepted_at, history_enabled)
select distinct on (user_id)
  user_id, consent_version, consent_at, true
from public.iris_web_conversations
order by user_id, consent_at asc
on conflict (user_id) do nothing;

comment on table public.iris_web_privacy_preferences is
  'Aceite único e escolha atual de salvamento do histórico da Íris Copilot web, independente das conversas, sem integração WhatsApp.';
