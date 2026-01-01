-- Debug script to check signup issues
-- Run these queries one by one to diagnose the problem

-- 1. Check if city, state, neighborhood columns exist in profiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('city', 'state', 'neighborhood', 'apartment_complex_name');

-- 2. Check current handle_new_user trigger function
SELECT routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public';

-- 3. Check if trigger is attached to auth.users
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 4. Check recent auth.users (to see if signup actually happened)
SELECT id, email, created_at, raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 5. Check if profiles were created for recent users
SELECT p.id, p.email, p.username, p.user_type, p.apartment_complex_name, p.city, p.state, p.neighborhood, p.created_at
FROM profiles p
ORDER BY p.created_at DESC
LIMIT 5;
