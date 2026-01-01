-- Populate manager_uuid in existing NYC listings
-- This links NYC listings to manager profiles for JOIN queries

-- NOTE: This assumes you have a way to map the numeric "Manager ID" to the UUID
-- If your NYC listings were imported from external data and don't have proper manager references,
-- you'll need to manually set manager_uuid for each listing

-- Option 1: If you have a single test manager, set all listings to that manager
-- (Replace 'YOUR-MANAGER-UUID-HERE' with the actual UUID from profiles table)
/*
UPDATE listings_nyc
SET manager_uuid = 'YOUR-MANAGER-UUID-HERE'
WHERE manager_uuid IS NULL;
*/

-- Option 2: Get a manager UUID from profiles table (for testing)
-- First, find a manager's UUID:
SELECT id, email, username, apartment_complex_name
FROM profiles
WHERE user_type = 'manager'
LIMIT 1;

-- Then use that UUID in the update:
-- UPDATE listings_nyc SET manager_uuid = 'the-uuid-from-above' WHERE manager_uuid IS NULL;

-- Verify the update
SELECT
  "Unit ID",
  "Title",
  "Manager ID",
  manager_uuid,
  CASE
    WHEN manager_uuid IS NULL THEN '❌ Missing - listing won''t show apartment name'
    ELSE '✅ Set'
  END as status
FROM listings_nyc
LIMIT 20;

-- Check if JOIN works
SELECT
  l."Unit ID",
  l."Title",
  p.username as manager_username,
  p.apartment_complex_name
FROM listings_nyc l
LEFT JOIN profiles p ON l.manager_uuid = p.id
LIMIT 10;
