-- Fix username login by creating/updating the get_email_from_username function
-- This function allows users to log in with their username instead of email

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

-- Grant execute permissions to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.get_email_from_username(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_email_from_username(TEXT) TO authenticated;

-- Verify the function was created
SELECT
  routine_name,
  routine_schema,
  security_type
FROM information_schema.routines
WHERE routine_name = 'get_email_from_username';
