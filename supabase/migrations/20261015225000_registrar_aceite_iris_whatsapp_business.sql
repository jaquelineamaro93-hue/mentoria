-- Importação declaratória, documentada: a administradora afirmou que TODOS
-- os contatos que já autorizaram acompanhamento WhatsApp também autorizaram a
-- Íris na conversa do WhatsApp Business. As conversas não foram lidas pela SOMA.
-- O registro representa a declaração, NÃO comprovação técnica do aceite original.
--
-- Uma autorização revogada continua revogada: esta migração executa uma vez,
-- não cria automação periódica de opt-in.

CREATE TABLE IF NOT EXISTS public.iris_consentimentos_origem (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  canal text NOT NULL CHECK (canal IN ('whatsapp_business', 'perfil_soma')),
  metodo text NOT NULL CHECK (metodo IN ('declaracao_administradora', 'consentimento_direto')),
  canal_numero_comercial text,
  aceite_original_em timestamptz,
  registrado_sistema_em timestamptz NOT NULL DEFAULT now(),
  evidencia_disponivel boolean NOT NULL DEFAULT false,
  observacao text,
  UNIQUE (user_id, canal, metodo)
);

ALTER TABLE public.iris_consentimentos_origem ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.iris_consentimentos_origem FROM anon, authenticated;
GRANT ALL ON public.iris_consentimentos_origem TO service_role;
CREATE INDEX IF NOT EXISTS iris_consentimentos_origem_usuario
  ON public.iris_consentimentos_origem(user_id, registrado_sistema_em DESC);

-- Registra somente pessoas com número válido e consentimento geral ativo, sem
-- pausa anterior. Não se inventa a data do aceite original. Os 9 cadastros
-- identificados antes da migração atendiam aos critérios.
WITH candidatos AS (
  SELECT p.id
  FROM public.profiles p
  LEFT JOIN public.iris_estado ie ON ie.user_id = p.id
  WHERE p.is_admin = false
    AND p.whatsapp_numero ~ '^55[1-9][0-9]{9,10}$'
    AND p.whatsapp_consentimento_em IS NOT NULL
    AND p.iris_ia_consentimento_em IS NULL
    AND COALESCE(ie.pausado, false) = false
), registro AS (
  INSERT INTO public.iris_consentimentos_origem (
    user_id, canal, metodo, canal_numero_comercial, aceite_original_em,
    evidencia_disponivel, observacao
  )
  SELECT c.id, 'whatsapp_business', 'declaracao_administradora',
    '5511959561795', NULL, false,
    'Administração informou que o aceite específico da Íris já ocorreu no WhatsApp Business. Não houve importação nem inspeção das conversas na SOMA.'
  FROM candidatos c
  ON CONFLICT (user_id, canal, metodo) DO NOTHING
  RETURNING user_id
)
UPDATE public.profiles p
SET iris_ia_consentimento_em = now()
FROM registro r
WHERE p.id = r.user_id
  AND p.iris_ia_consentimento_em IS NULL
  AND p.whatsapp_consentimento_em IS NOT NULL;
