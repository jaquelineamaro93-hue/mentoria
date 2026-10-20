-- SOMA: ofensiva também reconhece conquistas realizadas no próprio portal.
-- Nunca pontuar visitas, scroll ou mera abertura de página.
-- Um bônus de cinco Impulsos por dia, seja registro manual ou automático.
ALTER TABLE public.carreira_checkins
  ADD COLUMN IF NOT EXISTS origem text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS fonte text,
  ADD COLUMN IF NOT EXISTS referencia_id uuid;
ALTER TABLE public.carreira_checkins
  DROP CONSTRAINT IF EXISTS carreira_checkins_origem_check;
ALTER TABLE public.carreira_checkins
  ADD CONSTRAINT carreira_checkins_origem_check
  CHECK (origem IN ('manual','soma'));

-- Fonte real para auditoria e para evitar ganhar pontos de novo
-- ao marcar/desmarcar a mesma ação do PDI em dias diferentes.
CREATE TABLE IF NOT EXISTS public.carreira_atividades_reconhecidas (
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 fonte text NOT NULL CHECK (fonte IN (
   'diario','pdi_acao','pdi_secao','cv','soar'
 )),
 referencia_id uuid NOT NULL,
 tipo text NOT NULL CHECK(tipo IN (
   'reflexao','pdi','curriculo','aprendizado'
 )),
 dia date NOT NULL,
 registrado_em timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,fonte,referencia_id)
);
CREATE INDEX IF NOT EXISTS carreira_atividades_por_dia
 ON public.carreira_atividades_reconhecidas(user_id,dia DESC);
ALTER TABLE public.carreira_atividades_reconhecidas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.carreira_atividades_reconhecidas FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.carreira_atividades_reconhecidas TO authenticated;
GRANT ALL ON public.carreira_atividades_reconhecidas TO service_role;
DROP POLICY IF EXISTS carreira_atividades_reconhecidas_select ON public.carreira_atividades_reconhecidas;
CREATE POLICY carreira_atividades_reconhecidas_select
 ON public.carreira_atividades_reconhecidas FOR SELECT TO authenticated
 USING (auth.uid()=user_id);

-- Esta rotina é exclusiva dos gatilhos confiáveis de atividade, não da API.
CREATE OR REPLACE FUNCTION public.contabilizar_atividade_ofensiva(
  p_usuario uuid,p_fonte text,p_referencia uuid,p_tipo text,p_descricao text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
 v_dia date:=(now() AT TIME ZONE 'America/Sao_Paulo')::date;
 v_inserida integer:=0;
 v_checkin integer:=0;
 v_bonificacao integer:=0;
BEGIN
 IF p_usuario IS NULL OR p_referencia IS NULL
   OR p_fonte NOT IN ('diario','pdi_acao','pdi_secao','cv','soar')
   OR p_tipo NOT IN ('reflexao','pdi','curriculo','aprendizado')
   OR char_length(btrim(coalesce(p_descricao,''))) NOT BETWEEN 20 AND 500
 THEN RETURN; END IF;

 -- Cliente autenticado só ganha atividade registrada por si.
 IF auth.role()='authenticated' AND auth.uid() IS DISTINCT FROM p_usuario THEN
   RETURN;
 END IF;
 IF NOT EXISTS (
   SELECT 1 FROM public.profiles p
   WHERE p.id=p_usuario AND p.is_admin=false
   AND (
     (p.status_assinatura='ativo' AND
       (p.data_fim_acesso IS NULL OR p.data_fim_acesso>=v_dia))
     OR (p.trial_status='active' AND p.trial_ends_at>now())
   )
 ) OR EXISTS(
   SELECT 1 FROM public.mentoria_pausas
   WHERE user_id=p_usuario AND status='ativa'
 ) THEN RETURN; END IF;

 INSERT INTO public.carreira_atividades_reconhecidas
   (user_id,fonte,referencia_id,tipo,dia)
 VALUES(p_usuario,p_fonte,p_referencia,p_tipo,v_dia)
 ON CONFLICT(user_id,fonte,referencia_id) DO NOTHING;
 GET DIAGNOSTICS v_inserida=ROW_COUNT;
 IF v_inserida=0 THEN RETURN; END IF;

 INSERT INTO public.carreira_checkins
   (user_id,dia,tipo,evidencia,origem,fonte,referencia_id)
 VALUES(p_usuario,v_dia,p_tipo,p_descricao,'soma',p_fonte,p_referencia)
 ON CONFLICT(user_id,dia) DO NOTHING;
 GET DIAGNOSTICS v_checkin=ROW_COUNT;

 IF v_checkin=1 THEN
   INSERT INTO public.user_xp(user_id,action,points)
   VALUES(p_usuario,'carreira_checkin:'||v_dia::text,5)
   ON CONFLICT(user_id,action) DO NOTHING;
   GET DIAGNOSTICS v_bonificacao=ROW_COUNT;
   IF v_bonificacao=1 THEN
     UPDATE public.profiles
       SET pontos_total=coalesce(pontos_total,0)+5,updated_at=now()
       WHERE id=p_usuario;
   END IF;
 END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.contabilizar_atividade_ofensiva(uuid,text,uuid,text,text)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.contabilizar_atividade_ofensiva(uuid,text,uuid,text,text)
  TO service_role;

CREATE OR REPLACE FUNCTION public.trg_ofensiva_diario()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF char_length(btrim(coalesce(NEW.anotacoes,'')))>=20 THEN
   PERFORM public.contabilizar_atividade_ofensiva(
     NEW.user_id,'diario',NEW.id,'reflexao',
     'Você registrou uma reflexão no Diário de Bordo da SOMA.');
 END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_ofensiva_diario ON public.journal_notes;
CREATE TRIGGER trg_ofensiva_diario
 AFTER INSERT ON public.journal_notes FOR EACH ROW
 EXECUTE FUNCTION public.trg_ofensiva_diario();

CREATE OR REPLACE FUNCTION public.trg_ofensiva_pdi_acao()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NEW.concluida IS TRUE AND OLD.concluida IS DISTINCT FROM true THEN
   PERFORM public.contabilizar_atividade_ofensiva(
     NEW.mentorado_id,'pdi_acao',NEW.id,'pdi',
     'Você concluiu uma ação do seu Plano de Desenvolvimento Individual.');
 END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_ofensiva_pdi_acao ON public.pdi_acoes;
CREATE TRIGGER trg_ofensiva_pdi_acao
 AFTER UPDATE OF concluida ON public.pdi_acoes FOR EACH ROW
 EXECUTE FUNCTION public.trg_ofensiva_pdi_acao();

CREATE OR REPLACE FUNCTION public.trg_ofensiva_pdi_secao()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NEW.concluido IS TRUE
   AND (TG_OP='INSERT' OR OLD.concluido IS DISTINCT FROM true)
   AND char_length(btrim(coalesce(NEW.dados->>'texto','')))>=20 THEN
   PERFORM public.contabilizar_atividade_ofensiva(
     NEW.user_id,'pdi_secao',NEW.id,'pdi',
     'Você concluiu uma etapa do seu Plano de Desenvolvimento Individual.');
 END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_ofensiva_pdi_secao ON public.pdi_respostas;
CREATE TRIGGER trg_ofensiva_pdi_secao
 AFTER INSERT OR UPDATE OF concluido ON public.pdi_respostas FOR EACH ROW
 EXECUTE FUNCTION public.trg_ofensiva_pdi_secao();

CREATE OR REPLACE FUNCTION public.trg_ofensiva_cv()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF (char_length(btrim(coalesce(NEW.resultado_markdown,'')))>=20
     OR NEW.resultado_json IS NOT NULL) THEN
   PERFORM public.contabilizar_atividade_ofensiva(
     NEW.user_id,'cv',NEW.id,'curriculo',
     'Você concluiu uma análise de currículo no simulador da SOMA.');
 END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_ofensiva_cv ON public.cv_simulacoes;
CREATE TRIGGER trg_ofensiva_cv
 AFTER INSERT ON public.cv_simulacoes FOR EACH ROW
 EXECUTE FUNCTION public.trg_ofensiva_cv();

CREATE OR REPLACE FUNCTION public.trg_ofensiva_soar()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NEW.analise IS NOT NULL THEN
   PERFORM public.contabilizar_atividade_ofensiva(
     NEW.user_id,'soar',NEW.id,'aprendizado',
     'Você concluiu uma análise SOAR para orientar os próximos passos da carreira.');
 END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_ofensiva_soar ON public.soar_analises;
CREATE TRIGGER trg_ofensiva_soar
 AFTER INSERT ON public.soar_analises FOR EACH ROW
 EXECUTE FUNCTION public.trg_ofensiva_soar();
