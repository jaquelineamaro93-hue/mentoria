-- Respostas recebidas pela Cloud API. Sem acesso direto de usuários autenticados.
CREATE TABLE IF NOT EXISTS public.whatsapp_respostas_mentoria (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 meta_message_id text NOT NULL UNIQUE,
 phone_number_id text NOT NULL,
 tipo text NOT NULL,
 conteudo text NOT NULL,
 recebido_em timestamptz NOT NULL DEFAULT now(),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS whatsapp_respostas_mentoria_user_idx ON public.whatsapp_respostas_mentoria(user_id,recebido_em DESC);
ALTER TABLE public.whatsapp_respostas_mentoria ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.whatsapp_respostas_mentoria FROM anon,authenticated;
