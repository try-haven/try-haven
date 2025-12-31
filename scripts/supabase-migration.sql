-- Haven App Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
-- This extends Supabase Auth users with additional profile data
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  name TEXT,
  user_type TEXT NOT NULL DEFAULT 'searcher' CHECK (user_type IN ('searcher', 'manager')),
  address TEXT,
  commute_options TEXT[], -- Array of commute options: car, public-transit, walk, bike
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Listings Table (apartment listings created by managers)
CREATE TABLE IF NOT EXISTS listings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  manager_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  address TEXT NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  bedrooms INTEGER NOT NULL CHECK (bedrooms >= 0),
  bathrooms NUMERIC NOT NULL CHECK (bathrooms >= 0),
  sqft INTEGER NOT NULL CHECK (sqft > 0),
  images TEXT[], -- Array of image URLs
  amenities TEXT[], -- Array of amenity strings
  description TEXT NOT NULL,
  available_from TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews Table (for apartment reviews)
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listing_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL, -- Display name (can be anonymous)
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviewed Listings Table (tracks which listings a user has reviewed/swiped)
CREATE TABLE IF NOT EXISTS reviewed_listings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  listing_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- Liked Listings Table
CREATE TABLE IF NOT EXISTS liked_listings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  listing_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- Listing Changes Table (for price history tracking)
CREATE TABLE IF NOT EXISTS listing_changes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listing_id TEXT NOT NULL,
  field TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_listings_manager_id ON listings(manager_id);
CREATE INDEX IF NOT EXISTS idx_reviews_listing_id ON reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviewed_listings_user_id ON reviewed_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_reviewed_listings_listing_id ON reviewed_listings(listing_id);
CREATE INDEX IF NOT EXISTS idx_liked_listings_user_id ON liked_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_liked_listings_listing_id ON liked_listings(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_changes_listing_id ON listing_changes(listing_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewed_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE liked_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_changes ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Listings Policies
-- Anyone can view all listings (public data)
CREATE POLICY "Anyone can view listings" ON listings
  FOR SELECT USING (true);

-- Only managers can insert listings
CREATE POLICY "Managers can insert listings" ON listings
  FOR INSERT WITH CHECK (auth.uid() = manager_id);

-- Managers can update their own listings
CREATE POLICY "Managers can update own listings" ON listings
  FOR UPDATE USING (auth.uid() = manager_id);

-- Managers can delete their own listings
CREATE POLICY "Managers can delete own listings" ON listings
  FOR DELETE USING (auth.uid() = manager_id);

-- Reviews Policies
-- Anyone can view reviews (public data)
CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT USING (true);

-- Authenticated users can insert reviews
CREATE POLICY "Authenticated users can insert reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews" ON reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Reviewed Listings Policies
-- Users can view their own reviewed listings
CREATE POLICY "Users can view own reviewed listings" ON reviewed_listings
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own reviewed listings
CREATE POLICY "Users can insert own reviewed listings" ON reviewed_listings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reviewed listings
CREATE POLICY "Users can delete own reviewed listings" ON reviewed_listings
  FOR DELETE USING (auth.uid() = user_id);

-- Liked Listings Policies
-- Users can view their own liked listings
CREATE POLICY "Users can view own liked listings" ON liked_listings
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own liked listings
CREATE POLICY "Users can insert own liked listings" ON liked_listings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own liked listings
CREATE POLICY "Users can delete own liked listings" ON liked_listings
  FOR DELETE USING (auth.uid() = user_id);

-- Listing Changes Policies
-- Everyone can view listing changes (public data)
CREATE POLICY "Anyone can view listing changes" ON listing_changes
  FOR SELECT USING (true);

-- Only authenticated users can insert listing changes
CREATE POLICY "Authenticated users can insert listing changes" ON listing_changes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'searcher')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get email from username (for login)
-- This runs with SECURITY DEFINER to bypass RLS and allow username-based login
CREATE OR REPLACE FUNCTION public.get_email_from_username(username_input TEXT)
RETURNS TEXT AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email
  FROM public.profiles
  WHERE username = username_input
  LIMIT 1;

  RETURN user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
