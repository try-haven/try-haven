-- Add latitude, longitude, and ratings columns to listings_nyc table

-- Add coordinate columns for geocoding
ALTER TABLE listings_nyc
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Add ratings columns
ALTER TABLE listings_nyc
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) CHECK (average_rating >= 0 AND average_rating <= 5),
ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_listings_nyc_coordinates
ON listings_nyc (latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_listings_nyc_rating
ON listings_nyc (average_rating)
WHERE average_rating IS NOT NULL;

-- Optional: Add comments for documentation
COMMENT ON COLUMN listings_nyc.latitude IS 'Latitude coordinate for geocoding and distance calculations';
COMMENT ON COLUMN listings_nyc.longitude IS 'Longitude coordinate for geocoding and distance calculations';
COMMENT ON COLUMN listings_nyc.average_rating IS 'Average rating from reviews (0-5 scale)';
COMMENT ON COLUMN listings_nyc.total_ratings IS 'Total number of ratings received';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'listings_nyc'
AND column_name IN ('latitude', 'longitude', 'average_rating', 'total_ratings');
