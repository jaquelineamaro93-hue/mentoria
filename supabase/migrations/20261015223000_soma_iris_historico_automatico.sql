-- Conversas da Íris SOMA. Não altera nem exclui respostas ou acompanhamentos anteriores.
-- Consentimento separado e explícito para uso de IA externa sobre mensagens de mentoria.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS iris_ia_consentimento_em timestamptz;
GRANT UPDATE (iris_ia_consentimento_em) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.proteger_consentimento_iris()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.whatsapp_numero IS DISTINCT FROM OLD.whatsapp_numero OR
     NEW.whatsapp_numero IS NULL OR NEW.whatsapp_consentimento_em IS NULL THEN
    NEW.iris_ia_consentimento_em := NULL;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_zz_proteger_consentimento_iris ON public.profiles;
CREATE TRIGGER trg_zz_proteger_consentimento_iris
BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.proteger_consentimento_iris();

CREATE TABLE IF NOT EXISTS public.iris_estado (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  pausado boolean NOT NULL DEFAULT false,
  objetivo_atual text,
  insight_atual text,
  proximo_passo text,
  ultima_interacao_em timestamptz,
  ultimo_envio_em timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.iris_turnos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  origem_id text NOT NULL UNIQUE,
  origem_tipo text NOT NULL DEFAULT 'whatsapp' CHECK (origem_tipo IN ('whatsapp', 'semanal')),
  status text NOT NULL DEFAULT 'fila' CHECK (status IN
     ('fila','aguardando_agente','pronto','enviando','enviado','revisao','erro','cancelado')),
  manus_task_id text,
  manus_marcador text,
  manus_enviado_em timestamptz,
  resposta_gerada text,
  insight text,
  proximo_passo text,
  meta_message_id text UNIQUE,
  tentativas integer NOT NULL DEFAULT 0,
  erro_resumido text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_iris_turnos_pendentes ON public.iris_turnos(status,criado_em);
CREATE INDEX IF NOT EXISTS idx_iris_turnos_por_usuario ON public.iris_turnos(user_id,criado_em DESC);

CREATE TABLE IF NOT EXISTS public.iris_mensagens_enviadas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  turno_id uuid REFERENCES public.iris_turnos(id) ON DELETE SET NULL,
  meta_message_id text NOT NULL UNIQUE,
  conteudo text NOT NULL,
  tipo text NOT NULL DEFAULT 'texto' CHECK (tipo IN ('texto','template')),
  enviado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_iris_enviadas_usuario ON public.iris_mensagens_enviadas(user_id,enviado_em DESC);

CREATE TABLE IF NOT EXISTS public.iris_proximos_passos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  turno_id uuid REFERENCES public.iris_turnos(id) ON DELETE SET NULL,
  insight text,
  acao text NOT NULL,
  situacao text NOT NULL DEFAULT 'proposto' CHECK (situacao IN ('proposto','em_andamento','concluido','cancelado')),
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_iris_passos_usuario ON public.iris_proximos_passos(user_id,criado_em DESC);

ALTER TABLE public.iris_estado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iris_turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iris_mensagens_enviadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iris_proximos_passos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.iris_estado, public.iris_turnos, public.iris_mensagens_enviadas,
  public.iris_proximos_passos FROM anon, authenticated;
GRANT ALL ON public.iris_estado, public.iris_turnos, public.iris_mensagens_enviadas,
  public.iris_proximos_passos TO service_role;

-- Uma única conversa Manus em andamento por vez, pois a Íris da Cue usa uma
-- thread persistente compartilhada. Transações concorrentes não criam jobs duplicados.
CREATE OR REPLACE FUNCTION public.iris_reivindicar_turno()
RETURNS SETOF public.iris_turnos
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT pg_try_advisory_xact_lock(624237130) THEN RETURN; END IF;
  IF EXISTS (
    SELECT 1 FROM public.iris_turnos
    WHERE status IN ('aguardando_agente','pronto','enviando')
  ) THEN RETURN; END IF;
  RETURN QUERY
  WITH candidato AS (
    SELECT t.id FROM public.iris_turnos t WHERE t.status = 'fila'
    ORDER BY t.criado_em ASC FOR UPDATE SKIP LOCKED LIMIT 1
  )
  UPDATE public.iris_turnos t
  SET status='aguardando_agente', tentativas=t.tentativas+1, atualizado_em=now()
  FROM candidato c WHERE t.id=c.id RETURNING t.*;
END; $$;
REVOKE ALL ON FUNCTION public.iris_reivindicar_turno() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.iris_reivindicar_turno() TO service_role;
