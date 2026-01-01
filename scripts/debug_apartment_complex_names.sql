-- Debugging Script: Check why apartment complex names aren't showing on listings
-- Run each section in order to diagnose the issue

-- ============================================================================
-- STEP 1: Check if apartment_complex_name column exists in profiles table
-- ============================================================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name = 'apartment_complex_name';

-- Expected: Should return 1 row showing the column exists
-- If empty: You need to run the migration first!

-- ============================================================================
-- STEP 2: Check all manager profiles and their apartment complex names
-- ============================================================================
SELECT
  id,
  email,
  username,
  user_type,
  apartment_complex_name,
  CASE
    WHEN apartment_complex_name IS NULL THEN '❌ NULL - needs update'
    WHEN apartment_complex_name = '' THEN '❌ Empty - needs update'
    ELSE '✅ Set'
  END as status
FROM profiles
WHERE user_type = 'manager'
ORDER BY apartment_complex_name NULLS FIRST;

-- Expected: All managers should have apartment_complex_name set
-- If NULL/empty: Run the update script to set them

-- ============================================================================
-- STEP 3: Check listings and their manager's apartment complex names (via JOIN)
-- ============================================================================
SELECT
  l.id as listing_id,
  l.title,
  l.manager_id,
  p.username as manager_username,
  p.apartment_complex_name,
  CASE
    WHEN p.apartment_complex_name IS NULL THEN '❌ Missing'
    WHEN p.apartment_complex_name = '' THEN '❌ Empty'
    ELSE '✅ ' || p.apartment_complex_name
  END as complex_status
FROM listings l
LEFT JOIN profiles p ON l.manager_id = p.id
ORDER BY p.apartment_complex_name NULLS FIRST
LIMIT 20;

-- Expected: All listings should show apartment_complex_name from their manager
-- If NULL: Manager doesn't have apartment_complex_name set

-- ============================================================================
-- STEP 4: Check NYC listings (if you're using listings_nyc table)
-- ============================================================================
-- Note: NYC listings use numeric Manager ID, not UUID, so JOIN might not work
SELECT
  "Unit ID",
  "Title",
  "Manager ID"
FROM listings_nyc
LIMIT 5;

-- ============================================================================
-- STEP 5: Test the exact query used by the frontend
-- ============================================================================
SELECT
  l.*,
  p.apartment_complex_name
FROM listings l
LEFT JOIN profiles p ON l.manager_id = p.id
LIMIT 5;

-- Expected: apartment_complex_name should appear in results
-- If NULL: Either migration not run or managers don't have it set

-- ============================================================================
-- STEP 6: Summary Statistics
-- ============================================================================
SELECT
  'Total Managers' as metric,
  COUNT(*) as count
FROM profiles
WHERE user_type = 'manager'
UNION ALL
SELECT
  'Managers with complex name set',
  COUNT(*)
FROM profiles
WHERE user_type = 'manager'
  AND apartment_complex_name IS NOT NULL
  AND apartment_complex_name != ''
UNION ALL
SELECT
  'Managers missing complex name',
  COUNT(*)
FROM profiles
WHERE user_type = 'manager'
  AND (apartment_complex_name IS NULL OR apartment_complex_name = '')
UNION ALL
SELECT
  'Total Listings',
  COUNT(*)
FROM listings
UNION ALL
SELECT
  'Listings with manager complex name',
  COUNT(*)
FROM listings l
INNER JOIN profiles p ON l.manager_id = p.id
WHERE p.apartment_complex_name IS NOT NULL
  AND p.apartment_complex_name != '';

-- ============================================================================
-- QUICK FIX: If column exists but values are NULL, run this:
-- ============================================================================
-- Uncomment and run if STEP 2 shows NULL values:
/*
UPDATE profiles
SET apartment_complex_name = 'test apartment'
WHERE user_type = 'manager'
  AND (apartment_complex_name IS NULL OR apartment_complex_name = '');
*/
