# Supabase Database Migrations

This folder contains SQL migration scripts for your Supabase database.

## How to Apply Migrations

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to the **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of the migration file
6. Click **Run** or press `Ctrl+Enter` / `Cmd+Enter`
7. Check for success message at the bottom

## Required Migration

### complete_account_deletion.sql ⚠️ REQUIRED

**Status:** This migration is REQUIRED for the delete account feature to work.

**What it does:**
- Creates a `delete_user_account()` RPC function with elevated privileges
- Deletes all user data in the correct order:
  1. Liked listings
  2. Reviewed listings
  3. User profile
  4. Auth user record
- Returns a JSON response indicating success or failure
- Uses `SECURITY DEFINER` to grant necessary permissions to delete from `auth.users` table

**When to run:**
**Run this NOW** to enable the "Delete Account" feature on the profile page.

**What happens without this migration:**
The delete account button will show an error message: "Database error: function delete_user_account() does not exist"

## Old Migrations (Deprecated)

### delete_user_function.sql

This has been replaced by `complete_account_deletion.sql`. Do not use this file.
