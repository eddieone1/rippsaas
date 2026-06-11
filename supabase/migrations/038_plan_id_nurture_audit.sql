-- MIGRATION 038: Plan IDs, audit lead capture, subscription nurture tracking
-- Replaces trial-reminder columns usage with audit/subscribe nurture flows.

ALTER TABLE gyms
  ADD COLUMN IF NOT EXISTS plan_id TEXT
    CHECK (plan_id IS NULL OR plan_id IN ('free_audit', 'starter_49', 'growth_79'));

ALTER TABLE gyms
  ADD COLUMN IF NOT EXISTS nurture_subscribe_3d_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS nurture_subscribe_7d_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN gyms.plan_id IS 'Internal plan: free_audit (lead), starter_49, growth_79';
COMMENT ON COLUMN gyms.nurture_subscribe_3d_sent_at IS 'When 3-day post-onboarding subscribe nudge was sent';
COMMENT ON COLUMN gyms.nurture_subscribe_7d_sent_at IS 'When 7-day post-onboarding subscribe nudge was sent';

CREATE TABLE IF NOT EXISTS audit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  active_members TEXT NOT NULL,
  gym_software TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  nurture_day1_sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS audit_requests_created_at_idx ON audit_requests (created_at);
CREATE INDEX IF NOT EXISTS audit_requests_email_idx ON audit_requests (email);

COMMENT ON TABLE audit_requests IS 'Free Retention Audit lead capture — not a subscription';
COMMENT ON COLUMN audit_requests.nurture_day1_sent_at IS 'When day-1 audit follow-up email was sent';
