-- Tabela para feedbacks entre colegas (peer feedback)
CREATE TABLE IF NOT EXISTS peer_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  de_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  para_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mensagem TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance nas queries comuns
CREATE INDEX IF NOT EXISTS idx_peer_feedbacks_de_user ON peer_feedbacks(de_user_id);
CREATE INDEX IF NOT EXISTS idx_peer_feedbacks_para_user ON peer_feedbacks(para_user_id);
CREATE INDEX IF NOT EXISTS idx_peer_feedbacks_created ON peer_feedbacks(created_at DESC);

-- Habilitar RLS
ALTER TABLE peer_feedbacks ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança:
-- 1. Usuário pode ver feedbacks que RECEBEU (para_user_id = auth.uid())
CREATE POLICY "user_can_view_received_feedbacks" ON peer_feedbacks
  FOR SELECT USING (para_user_id = auth.uid());

-- 2. Usuário pode ver feedbacks que ENVIOU (de_user_id = auth.uid())
CREATE POLICY "user_can_view_sent_feedbacks" ON peer_feedbacks
  FOR SELECT USING (de_user_id = auth.uid());

-- 3. Admin pode ver todos
CREATE POLICY "admin_can_view_all_feedbacks" ON peer_feedbacks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- 4. Usuário pode enviar feedback (inserir com de_user_id = auth.uid())
CREATE POLICY "user_can_create_feedback" ON peer_feedbacks
  FOR INSERT WITH CHECK (de_user_id = auth.uid());

-- 5. Admin pode criar feedback em nome de qualquer um
CREATE POLICY "admin_can_create_any_feedback" ON peer_feedbacks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );
