-- Populate apartment_complex_name in listings_nyc from their managers
-- Run this AFTER adding the columns to listings_nyc

-- Step 1: Set all NYC listings to have apartment_complex_name = 'test apartment'
-- (Since we don't have a reliable mapping between numeric Manager ID and profile UUIDs)
UPDATE listings_nyc
SET apartment_complex_name = 'test apartment'
WHERE apartment_complex_name IS NULL OR apartment_complex_name = '';

-- Step 2: Verify the update
SELECT
  "Unit ID",
  "Title",
  "Manager ID",
  apartment_complex_name,
  CASE
    WHEN apartment_complex_name IS NULL THEN '❌ Missing'
    WHEN apartment_complex_name = '' THEN '❌ Empty'
    ELSE '✅ Set'
  END as status
FROM listings_nyc
ORDER BY apartment_complex_name NULLS FIRST
LIMIT 20;

-- Step 3: Summary
SELECT
  COUNT(*) as total_nyc_listings,
  COUNT(CASE WHEN apartment_complex_name IS NOT NULL AND apartment_complex_name != '' THEN 1 END) as listings_with_complex_name,
  COUNT(CASE WHEN apartment_complex_name IS NULL OR apartment_complex_name = '' THEN 1 END) as listings_missing_complex_name
FROM listings_nyc;
