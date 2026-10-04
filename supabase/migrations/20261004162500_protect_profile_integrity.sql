-- Security hardening discovered during the QA audit.
-- No rows are deleted or rewritten by this migration.

-- Normal authenticated users must never be able to award their own Impulsos
-- or promote themselves to admin through direct PostgREST calls.
revoke update on public.profiles from authenticated;

grant update (
  nome,
  email,
  tipo_pacote,
  foto_url,
  onboarding_concluido,
  updated_at,
  cpf,
  last_login_at,
  status_pagamento,
  data_fim_acesso,
  observacao_pagamento,
  status_assinatura,
  origem_assinatura,
  proxima_cobranca,
  mp_subscription_id,
  creditos_simulacao_cv,
  plano_id,
  forma_pagamento_escolhida,
  boas_vindas_enviado,
  codigo_indicacao,
  indicado_por_id,
  sessoes_bonus_resgatadas,
  tour_concluido,
  pode_ver_dashboard,
  pode_editar_vagas,
  pode_editar_mentorados,
  pode_ver_financeiro,
  pode_editar_conteudo,
  genero,
  raw_resume,
  linkedin_updated_at
) on public.profiles to authenticated;

create or replace function public.proteger_campos_sistema_profile()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.status_pagamento := old.status_pagamento;
    new.data_fim_acesso := old.data_fim_acesso;
    new.observacao_pagamento := old.observacao_pagamento;
    new.status_assinatura := old.status_assinatura;
    new.origem_assinatura := old.origem_assinatura;
    new.proxima_cobranca := old.proxima_cobranca;
    new.mp_subscription_id := old.mp_subscription_id;
    new.plano_id := old.plano_id;
    new.forma_pagamento_escolhida := old.forma_pagamento_escolhida;
    new.boas_vindas_enviado := old.boas_vindas_enviado;
    new.pode_ver_dashboard := old.pode_ver_dashboard;
    new.pode_editar_vagas := old.pode_editar_vagas;
    new.pode_editar_mentorados := old.pode_editar_mentorados;
    new.pode_ver_financeiro := old.pode_ver_financeiro;
    new.pode_editar_conteudo := old.pode_editar_conteudo;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_proteger_campos_sistema_profile on public.profiles;
create trigger trg_proteger_campos_sistema_profile
before update on public.profiles
for each row
execute function public.proteger_campos_sistema_profile();
