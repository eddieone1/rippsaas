-- Add target segment and cancelled-members option to campaigns
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS target_segment TEXT NOT NULL DEFAULT 'all'
    CHECK (target_segment IN ('low', 'medium', 'high', 'all')),
  ADD COLUMN IF NOT EXISTS include_cancelled BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN campaigns.target_segment IS 'Risk level to target: low, medium, high, or all';
COMMENT ON COLUMN campaigns.include_cancelled IS 'When true, include cancelled members in targeting';

-- Optional: template_key for quick-execute template campaigns (nullable for existing rows)
ALTER TABLE campaign_templates
  ADD COLUMN IF NOT EXISTS template_key TEXT UNIQUE;

COMMENT ON COLUMN campaign_templates.template_key IS 'Key for quick template e.g. we_havent_seen_you, bring_a_friend, we_miss_you_discount';

-- Seed template campaigns for quick execution (only if not already present)
INSERT INTO campaign_templates (gym_id, name, subject, body, channel, template_key)
SELECT NULL, 'We haven''t seen you in a while', 'We miss you at {{gym_name}}!', 'Hi {{first_name}},\n\nWe haven''t seen you in a while and we''d love to have you back.\n\nYour last visit was on {{last_visit_date}}. Drop in this week and pick up where you left off.\n\nBest,\nThe {{gym_name}} Team', 'email', 'we_havent_seen_you'
WHERE NOT EXISTS (SELECT 1 FROM campaign_templates WHERE template_key = 'we_havent_seen_you');

INSERT INTO campaign_templates (gym_id, name, subject, body, channel, template_key)
SELECT NULL, 'Bring a friend on us', 'Bring a friend on us at {{gym_name}}', 'Hi {{first_name}},\n\nBring a friend on us! They can try a free session and you get to train together.\n\nNo catch. Just come in with a buddy this week.\n\nBest,\nThe {{gym_name}} Team', 'email', 'bring_a_friend'
WHERE NOT EXISTS (SELECT 1 FROM campaign_templates WHERE template_key = 'bring_a_friend');

INSERT INTO campaign_templates (gym_id, name, subject, body, channel, template_key)
SELECT NULL, 'We miss you (membership discount offer)', 'We miss you – here''s a little something from {{gym_name}}', 'Hi {{first_name}},\n\nWe miss you. Come back and we''ll give you {{discount_offer}} on your next month.\n\nUse this offer by visiting us this week. We''d love to see you.\n\nBest,\nThe {{gym_name}} Team', 'email', 'we_miss_you_discount'
WHERE NOT EXISTS (SELECT 1 FROM campaign_templates WHERE template_key = 'we_miss_you_discount');

INSERT INTO campaign_templates (gym_id, name, subject, body, channel, template_key)
SELECT NULL, 'We haven''t seen you (SMS)', '', 'Hi {{first_name}}, we haven''t seen you in a while! We''d love to have you back. Last visit: {{last_visit_date}}. See you soon, {{gym_name}}', 'sms', 'we_havent_seen_you_sms'
WHERE NOT EXISTS (SELECT 1 FROM campaign_templates WHERE template_key = 'we_havent_seen_you_sms');

INSERT INTO campaign_templates (gym_id, name, subject, body, channel, template_key)
SELECT NULL, 'Bring a friend (SMS)', '', '{{first_name}}: Bring a friend on us this week at {{gym_name}}. Free session for them!', 'sms', 'bring_a_friend_sms'
WHERE NOT EXISTS (SELECT 1 FROM campaign_templates WHERE template_key = 'bring_a_friend_sms');

INSERT INTO campaign_templates (gym_id, name, subject, body, channel, template_key)
SELECT NULL, 'We miss you discount (SMS)', '', '{{first_name}}, we miss you! Come back this week for {{discount_offer}}. {{gym_name}}', 'sms', 'we_miss_you_discount_sms'
WHERE NOT EXISTS (SELECT 1 FROM campaign_templates WHERE template_key = 'we_miss_you_discount_sms');
