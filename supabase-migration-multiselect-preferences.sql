-- Migration: Convert bedroom/bathroom ranges and rating to multi-select arrays
-- Run this SQL in your Supabase SQL Editor

-- Drop old range columns
ALTER TABLE profiles
DROP COLUMN IF EXISTS bedrooms_min,
DROP COLUMN IF EXISTS bedrooms_max,
DROP COLUMN IF EXISTS bathrooms_min,
DROP COLUMN IF EXISTS bathrooms_max,
DROP COLUMN IF EXISTS min_rating;

-- Add new array columns for bedrooms and bathrooms
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS bedrooms NUMERIC[],
ADD COLUMN IF NOT EXISTS bathrooms NUMERIC[];

-- Add rating range columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS rating_min NUMERIC,
ADD COLUMN IF NOT EXISTS rating_max NUMERIC;

-- Add comments
COMMENT ON COLUMN profiles.bedrooms IS 'Selected bedroom options (multi-select array)';
COMMENT ON COLUMN profiles.bathrooms IS 'Selected bathroom options (multi-select array)';
COMMENT ON COLUMN profiles.rating_min IS 'Minimum rating in range (0-5 scale)';
COMMENT ON COLUMN profiles.rating_max IS 'Maximum rating in range (0-5 scale)';
