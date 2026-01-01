-- Manager Verification Migration
-- This migration adds apartment complex name verification for property managers

-- Step 1: Add apartment_complex_name column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS apartment_complex_name TEXT;

COMMENT ON COLUMN profiles.apartment_complex_name IS 'Name of the apartment complex the manager represents (required for managers during signup verification)';

-- Step 2: Update the handle_new_user trigger function to include apartment_complex_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, user_type, apartment_complex_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'searcher'),
    NEW.raw_user_meta_data->>'apartment_complex_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The trigger itself doesn't need to be recreated as it already exists
-- and will automatically use the updated function
