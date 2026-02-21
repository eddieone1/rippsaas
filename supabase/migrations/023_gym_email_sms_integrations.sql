-- Allow gyms to use their own Resend and Twilio credentials for email and SMS campaigns.
-- When set, campaign sends use the gym's API keys; otherwise app defaults (env) are used.

ALTER TABLE gyms
  ADD COLUMN IF NOT EXISTS resend_api_key TEXT,
  ADD COLUMN IF NOT EXISTS twilio_account_sid TEXT,
  ADD COLUMN IF NOT EXISTS twilio_auth_token TEXT;

COMMENT ON COLUMN gyms.resend_api_key IS 'Optional Resend API key for this gym; emails send via this key so gym can use their own domain';
COMMENT ON COLUMN gyms.twilio_account_sid IS 'Optional Twilio Account SID for this gym; SMS sends use this account when set';
COMMENT ON COLUMN gyms.twilio_auth_token IS 'Optional Twilio Auth Token for this gym; never expose in API responses';
