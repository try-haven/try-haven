-- Add weights_locked column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS weights_locked BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN profiles.weights_locked IS
'If true, prevents ML model from automatically updating scoring weights (user has manually customized them)';

-- Create index for faster queries (optional, useful if we want to track how many users have locked weights)
CREATE INDEX IF NOT EXISTS idx_profiles_weights_locked
ON profiles (weights_locked)
WHERE weights_locked = TRUE;
