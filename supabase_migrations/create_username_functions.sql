-- Create all username-related RPC functions for login and signup
-- Run this in your Supabase SQL Editor

-- 1. Function to get email from username (for login)
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

-- 2. Function to check if username is available (for signup)
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

-- Grant execute permissions to all users (needed for login/signup before authentication)
GRANT EXECUTE ON FUNCTION public.get_email_from_username(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_email_from_username(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_username_available(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_username_available(TEXT) TO authenticated;

-- Verify functions were created
SELECT
  routine_name,
  routine_schema,
  security_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_name IN ('get_email_from_username', 'check_username_available')
ORDER BY routine_name;
