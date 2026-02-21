-- ============================================================================
-- MIGRATION 025: Coach Accountability Tables
-- ============================================================================
-- Ensures member_coaches has the columns needed for coach accountability,
-- and creates coach_touches for interaction tracking.
-- Safe to run even if member_coaches already exists.
-- ============================================================================

-- 1) Create member_coaches if it doesn't exist yet
CREATE TABLE IF NOT EXISTS member_coaches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) Add columns that may be missing on an existing table
ALTER TABLE member_coaches ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE;
ALTER TABLE member_coaches ADD COLUMN IF NOT EXISTS saved BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE member_coaches ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE member_coaches ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- 3) Backfill gym_id from the members table for any existing rows
UPDATE member_coaches mc
SET gym_id = m.gym_id
FROM members m
WHERE mc.member_id = m.id
  AND mc.gym_id IS NULL;

-- 4) Ensure unique constraint on member_id (one coach per member)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'member_coaches_member_id_key'
  ) THEN
    ALTER TABLE member_coaches ADD CONSTRAINT member_coaches_member_id_key UNIQUE (member_id);
  END IF;
END $$;

-- 5) Indexes
CREATE INDEX IF NOT EXISTS idx_member_coaches_gym_id ON member_coaches(gym_id);
CREATE INDEX IF NOT EXISTS idx_member_coaches_coach_id ON member_coaches(coach_id);
CREATE INDEX IF NOT EXISTS idx_member_coaches_member_id ON member_coaches(member_id);

-- ============================================================================
-- Coach touches / interaction log (new table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS coach_touches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('call', 'sms', 'email', 'in_person', 'dm', 'play_launch', 'auto_sms')),
  type TEXT NOT NULL DEFAULT 'coach' CHECK (type IN ('coach', 'system')),
  outcome TEXT NOT NULL CHECK (outcome IN ('replied', 'booked', 'no_response', 'follow_up', 'declined')),
  notes TEXT,
  play_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_touches_gym_id ON coach_touches(gym_id);
CREATE INDEX IF NOT EXISTS idx_coach_touches_member_id ON coach_touches(member_id);
CREATE INDEX IF NOT EXISTS idx_coach_touches_coach_id ON coach_touches(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_touches_created_at ON coach_touches(created_at DESC);

-- ============================================================================
-- RLS
-- ============================================================================
ALTER TABLE member_coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_touches ENABLE ROW LEVEL SECURITY;

-- member_coaches policies
DROP POLICY IF EXISTS "Users can view coach assignments in their gym" ON member_coaches;
CREATE POLICY "Users can view coach assignments in their gym"
  ON member_coaches FOR SELECT
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert coach assignments in their gym" ON member_coaches;
CREATE POLICY "Users can insert coach assignments in their gym"
  ON member_coaches FOR INSERT
  WITH CHECK (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update coach assignments in their gym" ON member_coaches;
CREATE POLICY "Users can update coach assignments in their gym"
  ON member_coaches FOR UPDATE
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete coach assignments in their gym" ON member_coaches;
CREATE POLICY "Users can delete coach assignments in their gym"
  ON member_coaches FOR DELETE
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

-- coach_touches policies
DROP POLICY IF EXISTS "Users can view touches in their gym" ON coach_touches;
CREATE POLICY "Users can view touches in their gym"
  ON coach_touches FOR SELECT
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert touches in their gym" ON coach_touches;
CREATE POLICY "Users can insert touches in their gym"
  ON coach_touches FOR INSERT
  WITH CHECK (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE member_coaches IS 'Tracks which coach is assigned to which member. One coach per member.';
COMMENT ON COLUMN member_coaches.gym_id IS 'Gym this assignment belongs to (backfilled from members table)';
COMMENT ON COLUMN member_coaches.saved IS 'Whether the coach has marked this member as saved (retained/re-engaged)';
COMMENT ON TABLE coach_touches IS 'Log of coach-member interactions (calls, SMS, emails, in-person, etc.)';
