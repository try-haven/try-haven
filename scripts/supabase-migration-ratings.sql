-- Add rating fields to listings table
-- Run this SQL in your Supabase SQL Editor

-- Add average_rating and total_ratings columns to listings table
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS average_rating NUMERIC DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0 CHECK (total_ratings >= 0);

-- Create function to update listing ratings when reviews change
CREATE OR REPLACE FUNCTION update_listing_ratings()
RETURNS TRIGGER AS $$
DECLARE
  listing_uuid UUID;
  avg_rating NUMERIC;
  total_count INTEGER;
BEGIN
  -- Get the listing_id as UUID
  -- The listing_id in reviews table is TEXT, so we need to handle both cases
  IF TG_OP = 'DELETE' THEN
    listing_uuid := OLD.listing_id::UUID;
  ELSE
    listing_uuid := NEW.listing_id::UUID;
  END IF;

  -- Calculate average rating and total count for this listing
  SELECT
    COALESCE(AVG(rating), 0)::NUMERIC,
    COUNT(*)::INTEGER
  INTO avg_rating, total_count
  FROM reviews
  WHERE listing_id = listing_uuid::TEXT;

  -- Update the listings table
  UPDATE listings
  SET
    average_rating = ROUND(avg_rating, 2),
    total_ratings = total_count
  WHERE id = listing_uuid;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for review INSERT, UPDATE, DELETE
DROP TRIGGER IF EXISTS update_listing_ratings_on_insert ON reviews;
CREATE TRIGGER update_listing_ratings_on_insert
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_ratings();

DROP TRIGGER IF EXISTS update_listing_ratings_on_update ON reviews;
CREATE TRIGGER update_listing_ratings_on_update
  AFTER UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_ratings();

DROP TRIGGER IF EXISTS update_listing_ratings_on_delete ON reviews;
CREATE TRIGGER update_listing_ratings_on_delete
  AFTER DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_ratings();

-- Backfill existing listings with calculated ratings
UPDATE listings l
SET
  average_rating = COALESCE((
    SELECT ROUND(AVG(rating)::NUMERIC, 2)
    FROM reviews r
    WHERE r.listing_id = l.id::TEXT
  ), 0),
  total_ratings = COALESCE((
    SELECT COUNT(*)::INTEGER
    FROM reviews r
    WHERE r.listing_id = l.id::TEXT
  ), 0);

COMMENT ON COLUMN listings.average_rating IS 'Average rating from reviews (0-5 scale), automatically calculated';
COMMENT ON COLUMN listings.total_ratings IS 'Total number of ratings/reviews, automatically calculated';
