-- ============================================================================
-- MIGRATION 033: 7-day trial reminder
-- ============================================================================
-- Adds column to track when 7-day trial reminder email was sent.
-- ============================================================================

ALTER TABLE gyms
  ADD COLUMN IF NOT EXISTS trial_reminder_7d_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN gyms.trial_reminder_7d_sent_at IS 'When 7-day trial reminder email was sent';
