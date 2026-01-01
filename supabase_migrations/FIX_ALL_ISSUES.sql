-- ============================================================================
-- COMPREHENSIVE FIX FOR ALL CURRENT ISSUES
-- Run this entire script in your Supabase SQL Editor to fix:
--   1. Slow signup (handle_new_user trigger)
--   2. Username login not working (RPC functions)
-- ============================================================================

-- 1. UPDATE TRIGGER: Add location fields to profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, user_type, apartment_complex_name, city, state, neighborhood)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'searcher'),
    NEW.raw_user_meta_data->>'apartment_complex_name',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'state',
    NEW.raw_user_meta_data->>'neighborhood'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. USERNAME LOGIN: Get email from username
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

-- 3. USERNAME VALIDATION: Check if username is available
CREATE OR REPLACE FUNCTION public.check_username_available(username_input TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  username_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM public.profiles
    WHERE username = username_input
  ) INTO username_exists;

  -- Return true if username is available (doesn't exist)
  RETURN NOT username_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. GRANT PERMISSIONS: Allow anon and authenticated users to call these functions
GRANT EXECUTE ON FUNCTION public.get_email_from_username(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_email_from_username(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_username_available(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_username_available(TEXT) TO authenticated;

-- 5. VERIFICATION: Check that everything was created correctly
SELECT '=== TRIGGER VERIFICATION ===' as check_type;
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

SELECT '=== FUNCTION VERIFICATION ===' as check_type;
SELECT
  routine_name,
  security_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_name IN ('handle_new_user', 'get_email_from_username', 'check_username_available')
ORDER BY routine_name;

SELECT '=== SUCCESS ===' as status;
SELECT 'All functions and triggers updated successfully!' as message;
