-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Gyms table
CREATE TABLE gyms (
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
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Members table
CREATE TABLE members (
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
CREATE TABLE member_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('visit', 'check_in')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaign templates table
CREATE TABLE campaign_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE, -- NULL for default templates
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE campaigns (
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
CREATE TABLE campaign_sends (
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
CREATE INDEX idx_users_gym_id ON users(gym_id);
CREATE INDEX idx_members_gym_id ON members(gym_id);
CREATE INDEX idx_members_churn_risk_level ON members(churn_risk_level);
CREATE INDEX idx_members_last_visit_date ON members(last_visit_date);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_member_activities_member_id ON member_activities(member_id);
CREATE INDEX idx_campaigns_gym_id ON campaigns(gym_id);
CREATE INDEX idx_campaign_templates_gym_id ON campaign_templates(gym_id);
CREATE INDEX idx_campaign_sends_member_id ON campaign_sends(member_id);
CREATE INDEX idx_campaign_sends_campaign_id ON campaign_sends(campaign_id);
CREATE INDEX idx_campaign_sends_sent_at ON campaign_sends(sent_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_gyms_updated_at BEFORE UPDATE ON gyms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
CREATE POLICY "Users can view their own gym"
  ON gyms FOR SELECT
  USING (id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own gym"
  ON gyms FOR UPDATE
  USING (id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

-- Users: users can read/update their own profile
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (id = auth.uid() OR gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Members: users can manage members in their gym
CREATE POLICY "Users can view members in their gym"
  ON members FOR SELECT
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert members in their gym"
  ON members FOR INSERT
  WITH CHECK (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update members in their gym"
  ON members FOR UPDATE
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete members in their gym"
  ON members FOR DELETE
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

-- Member activities: users can manage activities for their gym's members
CREATE POLICY "Users can view activities in their gym"
  ON member_activities FOR SELECT
  USING (member_id IN (SELECT id FROM members WHERE gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can insert activities in their gym"
  ON member_activities FOR INSERT
  WITH CHECK (member_id IN (SELECT id FROM members WHERE gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid())));

-- Campaigns: users can manage campaigns in their gym
CREATE POLICY "Users can view campaigns in their gym"
  ON campaigns FOR SELECT
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert campaigns in their gym"
  ON campaigns FOR INSERT
  WITH CHECK (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update campaigns in their gym"
  ON campaigns FOR UPDATE
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete campaigns in their gym"
  ON campaigns FOR DELETE
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

-- Campaign templates: users can manage templates in their gym (or view default templates)
CREATE POLICY "Users can view templates in their gym or default templates"
  ON campaign_templates FOR SELECT
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()) OR gym_id IS NULL);

CREATE POLICY "Users can insert templates in their gym"
  ON campaign_templates FOR INSERT
  WITH CHECK (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()) OR gym_id IS NULL);

CREATE POLICY "Users can update templates in their gym"
  ON campaign_templates FOR UPDATE
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete templates in their gym"
  ON campaign_templates FOR DELETE
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

-- Campaign sends: users can view/manage sends for their gym's campaigns
CREATE POLICY "Users can view sends in their gym"
  ON campaign_sends FOR SELECT
  USING (campaign_id IN (SELECT id FROM campaigns WHERE gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can insert sends in their gym"
  ON campaign_sends FOR INSERT
  WITH CHECK (campaign_id IN (SELECT id FROM campaigns WHERE gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can update sends in their gym"
  ON campaign_sends FOR UPDATE
  USING (campaign_id IN (SELECT id FROM campaigns WHERE gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid())));

-- Seed default campaign templates (gym_id is NULL for defaults)
INSERT INTO campaign_templates (id, gym_id, name, subject, body, channel) VALUES
  (uuid_generate_v4(), NULL, '14 Days Inactive', 'We miss you at {{gym_name}}!', 'Hi {{first_name}},\n\nWe noticed you haven''t visited us in a while. We''d love to see you back!\n\nYour last visit was on {{last_visit_date}}. Come back and continue your fitness journey with us.\n\nBest regards,\nThe {{gym_name}} Team', 'email'),
  (uuid_generate_v4(), NULL, '21 Days Inactive', 'Don''t give up on your fitness goals!', 'Hi {{first_name}},\n\nIt''s been 21 days since your last visit. We know life gets busy, but your health is important.\n\nWe''re here to support you. Come visit us this week - we''d love to help you get back on track!\n\nBest regards,\nThe {{gym_name}} Team', 'email'),
  (uuid_generate_v4(), NULL, '30+ Days Inactive', 'Let''s get you back on track', 'Hi {{first_name}},\n\nWe miss having you as part of the {{gym_name}} community! It''s been over a month since your last visit.\n\nWe understand that staying consistent can be challenging, but we''re here to help. Let''s work together to reignite your fitness journey.\n\nCome visit us this week - we''d love to see you!\n\nBest regards,\nThe {{gym_name}} Team', 'email');
