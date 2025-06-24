/*
  # Fix hanging submissions query

  1. Simplify RLS policies to prevent infinite loops
  2. Ensure proper permissions are granted
  3. Add debugging information
  4. Create test data if needed
*/

-- First, let's completely reset the policies to prevent any circular references
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can read own submissions" ON form_submissions;
DROP POLICY IF EXISTS "Users can insert own submissions" ON form_submissions;
DROP POLICY IF EXISTS "Users can update own submissions" ON form_submissions;

-- Create the simplest possible policies for users table
CREATE POLICY "allow_read_own_user"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "allow_insert_own_user"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_update_own_user"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create the simplest possible policies for form_submissions table
-- No subqueries that could cause hanging
CREATE POLICY "allow_read_own_submissions"
  ON form_submissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "allow_insert_own_submissions"
  ON form_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_update_own_submissions"
  ON form_submissions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Ensure tables have RLS enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Grant explicit permissions to authenticated role
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON form_submissions TO authenticated;

-- Grant sequence permissions
DO $$
DECLARE
    seq_name TEXT;
BEGIN
    -- Get the sequence name for form_submissions id column
    SELECT pg_get_serial_sequence('public.form_submissions', 'id') INTO seq_name;
    
    IF seq_name IS NOT NULL THEN
        EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %s TO authenticated', seq_name);
        RAISE NOTICE 'Granted sequence permissions on: %', seq_name;
    ELSE
        RAISE NOTICE 'No sequence found for form_submissions.id';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error granting sequence permissions: %', SQLERRM;
END $$;

-- Ensure the test user exists in the users table
INSERT INTO users (id, email, created_at, updated_at)
VALUES (
    'f7cd63aa-e9f9-4a17-bb96-12d8b1f31195',
    'john@apple.com',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

-- Check if the user has any submissions, if not create a test one
DO $$
DECLARE
    submission_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO submission_count
    FROM form_submissions 
    WHERE user_id = 'f7cd63aa-e9f9-4a17-bb96-12d8b1f31195';
    
    RAISE NOTICE 'User has % existing submissions', submission_count;
    
    IF submission_count = 0 THEN
        INSERT INTO form_submissions (
            user_id,
            name,
            email,
            book_topic,
            book_style,
            book_description,
            additional_notes,
            status,
            created_at,
            updated_at
        ) VALUES (
            'f7cd63aa-e9f9-4a17-bb96-12d8b1f31195',
            'John Apple',
            'john@apple.com',
            'iOS Development Best Practices',
            'practical-guide',
            'A comprehensive guide to iOS development covering Swift, UIKit, and modern development patterns. This book will help developers understand the core concepts and best practices for building robust iOS applications.',
            'Focus on practical examples and real-world scenarios.',
            'pending',
            NOW(),
            NOW()
        );
        RAISE NOTICE 'Created test submission for user';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating test submission: %', SQLERRM;
END $$;

-- Grant service role full access for admin operations
GRANT ALL ON users TO service_role;
GRANT ALL ON form_submissions TO service_role;

-- Final check: show what policies exist
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE 'Current RLS policies:';
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('users', 'form_submissions')
        ORDER BY tablename, policyname
    LOOP
        RAISE NOTICE 'Table: %, Policy: %, Command: %, Roles: %', 
            policy_record.tablename, 
            policy_record.policyname, 
            policy_record.cmd,
            policy_record.roles;
    END LOOP;
END $$;