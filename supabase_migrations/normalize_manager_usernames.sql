-- Normalize existing manager usernames to match the new format
-- Removes spaces and special characters, converts to lowercase
-- Example: "The Oaks Apartments" → "theoaksapartments"

-- Update manager usernames to normalized format
UPDATE profiles
SET username = LOWER(REGEXP_REPLACE(username, '[^a-zA-Z0-9]', '', 'g'))
WHERE user_type = 'manager'
  AND username ~ '[^a-z0-9]'; -- Only update if username contains non-alphanumeric chars

-- Verify the changes
SELECT
  user_type,
  username,
  apartment_complex_name,
  email
FROM profiles
WHERE user_type = 'manager'
ORDER BY created_at DESC;
