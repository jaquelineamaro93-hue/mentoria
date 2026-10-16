-- TopSend is an automation webhook trigger, not the Meta Cloud API.
-- Record requests as TRIGGERED, never as delivered/sent until confirmation.
CREATE TABLE IF NOT EXISTS public.topsend_despachos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  turno_id uuid NOT NULL UNIQUE REFERENCES public.iris_turnos(id) ON DELETE CASCADE,
  referencia text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'reservado'
    CHECK (status IN ('reservado','acionado','incerto','cancelado')),
  mensagem text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  acionado_em timestamptz,
  observacao text,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS topsend_despachos_user_id_idx
 ON public.topsend_despachos(user_id,criado_em DESC);

CREATE TABLE IF NOT EXISTS public.topsend_eventos_recebidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  id_evento text NOT NULL UNIQUE,
  telefone text NOT NULL,
  tipo text NOT NULL DEFAULT 'texto',
  conteudo text NOT NULL,
  recebido_em timestamptz NOT NULL,
  registrado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS topsend_eventos_recebidos_user_idx
 ON public.topsend_eventos_recebidos(user_id, recebido_em DESC);
ALTER TABLE public.topsend_despachos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topsend_eventos_recebidos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.topsend_despachos, public.topsend_eventos_recebidos
 FROM anon,authenticated;
GRANT ALL ON public.topsend_despachos, public.topsend_eventos_recebidos TO service_role;

-- The automation trigger acknowledges receiving the request, NOT message delivery.
ALTER TABLE public.iris_turnos DROP CONSTRAINT IF EXISTS iris_turnos_status_check;
ALTER TABLE public.iris_turnos
 ADD CONSTRAINT iris_turnos_status_check CHECK (
 status IN ('fila','aguardando_agente','pronto','enviando','enviado',
            'disparado','revisao','erro','cancelado'));
