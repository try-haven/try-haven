-- Update all manager profiles without apartment_complex_name to 'test apartment'
-- This is useful for testing or setting default values for existing managers

-- STEP 1: Check current state (run this first to see what will be updated)
SELECT
  id,
  email,
  username,
  user_type,
  apartment_complex_name
FROM profiles
WHERE user_type = 'manager'
  AND (apartment_complex_name IS NULL OR apartment_complex_name = '');

-- STEP 2: Update all managers without apartment_complex_name
UPDATE profiles
SET apartment_complex_name = 'test apartment'
WHERE user_type = 'manager'
  AND (apartment_complex_name IS NULL OR apartment_complex_name = '');

-- STEP 3: Verify the update
SELECT
  id,
  email,
  username,
  user_type,
  apartment_complex_name
FROM profiles
WHERE user_type = 'manager'
ORDER BY username;

-- STEP 4: Summary
SELECT
  COUNT(*) as total_managers_updated
FROM profiles
WHERE user_type = 'manager'
  AND apartment_complex_name = 'test apartment';
