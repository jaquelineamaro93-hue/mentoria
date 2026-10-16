-- A automação TopSend recebe um POST com variáveis mapeadas no painel.
-- HTTP 2xx = webhook aceito; NÃO significa envio ou entrega no WhatsApp.
ALTER TABLE public.iris_turnos DROP CONSTRAINT IF EXISTS iris_turnos_status_check;
ALTER TABLE public.iris_turnos ADD CONSTRAINT iris_turnos_status_check
CHECK (status IN ('fila','aguardando_agente','pronto','enviando','enviado',
  'revisao','erro','cancelado','acionado_topsend'));

CREATE TABLE IF NOT EXISTS public.iris_topsend_disparos (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 turno_id uuid NOT NULL UNIQUE REFERENCES public.iris_turnos(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 referencia text NOT NULL UNIQUE,
 mensagem text NOT NULL,
 situacao text NOT NULL DEFAULT 'reservado' CHECK
 (situacao IN ('reservado','webhook_aceito','envio_confirmado','entregue','lido',
  'incerto','rejeitado')),
 provider_message_id text UNIQUE,
 criado_em timestamptz NOT NULL DEFAULT now(),
 acionado_em timestamptz,
 confirmado_em timestamptz,
 atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS iris_topsend_disparos_usuario_em
 ON public.iris_topsend_disparos(user_id,criado_em DESC);
ALTER TABLE public.iris_topsend_disparos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.iris_topsend_disparos FROM anon, authenticated;
GRANT ALL ON public.iris_topsend_disparos TO service_role;
