-- Fix infinite recursion in users RLS policy
-- The original policy was querying the users table within its own policy check,
-- causing infinite recursion. Simplify to only allow users to view their own profile.

DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (id = auth.uid());
