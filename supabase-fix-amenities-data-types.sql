-- Fix amenities columns in listings_nyc table to be numeric (0/1) instead of text
-- This migration converts string-based amenities ("0"/"1") to proper integers (0/1)

-- First, let's check the current data types
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'listings_nyc'
AND column_name IN (
  'Washer/Dryer in unit',
  'Washer/Dryer in building',
  'Dishwasher',
  'AC',
  'Fireplace',
  'Pool'
)
ORDER BY column_name;

-- Convert text-based amenity columns to integers
-- Note: Some columns (Pets, Gym, Parking) are already numeric

-- Washer/Dryer in unit
ALTER TABLE listings_nyc
ALTER COLUMN "Washer/Dryer in unit" TYPE INTEGER
USING CASE
  WHEN "Washer/Dryer in unit" = '1' THEN 1
  WHEN "Washer/Dryer in unit" = '0' THEN 0
  WHEN "Washer/Dryer in unit"::INTEGER = 1 THEN 1
  ELSE 0
END;

-- Washer/Dryer in building
ALTER TABLE listings_nyc
ALTER COLUMN "Washer/Dryer in building" TYPE INTEGER
USING CASE
  WHEN "Washer/Dryer in building" = '1' THEN 1
  WHEN "Washer/Dryer in building" = '0' THEN 0
  WHEN "Washer/Dryer in building"::INTEGER = 1 THEN 1
  ELSE 0
END;

-- Dishwasher
ALTER TABLE listings_nyc
ALTER COLUMN "Dishwasher" TYPE INTEGER
USING CASE
  WHEN "Dishwasher" = '1' THEN 1
  WHEN "Dishwasher" = '0' THEN 0
  WHEN "Dishwasher"::INTEGER = 1 THEN 1
  ELSE 0
END;

-- AC
ALTER TABLE listings_nyc
ALTER COLUMN "AC" TYPE INTEGER
USING CASE
  WHEN "AC" = '1' THEN 1
  WHEN "AC" = '0' THEN 0
  WHEN "AC"::INTEGER = 1 THEN 1
  ELSE 0
END;

-- Fireplace
ALTER TABLE listings_nyc
ALTER COLUMN "Fireplace" TYPE INTEGER
USING CASE
  WHEN "Fireplace" = '1' THEN 1
  WHEN "Fireplace" = '0' THEN 0
  WHEN "Fireplace"::INTEGER = 1 THEN 1
  ELSE 0
END;

-- Pool
ALTER TABLE listings_nyc
ALTER COLUMN "Pool" TYPE INTEGER
USING CASE
  WHEN "Pool" = '1' THEN 1
  WHEN "Pool" = '0' THEN 0
  WHEN "Pool"::INTEGER = 1 THEN 1
  ELSE 0
END;

-- Verify the changes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'listings_nyc'
AND column_name IN (
  'Washer/Dryer in unit',
  'Washer/Dryer in building',
  'Dishwasher',
  'AC',
  'Pets',
  'Fireplace',
  'Gym',
  'Parking',
  'Pool'
)
ORDER BY column_name;

-- Expected result: All amenity columns should be INTEGER type
