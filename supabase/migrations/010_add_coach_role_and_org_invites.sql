-- Migration: Add coach role and organization invite system
-- This enables users to join existing organizations as coaches

-- Update role enum to include 'coach' instead of 'admin'
-- First, drop the constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint with 'coach' role
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('owner', 'coach'));

-- Update any existing 'admin' roles to 'coach'
UPDATE users SET role = 'coach' WHERE role = 'admin';

-- Create organization invites table for join flow
CREATE TABLE IF NOT EXISTS organization_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'coach' CHECK (role IN ('owner', 'coach')),
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE, -- Unique invite token
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_organization_invites_email ON organization_invites(email);
CREATE INDEX idx_organization_invites_token ON organization_invites(token);
CREATE INDEX idx_organization_invites_gym_id ON organization_invites(gym_id);

-- RLS policies for organization_invites
ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;

-- Owners can create invites for their gym
CREATE POLICY "Owners can create invites for their gym"
  ON organization_invites FOR INSERT
  WITH CHECK (
    gym_id IN (
      SELECT gym_id FROM users 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Users can view invites sent to their email
CREATE POLICY "Users can view invites for their email"
  ON organization_invites FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid())
  );

-- Owners can update invites for their gym
CREATE POLICY "Owners can update invites for their gym"
  ON organization_invites FOR UPDATE
  USING (
    gym_id IN (
      SELECT gym_id FROM users 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Note: Token generation is handled in application code for simplicity
-- This keeps the migration simpler and allows easier token management
