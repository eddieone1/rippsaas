-- Add tour completion tracking to users table
-- This tracks whether a user has seen the product tour

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS has_completed_tour BOOLEAN NOT NULL DEFAULT false;

-- Comment for documentation
COMMENT ON COLUMN users.has_completed_tour IS 'Whether the user has completed the product onboarding tour';
