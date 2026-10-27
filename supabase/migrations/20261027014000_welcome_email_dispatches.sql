-- Disparo de boas-vindas para uma conta confirmada, uma única vez.
-- Tabela só acessível pelo serviço da SOMA no servidor.
CREATE TABLE IF NOT EXISTS public.welcome_email_dispatches (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved','sent','failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
ALTER TABLE public.welcome_email_dispatches ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.welcome_email_dispatches FROM anon, authenticated;
COMMENT ON TABLE public.welcome_email_dispatches IS 'Registro de boas-vindas transacionais SOMA, somente service_role. Status reservado impede duplicidade mesmo em erro incerto de rede.';