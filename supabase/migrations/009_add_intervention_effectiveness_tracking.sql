-- Add intervention effectiveness tracking
-- MVP-level tracking: simple attribution based on last intervention before re-engagement

-- Update member_activities table to include 'reply' and 'booking' activity types for intervention tracking
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'member_activities_activity_type_check'
  ) THEN
    ALTER TABLE member_activities DROP CONSTRAINT member_activities_activity_type_check;
  END IF;
END $$;

-- Add new constraint with additional activity types
ALTER TABLE member_activities
  ADD CONSTRAINT member_activities_activity_type_check 
  CHECK (activity_type IN ('visit', 'check_in', 'reply', 'booking'));

-- Add columns to campaign_sends for better outcome tracking
ALTER TABLE campaign_sends
  ADD COLUMN IF NOT EXISTS outcome_calculated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS outcome TEXT CHECK (outcome IN ('re_engaged', 'no_response', 'cancelled')) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS days_to_return INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS first_activity_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS activity_type TEXT CHECK (activity_type IN ('visit', 'booking', 'reply')) DEFAULT NULL;

-- Add success window configuration to gyms (default 14 days)
ALTER TABLE gyms
  ADD COLUMN IF NOT EXISTS intervention_success_window_days INTEGER NOT NULL DEFAULT 14;

-- Add index for performance queries
CREATE INDEX IF NOT EXISTS idx_campaign_sends_outcome ON campaign_sends(outcome);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_sent_at_desc ON campaign_sends(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_campaign_member ON campaign_sends(campaign_id, member_id);

-- Function to calculate intervention outcomes (MVP: simple attribution)
-- This can be called periodically or on-demand
CREATE OR REPLACE FUNCTION calculate_intervention_outcomes(p_gym_id UUID, p_success_window_days INTEGER DEFAULT 14)
RETURNS TABLE(
  updated_count INTEGER
) AS $$
DECLARE
  v_success_window INTERVAL;
  v_updated INTEGER := 0;
BEGIN
  -- Set success window
  v_success_window := (p_success_window_days || ' days')::INTERVAL;
  
  -- Update campaign_sends with outcomes based on member activity
  -- MVP Attribution Rule: Last intervention before re-engagement is assumed to have contributed
  
  WITH member_activities_after_sends AS (
    SELECT DISTINCT ON (cs.id)
      cs.id AS send_id,
      cs.member_id,
      cs.sent_at,
      cs.member_re_engaged,
      ma.activity_date AS first_activity_date,
      ma.activity_type,
      (ma.activity_date - cs.sent_at::DATE) AS days_delta,
      -- Check if member cancelled
      CASE WHEN m.status = 'cancelled' THEN true ELSE false END AS is_cancelled
    FROM campaign_sends cs
    JOIN campaigns c ON c.id = cs.campaign_id
    LEFT JOIN member_activities ma ON ma.member_id = cs.member_id
      AND ma.activity_date::DATE >= cs.sent_at::DATE
      AND ma.activity_date::DATE <= (cs.sent_at + v_success_window)::DATE
    LEFT JOIN members m ON m.id = cs.member_id
    WHERE c.gym_id = p_gym_id
      AND cs.outcome IS NULL -- Only calculate for unprocessed sends
      AND cs.sent_at < NOW() - INTERVAL '1 day' -- Give at least 1 day for outcomes to materialise
    ORDER BY cs.id, ma.activity_date ASC
  ),
  outcomes AS (
    SELECT
      send_id,
      CASE
        WHEN is_cancelled THEN 'cancelled'
        WHEN first_activity_date IS NOT NULL THEN 're_engaged'
        WHEN sent_at + v_success_window < NOW() THEN 'no_response' -- Past success window
        ELSE NULL -- Still within success window
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

-- Comment for documentation
COMMENT ON FUNCTION calculate_intervention_outcomes IS 'MVP-level function to calculate intervention outcomes. Simple attribution: last intervention before re-engagement is assumed to have contributed. No complex causal inference.';

-- Comments for columns
COMMENT ON COLUMN campaign_sends.outcome IS 'Intervention outcome: re_engaged (member returned within success window), no_response (no activity within window), cancelled (member cancelled)';
COMMENT ON COLUMN campaign_sends.days_to_return IS 'Number of days from intervention send to first member activity (if re-engaged)';
COMMENT ON COLUMN campaign_sends.first_activity_at IS 'Timestamp of first member activity after intervention';
COMMENT ON COLUMN campaign_sends.activity_type IS 'Type of first activity: visit, booking, or reply';
COMMENT ON COLUMN campaign_sends.outcome_calculated_at IS 'When the outcome was last calculated';
COMMENT ON COLUMN gyms.intervention_success_window_days IS 'Number of days after intervention to consider for success attribution (default 14)';
