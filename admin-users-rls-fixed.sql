-- =====================================================
-- ADMIN USERS RLS POLICIES - FIXED (NO RECURSION)
-- Run this in Supabase SQL Editor
-- =====================================================
-- This fixes the infinite recursion by using auth.jwt() directly
-- without querying admin_users inside the policy
-- =====================================================

-- Step 1: Enable RLS on admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies dynamically
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
-- Step 3: Create a SECURITY DEFINER function to check role
-- This function bypasses RLS to avoid recursion
-- =====================================================
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM admin_users WHERE email = (SELECT auth.jwt()->>'email') LIMIT 1
$$;

-- =====================================================
-- Step 4: Create NEW RLS policies using the function
-- =====================================================

-- OVERWATCH: Full access (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY overwatch_full_access ON admin_users
  FOR ALL
  TO authenticated
  USING (auth_user_role() = 'Overwatch')
  WITH CHECK (auth_user_role() = 'Overwatch');

-- ADMIN: Read-only access to all rows
CREATE POLICY admin_read_access ON admin_users
  FOR SELECT
  TO authenticated
  USING (auth_user_role() = 'Admin');

-- OPERATOR: Read-only access to all rows
CREATE POLICY operator_read_only ON admin_users
  FOR SELECT
  TO authenticated
  USING (auth_user_role() = 'Operator');

-- VIEWER: Can only SELECT their own row
CREATE POLICY viewer_own_record ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    auth_user_role() = 'Viewer' 
    AND email = (auth.jwt()->>'email')
  );

-- =====================================================
-- Step 5: Verify policies
-- =====================================================
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'admin_users';
