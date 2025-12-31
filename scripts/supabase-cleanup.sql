-- Cleanup script - Run this FIRST to remove existing objects
-- This allows you to run the migration cleanly

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can view listings" ON listings;
DROP POLICY IF EXISTS "Managers can insert listings" ON listings;
DROP POLICY IF EXISTS "Managers can update own listings" ON listings;
DROP POLICY IF EXISTS "Managers can delete own listings" ON listings;
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can view own reviewed listings" ON reviewed_listings;
DROP POLICY IF EXISTS "Users can insert own reviewed listings" ON reviewed_listings;
DROP POLICY IF EXISTS "Users can delete own reviewed listings" ON reviewed_listings;
DROP POLICY IF EXISTS "Users can view own liked listings" ON liked_listings;
DROP POLICY IF EXISTS "Users can insert own liked listings" ON liked_listings;
DROP POLICY IF EXISTS "Users can delete own liked listings" ON liked_listings;
DROP POLICY IF EXISTS "Anyone can view listing changes" ON listing_changes;
DROP POLICY IF EXISTS "Authenticated users can insert listing changes" ON listing_changes;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_listings_updated_at ON listings;
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Note: We don't drop tables here to preserve existing data
-- If you want to start completely fresh, uncomment the lines below:
-- DROP TABLE IF EXISTS listing_changes CASCADE;
-- DROP TABLE IF EXISTS liked_listings CASCADE;
-- DROP TABLE IF EXISTS reviewed_listings CASCADE;
-- DROP TABLE IF EXISTS reviews CASCADE;
-- DROP TABLE IF EXISTS listings CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;
