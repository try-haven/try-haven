-- Migration: Convert bedroom/bathroom to multi-select arrays
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Add temporary array columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS bedrooms_array NUMERIC[],
ADD COLUMN IF NOT EXISTS bathrooms_array NUMERIC[];

-- Step 2: Migrate data from existing columns to temporary array columns
DO $$
BEGIN
  -- Migrate from bedrooms_min/max if they exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='bedrooms_min') THEN
    UPDATE profiles
    SET bedrooms_array = (
      SELECT ARRAY(
        SELECT generate_series(bedrooms_min::integer, bedrooms_max::integer)
      )
    )
    WHERE bedrooms_min IS NOT NULL AND bedrooms_max IS NOT NULL;
  END IF;

  -- Migrate from single bedrooms column if it exists and is numeric
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='bedrooms'
    AND data_type = 'numeric'
  ) THEN
    UPDATE profiles
    SET bedrooms_array = ARRAY[bedrooms::numeric]
    WHERE bedrooms IS NOT NULL AND bedrooms_array IS NULL;
  END IF;

  -- Migrate bathrooms_min to array
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='bathrooms_min') THEN
    UPDATE profiles
    SET bathrooms_array = ARRAY[bathrooms_min::numeric]
    WHERE bathrooms_min IS NOT NULL;
  END IF;

  -- Migrate from single bathrooms column if it exists and is numeric
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='bathrooms'
    AND data_type = 'numeric'
  ) THEN
    UPDATE profiles
    SET bathrooms_array = ARRAY[bathrooms::numeric]
    WHERE bathrooms IS NOT NULL AND bathrooms_array IS NULL;
  END IF;
END $$;

-- Step 3: Drop old columns
ALTER TABLE profiles
DROP COLUMN IF EXISTS bedrooms,
DROP COLUMN IF EXISTS bathrooms,
DROP COLUMN IF EXISTS bedrooms_min,
DROP COLUMN IF EXISTS bedrooms_max,
DROP COLUMN IF EXISTS bathrooms_min,
DROP COLUMN IF EXISTS bathrooms_max,
DROP COLUMN IF EXISTS min_rating;

-- Step 4: Rename temporary columns to final names
ALTER TABLE profiles
RENAME COLUMN bedrooms_array TO bedrooms;

ALTER TABLE profiles
RENAME COLUMN bathrooms_array TO bathrooms;

-- Step 5: Add rating range and required amenities columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS rating_min NUMERIC,
ADD COLUMN IF NOT EXISTS rating_max NUMERIC,
ADD COLUMN IF NOT EXISTS required_amenities TEXT[];

-- Add comments
COMMENT ON COLUMN profiles.bedrooms IS 'Selected bedroom options (multi-select array)';
COMMENT ON COLUMN profiles.bathrooms IS 'Selected bathroom options (multi-select array)';
COMMENT ON COLUMN profiles.rating_min IS 'Minimum rating in range (0-5 scale)';
COMMENT ON COLUMN profiles.rating_max IS 'Maximum rating in range (0-5 scale)';
COMMENT ON COLUMN profiles.required_amenities IS 'Required amenities (hard filter - listings must have these)';
