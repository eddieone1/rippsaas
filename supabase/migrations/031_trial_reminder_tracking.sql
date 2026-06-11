-- ============================================================================
-- MIGRATION 031: Trial reminder tracking
-- ============================================================================
-- Tracks when trial reminder emails were sent to avoid duplicates.
-- ============================================================================

ALTER TABLE gyms
  ADD COLUMN IF NOT EXISTS trial_reminder_3d_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_reminder_1d_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN gyms.trial_reminder_3d_sent_at IS 'When 3-day trial reminder email was sent';
COMMENT ON COLUMN gyms.trial_reminder_1d_sent_at IS 'When 1-day trial reminder email was sent';
