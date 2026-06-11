-- ============================================================================
-- MIGRATION 032: Promo codes for trial extension
-- ============================================================================
-- Stores promo codes that can extend a gym's free trial.
-- ============================================================================

CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  extension_days INTEGER NOT NULL DEFAULT 14,
  max_uses INTEGER,
  times_used INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- Track which gyms used which promo (one use per gym per code)
CREATE TABLE IF NOT EXISTS promo_code_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(promo_code_id, gym_id)
);

CREATE INDEX IF NOT EXISTS idx_promo_redemptions_gym ON promo_code_redemptions(gym_id);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_redemptions ENABLE ROW LEVEL SECURITY;

-- No policies: only service role (admin) can access; API uses admin client
COMMENT ON TABLE promo_codes IS 'Promo codes for extending free trials';
COMMENT ON TABLE promo_code_redemptions IS 'Tracks promo code redemptions per gym';

-- Example promo code: EXTEND14 extends trial by 14 days (add more via Supabase dashboard)
INSERT INTO promo_codes (code, extension_days, max_uses)
VALUES ('EXTEND14', 14, 100)
ON CONFLICT (code) DO NOTHING;
