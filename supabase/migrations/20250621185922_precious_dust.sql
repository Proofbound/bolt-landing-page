/*
  # Fix RLS policies for users and form_submissions tables

  1. Security Updates
    - Drop and recreate RLS policies for users table to ensure proper access
    - Fix form_submissions SELECT policy to work correctly with user authentication
    - Add missing INSERT policy for users table to handle user creation
    - Ensure all policies use proper auth.uid() checks

  2. Changes Made
    - Users table: Allow authenticated users to read, insert, and update their own data
    - Form submissions table: Fix SELECT policy and ensure proper user access
    - Remove conflicting policies and create clean, working ones
*/

-- Drop existing problematic policies for users table
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can read user data for form submissions" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create new, clean policies for users table
CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Drop existing policies for form_submissions table
DROP POLICY IF EXISTS "Users can create submissions" ON form_submissions;
DROP POLICY IF EXISTS "Users can read own submissions" ON form_submissions;
DROP POLICY IF EXISTS "Users can update own submissions" ON form_submissions;

-- Create new, clean policies for form_submissions table
CREATE POLICY "Users can insert their own submissions"
  ON form_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own submissions"
  ON form_submissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own submissions"
  ON form_submissions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure RLS is enabled on both tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;