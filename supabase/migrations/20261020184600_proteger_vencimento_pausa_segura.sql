-- RLS still prevents a member from modifying contract dates. The trusted
-- SECURITY DEFINER pause finalization runs as the postgres function owner.
-- Preserve the existing trigger's client-side protection while allowing only
-- SQL trusted-owner routines to update billing/expiry values transactionally.
CREATE OR REPLACE FUNCTION public.proteger_campos_sistema_profile()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT public.is_admin()
     AND current_user <> 'postgres' THEN
    NEW.status_pagamento := OLD.status_pagamento;
    NEW.data_fim_acesso := OLD.data_fim_acesso;
    NEW.observacao_pagamento := OLD.observacao_pagamento;
    NEW.status_assinatura := OLD.status_assinatura;
    NEW.origem_assinatura := OLD.origem_assinatura;
    NEW.proxima_cobranca := OLD.proxima_cobranca;
    NEW.mp_subscription_id := OLD.mp_subscription_id;
    NEW.plano_id := OLD.plano_id;
    NEW.forma_pagamento_escolhida := OLD.forma_pagamento_escolhida;
    NEW.boas_vindas_enviado := OLD.boas_vindas_enviado;
    NEW.pode_ver_dashboard := OLD.pode_ver_dashboard;
    NEW.pode_editar_vagas := OLD.pode_editar_vagas;
    NEW.pode_editar_mentorados := OLD.pode_editar_mentorados;
    NEW.pode_ver_financeiro := OLD.pode_ver_financeiro;
    NEW.pode_editar_conteudo := OLD.pode_editar_conteudo;
  END IF;
  RETURN NEW;
END;
$function$;
