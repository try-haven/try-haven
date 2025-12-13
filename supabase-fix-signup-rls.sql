-- Fix: Allow unauthenticated users to check if username exists during signup
-- This is needed for the signup flow to validate username availability

-- Note: We don't actually need an RLS policy for the SELECT approach
-- Instead, we'll use the secure function approach below which is safer

-- Alternative: Create a custom function instead of allowing direct SELECT
-- This is more secure but requires updating the UserContext code
CREATE OR REPLACE FUNCTION public.check_username_available(username_input TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  username_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO username_count
  FROM public.profiles
  WHERE username = username_input
  LIMIT 1;

  RETURN username_count = 0;  -- Returns true if available, false if taken
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
