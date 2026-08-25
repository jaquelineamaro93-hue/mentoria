-- Create table for "Primeiros 90 Dias" module responses
CREATE TABLE IF NOT EXISTS primeiros_90_dias_respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  situacao_stars TEXT DEFAULT 'realinhamento',
  respostas_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_stars CHECK (situacao_stars IS NULL OR situacao_stars IN ('startup', 'turnaround', 'realinhamento', 'sustentacao'))
);

-- Enable Row Level Security
ALTER TABLE primeiros_90_dias_respostas ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read/write their own data
CREATE POLICY "Users can read own data" ON primeiros_90_dias_respostas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON primeiros_90_dias_respostas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON primeiros_90_dias_respostas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create index for fast lookups
CREATE INDEX idx_primeiros_90_user_id ON primeiros_90_dias_respostas(user_id);
CREATE INDEX idx_primeiros_90_updated_at ON primeiros_90_dias_respostas(updated_at DESC);
