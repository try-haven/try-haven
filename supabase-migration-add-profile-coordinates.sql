-- Migration: Add latitude and longitude to profiles table
-- Run this SQL in your Supabase SQL Editor

-- Add latitude and longitude columns to profiles table
-- These store the geocoded coordinates of the user's preferred address
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Add comments to document these fields
COMMENT ON COLUMN profiles.latitude IS 'Latitude of user''s preferred address (geocoded)';
COMMENT ON COLUMN profiles.longitude IS 'Longitude of user''s preferred address (geocoded)';

-- Note: These coordinates are used for distance-based ranking of listings
-- When a user sets their address preference, we geocode it and store the coordinates
-- The ranking algorithm then calculates distance between user's location and each listing
