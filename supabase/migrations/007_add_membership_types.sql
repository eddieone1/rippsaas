-- Create membership_types table
-- This allows gyms to define their own membership types (e.g., "Basic", "Premium", "Student", etc.)

CREATE TABLE IF NOT EXISTS membership_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  billing_frequency TEXT CHECK (billing_frequency IN ('monthly', 'quarterly', 'yearly', 'one-time', 'custom')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(gym_id, name) -- Each gym can't have duplicate membership type names
);

-- Add membership_type_id to members table
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS membership_type_id UUID REFERENCES membership_types(id) ON DELETE SET NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_membership_types_gym_id ON membership_types(gym_id);
CREATE INDEX IF NOT EXISTS idx_membership_types_is_active ON membership_types(is_active);
CREATE INDEX IF NOT EXISTS idx_members_membership_type_id ON members(membership_type_id);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_membership_types_updated_at ON membership_types;
CREATE TRIGGER update_membership_types_updated_at BEFORE UPDATE ON membership_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE membership_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies for membership_types
DROP POLICY IF EXISTS "Users can view membership types in their gym" ON membership_types;
CREATE POLICY "Users can view membership types in their gym"
  ON membership_types FOR SELECT
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert membership types in their gym" ON membership_types;
CREATE POLICY "Users can insert membership types in their gym"
  ON membership_types FOR INSERT
  WITH CHECK (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update membership types in their gym" ON membership_types;
CREATE POLICY "Users can update membership types in their gym"
  ON membership_types FOR UPDATE
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete membership types in their gym" ON membership_types;
CREATE POLICY "Users can delete membership types in their gym"
  ON membership_types FOR DELETE
  USING (gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid()));

-- Comments for documentation
COMMENT ON TABLE membership_types IS 'Gym-defined membership types that can be assigned to members';
COMMENT ON COLUMN membership_types.name IS 'Name of the membership type (e.g., "Basic", "Premium", "Student")';
COMMENT ON COLUMN membership_types.description IS 'Optional description of the membership type';
COMMENT ON COLUMN membership_types.price IS 'Price of the membership type';
COMMENT ON COLUMN membership_types.billing_frequency IS 'How often the membership is billed: monthly, quarterly, yearly, one-time, or custom';
COMMENT ON COLUMN membership_types.is_active IS 'Whether this membership type is currently active/available';
