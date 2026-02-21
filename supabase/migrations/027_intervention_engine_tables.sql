-- ============================================================================
-- MIGRATION 027: Intervention Engine Tables
-- ============================================================================
-- Creates tables for the automated intervention / play-based messaging system.
-- These tables are prefixed with "intervention_" to avoid conflicts.
-- ============================================================================

-- Tenants for the intervention engine (maps to gyms)
CREATE TABLE IF NOT EXISTS intervention_tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Europe/London',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Members tracked by the intervention engine
CREATE TABLE IF NOT EXISTS intervention_members (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES intervention_tenants(id) ON DELETE CASCADE,
  external_id TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  consent_email BOOLEAN NOT NULL DEFAULT true,
  consent_sms BOOLEAN NOT NULL DEFAULT true,
  consent_whatsapp BOOLEAN NOT NULL DEFAULT false,
  do_not_contact BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intervention_members_tenant ON intervention_members(tenant_id);

-- Risk snapshots
CREATE TABLE IF NOT EXISTS intervention_risk_snapshots (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES intervention_tenants(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES intervention_members(id) ON DELETE CASCADE,
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  primary_risk_reason TEXT,
  computed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intervention_risk_snapshots_tenant_computed ON intervention_risk_snapshots(tenant_id, computed_at);
CREATE INDEX IF NOT EXISTS idx_intervention_risk_snapshots_member ON intervention_risk_snapshots(member_id);

-- Custom type for trigger
DO $$ BEGIN
  CREATE TYPE intervention_trigger_type AS ENUM ('DAILY_BATCH', 'EVENT_WEBHOOK');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Custom type for channel
DO $$ BEGIN
  CREATE TYPE intervention_channel AS ENUM ('EMAIL', 'SMS', 'WHATSAPP');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Custom type for intervention status
DO $$ BEGIN
  CREATE TYPE intervention_status AS ENUM ('CANDIDATE', 'PENDING_APPROVAL', 'SCHEDULED', 'SENT', 'DELIVERED', 'FAILED', 'CANCELED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Custom type for message event type
DO $$ BEGIN
  CREATE TYPE intervention_message_event_type AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'REPLIED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Custom type for outcome type
DO $$ BEGIN
  CREATE TYPE intervention_outcome_type AS ENUM ('CONTACTED', 'REPLIED', 'BOOKED', 'RETURNED', 'PAYMENT_RESOLVED', 'FROZEN', 'CANCELLED', 'SAVED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Plays (retention playbooks / automated message templates)
CREATE TABLE IF NOT EXISTS intervention_plays (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES intervention_tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  trigger_type intervention_trigger_type NOT NULL,
  min_risk_score INTEGER NOT NULL,
  channels intervention_channel[] NOT NULL DEFAULT '{}',
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_start TEXT NOT NULL DEFAULT '21:00',
  quiet_hours_end TEXT NOT NULL DEFAULT '08:00',
  max_messages_per_member_per_week INTEGER NOT NULL DEFAULT 2,
  cooldown_days INTEGER NOT NULL DEFAULT 3,
  template_subject TEXT,
  template_body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intervention_plays_tenant ON intervention_plays(tenant_id);
CREATE INDEX IF NOT EXISTS idx_intervention_plays_active ON intervention_plays(tenant_id, is_active, trigger_type);

-- Interventions (individual sends)
CREATE TABLE IF NOT EXISTS intervention_interventions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES intervention_tenants(id) ON DELETE CASCADE,
  play_id TEXT NOT NULL REFERENCES intervention_plays(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES intervention_members(id) ON DELETE CASCADE,
  status intervention_status NOT NULL DEFAULT 'CANDIDATE',
  channel intervention_channel NOT NULL,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  provider_message_id TEXT,
  reason TEXT,
  rendered_subject TEXT,
  rendered_body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intervention_interventions_tenant_status ON intervention_interventions(tenant_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_intervention_interventions_play_member ON intervention_interventions(play_id, member_id);

-- Message events (delivery tracking)
CREATE TABLE IF NOT EXISTS intervention_message_events (
  id TEXT PRIMARY KEY,
  intervention_id TEXT NOT NULL REFERENCES intervention_interventions(id) ON DELETE CASCADE,
  type intervention_message_event_type NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intervention_message_events_intervention ON intervention_message_events(intervention_id, created_at);

-- Outcomes
CREATE TABLE IF NOT EXISTS intervention_outcomes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES intervention_tenants(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES intervention_members(id) ON DELETE CASCADE,
  type intervention_outcome_type NOT NULL,
  notes TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intervention_outcomes_tenant ON intervention_outcomes(tenant_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_intervention_outcomes_member ON intervention_outcomes(member_id);

-- RLS policies (service role bypasses these, but enable for safety)
ALTER TABLE intervention_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_risk_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_message_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_outcomes ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (drop first to make idempotent)
DROP POLICY IF EXISTS "Service role full access" ON intervention_tenants;
DROP POLICY IF EXISTS "Service role full access" ON intervention_members;
DROP POLICY IF EXISTS "Service role full access" ON intervention_risk_snapshots;
DROP POLICY IF EXISTS "Service role full access" ON intervention_plays;
DROP POLICY IF EXISTS "Service role full access" ON intervention_interventions;
DROP POLICY IF EXISTS "Service role full access" ON intervention_message_events;
DROP POLICY IF EXISTS "Service role full access" ON intervention_outcomes;

CREATE POLICY "Service role full access" ON intervention_tenants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON intervention_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON intervention_risk_snapshots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON intervention_plays FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON intervention_interventions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON intervention_message_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON intervention_outcomes FOR ALL USING (true) WITH CHECK (true);

-- Seed a demo tenant so dev works out of the box
INSERT INTO intervention_tenants (id, name, timezone)
VALUES ('demo-tenant', 'Demo Gym', 'Europe/London')
ON CONFLICT (id) DO NOTHING;
