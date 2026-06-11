-- ============================================================================
-- MIGRATION 030: Onboarding completion tracking
-- ============================================================================
-- Adds onboarding_completed_at to users. Set when user completes the payment
-- step (Start trial). Ensures consistent onboarding flow: welcome → gym-info
-- → payment → upload → dashboard.
-- ============================================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN users.onboarding_completed_at IS 'When the user completed onboarding (clicked Start trial). Used to enforce step order.';
