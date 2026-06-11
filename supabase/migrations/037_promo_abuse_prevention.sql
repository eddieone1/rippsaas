-- ============================================================================
-- MIGRATION 037: Promo code abuse prevention
-- ============================================================================
-- Tracks failed promo attempts for rate limiting. Enforces max extensions per gym
-- via API logic (no schema change needed for that).
-- ============================================================================

-- Track failed promo code attempts for rate limiting (max 5 failures per 15 min per user)
CREATE TABLE IF NOT EXISTS promo_code_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  success BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_promo_attempts_user_time 
  ON promo_code_attempts(user_id, attempted_at DESC);

ALTER TABLE promo_code_attempts ENABLE ROW LEVEL SECURITY;

-- Only service role can access (API uses admin client)
COMMENT ON TABLE promo_code_attempts IS 'Tracks promo code attempts for rate limiting abuse prevention';
