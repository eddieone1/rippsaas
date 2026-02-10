-- Columns used by member profile and insights so stage/commitment persist and match
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
