-- ============================================================================
-- MIGRATION 035: Add date_of_birth and distance_from_gym_km to members
-- ============================================================================
-- Used by: CSV upload, birthday filter, dashboard inbox, churn risk, member list
-- ============================================================================

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS distance_from_gym_km NUMERIC;

COMMENT ON COLUMN members.date_of_birth IS 'Member date of birth (YYYY-MM-DD)';
COMMENT ON COLUMN members.distance_from_gym_km IS 'Distance from gym in km (calculated from address)';
