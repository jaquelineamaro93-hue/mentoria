-- Sessões de inspeção temporárias, reversíveis e auditáveis.
-- Nunca armazena credenciais de admin ou tokens de recuperação legíveis.
CREATE TABLE IF NOT EXISTS public.admin_inspecoes_sessoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  usuario_alvo_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE CHECK (length(token_hash)=64),
  criado_em timestamptz NOT NULL DEFAULT now(),
  expira_em timestamptz NOT NULL,
  encerrado_em timestamptz,
  CONSTRAINT admin_inspecao_distinct_users CHECK(admin_id<>usuario_alvo_id)
);
CREATE INDEX IF NOT EXISTS admin_inspecoes_target_active_idx
ON public.admin_inspecoes_sessoes (usuario_alvo_id,expira_em)
WHERE encerrado_em IS NULL;

ALTER TABLE public.admin_inspecoes_sessoes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.admin_inspecoes_sessoes FROM anon, authenticated;
GRANT ALL ON TABLE public.admin_inspecoes_sessoes TO service_role;
