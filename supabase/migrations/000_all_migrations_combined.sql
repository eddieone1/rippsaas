-- ============================================================================
-- ALL MIGRATIONS COMBINED - Safe to run multiple times (idempotent)
-- ============================================================================
-- This file combines all migrations (001, 005-009, 018-021) into a single
-- SQL script that can be run safely even if some migrations have already been applied.
-- 
-- Run this in your Supabase SQL Editor to ensure all migrations are applied.
-- ============================================================================

-- ============================================================================
-- MIGRATION 001: Initial Schema
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Gyms table
CREATE TABLE IF NOT EXISTS gyms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'trialing' CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled')),
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users table (gym owners/admins)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  joined_date DATE NOT NULL,
  last_visit_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
  churn_risk_score INTEGER NOT NULL DEFAULT 0 CHECK (churn_risk_score >= 0 AND churn_risk_score <= 100),
  churn_risk_level TEXT NOT NULL DEFAULT 'none' CHECK (churn_risk_level IN ('none', 'low', 'medium', 'high')),
  last_risk_calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Member activities table (for future enrichment)
CREATE TABLE IF NOT EXISTS member_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('visit', 'check_in')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaign templates table
CREATE TABLE IF NOT EXISTS campaign_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE, -- NULL for default templates
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL DEFAULT 'inactivity_threshold' CHECK (trigger_type IN ('inactivity_threshold')),
  trigger_days INTEGER NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  template_id UUID NOT NULL REFERENCES campaign_templates(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaign sends table
CREATE TABLE IF NOT EXISTS campaign_sends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'failed')),
  external_id TEXT, -- Email/SMS provider ID
  member_responded BOOLEAN NOT NULL DEFAULT false,
  member_re_engaged BOOLEAN NOT NULL DEFAULT false,
  member_visited_after DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_gym_id ON users(gym_id);
CREATE INDEX IF NOT EXISTS idx_members_gym_id ON members(gym_id);
CREATE INDEX IF NOT EXISTS idx_members_churn_risk_level ON members(churn_risk_level);
CREATE INDEX IF NOT EXISTS idx_members_last_visit_date ON members(last_visit_date);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_member_activities_member_id ON member_activities(member_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_gym_id ON campaigns(gym_id);
CREATE INDEX IF NOT EXISTS idx_campaign_templates_gym_id ON campaign_templates(gym_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_member_id ON campaign_sends(member_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_campaign_id ON campaign_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_sent_at ON campaign_sends(sent_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_gyms_updated_at ON gyms;
CREATE TRIGGER update_gyms_updated_at BEFORE UPDATE ON gyms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_members_updated_at ON members;
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_sends ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own gym's data
-- Gyms: users can read/update their own gym
DROP POLICY IF EXISTS "Users can view their own gym" ON gyms;
CREATE POLICY "Users can view their own gym"
  ON gyms FOR SELECT
  USING (id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their own gym" ON gyms;
CREATE POLICY "Users can update their own gym"
  ON gyms FOR UPDATE
  USING (id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

-- Users: users can read/update their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Members: users can manage members in their gym
DROP POLICY IF EXISTS "Users can view members in their gym" ON members;
CREATE POLICY "Users can view members in their gym"
  ON members FOR SELECT
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert members in their gym" ON members;
CREATE POLICY "Users can insert members in their gym"
  ON members FOR INSERT
  WITH CHECK (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update members in their gym" ON members;
CREATE POLICY "Users can update members in their gym"
  ON members FOR UPDATE
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete members in their gym" ON members;
CREATE POLICY "Users can delete members in their gym"
  ON members FOR DELETE
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

-- Member activities: users can manage activities for their gym's members
DROP POLICY IF EXISTS "Users can view activities in their gym" ON member_activities;
CREATE POLICY "Users can view activities in their gym"
  ON member_activities FOR SELECT
  USING (member_id IN (SELECT id FROM members WHERE gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid())));

DROP POLICY IF EXISTS "Users can insert activities in their gym" ON member_activities;
CREATE POLICY "Users can insert activities in their gym"
  ON member_activities FOR INSERT
  WITH CHECK (member_id IN (SELECT id FROM members WHERE gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid())));

-- Campaigns: users can manage campaigns in their gym
DROP POLICY IF EXISTS "Users can view campaigns in their gym" ON campaigns;
CREATE POLICY "Users can view campaigns in their gym"
  ON campaigns FOR SELECT
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert campaigns in their gym" ON campaigns;
CREATE POLICY "Users can insert campaigns in their gym"
  ON campaigns FOR INSERT
  WITH CHECK (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update campaigns in their gym" ON campaigns;
CREATE POLICY "Users can update campaigns in their gym"
  ON campaigns FOR UPDATE
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete campaigns in their gym" ON campaigns;
CREATE POLICY "Users can delete campaigns in their gym"
  ON campaigns FOR DELETE
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

-- Campaign templates: users can manage templates in their gym (or view default templates)
DROP POLICY IF EXISTS "Users can view templates in their gym or default templates" ON campaign_templates;
CREATE POLICY "Users can view templates in their gym or default templates"
  ON campaign_templates FOR SELECT
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()) OR gym_id IS NULL);

DROP POLICY IF EXISTS "Users can insert templates in their gym" ON campaign_templates;
CREATE POLICY "Users can insert templates in their gym"
  ON campaign_templates FOR INSERT
  WITH CHECK (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()) OR gym_id IS NULL);

DROP POLICY IF EXISTS "Users can update templates in their gym" ON campaign_templates;
CREATE POLICY "Users can update templates in their gym"
  ON campaign_templates FOR UPDATE
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete templates in their gym" ON campaign_templates;
CREATE POLICY "Users can delete templates in their gym"
  ON campaign_templates FOR DELETE
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

-- Campaign sends: users can view/manage sends for their gym's campaigns
DROP POLICY IF EXISTS "Users can view sends in their gym" ON campaign_sends;
CREATE POLICY "Users can view sends in their gym"
  ON campaign_sends FOR SELECT
  USING (campaign_id IN (SELECT id FROM campaigns WHERE gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid())));

DROP POLICY IF EXISTS "Users can insert sends in their gym" ON campaign_sends;
CREATE POLICY "Users can insert sends in their gym"
  ON campaign_sends FOR INSERT
  WITH CHECK (campaign_id IN (SELECT id FROM campaigns WHERE gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid())));

DROP POLICY IF EXISTS "Users can update sends in their gym" ON campaign_sends;
CREATE POLICY "Users can update sends in their gym"
  ON campaign_sends FOR UPDATE
  USING (campaign_id IN (SELECT id FROM campaigns WHERE gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid())));

-- Seed default campaign templates (gym_id is NULL for defaults)
-- Only insert if they don't already exist
INSERT INTO campaign_templates (id, gym_id, name, subject, body, channel)
SELECT uuid_generate_v4(), NULL, '14 Days Inactive', 'We miss you at {{gym_name}}!', 'Hi {{first_name}},\n\nWe noticed you haven''t visited us in a while. We''d love to see you back!\n\nYour last visit was on {{last_visit_date}}. Come back and continue your fitness journey with us.\n\nBest regards,\nThe {{gym_name}} Team', 'email'
WHERE NOT EXISTS (SELECT 1 FROM campaign_templates WHERE gym_id IS NULL AND name = '14 Days Inactive');

INSERT INTO campaign_templates (id, gym_id, name, subject, body, channel)
SELECT uuid_generate_v4(), NULL, '21 Days Inactive', 'Don''t give up on your fitness goals!', 'Hi {{first_name}},\n\nIt''s been 21 days since your last visit. We know life gets busy, but your health is important.\n\nWe''re here to support you. Come visit us this week - we''d love to help you get back on track!\n\nBest regards,\nThe {{gym_name}} Team', 'email'
WHERE NOT EXISTS (SELECT 1 FROM campaign_templates WHERE gym_id IS NULL AND name = '21 Days Inactive');

INSERT INTO campaign_templates (id, gym_id, name, subject, body, channel)
SELECT uuid_generate_v4(), NULL, '30+ Days Inactive', 'Let''s get you back on track', 'Hi {{first_name}},\n\nWe miss having you as part of the {{gym_name}} community! It''s been over a month since your last visit.\n\nWe understand that staying consistent can be challenging, but we''re here to help. Let''s work together to reignite your fitness journey.\n\nCome visit us this week - we''d love to see you!\n\nBest regards,\nThe {{gym_name}} Team', 'email'
WHERE NOT EXISTS (SELECT 1 FROM campaign_templates WHERE gym_id IS NULL AND name = '30+ Days Inactive');

-- ============================================================================
-- MIGRATION 005: Branding Fields
-- ============================================================================

ALTER TABLE gyms
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS brand_primary_color TEXT DEFAULT '#2563EB',
  ADD COLUMN IF NOT EXISTS brand_secondary_color TEXT DEFAULT '#1E40AF';

COMMENT ON COLUMN gyms.logo_url IS 'URL or base64 data URL of the gym logo';
COMMENT ON COLUMN gyms.brand_primary_color IS 'Primary brand colour (hex code) used for buttons and links';
COMMENT ON COLUMN gyms.brand_secondary_color IS 'Secondary brand colour (hex code) used for accents';

-- ============================================================================
-- MIGRATION 006: Client Count Range
-- ============================================================================

ALTER TABLE gyms
  ADD COLUMN IF NOT EXISTS client_count_range TEXT CHECK (client_count_range IN ('0-50', '51-150', '151-500', '501+'));

COMMENT ON COLUMN gyms.client_count_range IS 'Initial client count range selected during signup: 0-50, 51-150, 151-500, 501+';

-- ============================================================================
-- MIGRATION 007: Membership Types
-- ============================================================================

CREATE TABLE IF NOT EXISTS membership_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  billing_frequency TEXT CHECK (billing_frequency IN ('monthly', 'quarterly', 'yearly', 'one-time', 'custom')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(gym_id, name) -- Each gym can't have duplicate membership type names
);

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS membership_type_id UUID REFERENCES membership_types(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_membership_types_gym_id ON membership_types(gym_id);
CREATE INDEX IF NOT EXISTS idx_membership_types_is_active ON membership_types(is_active);
CREATE INDEX IF NOT EXISTS idx_members_membership_type_id ON members(membership_type_id);

DROP TRIGGER IF EXISTS update_membership_types_updated_at ON membership_types;
CREATE TRIGGER update_membership_types_updated_at BEFORE UPDATE ON membership_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE membership_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view membership types in their gym" ON membership_types;
CREATE POLICY "Users can view membership types in their gym"
  ON membership_types FOR SELECT
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert membership types in their gym" ON membership_types;
CREATE POLICY "Users can insert membership types in their gym"
  ON membership_types FOR INSERT
  WITH CHECK (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update membership types in their gym" ON membership_types;
CREATE POLICY "Users can update membership types in their gym"
  ON membership_types FOR UPDATE
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete membership types in their gym" ON membership_types;
CREATE POLICY "Users can delete membership types in their gym"
  ON membership_types FOR DELETE
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

COMMENT ON TABLE membership_types IS 'Gym-defined membership types that can be assigned to members';
COMMENT ON COLUMN membership_types.name IS 'Name of the membership type (e.g., "Basic", "Premium", "Student")';
COMMENT ON COLUMN membership_types.description IS 'Optional description of the membership type';
COMMENT ON COLUMN membership_types.price IS 'Price of the membership type';
COMMENT ON COLUMN membership_types.billing_frequency IS 'How often the membership is billed: monthly, quarterly, yearly, one-time, or custom';
COMMENT ON COLUMN membership_types.is_active IS 'Whether this membership type is currently active/available';

-- ============================================================================
-- MIGRATION 008: Tour Completion Tracking
-- ============================================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS has_completed_tour BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN users.has_completed_tour IS 'Whether the user has completed the product onboarding tour';

-- ============================================================================
-- MIGRATION 009: Intervention Effectiveness Tracking
-- ============================================================================

-- Update member_activities table to include 'reply' and 'booking' activity types
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'member_activities_activity_type_check'
  ) THEN
    ALTER TABLE member_activities DROP CONSTRAINT member_activities_activity_type_check;
  END IF;
END $$;

ALTER TABLE member_activities
  ADD CONSTRAINT member_activities_activity_type_check 
  CHECK (activity_type IN ('visit', 'check_in', 'reply', 'booking'));

ALTER TABLE campaign_sends
  ADD COLUMN IF NOT EXISTS outcome_calculated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS outcome TEXT CHECK (outcome IN ('re_engaged', 'no_response', 'cancelled')) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS days_to_return INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS first_activity_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS activity_type TEXT CHECK (activity_type IN ('visit', 'booking', 'reply')) DEFAULT NULL;

ALTER TABLE gyms
  ADD COLUMN IF NOT EXISTS intervention_success_window_days INTEGER NOT NULL DEFAULT 14;

CREATE INDEX IF NOT EXISTS idx_campaign_sends_outcome ON campaign_sends(outcome);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_sent_at_desc ON campaign_sends(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_campaign_member ON campaign_sends(campaign_id, member_id);

CREATE OR REPLACE FUNCTION calculate_intervention_outcomes(p_gym_id UUID, p_success_window_days INTEGER DEFAULT 14)
RETURNS TABLE(
  updated_count INTEGER
) AS $$
DECLARE
  v_success_window INTERVAL;
  v_updated INTEGER := 0;
BEGIN
  v_success_window := (p_success_window_days || ' days')::INTERVAL;
  
  WITH member_activities_after_sends AS (
    SELECT DISTINCT ON (cs.id)
      cs.id AS send_id,
      cs.member_id,
      cs.sent_at,
      cs.member_re_engaged,
      ma.activity_date AS first_activity_date,
      ma.activity_type,
      (ma.activity_date - cs.sent_at::DATE) AS days_delta,
      CASE WHEN m.status = 'cancelled' THEN true ELSE false END AS is_cancelled
    FROM campaign_sends cs
    JOIN campaigns c ON c.id = cs.campaign_id
    LEFT JOIN member_activities ma ON ma.member_id = cs.member_id
      AND ma.activity_date::DATE >= cs.sent_at::DATE
      AND ma.activity_date::DATE <= (cs.sent_at + v_success_window)::DATE
    LEFT JOIN members m ON m.id = cs.member_id
    WHERE c.gym_id = p_gym_id
      AND cs.outcome IS NULL
      AND cs.sent_at < NOW() - INTERVAL '1 day'
    ORDER BY cs.id, ma.activity_date ASC
  ),
  outcomes AS (
    SELECT
      send_id,
      CASE
        WHEN is_cancelled THEN 'cancelled'
        WHEN first_activity_date IS NOT NULL THEN 're_engaged'
        WHEN sent_at + v_success_window < NOW() THEN 'no_response'
        ELSE NULL
      END AS calculated_outcome,
      first_activity_date,
      days_delta,
      activity_type
    FROM member_activities_after_sends
  )
  UPDATE campaign_sends cs
  SET
    outcome = o.calculated_outcome,
    days_to_return = o.days_delta,
    first_activity_at = CASE WHEN o.first_activity_date IS NOT NULL THEN o.first_activity_date::TIMESTAMPTZ ELSE NULL END,
    activity_type = o.activity_type,
    outcome_calculated_at = NOW(),
    member_re_engaged = CASE WHEN o.calculated_outcome = 're_engaged' THEN true ELSE member_re_engaged END,
    member_visited_after = o.first_activity_date
  FROM outcomes o
  WHERE cs.id = o.send_id
    AND o.calculated_outcome IS NOT NULL;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  RETURN QUERY SELECT v_updated;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_intervention_outcomes IS 'MVP-level function to calculate intervention outcomes. Simple attribution: last intervention before re-engagement is assumed to have contributed. No complex causal inference.';
COMMENT ON COLUMN campaign_sends.outcome IS 'Intervention outcome: re_engaged (member returned within success window), no_response (no activity within window), cancelled (member cancelled)';
COMMENT ON COLUMN campaign_sends.days_to_return IS 'Number of days from intervention send to first member activity (if re-engaged)';
COMMENT ON COLUMN campaign_sends.first_activity_at IS 'Timestamp of first member activity after intervention';
COMMENT ON COLUMN campaign_sends.activity_type IS 'Type of first activity: visit, booking, or reply';
COMMENT ON COLUMN campaign_sends.outcome_calculated_at IS 'When the outcome was last calculated';
COMMENT ON COLUMN gyms.intervention_success_window_days IS 'Number of days after intervention to consider for success attribution (default 14)';

-- ============================================================================
-- MIGRATION 018: Gym Sender Identity
-- ============================================================================

ALTER TABLE gyms
  ADD COLUMN IF NOT EXISTS sender_name TEXT,
  ADD COLUMN IF NOT EXISTS sender_email TEXT,
  ADD COLUMN IF NOT EXISTS sms_from_number TEXT;

COMMENT ON COLUMN gyms.sender_name IS 'Display name for campaign emails (e.g. "Acme Gym")';
COMMENT ON COLUMN gyms.sender_email IS 'From address for campaign emails; must use a domain verified in Resend';
COMMENT ON COLUMN gyms.sms_from_number IS 'Optional Twilio number for SMS campaigns (e.g. +1234567890)';

-- ============================================================================
-- MIGRATION 019: Member Intelligence Columns
-- ============================================================================

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS member_stage TEXT,
  ADD COLUMN IF NOT EXISTS commitment_score NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS commitment_score_calculated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS churn_probability NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS habit_decay_index NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS emotional_disengagement_flags JSONB,
  ADD COLUMN IF NOT EXISTS behaviour_interpretation TEXT;

COMMENT ON COLUMN members.member_stage IS 'Habit lifecycle stage from member-intelligence (e.g. momentum_identity, win_back_window)';
COMMENT ON COLUMN members.commitment_score IS '0-100 commitment score from commitment-score lib';
COMMENT ON COLUMN members.churn_probability IS 'Churn risk score from churn-risk lib';

-- ============================================================================
-- MIGRATION 020: Organization Invites
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'coach')),
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organization_invites_gym_id ON organization_invites(gym_id);
CREATE INDEX IF NOT EXISTS idx_organization_invites_email ON organization_invites(email);
CREATE INDEX IF NOT EXISTS idx_organization_invites_token ON organization_invites(token);
CREATE INDEX IF NOT EXISTS idx_organization_invites_invited_by ON organization_invites(invited_by);

ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view invites for their gym" ON organization_invites;
CREATE POLICY "Users can view invites for their gym"
  ON organization_invites FOR SELECT
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can create invites for their gym" ON organization_invites;
CREATE POLICY "Users can create invites for their gym"
  ON organization_invites FOR INSERT
  WITH CHECK (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update invites for their gym" ON organization_invites;
CREATE POLICY "Users can update invites for their gym"
  ON organization_invites FOR UPDATE
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

-- ============================================================================
-- MIGRATION 021: Recalibrate Risk Scoring
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_risk_level(commitment_score NUMERIC)
RETURNS TEXT AS $$
BEGIN
  IF commitment_score IS NULL THEN
    RETURN 'medium'; -- Default if no commitment score
  ELSIF commitment_score >= 80 THEN
    RETURN 'none';
  ELSIF commitment_score >= 61 THEN
    RETURN 'low';
  ELSIF commitment_score >= 21 THEN
    RETURN 'medium';
  ELSE
    RETURN 'high';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION calculate_risk_score(
  commitment_score NUMERIC,
  last_visit_date TIMESTAMPTZ
)
RETURNS INTEGER AS $$
DECLARE
  days_since_visit INTEGER;
  fourteen_day_periods INTEGER;
  base_risk_score NUMERIC;
  final_risk_score NUMERIC;
BEGIN
  IF commitment_score IS NULL THEN
    commitment_score := 50;
  END IF;

  IF last_visit_date IS NULL THEN
    RETURN 85;
  END IF;

  days_since_visit := EXTRACT(EPOCH FROM (NOW() - last_visit_date)) / 86400;
  days_since_visit := FLOOR(days_since_visit)::INTEGER;

  IF days_since_visit = 0 THEN
    RETURN GREATEST(0, LEAST(100, ROUND(100 - commitment_score)::INTEGER));
  END IF;

  base_risk_score := 100 - commitment_score;
  fourteen_day_periods := FLOOR(days_since_visit / 14)::INTEGER;

  IF fourteen_day_periods > 0 THEN
    final_risk_score := base_risk_score * POWER(1.2, fourteen_day_periods);
  ELSE
    final_risk_score := base_risk_score;
  END IF;

  RETURN GREATEST(0, LEAST(100, ROUND(final_risk_score)::INTEGER));
END;
$$ LANGUAGE plpgsql;

-- Update all members with new risk scores and levels (only if commitment_score exists)
UPDATE members
SET
  churn_risk_level = calculate_risk_level(commitment_score),
  churn_risk_score = calculate_risk_score(commitment_score, last_visit_date)
WHERE
  (status = 'active' OR status = 'inactive')
  AND commitment_score IS NOT NULL;

COMMENT ON FUNCTION calculate_risk_level IS 'Determines risk level based on commitment score: 1-20=high, 21-60=medium, 61-79=low, 80+=none';
COMMENT ON FUNCTION calculate_risk_score IS 'Calculates risk score: base = 100 - commitment_score, then multiplies by 1.2 for each 14-day period without visit';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- All migrations have been applied. The database schema is now up to date.
-- ============================================================================
