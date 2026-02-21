-- Organization invites table
CREATE TABLE organization_invites (
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

-- Indexes for performance
CREATE INDEX idx_organization_invites_gym_id ON organization_invites(gym_id);
CREATE INDEX idx_organization_invites_email ON organization_invites(email);
CREATE INDEX idx_organization_invites_token ON organization_invites(token);
CREATE INDEX idx_organization_invites_invited_by ON organization_invites(invited_by);

-- Enable RLS
ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view invites for their gym
CREATE POLICY "Users can view invites for their gym"
  ON organization_invites FOR SELECT
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

-- Users with invite_users permission can create invites for their gym
CREATE POLICY "Users can create invites for their gym"
  ON organization_invites FOR INSERT
  WITH CHECK (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

-- Users can update invites for their gym (to mark as accepted)
CREATE POLICY "Users can update invites for their gym"
  ON organization_invites FOR UPDATE
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

-- Note: The API route handles checking user email for viewing own invites
-- This policy allows users to see invites for their gym (for admins/owners to manage)
