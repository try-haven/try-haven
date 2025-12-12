-- Migration: Add learned preferences fields to profiles table
-- Run this SQL in your Supabase SQL Editor

-- Add learned preferences columns to profiles table
-- These are automatically learned from user's swipe behavior
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS learned_price_min INTEGER,
ADD COLUMN IF NOT EXISTS learned_price_max INTEGER,
ADD COLUMN IF NOT EXISTS learned_bedrooms INTEGER,
ADD COLUMN IF NOT EXISTS learned_bathrooms NUMERIC,
ADD COLUMN IF NOT EXISTS learned_sqft_min INTEGER,
ADD COLUMN IF NOT EXISTS learned_sqft_max INTEGER,
ADD COLUMN IF NOT EXISTS learned_preferred_amenities JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS learned_preferred_locations TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS learned_avg_image_count NUMERIC,
ADD COLUMN IF NOT EXISTS learned_avg_description_length INTEGER,
ADD COLUMN IF NOT EXISTS learned_preferences_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS min_rating NUMERIC CHECK (min_rating >= 0 AND min_rating <= 5);

-- Add comments to document these fields
COMMENT ON COLUMN profiles.learned_price_min IS 'Learned minimum price from liked listings (median - 20%)';
COMMENT ON COLUMN profiles.learned_price_max IS 'Learned maximum price from liked listings (median + 20%)';
COMMENT ON COLUMN profiles.learned_bedrooms IS 'Learned bedroom preference from liked listings (median)';
COMMENT ON COLUMN profiles.learned_bathrooms IS 'Learned bathroom preference from liked listings (median)';
COMMENT ON COLUMN profiles.learned_sqft_min IS 'Learned minimum sqft from liked listings (median - 20%)';
COMMENT ON COLUMN profiles.learned_sqft_max IS 'Learned maximum sqft from liked listings (median + 20%)';
COMMENT ON COLUMN profiles.learned_preferred_amenities IS 'JSON object mapping amenity name to preference weight (contrast learned from likes vs dislikes)';
COMMENT ON COLUMN profiles.learned_preferred_locations IS 'Array of preferred city/neighborhood keywords, learned from liked listings (within user''s state)';
COMMENT ON COLUMN profiles.learned_avg_image_count IS 'Average number of images in liked listings (quality signal)';
COMMENT ON COLUMN profiles.learned_avg_description_length IS 'Average description length in liked listings (quality signal)';
COMMENT ON COLUMN profiles.learned_preferences_updated_at IS 'Timestamp when learned preferences were last calculated';
COMMENT ON COLUMN profiles.min_rating IS 'User-set minimum rating filter (0-5 scale, nullable)';

-- Create index for faster JSON queries on amenities
CREATE INDEX IF NOT EXISTS idx_profiles_learned_amenities ON profiles USING GIN (learned_preferred_amenities);

-- Notes on the learning strategy:
-- 1. Explicit user preferences (price_min, price_max, bedrooms, etc.) are used for HARD FILTERS
-- 2. Learned preferences (learned_*) are calculated from swipe behavior and used:
--    a) As fallback filters when user hasn't set explicit preferences
--    b) For SOFT SCORING of amenities, locations (city/neighborhood within state), and quality
-- 3. Location learning works as:
--    - HARD FILTER: State level (from user's explicit address preference)
--    - SOFT SCORING: City/neighborhood level (learned from behavior within that state)
