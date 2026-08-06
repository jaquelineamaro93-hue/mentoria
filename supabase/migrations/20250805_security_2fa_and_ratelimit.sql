-- Tabela para armazenar configuração de 2FA (TOTP)
CREATE TABLE IF NOT EXISTS user_2fa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL, -- Secret TOTP criptografado
  is_enabled BOOLEAN DEFAULT false,
  backup_codes TEXT[] DEFAULT ARRAY[]::TEXT[], -- Códigos de backup em JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  enabled_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id)
);

-- Tabela para rastrear tentativas de login
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  success BOOLEAN DEFAULT false,
  reason TEXT, -- 'wrong_password', 'user_not_found', 'blocked', etc
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_agent TEXT
);

-- Tabela para bloqueio temporário de IPs/usuários
CREATE TABLE IF NOT EXISTS security_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_type TEXT NOT NULL, -- 'ip' ou 'email'
  block_value TEXT NOT NULL, -- IP ou email
  reason TEXT, -- 'brute_force', 'manual', etc
  attempts_count INT DEFAULT 1,
  blocked_until TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created ON login_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_blocks_value ON security_blocks(block_value);
CREATE INDEX IF NOT EXISTS idx_security_blocks_until ON security_blocks(blocked_until);
CREATE INDEX IF NOT EXISTS idx_user_2fa_user_id ON user_2fa(user_id);

-- Habilitar RLS
ALTER TABLE user_2fa ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- user_2fa: usuários só veem seus próprios dados
CREATE POLICY "Users can view own 2fa settings" ON user_2fa
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own 2fa settings" ON user_2fa
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own 2fa settings" ON user_2fa
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- login_attempts: apenas admin pode ver (log)
CREATE POLICY "Admins can view login attempts" ON login_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Service role can insert login attempts" ON login_attempts
  FOR INSERT WITH CHECK (true);

-- security_blocks: apenas admin
CREATE POLICY "Admins can view security blocks" ON security_blocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Service role can manage blocks" ON security_blocks
  FOR ALL USING (true);
