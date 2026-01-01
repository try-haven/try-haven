-- Add price_history column to listings_nyc table
-- Stores all-time price changes as JSONB array
-- Format: [{"timestamp": "ISO date", "old_price": number, "new_price": number}, ...]

ALTER TABLE listings_nyc
ADD COLUMN IF NOT EXISTS price_history JSONB DEFAULT '[]'::jsonb;

-- Add index for faster queries on price_history
CREATE INDEX IF NOT EXISTS idx_listings_nyc_price_history
ON listings_nyc USING GIN (price_history);

-- Add comment explaining the column
COMMENT ON COLUMN listings_nyc.price_history IS 'Array of price changes over time. Each entry has timestamp, old_price, and new_price.';
