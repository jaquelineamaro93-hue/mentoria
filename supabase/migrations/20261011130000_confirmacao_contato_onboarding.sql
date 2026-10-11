ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dados_contato_confirmados_em timestamptz;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_genero_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_genero_check CHECK (genero IS NULL OR genero IN ('masculino','feminino','nao_binario','outro','prefiro_nao_informar'));
GRANT UPDATE (dados_contato_confirmados_em) ON public.profiles TO authenticated;
CREATE OR REPLACE FUNCTION public.proteger_confirmacao_contato() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF NEW.dados_contato_confirmados_em IS NOT NULL AND (NEW.whatsapp_numero IS NULL OR NEW.whatsapp_numero !~ '^55[1-9][0-9]{9,10}$') THEN
  RAISE EXCEPTION 'Confirmação de contato exige WhatsApp com DDD válido';
 END IF;
 IF NEW.whatsapp_numero IS DISTINCT FROM OLD.whatsapp_numero THEN
  NEW.whatsapp_validado_em := NULL;
  IF NEW.dados_contato_confirmados_em IS NOT DISTINCT FROM OLD.dados_contato_confirmados_em THEN
   NEW.dados_contato_confirmados_em := NULL;
  END IF;
 END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_proteger_confirmacao_contato ON public.profiles;
CREATE TRIGGER trg_proteger_confirmacao_contato BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.proteger_confirmacao_contato();
