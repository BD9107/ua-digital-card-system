-- =====================================================
-- ADMIN USERS RLS POLICIES - EMAIL-BASED MATCHING
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Enable RLS on admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Step 2: Drop ALL existing policies dynamically
-- =====================================================
DO $drop_policies$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'admin_users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON admin_users', pol.policyname);
    END LOOP;
END $drop_policies$;

-- =====================================================
-- Step 3: Create NEW RLS policies based on EMAIL matching
-- =====================================================

-- OVERWATCH: Full access (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY overwatch_full_access ON admin_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.email = (auth.jwt()->>'email')
      AND au.role = 'Overwatch'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.email = (auth.jwt()->>'email')
      AND au.role = 'Overwatch'
    )
  );

-- ADMIN: Read-only access to all rows
CREATE POLICY admin_read_access ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.email = (auth.jwt()->>'email')
      AND au.role = 'Admin'
    )
  );

-- OPERATOR: Read-only access to all rows
CREATE POLICY operator_read_only ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.email = (auth.jwt()->>'email')
      AND au.role = 'Operator'
    )
  );

-- VIEWER: Can only SELECT their own row
CREATE POLICY viewer_own_record ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    email = (auth.jwt()->>'email')
    AND EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.email = (auth.jwt()->>'email')
      AND au.role = 'Viewer'
    )
  );

-- =====================================================
-- Step 4: Update helper functions to use email
-- =====================================================
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS text AS $func$
  SELECT role 
  FROM admin_users 
  WHERE email = (auth.jwt()->>'email')
  LIMIT 1;
$func$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_current_user_status()
RETURNS text AS $func$
  SELECT status 
  FROM admin_users 
  WHERE email = (auth.jwt()->>'email')
  LIMIT 1;
$func$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- VERIFICATION: Show current policies
-- =====================================================
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'admin_users';
