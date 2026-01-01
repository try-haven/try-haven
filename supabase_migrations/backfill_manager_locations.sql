-- Backfill location data for existing managers who don't have it set
-- This ensures backwards compatibility for managers created before location tracking

UPDATE profiles
SET
  city = 'New York',
  state = 'NY',
  neighborhood = 'Manhattan'
WHERE
  user_type = 'manager'
  AND (city IS NULL OR city = '' OR state IS NULL OR state = '' OR neighborhood IS NULL OR neighborhood = '');

-- Verify the update
SELECT
  username,
  apartment_complex_name,
  city,
  state,
  neighborhood
FROM profiles
WHERE user_type = 'manager';
