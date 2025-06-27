/*
  # Complete database schema backup
  # Generated: January 25, 2025
  
  1. Custom Types
    - Creates enum types only if they don't exist
    - stripe_subscription_status, stripe_order_status, submission_status
    
  2. Tables
    - users: User profile data linked to auth.users
    - form_submissions: Book request submissions
    - stripe_customers: Stripe customer mappings
    - stripe_subscriptions: Subscription data
    - stripe_orders: Order/payment data
    
  3. Views
    - stripe_user_subscriptions: User subscription view
    - stripe_user_orders: User orders view
    
  4. Security
    - RLS policies for all tables
    - Proper permissions for authenticated and service roles
    
  5. Functions and Triggers
    - User creation handling
    - Updated timestamp triggers
    - Email notification triggers
*/

-- Custom types (only create if they don't exist)
DO $$ BEGIN
    CREATE TYPE stripe_subscription_status AS ENUM (
        'not_started',
        'incomplete',
        'incomplete_expired',
        'trialing',
        'active',
        'past_due',
        'canceled',
        'unpaid',
        'paused'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stripe_order_status AS ENUM (
        'pending',
        'completed',
        'canceled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE submission_status AS ENUM (
        'pending',
        'in_progress',
        'completed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Form submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  book_topic text NOT NULL,
  book_style text DEFAULT '',
  book_description text NOT NULL,
  additional_notes text DEFAULT '',
  status submission_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Stripe customers table
CREATE TABLE IF NOT EXISTS stripe_customers (
  id bigint primary key generated always as identity,
  user_id uuid references auth.users(id) not null unique,
  customer_id text not null unique,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  deleted_at timestamp with time zone default null
);

-- Stripe subscriptions table
CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id bigint primary key generated always as identity,
  customer_id text unique not null,
  subscription_id text default null,
  price_id text default null,
  current_period_start bigint default null,
  current_period_end bigint default null,
  cancel_at_period_end boolean default false,
  payment_method_brand text default null,
  payment_method_last4 text default null,
  status stripe_subscription_status not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  deleted_at timestamp with time zone default null
);

-- Stripe orders table
CREATE TABLE IF NOT EXISTS stripe_orders (
    id bigint primary key generated always as identity,
    checkout_session_id text not null,
    payment_intent_id text not null,
    customer_id text not null,
    amount_subtotal bigint not null,
    amount_total bigint not null,
    currency text not null,
    payment_status text not null,
    status stripe_order_status not null default 'pending',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    deleted_at timestamp with time zone default null
);

-- Views (drop and recreate to ensure they're up to date)
DROP VIEW IF EXISTS stripe_user_subscriptions;
CREATE VIEW stripe_user_subscriptions WITH (security_invoker = true) AS
SELECT
    c.customer_id,
    s.subscription_id,
    s.status as subscription_status,
    s.price_id,
    s.current_period_start,
    s.current_period_end,
    s.cancel_at_period_end,
    s.payment_method_brand,
    s.payment_method_last4
FROM stripe_customers c
LEFT JOIN stripe_subscriptions s ON c.customer_id = s.customer_id
WHERE c.user_id = auth.uid()
AND c.deleted_at IS NULL
AND s.deleted_at IS NULL;

DROP VIEW IF EXISTS stripe_user_orders;
CREATE VIEW stripe_user_orders WITH (security_invoker) AS
SELECT
    c.customer_id,
    o.id as order_id,
    o.checkout_session_id,
    o.payment_intent_id,
    o.amount_subtotal,
    o.amount_total,
    o.currency,
    o.payment_status,
    o.status as order_status,
    o.created_at as order_date
FROM stripe_customers c
LEFT JOIN stripe_orders o ON c.customer_id = o.customer_id
WHERE c.user_id = auth.uid()
AND c.deleted_at IS NULL
AND o.deleted_at IS NULL;

-- Indexes (only create if they don't exist)
CREATE INDEX IF NOT EXISTS idx_form_submissions_user_id ON form_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_created_at ON form_submissions(created_at DESC);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    -- Drop all existing policies on users table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', pol.policyname);
    END LOOP;
    
    -- Drop all existing policies on form_submissions table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'form_submissions' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON form_submissions', pol.policyname);
    END LOOP;
    
    -- Drop all existing policies on stripe_customers table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'stripe_customers' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON stripe_customers', pol.policyname);
    END LOOP;
    
    -- Drop all existing policies on stripe_subscriptions table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'stripe_subscriptions' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON stripe_subscriptions', pol.policyname);
    END LOOP;
    
    -- Drop all existing policies on stripe_orders table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'stripe_orders' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON stripe_orders', pol.policyname);
    END LOOP;
END $$;

-- Users policies
CREATE POLICY "allow_read_own_user" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "allow_insert_own_user" ON users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "allow_update_own_user" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Form submissions policies
CREATE POLICY "allow_read_own_submissions" ON form_submissions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "allow_insert_own_submissions" ON form_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "allow_update_own_submissions" ON form_submissions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Stripe customers policies
CREATE POLICY "Users can view their own customer data" ON stripe_customers FOR SELECT TO authenticated USING (user_id = auth.uid() AND deleted_at IS NULL);

-- Stripe subscriptions policies
CREATE POLICY "Users can view their own subscription data" ON stripe_subscriptions FOR SELECT TO authenticated USING (
    customer_id IN (
        SELECT customer_id
        FROM stripe_customers
        WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
    AND deleted_at IS NULL
);

-- Stripe orders policies
CREATE POLICY "Users can view their own order data" ON stripe_orders FOR SELECT TO authenticated USING (
    customer_id IN (
        SELECT customer_id
        FROM stripe_customers
        WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
    AND deleted_at IS NULL
);

-- Functions (create or replace to ensure they're up to date)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user record: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION notify_new_submission()
RETURNS trigger AS $$
DECLARE
  submission_data jsonb;
BEGIN
  submission_data := to_jsonb(NEW);
  
  -- Only try to call the edge function if net extension is available
  BEGIN
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-submission-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := jsonb_build_object('submission', submission_data)
    );
  EXCEPTION
    WHEN undefined_function THEN
      -- net.http_post is not available, skip email notification
      RAISE WARNING 'net.http_post function not available, skipping email notification';
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to send email notification: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_form_submissions_updated_at ON form_submissions;
DROP TRIGGER IF EXISTS trigger_email_notification ON form_submissions;

-- Recreate triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_submissions_updated_at
  BEFORE UPDATE ON form_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_email_notification
  AFTER INSERT ON form_submissions
  FOR EACH ROW EXECUTE FUNCTION notify_new_submission();

-- Permissions
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON form_submissions TO authenticated;
GRANT SELECT ON stripe_user_subscriptions TO authenticated;
GRANT ALL ON users TO service_role;
GRANT ALL ON form_submissions TO service_role;
GRANT ALL ON stripe_customers TO service_role;
GRANT ALL ON stripe_subscriptions TO service_role;
GRANT ALL ON stripe_orders TO service_role;

-- Grant sequence permissions
DO $$
DECLARE
    seq_name TEXT;
BEGIN
    -- Grant permissions on sequences for form_submissions
    SELECT pg_get_serial_sequence('public.form_submissions', 'id') INTO seq_name;
    IF seq_name IS NOT NULL THEN
        EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %s TO authenticated', seq_name);
        EXECUTE format('GRANT ALL ON SEQUENCE %s TO service_role', seq_name);
    END IF;
    
    -- Grant permissions on sequences for stripe_customers
    SELECT pg_get_serial_sequence('public.stripe_customers', 'id') INTO seq_name;
    IF seq_name IS NOT NULL THEN
        EXECUTE format('GRANT ALL ON SEQUENCE %s TO service_role', seq_name);
    END IF;
    
    -- Grant permissions on sequences for stripe_subscriptions
    SELECT pg_get_serial_sequence('public.stripe_subscriptions', 'id') INTO seq_name;
    IF seq_name IS NOT NULL THEN
        EXECUTE format('GRANT ALL ON SEQUENCE %s TO service_role', seq_name);
    END IF;
    
    -- Grant permissions on sequences for stripe_orders
    SELECT pg_get_serial_sequence('public.stripe_orders', 'id') INTO seq_name;
    IF seq_name IS NOT NULL THEN
        EXECUTE format('GRANT ALL ON SEQUENCE %s TO service_role', seq_name);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Could not grant sequence permissions: %', SQLERRM;
END $$;