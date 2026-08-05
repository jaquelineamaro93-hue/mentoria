CREATE TABLE IF NOT EXISTS vaga_readiness_roadmap (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaga_id UUID NOT NULL REFERENCES vagas_candidatura(id) ON DELETE CASCADE,
  mentorado_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  readiness_score INTEGER CHECK (readiness_score >= 0 AND readiness_score <= 100),
  readiness_gap INTEGER CHECK (readiness_gap >= 0 AND readiness_gap <= 100),
  roadmap_items JSONB,
  weeks_to_ready INTEGER,
  estimated_readiness_date DATE,
  progress_percentage INTEGER DEFAULT 0,
  items_completed INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS readiness_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID NOT NULL REFERENCES vaga_readiness_roadmap(id) ON DELETE CASCADE,
  item_index INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(roadmap_id, item_index)
);

CREATE INDEX IF NOT EXISTS idx_vaga_readiness_roadmap_vaga_id ON vaga_readiness_roadmap(vaga_id);
CREATE INDEX IF NOT EXISTS idx_vaga_readiness_roadmap_mentorado_id ON vaga_readiness_roadmap(mentorado_id);
CREATE INDEX IF NOT EXISTS idx_readiness_progress_roadmap_id ON readiness_progress(roadmap_id);

ALTER TABLE vaga_readiness_roadmap ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentorados can view own readiness roadmap" ON vaga_readiness_roadmap
  FOR SELECT USING (auth.uid() = mentorado_id);

CREATE POLICY "Mentorados can insert own readiness roadmap" ON vaga_readiness_roadmap
  FOR INSERT WITH CHECK (auth.uid() = mentorado_id);

CREATE POLICY "Mentorados can update own readiness roadmap" ON vaga_readiness_roadmap
  FOR UPDATE USING (auth.uid() = mentorado_id);

CREATE POLICY "Service role can manage readiness roadmap" ON vaga_readiness_roadmap
  FOR ALL USING (true);

CREATE POLICY "Mentorados can view own progress" ON readiness_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vaga_readiness_roadmap
      WHERE id = readiness_progress.roadmap_id
      AND auth.uid() = mentorado_id
    )
  );

CREATE POLICY "Mentorados can manage own progress" ON readiness_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vaga_readiness_roadmap
      WHERE id = readiness_progress.roadmap_id
      AND auth.uid() = mentorado_id
    )
  );

CREATE POLICY "Service role can manage progress" ON readiness_progress
  FOR ALL USING (true);
