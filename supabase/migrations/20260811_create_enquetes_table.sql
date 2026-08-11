CREATE TABLE public.enquetes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_fim TIMESTAMPTZ NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('online', 'presencial')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  horario TEXT,
  local TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_enquetes_tipo_ativo ON public.enquetes(tipo, ativo);
CREATE INDEX idx_enquetes_data_fim ON public.enquetes(data_fim DESC);

ALTER TABLE public.enquetes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_enquetes" ON public.enquetes
  FOR SELECT
  USING (ativo = true);

CREATE POLICY "admin_write_enquetes" ON public.enquetes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "admin_update_enquetes" ON public.enquetes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "admin_delete_enquetes" ON public.enquetes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );
