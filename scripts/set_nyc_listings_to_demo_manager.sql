-- Set all NYC listings to use the demo-manager account
-- This allows them to display the apartment complex name via JOIN

-- Step 1: Find the demo-manager UUID
SELECT id, email, username, apartment_complex_name
FROM profiles
WHERE username = 'demo-manager' OR email LIKE '%demo-manager%'
LIMIT 1;

-- Step 2: Update all NYC listings to use demo-manager UUID
-- This uses a subquery to automatically get the demo-manager UUID
UPDATE listings_nyc
SET manager_uuid = (
  SELECT id
  FROM profiles
  WHERE username = 'demo-manager'
  LIMIT 1
)
WHERE manager_uuid IS NULL OR manager_uuid != (
  SELECT id
  FROM profiles
  WHERE username = 'demo-manager'
  LIMIT 1
);

-- Step 3: Verify the update
SELECT
  COUNT(*) as total_listings_updated
FROM listings_nyc
WHERE manager_uuid = (
  SELECT id
  FROM profiles
  WHERE username = 'demo-manager'
  LIMIT 1
);

-- Step 4: Test the JOIN to see apartment complex name
SELECT
  l."Unit ID",
  l."Title",
  l."Manager ID",
  l.manager_uuid,
  p.username as manager_username,
  p.apartment_complex_name,
  CASE
    WHEN p.apartment_complex_name IS NOT NULL THEN '✅ Will show in UI'
    ELSE '❌ Missing apartment name'
  END as display_status
FROM listings_nyc l
LEFT JOIN profiles p ON l.manager_uuid = p.id
LIMIT 10;

-- Step 5: Summary
SELECT
  'Total NYC Listings' as metric,
  COUNT(*) as count
FROM listings_nyc
UNION ALL
SELECT
  'Listings with manager_uuid',
  COUNT(*)
FROM listings_nyc
WHERE manager_uuid IS NOT NULL
UNION ALL
SELECT
  'Listings linked to demo-manager',
  COUNT(*)
FROM listings_nyc
WHERE manager_uuid = (
  SELECT id FROM profiles WHERE username = 'demo-manager' LIMIT 1
);
