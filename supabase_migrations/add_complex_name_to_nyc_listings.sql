-- Add apartment_complex_name column to listings_nyc table
-- This denormalizes the data but avoids JOIN issues with numeric Manager ID

-- Step 1: Add the column
ALTER TABLE listings_nyc
ADD COLUMN IF NOT EXISTS apartment_complex_name TEXT;

-- Step 2: Add a manager_uuid column to properly reference profiles
ALTER TABLE listings_nyc
ADD COLUMN IF NOT EXISTS manager_uuid UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 3: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_listings_nyc_manager_uuid ON listings_nyc(manager_uuid);

COMMENT ON COLUMN listings_nyc.apartment_complex_name IS 'Denormalized apartment complex name for fast queries';
COMMENT ON COLUMN listings_nyc.manager_uuid IS 'UUID reference to the manager in profiles table';
