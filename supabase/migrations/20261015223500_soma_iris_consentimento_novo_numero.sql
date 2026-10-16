-- Consentimento novo pode ser registrado junto com troca de número,
-- mas nunca transporta automaticamente autorização anterior para novo WhatsApp.
CREATE OR REPLACE FUNCTION public.proteger_consentimento_iris()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.whatsapp_numero IS NULL OR NEW.whatsapp_consentimento_em IS NULL THEN
    NEW.iris_ia_consentimento_em := NULL;
  ELSIF NEW.whatsapp_numero IS DISTINCT FROM OLD.whatsapp_numero
     AND NEW.iris_ia_consentimento_em IS NOT DISTINCT FROM OLD.iris_ia_consentimento_em THEN
    NEW.iris_ia_consentimento_em := NULL;
  END IF;
  RETURN NEW;
END; $$;
