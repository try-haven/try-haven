-- Migration: Update bedroom/bathroom to ranges and ensure min_rating exists
-- Run this SQL in your Supabase SQL Editor

-- Add new range columns for bedrooms and bathrooms
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS bedrooms_min INTEGER,
ADD COLUMN IF NOT EXISTS bedrooms_max INTEGER,
ADD COLUMN IF NOT EXISTS bathrooms_min NUMERIC,
ADD COLUMN IF NOT EXISTS bathrooms_max NUMERIC;

-- Migrate existing single values to min/max ranges
-- If user had "bedrooms: 2", set both min and max to 2
UPDATE profiles
SET bedrooms_min = bedrooms,
    bedrooms_max = bedrooms
WHERE bedrooms IS NOT NULL AND bedrooms_min IS NULL;

UPDATE profiles
SET bathrooms_min = bathrooms,
    bathrooms_max = bathrooms
WHERE bathrooms IS NOT NULL AND bathrooms_min IS NULL;

-- Drop old single-value columns (optional - can keep for backwards compatibility)
-- ALTER TABLE profiles DROP COLUMN IF EXISTS bedrooms;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS bathrooms;

-- Add min_rating if it doesn't exist (for hard filtering)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS min_rating NUMERIC;

-- Add comments
COMMENT ON COLUMN profiles.bedrooms_min IS 'Minimum number of bedrooms (hard filter)';
COMMENT ON COLUMN profiles.bedrooms_max IS 'Maximum number of bedrooms (hard filter)';
COMMENT ON COLUMN profiles.bathrooms_min IS 'Minimum number of bathrooms (hard filter)';
COMMENT ON COLUMN profiles.bathrooms_max IS 'Maximum number of bathrooms (hard filter)';
COMMENT ON COLUMN profiles.min_rating IS 'Minimum average rating (0-5 scale, hard filter)';
