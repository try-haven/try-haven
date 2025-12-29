-- Add images column to listings_nyc table
-- This will store an array of image URLs for each listing

-- Add images column (JSONB array of strings)
ALTER TABLE listings_nyc
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_listings_nyc_images ON listings_nyc USING GIN (images);

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'listings_nyc'
AND column_name = 'images';

-- Check current state (should all be empty arrays initially)
SELECT "Unit ID", images
FROM listings_nyc
LIMIT 10;
