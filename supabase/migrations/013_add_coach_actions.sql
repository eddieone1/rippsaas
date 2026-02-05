-- Migration: Add coach actions/tasks system
-- Simple task list for coaches to track daily actions on assigned members

CREATE TABLE IF NOT EXISTS coach_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'contact_member',
    'send_campaign',
    'check_in',
    'follow_up',
    'investigate_issue'
  )),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  due_date DATE NOT NULL, -- Action due date (typically today)
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT, -- Optional notes when completing
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_coach_actions_coach_id ON coach_actions(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_actions_member_id ON coach_actions(member_id);
CREATE INDEX IF NOT EXISTS idx_coach_actions_due_date ON coach_actions(due_date);
CREATE INDEX IF NOT EXISTS idx_coach_actions_completed_at ON coach_actions(completed_at);

-- Composite index for common query: active actions for coach
CREATE INDEX IF NOT EXISTS idx_coach_actions_active 
  ON coach_actions(coach_id, due_date, completed_at NULLS FIRST)
  WHERE completed_at IS NULL;

-- Enable RLS
ALTER TABLE coach_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Coaches can view their own actions
CREATE POLICY "Coaches can view their own actions"
  ON coach_actions FOR SELECT
  USING (coach_id = auth.uid());

-- Coaches can update their own actions (mark complete)
CREATE POLICY "Coaches can update their own actions"
  ON coach_actions FOR UPDATE
  USING (coach_id = auth.uid());

-- System can create actions (via admin client or background job)
CREATE POLICY "System can create actions"
  ON coach_actions FOR INSERT
  WITH CHECK (true); -- Admin client bypasses RLS anyway

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_coach_actions_updated_at ON coach_actions;
CREATE TRIGGER update_coach_actions_updated_at 
  BEFORE UPDATE ON coach_actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
