-- Migration: Add apartment preference fields to profiles table
-- Run this SQL in your Supabase SQL Editor

-- Add new preference columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS price_min INTEGER CHECK (price_min >= 0),
ADD COLUMN IF NOT EXISTS price_max INTEGER CHECK (price_max >= 0),
ADD COLUMN IF NOT EXISTS bedrooms INTEGER CHECK (bedrooms >= 0),
ADD COLUMN IF NOT EXISTS bathrooms NUMERIC CHECK (bathrooms >= 0),
ADD COLUMN IF NOT EXISTS sqft_min INTEGER CHECK (sqft_min >= 0),
ADD COLUMN IF NOT EXISTS sqft_max INTEGER CHECK (sqft_max >= 0);

-- Add check constraint to ensure price_min <= price_max when both are set
ALTER TABLE profiles
ADD CONSTRAINT price_range_valid
CHECK (price_min IS NULL OR price_max IS NULL OR price_min <= price_max);

-- Add check constraint to ensure sqft_min <= sqft_max when both are set
ALTER TABLE profiles
ADD CONSTRAINT sqft_range_valid
CHECK (sqft_min IS NULL OR sqft_max IS NULL OR sqft_min <= sqft_max);

-- Add comment to document these fields
COMMENT ON COLUMN profiles.price_min IS 'Minimum monthly rent preference in dollars (nullable - if null, learn from behavior)';
COMMENT ON COLUMN profiles.price_max IS 'Maximum monthly rent preference in dollars (nullable - if null, learn from behavior)';
COMMENT ON COLUMN profiles.bedrooms IS 'Preferred number of bedrooms (nullable - if null, learn from behavior)';
COMMENT ON COLUMN profiles.bathrooms IS 'Preferred number of bathrooms (nullable - if null, learn from behavior)';
COMMENT ON COLUMN profiles.sqft_min IS 'Minimum square footage preference (nullable - if null, learn from behavior)';
COMMENT ON COLUMN profiles.sqft_max IS 'Maximum square footage preference (nullable - if null, learn from behavior)';
