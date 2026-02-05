-- Add client count range field to gyms table
-- This stores the initial client count range selected during signup

ALTER TABLE gyms
  ADD COLUMN IF NOT EXISTS client_count_range TEXT CHECK (client_count_range IN ('0-50', '51-150', '151-500', '501+'));

-- Comment for documentation
COMMENT ON COLUMN gyms.client_count_range IS 'Initial client count range selected during signup: 0-50, 51-150, 151-500, 501+';
