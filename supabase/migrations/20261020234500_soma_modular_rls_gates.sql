-- Segurança em profundidade: além do proxy Next, as tabelas de conteúdo
-- só podem ser consultadas/mutadas via JWT autenticado com entitlement.
-- Políticas RESTRICTIVE combinam com as políticas atuais de propriedade.
-- Como enforce_access=false por padrão, usuários atuais não perdem acesso.

CREATE OR REPLACE FUNCTION public.soma_has_mentorship_entitlement()
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_user uuid:=auth.uid();v_p public.profiles%rowtype;
 v_today date:=(now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
 IF v_user IS NULL THEN RETURN false; END IF;
 SELECT * INTO v_p FROM public.profiles WHERE id=v_user;
 IF NOT FOUND THEN RETURN false; END IF;
 IF v_p.is_admin THEN RETURN true; END IF;
 IF EXISTS(SELECT 1 FROM public.mentoria_pausas p WHERE p.user_id=v_user AND p.status='ativa')
   THEN RETURN false; END IF;
 IF v_p.trial_status='active' AND v_p.trial_ends_at>now()
   THEN RETURN true; END IF;
 RETURN v_p.plano_id IS NOT NULL AND v_p.status_assinatura='ativo'
  AND (v_p.data_fim_acesso IS NULL OR v_p.data_fim_acesso>=v_today);
END; $$;
REVOKE ALL ON FUNCTION public.soma_has_mentorship_entitlement() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.soma_has_mentorship_entitlement() TO authenticated;

DO $$
DECLARE entry text[];
BEGIN
 FOR entry IN SELECT ARRAY[v.tablename,v.slug] FROM (VALUES
  ('quem_sou_eu_respostas','autoconhecimento'),
  ('mapa_essencia','autoconhecimento'),
  ('bussola_posicionamento','autoconhecimento'),
  ('diagnostics','diagnostico'),
  ('via_resultados','diagnostico'),
  ('cv_simulacoes','curriculo-ats'),
  ('soar_analises','entrevistas'),
  ('pdi_respostas','desenvolvimento'),
  ('vagas_candidatura','vagas')
 ) AS v(tablename,slug)
 LOOP
  IF to_regclass('public.'||quote_ident(entry[1])) IS NOT NULL THEN
   EXECUTE format(
    'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING(public.soma_has_module(%L)) WITH CHECK(public.soma_has_module(%L))',
    'soma_module_gate_'||entry[1],entry[1],entry[2],entry[2]);
  END IF;
 END LOOP;
END $$;

-- Gravações das mentorias em grupo contêm conteúdo exclusivo e não devem
-- ficar visíveis a quem comprou somente uma ferramenta.
CREATE POLICY soma_recordings_mentorship_only ON public.recordings
 AS RESTRICTIVE FOR SELECT TO authenticated
 USING(public.soma_has_mentorship_entitlement());

-- Atenção: novos módulos futuros precisam de mapeamento explícito em
-- lib/modules/routes.ts, suas APIs e quaisquer políticas de storage/RLS.
