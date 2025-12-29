-- Add learned sqft preference column to profiles table
-- This allows the system to learn users' preferred square footage from their swipe history

-- Add column for learned average sqft
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS learned_avg_sqft INTEGER;

-- Add comment explaining the column
COMMENT ON COLUMN profiles.learned_avg_sqft IS
  'Median square footage from liked listings (learned from swipe behavior)';
