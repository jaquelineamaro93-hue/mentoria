-- Permite testar a Ofensiva em contas administrativas com plano válido.
-- Contas administrativas continuam excluídas do ranking público.
-- A pausa continua bloqueando o registro, mas com mensagem correta.
CREATE OR REPLACE FUNCTION public.registrar_checkin_carreira(p_tipo text, p_evidencia text)
RETURNS TABLE(ok boolean, registrado boolean, dia date, pontos integer)
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
    SELECT 1 FROM public.profiles p WHERE p.id=v_user
      AND (
        (p.status_assinatura='ativo' AND (p.data_fim_acesso IS NULL OR p.data_fim_acesso>=v_dia))
        OR (p.trial_status='active' AND p.trial_ends_at>now())
      )
  ) THEN RAISE EXCEPTION 'É necessário ter acesso ativo à mentoria para registrar atividades'; END IF;

  IF EXISTS (
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
