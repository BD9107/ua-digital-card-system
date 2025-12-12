-- =====================================================
-- ADMIN USERS RLS POLICIES - EMAIL-BASED MATCHING
-- Run this in Supabase SQL Editor
-- =====================================================
-- This script fixes RLS policies to use EMAIL matching
-- instead of UUID matching via auth.uid()
-- =====================================================

-- Step 1: Enable RLS on admin_users (idempotent)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Step 2: Drop ALL existing policies on admin_users
-- =====================================================
-- Drop snake_case named policies
DROP POLICY IF EXISTS overwatch_full_access ON admin_users;
DROP POLICY IF EXISTS admin_read_access ON admin_users;
DROP POLICY IF EXISTS admin_update_limited ON admin_users;
DROP POLICY IF EXISTS operator_read_only ON admin_users;
DROP POLICY IF EXISTS viewer_own_record ON admin_users;

-- Drop any quoted name policies (legacy)
DROP POLICY IF EXISTS "overwatch_full_access" ON admin_users;
DROP POLICY IF EXISTS "admin_read_access" ON admin_users;
DROP POLICY IF EXISTS "admin_update_limited" ON admin_users;
DROP POLICY IF EXISTS "operator_read_only" ON admin_users;
DROP POLICY IF EXISTS "viewer_own_record" ON admin_users;
DROP POLICY IF EXISTS "Overwatch full access" ON admin_users;
DROP POLICY IF EXISTS "Admin read access" ON admin_users;
DROP POLICY IF EXISTS "Admin update limited" ON admin_users;
DROP POLICY IF EXISTS "Operator read only" ON admin_users;
DROP POLICY IF EXISTS "Viewer own record" ON admin_users;

-- =====================================================
-- Step 3: Create helper function for email-based role check
-- =====================================================
CREATE OR REPLACE FUNCTION get_current_user_role_by_email()
RETURNS text AS $$
  SELECT role 
  FROM admin_users 
  WHERE email = auth.jwt()->>'email'
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- Step 4: Create NEW RLS policies based on EMAIL matching
-- =====================================================

-- OVERWATCH: Full access (SELECT, INSERT, UPDATE, DELETE)
-- Allows any authenticated user whose email matches an Overwatch in admin_users
CREATE POLICY overwatch_full_access ON admin_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.email = auth.jwt()->>'email' 
      AND au.role = 'Overwatch'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.email = auth.jwt()->>'email' 
      AND au.role = 'Overwatch'
    )
  );

-- ADMIN: Read-only access to all rows
-- Can SELECT all, but cannot INSERT/UPDATE/DELETE
CREATE POLICY admin_read_access ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.email = auth.jwt()->>'email' 
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
      WHERE au.email = auth.jwt()->>'email' 
      AND au.role = 'Operator'
    )
  );

-- VIEWER: Can only SELECT their own row (email match)
CREATE POLICY viewer_own_record ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    email = auth.jwt()->>'email'
    AND EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.email = auth.jwt()->>'email' 
      AND au.role = 'Viewer'
    )
  );

-- =====================================================
-- Step 5: Update helper functions to use email
-- =====================================================
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS text AS $$
  SELECT role 
  FROM admin_users 
  WHERE email = auth.jwt()->>'email'
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_current_user_status()
RETURNS text AS $$
  SELECT status 
  FROM admin_users 
  WHERE email = auth.jwt()->>'email'
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- After running this script, the Overwatch user 
-- (tempadmin@blindingmedia.com) will have full permissions
-- as long as their record exists in admin_users with:
--   email = 'tempadmin@blindingmedia.com'
--   role = 'Overwatch'
--   status = 'Active'
--
-- To verify the user exists:
-- SELECT * FROM admin_users WHERE email = 'tempadmin@blindingmedia.com';
--
-- If not, insert them:
-- INSERT INTO admin_users (id, email, role, status)
-- SELECT id, email, 'Overwatch', 'Active'
-- FROM auth.users
-- WHERE email = 'tempadmin@blindingmedia.com';
-- =====================================================

-- Display current policies for verification
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'admin_users';
