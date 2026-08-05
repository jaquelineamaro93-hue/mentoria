-- Tabela para armazenar conexões OAuth (Google, LinkedIn)
CREATE TABLE IF NOT EXISTS oauth_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'google', 'linkedin'
  provider_id TEXT NOT NULL, -- ID do usuário no provider
  email TEXT,
  name TEXT,
  picture_url TEXT,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_used TIMESTAMP WITH TIME ZONE,
  UNIQUE(provider, provider_id),
  UNIQUE(user_id, provider)
);

-- Tabela para controle de vagas por plano
CREATE TABLE IF NOT EXISTS plano_vagas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_tipo TEXT NOT NULL UNIQUE, -- 'online', 'presencial', 'premium'
  total_vagas INT NOT NULL DEFAULT 100,
  vagas_disponiveis INT NOT NULL DEFAULT 100,
  vagas_ocupadas INT NOT NULL DEFAULT 0,
  descricao TEXT,
  preco DECIMAL(10, 2),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para rastrear inscrições por vaga
CREATE TABLE IF NOT EXISTS inscricoes_vagas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plano_tipo TEXT NOT NULL REFERENCES plano_vagas(plano_tipo) ON DELETE CASCADE,
  status TEXT DEFAULT 'ativa', -- 'ativa', 'cancelada', 'concluida'
  data_inscricao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_fim TIMESTAMP WITH TIME ZONE,
  cancelada_em TIMESTAMP WITH TIME ZONE,
  motivo_cancelamento TEXT
);

-- Atualizar tabela profiles para adicionar oauth info
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS oauth_provider TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS oauth_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS picture_url TEXT;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_oauth_connections_user_id ON oauth_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_connections_provider ON oauth_connections(provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_vagas_user_id ON inscricoes_vagas(user_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_vagas_plano_tipo ON inscricoes_vagas(plano_tipo);
CREATE INDEX IF NOT EXISTS idx_inscricoes_vagas_status ON inscricoes_vagas(status);

-- Habilitar RLS
ALTER TABLE oauth_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE plano_vagas ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscricoes_vagas ENABLE ROW LEVEL SECURITY;

-- RLS Policies para oauth_connections
CREATE POLICY "Users can view own oauth connections" ON oauth_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own oauth connections" ON oauth_connections
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage oauth" ON oauth_connections
  FOR ALL USING (true);

-- RLS Policies para plano_vagas (todos podem ver)
CREATE POLICY "Anyone can view plano vagas" ON plano_vagas
  FOR SELECT USING (true);

CREATE POLICY "Only admins can update plano vagas" ON plano_vagas
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Service role can manage plano vagas" ON plano_vagas
  FOR ALL USING (true);

-- RLS Policies para inscricoes_vagas
CREATE POLICY "Users can view own inscricoes" ON inscricoes_vagas
  FOR SELECT USING (auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Service role can manage inscricoes" ON inscricoes_vagas
  FOR ALL USING (true);

-- Inserir planos padrão
INSERT INTO plano_vagas (plano_tipo, total_vagas, vagas_disponiveis, preco, descricao)
VALUES
  ('online', 100, 100, 297.00, 'Mentoria Online - Programa de 6 meses'),
  ('presencial', 50, 50, 497.00, 'Mentoria Presencial - Programa de 6 meses'),
  ('premium', 20, 20, 997.00, 'Mentoria Premium - Programa de 6 meses com acompanhamento diário')
ON CONFLICT DO NOTHING;
