-- Tabela para candidaturas de emprego
CREATE TABLE IF NOT EXISTS vagas_candidatura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorado_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa TEXT NOT NULL,
  cargo TEXT NOT NULL,
  etapa TEXT NOT NULL DEFAULT 'para_aplicar',
  -- Valores possíveis: 'para_aplicar', 'aplicada', 'entrevista_agendada',
  -- 'aguardando_retorno', 'entrevista_decisor', 'case', 'oferta', 'lost'
  fit_score INTEGER CHECK (fit_score >= 0 AND fit_score <= 100),
  descricao_vaga TEXT,
  link_vaga TEXT,
  proximo_passo TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_vagas_candidatura_mentorado_id ON vagas_candidatura(mentorado_id);
CREATE INDEX IF NOT EXISTS idx_vagas_candidatura_etapa ON vagas_candidatura(etapa);
CREATE INDEX IF NOT EXISTS idx_vagas_candidatura_fit_score ON vagas_candidatura(fit_score DESC);
CREATE INDEX IF NOT EXISTS idx_vagas_candidatura_created_at ON vagas_candidatura(created_at DESC);

-- Habilitar RLS
ALTER TABLE vagas_candidatura ENABLE ROW LEVEL SECURITY;

-- RLS Policies: mentorado só vê suas próprias vagas
CREATE POLICY "Mentorados can view own candidaturas" ON vagas_candidatura
  FOR SELECT USING (auth.uid() = mentorado_id);

CREATE POLICY "Mentorados can insert own candidaturas" ON vagas_candidatura
  FOR INSERT WITH CHECK (auth.uid() = mentorado_id);

CREATE POLICY "Mentorados can update own candidaturas" ON vagas_candidatura
  FOR UPDATE USING (auth.uid() = mentorado_id);

CREATE POLICY "Mentorados can delete own candidaturas" ON vagas_candidatura
  FOR DELETE USING (auth.uid() = mentorado_id);

-- Service role pode fazer qualquer coisa
CREATE POLICY "Service role can manage candidaturas" ON vagas_candidatura
  FOR ALL USING (true);
