-- Registro de mensagens trazidas manualmente do WhatsApp Business pela administradora.
-- NÃO usar a tabela da Meta/Cloud API nem criar identificadores de entrega fictícios.
CREATE TABLE IF NOT EXISTS public.iris_mensagens_importadas (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 chave_origem text NOT NULL UNIQUE,
 canal text NOT NULL DEFAULT 'whatsapp_business' CHECK (canal='whatsapp_business'),
 direcao text NOT NULL CHECK (direcao IN ('entrada','saida')),
 conteudo text NOT NULL,
 ocorrido_em timestamptz NOT NULL,
 registrado_em timestamptz NOT NULL DEFAULT now(),
 registrado_por text NOT NULL DEFAULT 'transcricao_administradora'
   CHECK (registrado_por='transcricao_administradora')
);
CREATE INDEX IF NOT EXISTS idx_iris_importadas_user_tempo
 ON public.iris_mensagens_importadas(user_id, ocorrido_em DESC);
ALTER TABLE public.iris_mensagens_importadas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.iris_mensagens_importadas FROM anon, authenticated;
GRANT ALL ON public.iris_mensagens_importadas TO service_role;
