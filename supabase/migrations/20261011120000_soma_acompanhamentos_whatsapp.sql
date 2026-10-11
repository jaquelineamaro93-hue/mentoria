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
