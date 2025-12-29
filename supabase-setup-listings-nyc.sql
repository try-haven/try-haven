-- Enable RLS on listings_nyc table (if not already enabled)
ALTER TABLE listings_nyc ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON listings_nyc;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON listings_nyc;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON listings_nyc;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON listings_nyc;

-- Create policy to allow all users to read listings (public access)
CREATE POLICY "Enable read access for all users"
ON listings_nyc
FOR SELECT
TO public
USING (true);

-- Create policy to allow authenticated users to insert listings
CREATE POLICY "Enable insert for authenticated users only"
ON listings_nyc
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy to allow authenticated users to update their own listings
CREATE POLICY "Enable update for authenticated users only"
ON listings_nyc
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy to allow authenticated users to delete their own listings
CREATE POLICY "Enable delete for authenticated users only"
ON listings_nyc
FOR DELETE
TO authenticated
USING (true);

-- Grant necessary permissions
GRANT SELECT ON listings_nyc TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON listings_nyc TO authenticated;

-- Verify the table exists and check first row
-- Run this separately to see if there's data:
-- SELECT * FROM listings_nyc LIMIT 1;
