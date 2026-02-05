-- Add phone to users for personal info in settings
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone TEXT;

COMMENT ON COLUMN users.phone IS 'User phone number for contact and display in settings';
