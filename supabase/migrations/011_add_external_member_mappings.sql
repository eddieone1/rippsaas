-- Migration: Add external member mappings table
-- This table tracks external member IDs (from Mindbody, Glofox, etc.) 
-- to prevent duplicates and enable updates

CREATE TABLE IF NOT EXISTS external_member_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL, -- External system's member ID
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('mindbody', 'glofox', 'other')), -- Which external system
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(gym_id, external_id, source) -- One mapping per external ID per source per gym
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_external_member_mappings_gym_id ON external_member_mappings(gym_id);
CREATE INDEX IF NOT EXISTS idx_external_member_mappings_external_id ON external_member_mappings(external_id);
CREATE INDEX IF NOT EXISTS idx_external_member_mappings_member_id ON external_member_mappings(member_id);
CREATE INDEX IF NOT EXISTS idx_external_member_mappings_source ON external_member_mappings(source);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_external_member_mappings_lookup 
  ON external_member_mappings(gym_id, external_id, source);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_external_member_mappings_updated_at ON external_member_mappings;
CREATE TRIGGER update_external_member_mappings_updated_at 
  BEFORE UPDATE ON external_member_mappings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE external_member_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view mappings for their gym
CREATE POLICY "Users can view mappings for their gym"
  ON external_member_mappings FOR SELECT
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

-- System can insert/update mappings (via admin client)
-- Note: In production, you might want to restrict this further
CREATE POLICY "System can manage mappings"
  ON external_member_mappings FOR ALL
  USING (true); -- Admin client bypasses RLS anyway, but this is for clarity
