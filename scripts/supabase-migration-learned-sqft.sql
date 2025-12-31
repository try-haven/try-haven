-- Add learned sqft preference column to profiles table
-- This allows the system to learn users' preferred square footage from their swipe history
-- Grouped by bedroom count for better personalization

-- Drop old column if it exists (migration from single value to bedroom-keyed object)
ALTER TABLE profiles
DROP COLUMN IF EXISTS learned_avg_sqft;

-- Add column for bedroom-specific learned average sqft
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS learned_avg_sqft_by_bedrooms JSONB;

-- Add comment explaining the column
COMMENT ON COLUMN profiles.learned_avg_sqft_by_bedrooms IS
  'Median square footage from liked listings grouped by bedroom count (learned from swipe behavior). Format: {"0": 550, "1": 750, "2": 1100, "3": 1400}';
