-- Redefine re-engagement: a member re-engages when they make another visit.
-- Re-engagement is no longer triggered by replies or bookings; only physical visits (visit, check_in) count.
-- Remove manual "Mark as Re-engaged" from application layer; re-engagement is purely activity-based.

-- Update campaign_sends.activity_type: re-engagement is visits only (visit, check_in)
-- Clear legacy reply/booking values that no longer count as re-engagement
UPDATE campaign_sends SET activity_type = NULL WHERE activity_type IN ('reply', 'booking');

ALTER TABLE campaign_sends DROP CONSTRAINT IF EXISTS campaign_sends_activity_type_check;
ALTER TABLE campaign_sends
  ADD CONSTRAINT campaign_sends_activity_type_check
  CHECK (activity_type IS NULL OR activity_type IN ('visit', 'check_in'));

-- Redefine calculate_intervention_outcomes: only visits (visit, check_in) count as re-engagement
CREATE OR REPLACE FUNCTION calculate_intervention_outcomes(p_gym_id UUID, p_success_window_days INTEGER DEFAULT 14)
RETURNS TABLE(updated_count INTEGER) AS $$
DECLARE
  v_success_window INTERVAL;
  v_updated INTEGER := 0;
BEGIN
  v_success_window := (p_success_window_days || ' days')::INTERVAL;

  WITH member_visits_after_sends AS (
    SELECT DISTINCT ON (cs.id)
      cs.id AS send_id,
      cs.member_id,
      cs.sent_at,
      cs.member_re_engaged,
      ma.activity_date AS first_visit_date,
      ma.activity_type,
      (ma.activity_date - cs.sent_at::DATE) AS days_delta,
      CASE WHEN m.status = 'cancelled' THEN true ELSE false END AS is_cancelled
    FROM campaign_sends cs
    JOIN campaigns c ON c.id = cs.campaign_id
    LEFT JOIN member_activities ma ON ma.member_id = cs.member_id
      AND ma.activity_type IN ('visit', 'check_in')
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
        WHEN first_visit_date IS NOT NULL THEN 're_engaged'
        WHEN sent_at + v_success_window < NOW() THEN 'no_response'
        ELSE NULL
      END AS calculated_outcome,
      first_visit_date,
      days_delta,
      activity_type
    FROM member_visits_after_sends
  )
  UPDATE campaign_sends cs
  SET
    outcome = o.calculated_outcome,
    days_to_return = o.days_delta,
    first_activity_at = CASE WHEN o.first_visit_date IS NOT NULL THEN o.first_visit_date::TIMESTAMPTZ ELSE NULL END,
    activity_type = o.activity_type,
    outcome_calculated_at = NOW(),
    member_re_engaged = CASE WHEN o.calculated_outcome = 're_engaged' THEN true ELSE member_re_engaged END,
    member_visited_after = o.first_visit_date
  FROM outcomes o
  WHERE cs.id = o.send_id
    AND o.calculated_outcome IS NOT NULL;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN QUERY SELECT v_updated;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_intervention_outcomes IS 'Calculates intervention outcomes. Re-engagement = member made another visit (visit or check_in) within the success window. Attribution: last intervention before that visit is assumed to have contributed.';
COMMENT ON COLUMN campaign_sends.outcome IS 'Intervention outcome: re_engaged (member made another visit within success window), no_response (no visit within window), cancelled (member cancelled)';
COMMENT ON COLUMN campaign_sends.days_to_return IS 'Days from intervention send to first visit (if re-engaged)';
COMMENT ON COLUMN campaign_sends.first_activity_at IS 'Timestamp of first visit after intervention';
COMMENT ON COLUMN campaign_sends.activity_type IS 'Type of first visit: visit or check_in (re-engagement requires a physical visit)';
