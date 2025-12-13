-- Migration: Drop learned_bedrooms and learned_bathrooms columns from profiles table
-- These fields were removed from the learned preferences system as bedrooms/bathrooms
-- are handled as hard filters from explicit user preferences, not learned preferences
-- Run this SQL in your Supabase SQL Editor

-- Drop the columns if they exist
ALTER TABLE profiles
DROP COLUMN IF EXISTS learned_bedrooms,
DROP COLUMN IF EXISTS learned_bathrooms;

-- Note: This migration is safe to run as the code has already been updated to not
-- reference these columns. Any existing data in these columns will be lost.
