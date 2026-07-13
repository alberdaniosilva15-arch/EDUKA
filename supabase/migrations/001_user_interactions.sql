-- ============================================
-- Eduka — Supabase Migration: user_interactions
-- Criado: 2026-07-12
-- ============================================

-- Tabela para tracking de interacoes do utilizador
-- Usada por learning-system.js para personalizar respostas da IA

CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('generate', 'improve', 'explain', 'slides', 'estudo', 'chat', 'pdf')),
  topic TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para buscas rapidas por user_id + data
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_created_at ON user_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_created ON user_interactions(user_id, created_at DESC);

-- RLS: utilizadores so veem as proprias interacoes
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own interactions"
  ON user_interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interactions"
  ON user_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role (admin client) pode fazer tudo
CREATE POLICY "Service role full access"
  ON user_interactions FOR ALL
  USING (auth.role() = 'service_role');
