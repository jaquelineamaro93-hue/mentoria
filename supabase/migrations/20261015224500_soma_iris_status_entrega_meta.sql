-- Registre o status real devolvido pela Meta; aceite da API não garante entrega.
ALTER TABLE public.iris_mensagens_enviadas
  ADD COLUMN IF NOT EXISTS status_entrega text NOT NULL DEFAULT 'aceito';
ALTER TABLE public.iris_mensagens_enviadas
  ADD COLUMN IF NOT EXISTS status_atualizado_em timestamptz;
