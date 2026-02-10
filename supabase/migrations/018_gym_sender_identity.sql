-- Allow gyms to send campaigns from their own email/name and (optional) SMS number
-- Email: Resend requires the "from" domain to be verified in Resend dashboard
-- SMS: Twilio "from" number is set per-app or per-gym (see env TWILIO_PHONE_NUMBER)

ALTER TABLE gyms
  ADD COLUMN IF NOT EXISTS sender_name TEXT,
  ADD COLUMN IF NOT EXISTS sender_email TEXT,
  ADD COLUMN IF NOT EXISTS sms_from_number TEXT;

COMMENT ON COLUMN gyms.sender_name IS 'Display name for campaign emails (e.g. "Acme Gym")';
COMMENT ON COLUMN gyms.sender_email IS 'From address for campaign emails; must use a domain verified in Resend';
COMMENT ON COLUMN gyms.sms_from_number IS 'Optional Twilio number for SMS campaigns (e.g. +1234567890)';
