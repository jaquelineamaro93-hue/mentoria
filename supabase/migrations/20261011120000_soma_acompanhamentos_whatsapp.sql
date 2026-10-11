ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_numero text, ADD COLUMN IF NOT EXISTS whatsapp_consentimento_em timestamptz, ADD COLUMN IF NOT EXISTS whatsapp_validado_em timestamptz;
CREATE TABLE IF NOT EXISTS public.acompanhamentos_semanais (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 semana_inicio date NOT NULL,objetivo text,progresso text,insight text,proxima_acao text,mensagem_whatsapp text,
 status text NOT NULL DEFAULT 'rascunho' CHECK(status IN ('rascunho','aprovado','enviado','cancelado')),
 enviado_em timestamptz,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id,semana_inicio));
ALTER TABLE public.acompanhamentos_semanais ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.acompanhamentos_semanais FROM anon,authenticated;
CREATE INDEX IF NOT EXISTS idx_acompanhamentos_user_semana ON public.acompanhamentos_semanais(user_id,semana_inicio DESC);

GRANT UPDATE (whatsapp_numero,whatsapp_consentimento_em,genero) ON public.profiles TO authenticated;
CREATE OR REPLACE FUNCTION public.proteger_validacao_whatsapp() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN NEW.whatsapp_validado_em := OLD.whatsapp_validado_em; END IF;
 IF NEW.whatsapp_numero IS DISTINCT FROM OLD.whatsapp_numero THEN NEW.whatsapp_validado_em := NULL; END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_proteger_validacao_whatsapp ON public.profiles;
CREATE TRIGGER trg_proteger_validacao_whatsapp BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.proteger_validacao_whatsapp();
