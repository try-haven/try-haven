-- Add property features weight column to profiles table
-- This separates physical property characteristics (sqft, age, renovation)
-- from listing quality (photos, description)

-- Step 1: Drop old constraint FIRST (before adding column)
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS weights_sum_check;

-- Step 2: Add new column WITHOUT default initially (to avoid constraint violations)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS weight_property_features INTEGER
  CHECK (weight_property_features >= 0 AND weight_property_features <= 100);

-- Step 3: Migrate existing users to new weight distribution
-- This must happen BEFORE adding the new constraint
UPDATE profiles
SET
  weight_distance = 30,          -- 40 -> 30 (-25%)
  weight_amenities = 30,         -- 35 -> 30 (-14%)
  weight_property_features = 20, -- NEW category
  weight_quality = 15,           -- Unchanged
  weight_rating = 5              -- 10 -> 5 (-50%)
WHERE
  weight_distance IS NOT NULL;   -- Only update rows that have weights set

-- Step 4: Set default for new rows going forward
ALTER TABLE profiles
ALTER COLUMN weight_property_features SET DEFAULT 20;

-- Step 5: Add new constraint (5 weights sum to 100)
-- Now all existing rows should have valid values
ALTER TABLE profiles
ADD CONSTRAINT weights_sum_check
CHECK (
  (weight_distance + weight_amenities + weight_property_features + weight_quality + weight_rating = 100)
  OR
  (weight_distance IS NULL AND weight_amenities IS NULL AND weight_property_features IS NULL
   AND weight_quality IS NULL AND weight_rating IS NULL)
);

-- Step 6: Handle any rounding errors to ensure sum = 100
UPDATE profiles
SET weight_rating = 100 - (weight_distance + weight_amenities + weight_property_features + weight_quality)
WHERE (weight_distance + weight_amenities + weight_property_features + weight_quality + weight_rating) != 100
  AND weight_distance IS NOT NULL;

-- Step 7: Add helpful comment
COMMENT ON COLUMN profiles.weight_property_features IS
  'Percentage weight (0-100) for property features (sqft, building age, renovation) in match scoring';
