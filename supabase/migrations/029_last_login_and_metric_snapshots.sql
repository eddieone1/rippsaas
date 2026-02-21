-- ============================================================================
-- MIGRATION 029: Last Login & Metric Snapshots for Dashboard Deltas
-- ============================================================================
-- Adds last_login_at to users for greeting/deltas.
-- Adds user_metric_snapshots to store metric baseline at login for % change.
-- ============================================================================

-- 1) Add last_login_at to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

COMMENT ON COLUMN users.last_login_at IS 'When the user last signed in (updated on login)';

-- 2) Create user_metric_snapshots for stat card deltas
CREATE TABLE IF NOT EXISTS user_metric_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  at_risk_count INTEGER NOT NULL DEFAULT 0,
  avg_commitment_score INTEGER NOT NULL DEFAULT 0,
  revenue_at_risk INTEGER NOT NULL DEFAULT 0,
  revenue_saved INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_metric_snapshots_user_id ON user_metric_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_user_metric_snapshots_created_at ON user_metric_snapshots(user_id, created_at DESC);

ALTER TABLE user_metric_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own metric snapshots" ON user_metric_snapshots;
CREATE POLICY "Users can view own metric snapshots"
  ON user_metric_snapshots FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own metric snapshots" ON user_metric_snapshots;
CREATE POLICY "Users can insert own metric snapshots"
  ON user_metric_snapshots FOR INSERT
  WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE user_metric_snapshots IS 'Stores dashboard metric baseline at login for stat card % change display';
