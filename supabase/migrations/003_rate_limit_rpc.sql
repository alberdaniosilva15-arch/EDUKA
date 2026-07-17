-- Funcao RPC atomica para rate limiting
-- Faz read + check + update numa unica transacao, eliminando race conditions
-- Executar esta migration no Supabase antes de deployar a nova api-helpers.js

CREATE OR REPLACE FUNCTION increment_rate_limit(
  p_user_id UUID,
  p_cost INTEGER,
  p_window_ms BIGINT
) RETURNS TABLE(allowed BOOLEAN, credits_used INTEGER, window_start TIMESTAMPTZ)
LANGUAGE plpgsql
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_window_start TIMESTAMPTZ;
  v_current INTEGER;
  v_max_credits INTEGER := 30;
BEGIN
  -- Buscar entrada actual (ou criar se nao existe)
  INSERT INTO rate_limits (user_id, credits_used, window_start)
  VALUES (p_user_id, 0, v_now)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT r.credits_used, r.window_start
  INTO v_current, v_window_start
  FROM rate_limits r WHERE r.user_id = p_user_id;

  -- Reset se janela expirou
  IF v_window_start < v_now - (p_window_ms || ' milliseconds')::INTERVAL THEN
    UPDATE rate_limits SET credits_used = 0, window_start = v_now
    WHERE user_id = p_user_id;
    v_current := 0;
    v_window_start := v_now;
  END IF;

  -- Verificar e incrementar atomicamente
  IF v_current + p_cost <= v_max_credits THEN
    UPDATE rate_limits SET credits_used = credits_used + p_cost
    WHERE user_id = p_user_id;
    RETURN QUERY SELECT TRUE, v_current + p_cost, v_window_start;
  ELSE
    RETURN QUERY SELECT FALSE, v_current, v_window_start;
  END IF;
END;
$$;
