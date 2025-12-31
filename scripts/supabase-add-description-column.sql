-- Add description column to listings_nyc table
-- This will store detailed descriptions for each listing

-- Add description column (TEXT)
ALTER TABLE listings_nyc
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL;

-- Verify the column was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'listings_nyc'
AND column_name = 'description';

-- Check current state (should all be null initially)
SELECT "Unit ID", "Neighborhood", description
FROM listings_nyc
LIMIT 10;
