-- Tabela para feedbacks de sessões enviados por admins/mentores aos mentorados
CREATE TABLE IF NOT EXISTS feedback_sessoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'feedback' CHECK (tipo IN ('feedback', 'nota', 'arquivo')),
  arquivo_url TEXT,
  data TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_feedback_sessoes_user ON feedback_sessoes(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_sessoes_admin ON feedback_sessoes(admin_id);
CREATE INDEX IF NOT EXISTS idx_feedback_sessoes_data ON feedback_sessoes(data DESC);

-- Habilitar RLS
ALTER TABLE feedback_sessoes ENABLE ROW LEVEL SECURITY;

-- Admin pode ver todos os feedbacks que enviou
CREATE POLICY "admin_view_own_feedbacks" ON feedback_sessoes
  FOR SELECT USING (admin_id = auth.uid());

-- Mentorado pode ver feedbacks que recebeu
CREATE POLICY "user_view_received_feedbacks" ON feedback_sessoes
  FOR SELECT USING (user_id = auth.uid());

-- Admin pode criar feedbacks
CREATE POLICY "admin_create_feedback" ON feedback_sessoes
  FOR INSERT WITH CHECK (admin_id = auth.uid());

-- Admin pode editar seus próprios feedbacks
CREATE POLICY "admin_update_own_feedback" ON feedback_sessoes
  FOR UPDATE USING (admin_id = auth.uid());

-- Admin pode deletar seus próprios feedbacks
CREATE POLICY "admin_delete_own_feedback" ON feedback_sessoes
  FOR DELETE USING (admin_id = auth.uid());
