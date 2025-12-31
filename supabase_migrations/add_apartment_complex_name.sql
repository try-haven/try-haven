-- Add apartment complex name column to profiles table for manager verification
ALTER TABLE profiles
ADD COLUMN apartment_complex_name TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN profiles.apartment_complex_name IS 'Name of the apartment complex the manager represents (required for managers during signup verification)';
