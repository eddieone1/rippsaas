-- Member intelligence: stages, churn probability, habit decay, emotional flags, behaviour interpretation
-- Supports proactive retention (emotional disengagement detection, real-time churn, habit decay index)

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS member_stage TEXT DEFAULT NULL
    CHECK (member_stage IS NULL OR member_stage IN (
      'onboarding_vulnerability',
      'habit_formation',
      'momentum_identity',
      'plateau_boredom_risk',
      'emotional_disengagement',
      'at_risk_silent_quit',
      'win_back_window'
    )),
  ADD COLUMN IF NOT EXISTS churn_probability INTEGER DEFAULT NULL
    CHECK (churn_probability IS NULL OR (churn_probability >= 0 AND churn_probability <= 100)),
  ADD COLUMN IF NOT EXISTS habit_decay_index INTEGER DEFAULT NULL
    CHECK (habit_decay_index IS NULL OR (habit_decay_index >= 0 AND habit_decay_index <= 100)),
  ADD COLUMN IF NOT EXISTS emotional_disengagement_flags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS behaviour_interpretation TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_members_member_stage ON members(member_stage);
CREATE INDEX IF NOT EXISTS idx_members_churn_probability ON members(churn_probability DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_members_habit_decay_index ON members(habit_decay_index DESC NULLS LAST);

COMMENT ON COLUMN members.member_stage IS 'Dynamic retention stage: onboarding_vulnerability, habit_formation, momentum_identity, plateau_boredom_risk, emotional_disengagement, at_risk_silent_quit, win_back_window';
COMMENT ON COLUMN members.churn_probability IS 'Real-time churn probability 0-100';
COMMENT ON COLUMN members.habit_decay_index IS 'Habit decay index 0-100 (higher = more decay)';
COMMENT ON COLUMN members.emotional_disengagement_flags IS 'Flags indicating emotional disengagement signals';
COMMENT ON COLUMN members.behaviour_interpretation IS 'Human-readable interpretation of behaviour signals';
