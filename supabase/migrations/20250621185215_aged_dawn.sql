/*
  # Fix dashboard access and form submission permissions

  1. Policy Updates
    - Drop and recreate form submission policies with proper permissions
    - Simplify RLS policies to avoid complex joins
    - Ensure authenticated users can access their own data

  2. Permissions
    - Grant necessary permissions to authenticated role
    - Fix sequence access issues

  3. Security
    - Maintain data isolation between users
    - Allow users to read submissions by user_id or email match
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can read own submissions" ON form_submissions;
DROP POLICY IF EXISTS "Users can read submissions by email" ON form_submissions;
DROP POLICY IF EXISTS "Users can create submissions" ON form_submissions;
DROP POLICY IF EXISTS "Users can update own submissions" ON form_submissions;

-- Create simplified, working policies for form_submissions
CREATE POLICY "Users can read own submissions"
  ON form_submissions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can create submissions"
  ON form_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own submissions"
  ON form_submissions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Ensure the authenticated role has the necessary permissions
GRANT SELECT ON form_submissions TO authenticated;
GRANT INSERT ON form_submissions TO authenticated;
GRANT UPDATE ON form_submissions TO authenticated;

-- Grant access to the sequence (check if it exists first)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'form_submissions_id_seq') THEN
    GRANT USAGE ON SEQUENCE form_submissions_id_seq TO authenticated;
  END IF;
END $$;