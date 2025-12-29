-- Drop ml_model_weights column from profiles table
-- This column is no longer needed as we're using simpler weight-based scoring

-- Drop the index first
DROP INDEX IF EXISTS idx_profiles_has_ml_model;

-- Drop the column
ALTER TABLE profiles
DROP COLUMN IF EXISTS ml_model_weights;

-- Verify the column was removed
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name = 'ml_model_weights';
-- Should return no rows
