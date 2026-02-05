-- Migration: Add coach assignments to members
-- Allows assigning coaches to members for better accountability

CREATE TABLE IF NOT EXISTS member_coaches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT, -- Optional notes about the assignment
  UNIQUE(member_id, coach_id) -- One coach per member (can be changed)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_member_coaches_member_id ON member_coaches(member_id);
CREATE INDEX IF NOT EXISTS idx_member_coaches_coach_id ON member_coaches(coach_id);

-- Enable RLS
ALTER TABLE member_coaches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view coach assignments for their gym's members
CREATE POLICY "Users can view coach assignments for their gym"
  ON member_coaches FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM members 
      WHERE gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid())
    )
  );

-- Owners can assign coaches
CREATE POLICY "Owners can assign coaches"
  ON member_coaches FOR ALL
  USING (
    member_id IN (
      SELECT id FROM members 
      WHERE gym_id IN (
        SELECT gym_id FROM users 
        WHERE id = auth.uid() AND role = 'owner'
      )
    )
  );

-- Add commitment_score column to members table for performance
-- This will be calculated and stored to avoid recalculating on every query
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS commitment_score INTEGER DEFAULT NULL CHECK (commitment_score >= 0 AND commitment_score <= 100),
  ADD COLUMN IF NOT EXISTS commitment_score_calculated_at TIMESTAMPTZ DEFAULT NULL;

-- Index for sorting by commitment score
CREATE INDEX IF NOT EXISTS idx_members_commitment_score ON members(commitment_score DESC NULLS LAST);

-- Composite index for at-risk queries (common filter pattern)
CREATE INDEX IF NOT EXISTS idx_members_at_risk_query 
  ON members(gym_id, status, churn_risk_level, commitment_score DESC NULLS LAST)
  WHERE status = 'active' AND churn_risk_level IN ('high', 'medium');
