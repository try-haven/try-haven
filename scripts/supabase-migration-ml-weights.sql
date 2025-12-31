-- Add ML model weights column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS ml_model_weights JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN profiles.ml_model_weights IS
'Trained ML model weights for personalized recommendations (TensorFlow.js logistic regression)';

-- Create index for faster queries (optional, useful for analytics)
CREATE INDEX IF NOT EXISTS idx_profiles_has_ml_model
ON profiles ((ml_model_weights IS NOT NULL));
