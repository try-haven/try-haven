-- Fix Bedrooms column in listings_nyc table to be numeric instead of text
-- This migration converts string-based bedrooms ("0", "1", "2", etc.) to proper integers

-- First, let's check the current data type
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'listings_nyc'
AND column_name = 'Bedrooms';

-- Check for any non-numeric values before conversion
SELECT DISTINCT "Bedrooms"
FROM listings_nyc
ORDER BY "Bedrooms";

-- Convert Bedrooms column from text to integer
ALTER TABLE listings_nyc
ALTER COLUMN "Bedrooms" TYPE INTEGER
USING CASE
  WHEN "Bedrooms" ~ '^\d+$' THEN "Bedrooms"::INTEGER  -- If it's a valid integer string
  ELSE 0  -- Default to 0 for any invalid values (studio apartments)
END;

-- Add a constraint to ensure bedrooms is non-negative
ALTER TABLE listings_nyc
ADD CONSTRAINT bedrooms_non_negative CHECK ("Bedrooms" >= 0);

-- Verify the change
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'listings_nyc'
AND column_name = 'Bedrooms';

-- Check the data after conversion
SELECT "Bedrooms", COUNT(*) as count
FROM listings_nyc
GROUP BY "Bedrooms"
ORDER BY "Bedrooms";

-- Expected result: Bedrooms should be INTEGER type with values 0, 1, 2, 3, 4, 5, etc.
