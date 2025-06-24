/*
  # Debug and fix form submissions access

  1. Check current state and fix any issues
    - Ensure proper RLS policies exist
    - Check for any data inconsistencies
    - Add debugging capabilities

  2. Security
    - Maintain proper RLS policies
    - Ensure users can only access their own data
*/

-- First, let's check if there are any form submissions without proper user_id
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM form_submissions 
    WHERE user_id IS NULL;
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Found % form submissions without user_id', orphaned_count;
    END IF;
END $$;

-- Ensure the user exists in our users table for the current test user
INSERT INTO users (id, email, created_at, updated_at)
SELECT 
    au.id, 
    au.email, 
    COALESCE(au.created_at, NOW()), 
    NOW()
FROM auth.users au
WHERE au.id = 'f7cd63aa-e9f9-4a17-bb96-12d8b1f31195'
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

-- Clean up any existing policies and recreate them with proper names
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

DROP POLICY IF EXISTS "Users can read their own submissions" ON form_submissions;
DROP POLICY IF EXISTS "Users can insert their own submissions" ON form_submissions;
DROP POLICY IF EXISTS "Users can update their own submissions" ON form_submissions;
DROP POLICY IF EXISTS "Users can read own submissions" ON form_submissions;
DROP POLICY IF EXISTS "Users can insert own submissions" ON form_submissions;
DROP POLICY IF EXISTS "Users can update own submissions" ON form_submissions;

-- Create clean, simple policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create clean, simple policies for form_submissions table
CREATE POLICY "Users can read own submissions"
  ON form_submissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own submissions"
  ON form_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own submissions"
  ON form_submissions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON form_submissions TO authenticated;

-- Grant sequence permissions
DO $$
DECLARE
    seq_name TEXT;
BEGIN
    -- Find the actual sequence name for form_submissions
    SELECT pg_get_serial_sequence('form_submissions', 'id') INTO seq_name;
    
    IF seq_name IS NOT NULL THEN
        EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %s TO authenticated', seq_name);
        RAISE NOTICE 'Granted permissions on sequence: %', seq_name;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not grant sequence permissions: %', SQLERRM;
END $$;

-- Create a test submission for the user if none exists (for debugging)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM form_submissions 
        WHERE user_id = 'f7cd63aa-e9f9-4a17-bb96-12d8b1f31195'
    ) THEN
        INSERT INTO form_submissions (
            user_id,
            name,
            email,
            book_topic,
            book_description,
            status
        ) VALUES (
            'f7cd63aa-e9f9-4a17-bb96-12d8b1f31195',
            'John Apple',
            'john@apple.com',
            'Test Book Topic',
            'This is a test book description for debugging purposes.',
            'pending'
        );
        RAISE NOTICE 'Created test submission for debugging';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create test submission: %', SQLERRM;
END $$;