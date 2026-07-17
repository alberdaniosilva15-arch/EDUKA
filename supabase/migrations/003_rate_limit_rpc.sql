-- A tabela precisa ter PRIMARY KEY ou UNIQUE em user_id.
-- Exemplo:
-- ALTER TABLE public.rate_limits
-- ADD CONSTRAINT rate_limits_user_id_key UNIQUE (user_id);

CREATE OR REPLACE FUNCTION public.increment_rate_limit(
  p_user_id UUID,
  p_cost INTEGER,
  p_window_ms BIGINT
)
RETURNS TABLE (
  allowed BOOLEAN,
  credits_used INTEGER,
  window_start TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_now TIMESTAMPTZ := clock_timestamp();
  v_window_start TIMESTAMPTZ;
  v_current INTEGER;
  v_max_credits CONSTANT INTEGER := 30;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id must not be null'
      USING ERRCODE = '22023';
  END IF;

  IF p_cost IS NULL OR p_cost <= 0 OR p_cost > v_max_credits THEN
    RAISE EXCEPTION 'p_cost must be between 1 and %', v_max_credits
      USING ERRCODE = '22023';
  END IF;

  IF p_window_ms IS NULL OR p_window_ms <= 0 THEN
    RAISE EXCEPTION 'p_window_ms must be greater than zero'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.rate_limits AS rl (
    user_id,
    credits_used,
    window_start
  )
  VALUES (
    p_user_id,
    0,
    v_now
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- O bloqueio permanece até ao fim da transação.
  SELECT rl.credits_used, rl.window_start
  INTO v_current, v_window_start
  FROM public.rate_limits AS rl
  WHERE rl.user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'rate-limit row could not be created';
  END IF;

  IF v_window_start <=
     v_now - (p_window_ms * INTERVAL '1 millisecond') THEN
    v_current := 0;
    v_window_start := v_now;

    UPDATE public.rate_limits AS rl
    SET credits_used = 0,
        window_start = v_window_start
    WHERE rl.user_id = p_user_id;
  END IF;

  IF v_current <= v_max_credits - p_cost THEN
    v_current := v_current + p_cost;

    UPDATE public.rate_limits AS rl
    SET credits_used = v_current
    WHERE rl.user_id = p_user_id;

    RETURN QUERY
    SELECT TRUE, v_current, v_window_start;
  ELSE
    RETURN QUERY
    SELECT FALSE, v_current, v_window_start;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_rate_limit(UUID, INTEGER, BIGINT)
FROM PUBLIC;

REVOKE ALL ON FUNCTION public.increment_rate_limit(UUID, INTEGER, BIGINT)
FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.increment_rate_limit(UUID, INTEGER, BIGINT)
TO service_role;
