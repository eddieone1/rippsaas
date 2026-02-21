-- ============================================================================
-- MIGRATION 026: Auto-Interventions Toggle
-- ============================================================================
-- Adds a toggle for gyms to enable/disable automated interventions.
-- When enabled, the daily cron job runs the intervention engine.
-- All cron-generated interventions require manual approval before sending.
-- ============================================================================

ALTER TABLE gyms
  ADD COLUMN IF NOT EXISTS auto_interventions_enabled BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN gyms.auto_interventions_enabled IS 'When true, the daily cron job generates interventions for at-risk members. All auto-generated interventions require manual approval.';
