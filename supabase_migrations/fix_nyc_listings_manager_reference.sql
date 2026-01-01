-- Fix NYC listings to properly reference manager profiles via UUID
-- This allows us to JOIN with profiles table to get apartment_complex_name

-- Add manager_uuid column to listings_nyc that properly references profiles
ALTER TABLE listings_nyc
ADD COLUMN IF NOT EXISTS manager_uuid UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster JOINs
CREATE INDEX IF NOT EXISTS idx_listings_nyc_manager_uuid ON listings_nyc(manager_uuid);

COMMENT ON COLUMN listings_nyc.manager_uuid IS 'UUID reference to manager in profiles table - allows JOIN to fetch apartment_complex_name';

-- Note: You'll need to populate manager_uuid for existing listings
-- If you know the mapping between numeric Manager ID and UUIDs, update here:
-- UPDATE listings_nyc SET manager_uuid = 'some-uuid' WHERE "Manager ID" = 123;
