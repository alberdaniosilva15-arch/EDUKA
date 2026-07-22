-- Tabela rate_limits para rate limiting por user_id
-- Substitui o Map em memória que não funciona em serverless

-- Cleanup migration: remove tabela anterior se existir (dados são efêmeros)
DROP TABLE IF EXISTS public.rate_limits;

CREATE TABLE IF NOT EXISTS rate_limits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_used INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: apenas service role pode ler/escrever (API routes usam admin client)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy: service_role tem acesso total (usado pelo admin client nas API routes)
-- Utilizadores normais NÃO devem ver nem alterar rate limits
CREATE POLICY "service_role_full_access" ON rate_limits
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Cleanup automático de entradas expiradas (janelas > 1 hora)
-- Executar periodicamente via cron job no Supabase:
-- SELECT cron.schedule('cleanup_rate_limits', '*/30 * * * *', $$
--   DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '1 hour';
-- $$);
