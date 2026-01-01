-- Replace numeric "Manager ID" with UUID in listings_nyc table (Version 2)
-- This version uses snake_case column name for better compatibility

-- Step 1: Add manager_id column (no spaces)
ALTER TABLE listings_nyc
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Set all listings to demo-manager
UPDATE listings_nyc
SET manager_id = (
  SELECT id
  FROM profiles
  WHERE username = 'demo-manager'
  LIMIT 1
);

-- Step 3: Drop the old "Manager ID" column (with space)
ALTER TABLE listings_nyc
DROP COLUMN IF EXISTS "Manager ID";

-- Step 4: Make manager_id NOT NULL
ALTER TABLE listings_nyc
ALTER COLUMN manager_id SET NOT NULL;

-- Step 5: Create index for faster JOINs
CREATE INDEX IF NOT EXISTS idx_listings_nyc_manager_id ON listings_nyc(manager_id);

COMMENT ON COLUMN listings_nyc.manager_id IS 'UUID reference to manager in profiles/auth.users table';

-- Verify the change
SELECT
  "Unit ID",
  "Title",
  manager_id,
  pg_typeof(manager_id) as manager_id_type
FROM listings_nyc
LIMIT 5;

-- Test the JOIN
SELECT
  l."Unit ID",
  l."Title",
  l.manager_id,
  p.username,
  p.apartment_complex_name
FROM listings_nyc l
LEFT JOIN profiles p ON l.manager_id = p.id
LIMIT 5;
