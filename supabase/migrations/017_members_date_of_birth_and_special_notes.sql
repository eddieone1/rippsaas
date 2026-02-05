-- Add date_of_birth and special_notes to members for deduplication and manual notes
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS date_of_birth DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS special_notes TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_members_date_of_birth ON members(date_of_birth) WHERE date_of_birth IS NOT NULL;
COMMENT ON COLUMN members.date_of_birth IS 'Used with name/email to recognise existing members on upload';
COMMENT ON COLUMN members.special_notes IS 'Manual notes editable from member profile';
