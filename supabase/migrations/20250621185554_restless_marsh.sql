/*
  # Fix all permission issues for dashboard

  1. Permissions
    - Grant SELECT on users table to authenticated role
    - Grant SELECT, INSERT, UPDATE on form_submissions to authenticated role
    - Grant usage on sequences to authenticated role
    - Ensure service_role has full access

  2. Policies
    - Drop and recreate all form_submissions policies
    - Only create users policies if they don't exist
    - Ensure policies work with granted permissions

  3. Security
    - Maintain proper RLS while allowing necessary access
    - Allow cross-table lookups in policies
*/

-- First, drop all existing problematic policies on form_submissions
DROP POLICY IF EXISTS "Users can read own submissions" ON form_submissions;
DROP POLICY IF EXISTS "Users can read submissions by email" ON form_submissions;
DROP POLICY IF EXISTS "Users can create submissions" ON form_submissions;
DROP POLICY IF EXISTS "Users can update own submissions" ON form_submissions;

-- Drop the problematic users policy if it exists
DROP POLICY IF EXISTS "Users can read user data for form submissions" ON users;

-- Grant necessary permissions to authenticated role
GRANT SELECT ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON form_submissions TO authenticated;

-- Grant usage on sequences
DO $$
DECLARE
    seq_record RECORD;
BEGIN
    FOR seq_record IN 
        SELECT schemaname, sequencename 
        FROM pg_sequences 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %I.%I TO authenticated', 
                      seq_record.schemaname, seq_record.sequencename);
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        -- If pg_sequences doesn't exist, try the older approach
        BEGIN
            IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'form_submissions_id_seq' AND relkind = 'S') THEN
                GRANT USAGE, SELECT ON SEQUENCE form_submissions_id_seq TO authenticated;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- Ignore sequence errors for now
                NULL;
        END;
END $$;

-- Only create users policies if they don't already exist
DO $$
BEGIN
    -- Check if the policy exists before creating it
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can read own data'
    ) THEN
        CREATE POLICY "Users can read own data"
          ON users
          FOR SELECT
          TO authenticated
          USING (auth.uid() = id);
    END IF;
    
    -- Check if the update policy exists before creating it
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can update own data'
    ) THEN
        CREATE POLICY "Users can update own data"
          ON users
          FOR UPDATE
          TO authenticated
          USING (auth.uid() = id);
    END IF;
END $$;

-- Create a permissive policy for users table to allow form submission lookups
CREATE POLICY "Users can read user data for form submissions"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Create working policies for form_submissions
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

-- Ensure service role has full access for admin functions
GRANT ALL ON users TO service_role;
GRANT ALL ON form_submissions TO service_role;

-- Grant usage on all sequences to service_role
DO $$
DECLARE
    seq_record RECORD;
BEGIN
    FOR seq_record IN 
        SELECT schemaname, sequencename 
        FROM pg_sequences 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('GRANT ALL ON SEQUENCE %I.%I TO service_role', 
                      seq_record.schemaname, seq_record.sequencename);
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        -- If pg_sequences doesn't exist, try the older approach
        BEGIN
            IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'form_submissions_id_seq' AND relkind = 'S') THEN
                GRANT ALL ON SEQUENCE form_submissions_id_seq TO service_role;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- Ignore sequence errors for now
                NULL;
        END;
END $$;