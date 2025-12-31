-- Add view and neighborhood filter columns to profiles table
-- These allow users to filter listings by view type and specific neighborhoods

-- Add required_view column (JSONB array of view types)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS required_view JSONB DEFAULT NULL;

-- Add required_neighborhoods column (JSONB array of neighborhoods)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS required_neighborhoods JSONB DEFAULT NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_required_view ON profiles USING GIN (required_view);
CREATE INDEX IF NOT EXISTS idx_profiles_required_neighborhoods ON profiles USING GIN (required_neighborhoods);

-- Verify the columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('required_view', 'required_neighborhoods');
