-- Pausas contratuais SOMA. Limite de 60 dias cumulativos por ciclo do plano.
-- Datas em America/Sao_Paulo. Nenhuma alteração nas cobranças do Mercado Pago.
CREATE TABLE IF NOT EXISTS public.mentoria_pausa_ciclos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plano_id uuid NOT NULL REFERENCES public.planos_mentoria(id),
  vencimento_base date NOT NULL,
  vencimento_atual date NOT NULL,
  dias_utilizados integer NOT NULL DEFAULT 0 CHECK (dias_utilizados BETWEEN 0 AND 60),
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mentoria_pausa_ciclos_usuario_idx
 ON public.mentoria_pausa_ciclos(user_id,criado_em DESC);
ALTER TABLE public.mentoria_pausa_ciclos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mentoria_pausa_ciclos FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.mentoria_pausa_ciclos TO authenticated;
GRANT ALL ON public.mentoria_pausa_ciclos TO service_role;
DROP POLICY IF EXISTS mentoria_pausa_ciclos_select ON public.mentoria_pausa_ciclos;
CREATE POLICY mentoria_pausa_ciclos_select ON public.mentoria_pausa_ciclos
  FOR SELECT TO authenticated USING (user_id=auth.uid());

CREATE TABLE IF NOT EXISTS public.mentoria_pausas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ciclo_id uuid NOT NULL REFERENCES public.mentoria_pausa_ciclos(id),
  termo_id uuid NOT NULL REFERENCES public.termos_versoes(id),
  status text NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa','finalizada')),
  inicio_em date NOT NULL DEFAULT ((now() AT TIME ZONE 'America/Sao_Paulo')::date),
  fim_previsto_em date NOT NULL,
  finalizado_em date,
  dias_solicitados integer NOT NULL CHECK(dias_solicitados BETWEEN 1 AND 60),
  dias_utilizados integer NOT NULL DEFAULT 0 CHECK(dias_utilizados BETWEEN 0 AND 60),
  vencimento_antes date NOT NULL,
  vencimento_depois date,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CHECK (fim_previsto_em = inicio_em + dias_solicitados),
  CHECK ((status='ativa' AND finalizado_em IS NULL AND vencimento_depois IS NULL) OR
         (status='finalizada' AND finalizado_em IS NOT NULL AND vencimento_depois IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS mentoria_pausas_unica_ativa
 ON public.mentoria_pausas(user_id) WHERE status='ativa';
CREATE INDEX IF NOT EXISTS mentoria_pausas_termino_idx
 ON public.mentoria_pausas(fim_previsto_em) WHERE status='ativa';
ALTER TABLE public.mentoria_pausas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mentoria_pausas FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.mentoria_pausas TO authenticated;
GRANT ALL ON public.mentoria_pausas TO service_role;
DROP POLICY IF EXISTS mentoria_pausas_select ON public.mentoria_pausas;
CREATE POLICY mentoria_pausas_select ON public.mentoria_pausas
 FOR SELECT TO authenticated USING(user_id=auth.uid());

-- Notificação com uma única entrega por tipo/canal, reutilizável no cron.
CREATE TABLE IF NOT EXISTS public.mentoria_pausa_avisos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pausa_id uuid NOT NULL REFERENCES public.mentoria_pausas(id) ON DELETE CASCADE,
  canal text NOT NULL CHECK(canal IN ('email','webpush')),
  tipo text NOT NULL CHECK(tipo IN ('inicio','retorno_7d','retorno_1d','retomada')),
  status text NOT NULL DEFAULT 'reservado' CHECK(status IN('reservado','enviado')),
  criado_em timestamptz NOT NULL DEFAULT now(),
  enviado_em timestamptz,
  UNIQUE(pausa_id,canal,tipo)
);
ALTER TABLE public.mentoria_pausa_avisos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mentoria_pausa_avisos FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.mentoria_pausa_avisos TO service_role;

-- Atomic, authenticated request: cannot pause trial, admin, expired or untimed contract.
-- Requires the actual active contractual version 2.1 to be accepted.
CREATE OR REPLACE FUNCTION public.solicitar_pausa_mentoria(
 p_dias integer,p_confirmou boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
 v_user uuid:=auth.uid();
 v_today date:=(now() AT TIME ZONE 'America/Sao_Paulo')::date;
 v_profile public.profiles%ROWTYPE;
 v_term public.termos_versoes%ROWTYPE;
 v_ciclo public.mentoria_pausa_ciclos%ROWTYPE;
 v_pausa public.mentoria_pausas%ROWTYPE;
BEGIN
 IF v_user IS NULL OR p_confirmou IS NOT TRUE
   THEN RAISE EXCEPTION 'Confirme a solicitação de pausa no seu plano'; END IF;
 IF p_dias IS NULL OR p_dias NOT BETWEEN 1 AND 60
   THEN RAISE EXCEPTION 'A pausa deve ter de 1 a 60 dias'; END IF;
 SELECT * INTO v_profile FROM public.profiles WHERE id=v_user FOR UPDATE;
 IF NOT FOUND OR v_profile.is_admin OR v_profile.status_assinatura<>'ativo'
    OR v_profile.plano_id IS NULL
    THEN RAISE EXCEPTION 'A pausa é disponível apenas para planos pagos ativos'; END IF;
 IF v_profile.data_fim_acesso IS NULL THEN
   RAISE EXCEPTION 'O vencimento do seu plano precisa ser confirmado pela equipe antes da pausa'; END IF;
 IF v_profile.data_fim_acesso < v_today
   THEN RAISE EXCEPTION 'Seu plano já venceu; entre em contato com a equipe'; END IF;
 SELECT * INTO v_term FROM public.termos_versoes
   WHERE ativo=true ORDER BY publicado_em DESC LIMIT 1;
 IF NOT FOUND OR v_term.versao NOT IN ('2.1')
   OR NOT EXISTS(SELECT 1 FROM public.termos_aceites
     WHERE user_id=v_user AND termo_id=v_term.id)
   THEN RAISE EXCEPTION 'Você precisa aceitar a versão atualizada do termo de mentoria'; END IF;
 IF EXISTS(SELECT 1 FROM public.mentoria_pausas WHERE user_id=v_user AND status='ativa')
   THEN RAISE EXCEPTION 'Já existe uma pausa ativa neste plano'; END IF;

 SELECT * INTO v_ciclo FROM public.mentoria_pausa_ciclos
  WHERE user_id=v_user AND plano_id=v_profile.plano_id
  ORDER BY criado_em DESC LIMIT 1 FOR UPDATE;
 IF NOT FOUND OR v_ciclo.vencimento_atual<>v_profile.data_fim_acesso THEN
   INSERT INTO public.mentoria_pausa_ciclos(user_id,plano_id,vencimento_base,vencimento_atual)
   VALUES(v_user,v_profile.plano_id,v_profile.data_fim_acesso,v_profile.data_fim_acesso)
   RETURNING * INTO v_ciclo;
 END IF;
 IF v_ciclo.dias_utilizados+p_dias>60 THEN
   RAISE EXCEPTION 'Restam % dias de pausa neste ciclo',greatest(0,60-v_ciclo.dias_utilizados);
 END IF;
 INSERT INTO public.mentoria_pausas (
    user_id,ciclo_id,termo_id,inicio_em,fim_previsto_em,dias_solicitados,vencimento_antes)
 VALUES (v_user,v_ciclo.id,v_term.id,v_today,v_today+p_dias,p_dias,v_profile.data_fim_acesso)
 RETURNING * INTO v_pausa;
 RETURN jsonb_build_object('id',v_pausa.id,'status','ativa','inicio',v_today,
    'fim_previsto',v_pausa.fim_previsto_em,'dias',p_dias,
    'vencimento_original',v_profile.data_fim_acesso,
    'dias_disponiveis',60-v_ciclo.dias_utilizados-p_dias);
END;
$$;
REVOKE ALL ON FUNCTION public.solicitar_pausa_mentoria(integer,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.solicitar_pausa_mentoria(integer,boolean) TO authenticated;

-- Finalize a pause at planned end, or early on authenticated member request.
-- Lock pause and profile; add actual paused days exactly once.
CREATE OR REPLACE FUNCTION public.finalizar_pausa_mentoria(
 p_pausa_id uuid,p_antecipada boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
 v_today date:=(now() AT TIME ZONE 'America/Sao_Paulo')::date;
 v_pausa public.mentoria_pausas%ROWTYPE;
 v_profile public.profiles%ROWTYPE;
 v_dias integer;
 v_fim date;
 v_vencimento date;
BEGIN
 SELECT * INTO v_pausa FROM public.mentoria_pausas
   WHERE id=p_pausa_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Pausa não encontrada'; END IF;
 IF auth.role()<>'service_role' AND
    (auth.uid() IS NULL OR auth.uid()<>v_pausa.user_id) THEN
   RAISE EXCEPTION 'Sem permissão para concluir esta pausa'; END IF;
 IF v_pausa.status='finalizada' THEN
   RETURN jsonb_build_object('id',v_pausa.id,'status','finalizada',
      'dias_utilizados',v_pausa.dias_utilizados,'vencimento',v_pausa.vencimento_depois,
      'ja_finalizada',true);
 END IF;
 IF NOT p_antecipada AND v_pausa.fim_previsto_em>v_today THEN
   RAISE EXCEPTION 'A pausa ainda não terminou'; END IF;
 SELECT * INTO v_profile FROM public.profiles WHERE id=v_pausa.user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Plano não encontrado'; END IF;
 IF v_profile.plano_id IS DISTINCT FROM
   (SELECT plano_id FROM public.mentoria_pausa_ciclos WHERE id=v_pausa.ciclo_id) THEN
   RAISE EXCEPTION 'O plano mudou durante a pausa; precisa de revisão da equipe'; END IF;
 IF v_profile.data_fim_acesso IS NULL THEN
   RAISE EXCEPTION 'Data de vencimento não encontrada; precisa de revisão'; END IF;
 v_fim:=LEAST(v_today,v_pausa.fim_previsto_em);
 v_dias:=GREATEST(0,v_fim-v_pausa.inicio_em);
 v_vencimento:=v_profile.data_fim_acesso+v_dias;
 UPDATE public.profiles SET data_fim_acesso=v_vencimento,
   updated_at=now() WHERE id=v_profile.id;
 UPDATE public.mentoria_pausa_ciclos SET
   vencimento_atual=v_vencimento,
   dias_utilizados=dias_utilizados+v_dias
   WHERE id=v_pausa.ciclo_id;
 UPDATE public.mentoria_pausas SET status='finalizada',
   finalizado_em=v_fim,dias_utilizados=v_dias,
   vencimento_depois=v_vencimento,atualizado_em=now()
   WHERE id=v_pausa.id;
 RETURN jsonb_build_object('id',v_pausa.id,'status','finalizada',
   'dias_utilizados',v_dias,'vencimento',v_vencimento,
   'ja_finalizada',false);
END;
$$;
REVOKE ALL ON FUNCTION public.finalizar_pausa_mentoria(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.finalizar_pausa_mentoria(uuid,boolean) TO authenticated,service_role;

-- A paused member may browse history, but cannot earn new streak rewards.
CREATE OR REPLACE FUNCTION public.registrar_checkin_carreira(
  p_tipo text, p_evidencia text
) RETURNS TABLE(ok boolean, registrado boolean, dia date, pontos integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_user uuid := auth.uid();
  v_dia date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_rows integer := 0;
  v_points integer := 5;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Faça login para registrar seu progresso'; END IF;
  IF p_tipo IS NULL OR p_tipo NOT IN (
    'ingles','curriculo','linkedin','networking','candidatura',
    'entrevista','pdi','aprendizado','reflexao'
  ) OR p_evidencia IS NULL OR char_length(btrim(p_evidencia)) NOT BETWEEN 20 AND 500
  THEN RAISE EXCEPTION 'Informe uma ação real (20 a 500 caracteres)'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id=v_user AND p.is_admin=false
    AND (
      (p.status_assinatura='ativo' AND (p.data_fim_acesso IS NULL OR p.data_fim_acesso>=v_dia))
      OR (p.trial_status='active' AND p.trial_ends_at>now())
    )
  ) OR EXISTS (
    SELECT 1 FROM public.mentoria_pausas
      WHERE user_id=v_user AND status='ativa'
  ) THEN RAISE EXCEPTION 'O check-in fica suspenso durante a pausa da mentoria'; END IF;

  INSERT INTO public.carreira_checkins(user_id,dia,tipo,evidencia)
  VALUES (v_user,v_dia,p_tipo,btrim(p_evidencia))
  ON CONFLICT(user_id,dia) DO NOTHING;
  GET DIAGNOSTICS v_rows=ROW_COUNT;
  IF v_rows=1 THEN
    INSERT INTO public.user_xp(user_id,action,points)
    VALUES(v_user,'carreira_checkin:'||v_dia::text,v_points)
    ON CONFLICT(user_id,action) DO NOTHING;
    UPDATE public.profiles
      SET pontos_total=coalesce(pontos_total,0)+v_points,updated_at=now()
      WHERE id=v_user;
  END IF;
  RETURN QUERY SELECT true,v_rows=1,v_dia,
    CASE WHEN v_rows=1 THEN v_points ELSE 0 END;
END;
$$;
REVOKE ALL ON FUNCTION public.registrar_checkin_carreira(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.registrar_checkin_carreira(text,text) TO authenticated,service_role;
