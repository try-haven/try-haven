-- Complete account deletion function
-- This function handles deletion of all user data including the auth user
-- Run this in your Supabase SQL Editor

-- Drop the old function if it exists
DROP FUNCTION IF EXISTS delete_user();

-- Create a comprehensive function to delete the entire user account
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id uuid;
  result jsonb;
BEGIN
  -- Get the current user's ID
  user_id := auth.uid();

  -- Check if user is authenticated
  IF user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  END IF;

  -- Delete all user data in order (to handle foreign key constraints)

  -- 1. Delete liked listings
  DELETE FROM liked_listings WHERE user_id = user_id;

  -- 2. Delete reviewed listings
  DELETE FROM reviewed_listings WHERE user_id = user_id;

  -- 3. Delete user profile
  DELETE FROM profiles WHERE id = user_id;

  -- 4. Delete the auth user
  DELETE FROM auth.users WHERE id = user_id;

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Account deleted successfully'
  );

EXCEPTION WHEN OTHERS THEN
  -- Return error if something goes wrong
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION delete_user_account() IS 'Allows authenticated users to completely delete their own account including all data and auth user';
