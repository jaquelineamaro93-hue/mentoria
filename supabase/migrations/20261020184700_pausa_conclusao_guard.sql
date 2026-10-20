-- Harden identity check even if the request is missing auth.role().
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
 IF coalesce(auth.role(),'')<>'service_role' AND
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
 IF v_profile.status_assinatura <> 'ativo' THEN
   RAISE EXCEPTION 'O plano não está ativo. O retorno precisa de revisão da equipe'; END IF;
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

