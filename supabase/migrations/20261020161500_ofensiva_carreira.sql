-- Ofensiva da carreira: uma ação intencional por dia, auditável, sem XP por visitas.
CREATE TABLE IF NOT EXISTS public.carreira_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dia date NOT NULL DEFAULT ((now() AT TIME ZONE 'America/Sao_Paulo')::date),
  tipo text NOT NULL CHECK (tipo IN (
    'ingles','curriculo','linkedin','networking','candidatura',
    'entrevista','pdi','aprendizado','reflexao'
  )),
  evidencia text NOT NULL CHECK (char_length(btrim(evidencia)) BETWEEN 20 AND 500),
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id,dia)
);
CREATE INDEX IF NOT EXISTS carreira_checkins_usuario_data
  ON public.carreira_checkins(user_id,dia DESC);
ALTER TABLE public.carreira_checkins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.carreira_checkins FROM anon,authenticated;
GRANT SELECT ON public.carreira_checkins TO authenticated;
GRANT ALL ON public.carreira_checkins TO service_role;
DROP POLICY IF EXISTS carreira_checkins_select_own ON public.carreira_checkins;
CREATE POLICY carreira_checkins_select_own
  ON public.carreira_checkins FOR SELECT TO authenticated
  USING (auth.uid()=user_id);

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
  IF v_user IS NULL THEN RAISE EXCEPTION 'É preciso entrar na SOMA para registrar uma ação'; END IF;
  IF p_tipo IS NULL OR p_tipo NOT IN (
    'ingles','curriculo','linkedin','networking','candidatura',
    'entrevista','pdi','aprendizado','reflexao'
  ) OR p_evidencia IS NULL OR char_length(btrim(p_evidencia)) NOT BETWEEN 20 AND 500
  THEN RAISE EXCEPTION 'Informe a ação e o que realmente fez (20 a 500 caracteres)'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id=v_user AND p.is_admin=false
    AND (
      (p.status_assinatura='ativo' AND (p.data_fim_acesso IS NULL OR p.data_fim_acesso>=v_dia))
      OR (p.trial_status='active' AND p.trial_ends_at>now())
    )
  ) THEN RAISE EXCEPTION 'Check-in disponível para mentorados com acesso ativo'; END IF;

  INSERT INTO public.carreira_checkins (user_id,dia,tipo,evidencia)
  VALUES (v_user,v_dia,p_tipo,btrim(p_evidencia))
  ON CONFLICT (user_id,dia) DO NOTHING;
  GET DIAGNOSTICS v_rows=ROW_COUNT;
  IF v_rows=1 THEN
    INSERT INTO public.user_xp(user_id,action,points)
    VALUES(v_user,'carreira_checkin:'||v_dia::text,v_points)
    ON CONFLICT(user_id,action) DO NOTHING;
    UPDATE public.profiles
      SET pontos_total=coalesce(pontos_total,0)+v_points,updated_at=now()
      WHERE id=v_user;
  END IF;
  RETURN QUERY SELECT true,v_rows=1,v_dia,CASE WHEN v_rows=1 THEN v_points ELSE 0 END;
END;
$$;
REVOKE ALL ON FUNCTION public.registrar_checkin_carreira(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.registrar_checkin_carreira(text,text) TO authenticated,service_role;
