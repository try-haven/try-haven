-- Replace numeric "Manager ID" with UUID in listings_nyc table
-- This allows proper JOIN with profiles table

-- Step 1: Add temporary manager_id_uuid column
ALTER TABLE listings_nyc
ADD COLUMN IF NOT EXISTS manager_id_uuid UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Set all listings to demo-manager (or your manager UUID)
UPDATE listings_nyc
SET manager_id_uuid = (
  SELECT id
  FROM profiles
  WHERE username = 'demo-manager'
  LIMIT 1
);

-- Step 3: Drop the old numeric "Manager ID" column
ALTER TABLE listings_nyc
DROP COLUMN IF EXISTS "Manager ID";

-- Step 4: Rename the UUID column to "Manager ID"
ALTER TABLE listings_nyc
RENAME COLUMN manager_id_uuid TO "Manager ID";

-- Step 5: Make it NOT NULL since every listing needs a manager
ALTER TABLE listings_nyc
ALTER COLUMN "Manager ID" SET NOT NULL;

-- Step 6: Create index for faster JOINs
CREATE INDEX IF NOT EXISTS idx_listings_nyc_manager_id ON listings_nyc("Manager ID");

COMMENT ON COLUMN listings_nyc."Manager ID" IS 'UUID reference to manager in profiles/auth.users table';

-- Verify the change
SELECT
  "Unit ID",
  "Title",
  "Manager ID",
  pg_typeof("Manager ID") as manager_id_type
FROM listings_nyc
LIMIT 5;
