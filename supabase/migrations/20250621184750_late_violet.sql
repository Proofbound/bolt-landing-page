/*
  # Fix users table permissions and form submission policies

  1. Updates
    - Add policy for users table to allow reading user data for form submissions
    - Update form submissions policies to handle both user_id and email matching
    - Grant necessary permissions to service role

  2. Security
    - Maintain RLS while allowing necessary access patterns
    - Enable admin functions through service role permissions
*/

-- Add missing policies for users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can read user data for form submissions'
  ) THEN
    CREATE POLICY "Users can read user data for form submissions"
      ON users
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Update form submissions policies to be more permissive for debugging
DROP POLICY IF EXISTS "Users can read submissions by email" ON form_submissions;

-- Recreate the main policy with better logic
DROP POLICY IF EXISTS "Users can read own submissions" ON form_submissions;
CREATE POLICY "Users can read own submissions"
  ON form_submissions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Ensure service role can access everything (for admin functions)
GRANT SELECT ON users TO service_role;
GRANT ALL ON form_submissions TO service_role;