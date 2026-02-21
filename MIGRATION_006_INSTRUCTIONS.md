# Migration 006: Add client_count_range Column

## Quick Fix

Run this SQL in your Supabase SQL Editor:

```sql
-- Add client count range field to gyms table
-- This stores the initial client count range selected during signup

ALTER TABLE gyms
  ADD COLUMN IF NOT EXISTS client_count_range TEXT CHECK (client_count_range IN ('0-50', '51-150', '151-500', '501+'));

-- Comment for documentation
COMMENT ON COLUMN gyms.client_count_range IS 'Initial client count range selected during signup: 0-50, 51-150, 151-500, 501+';
```

## Steps

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Paste the SQL above
4. Click **Run** or press `Ctrl/Cmd + Enter`
5. Verify the migration succeeded (you should see "Success. No rows returned")

## What This Does

- Adds a `client_count_range` column to the `gyms` table
- Stores the initial client count range selected during signup
- Validates that values are one of: '0-50', '51-150', '151-500', '501+'

## Note

The signup will work without this migration (the code handles it gracefully), but the client count data won't be stored until the migration is applied.
