CREATE TABLE IF NOT EXISTS public.entrevistas_iniciais (
 user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
 momento_profissional text NOT NULL CHECK (char_length(momento_profissional) BETWEEN 3 AND 100),
 objetivo_principal text NOT NULL CHECK (char_length(objetivo_principal) BETWEEN 10 AND 1200),
 maior_desafio text NOT NULL CHECK (char_length(maior_desafio) BETWEEN 10 AND 1200),
 prioridade_90_dias text NOT NULL CHECK (char_length(prioridade_90_dias) BETWEEN 10 AND 1200),
 apoio_esperado text NOT NULL CHECK (char_length(apoio_esperado) BETWEEN 3 AND 500),
 comunicacao_preferida text NOT NULL CHECK (comunicacao_preferida IN ('reflexoes','exercicios','oportunidades','misto')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.entrevistas_iniciais ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS entrevistas_iniciais_select_own ON public.entrevistas_iniciais;
CREATE POLICY entrevistas_iniciais_select_own ON public.entrevistas_iniciais FOR SELECT TO authenticated USING (auth.uid()=user_id OR public.is_admin());
DROP POLICY IF EXISTS entrevistas_iniciais_insert_own ON public.entrevistas_iniciais;
CREATE POLICY entrevistas_iniciais_insert_own ON public.entrevistas_iniciais FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
DROP POLICY IF EXISTS entrevistas_iniciais_update_own ON public.entrevistas_iniciais;
CREATE POLICY entrevistas_iniciais_update_own ON public.entrevistas_iniciais FOR UPDATE TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
GRANT SELECT,INSERT,UPDATE ON public.entrevistas_iniciais TO authenticated;
