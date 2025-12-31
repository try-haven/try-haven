-- Add scoring weight columns to profiles table
-- These allow users to customize how much each factor contributes to the match score
-- Weights are stored as percentages (0-100) and should sum to 100

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS weight_distance INTEGER DEFAULT 40 CHECK (weight_distance >= 0 AND weight_distance <= 100),
ADD COLUMN IF NOT EXISTS weight_amenities INTEGER DEFAULT 35 CHECK (weight_amenities >= 0 AND weight_amenities <= 100),
ADD COLUMN IF NOT EXISTS weight_quality INTEGER DEFAULT 15 CHECK (weight_quality >= 0 AND weight_quality <= 100),
ADD COLUMN IF NOT EXISTS weight_rating INTEGER DEFAULT 10 CHECK (weight_rating >= 0 AND weight_rating <= 100);

-- Add a check constraint to ensure weights sum to 100
-- Note: This constraint will be validated when weights are updated together
ALTER TABLE profiles
ADD CONSTRAINT weights_sum_check
CHECK (
  (weight_distance + weight_amenities + weight_quality + weight_rating = 100)
  OR
  (weight_distance IS NULL AND weight_amenities IS NULL AND weight_quality IS NULL AND weight_rating IS NULL)
);

-- Set default weights for existing users (if NULL)
UPDATE profiles
SET
  weight_distance = 40,
  weight_amenities = 35,
  weight_quality = 15,
  weight_rating = 10
WHERE
  weight_distance IS NULL
  OR weight_amenities IS NULL
  OR weight_quality IS NULL
  OR weight_rating IS NULL;

-- Add helpful comment
COMMENT ON COLUMN profiles.weight_distance IS 'Percentage weight (0-100) for distance/location in match scoring';
COMMENT ON COLUMN profiles.weight_amenities IS 'Percentage weight (0-100) for amenities in match scoring';
COMMENT ON COLUMN profiles.weight_quality IS 'Percentage weight (0-100) for listing quality (photos, description) in match scoring';
COMMENT ON COLUMN profiles.weight_rating IS 'Percentage weight (0-100) for rating/reviews in match scoring';
