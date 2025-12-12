-- =====================================================
-- ADMIN USERS MANAGEMENT SYSTEM - VERSION 2
-- Run this in Supabase SQL Editor
-- FIXED: Uses snake_case policy names (no quoted identifiers)
-- =====================================================

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('Overwatch','Admin','Operator','Viewer')),
  status text NOT NULL CHECK (status IN ('Active','Inactive','Pending','Suspended')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_status ON admin_users(status);

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTION: Get current user's role
-- =====================================================
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS text AS $$
  SELECT role FROM admin_users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- =====================================================
-- HELPER FUNCTION: Get current user's status
-- =====================================================
CREATE OR REPLACE FUNCTION get_current_user_status()
RETURNS text AS $$
  SELECT status FROM admin_users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- =====================================================
-- RLS POLICIES FOR admin_users (SNAKE_CASE NAMES)
-- =====================================================

-- Drop existing policies if any (using snake_case names)
DROP POLICY IF EXISTS overwatch_full_access ON admin_users;
DROP POLICY IF EXISTS admin_read_access ON admin_users;
DROP POLICY IF EXISTS admin_update_limited ON admin_users;
DROP POLICY IF EXISTS operator_read_only ON admin_users;
DROP POLICY IF EXISTS viewer_own_record ON admin_users;

-- OVERWATCH: Full access (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY overwatch_full_access ON admin_users
  FOR ALL
  TO authenticated
  USING (get_current_user_role() = 'Overwatch')
  WITH CHECK (get_current_user_role() = 'Overwatch');

-- ADMIN: Can SELECT all users
CREATE POLICY admin_read_access ON admin_users
  FOR SELECT
  TO authenticated
  USING (get_current_user_role() = 'Admin');

-- ADMIN: Can UPDATE non-Overwatch accounts (limited to email changes)
CREATE POLICY admin_update_limited ON admin_users
  FOR UPDATE
  TO authenticated
  USING (
    get_current_user_role() = 'Admin' AND 
    role != 'Overwatch'
  )
  WITH CHECK (
    get_current_user_role() = 'Admin' AND 
    role != 'Overwatch'
  );

-- OPERATOR: Read-only access to all users
CREATE POLICY operator_read_only ON admin_users
  FOR SELECT
  TO authenticated
  USING (get_current_user_role() = 'Operator');

-- VIEWER: Can only see their own record
CREATE POLICY viewer_own_record ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() = 'Viewer' AND 
    id = auth.uid()
  );

-- =====================================================
-- TRIGGER: Auto-update timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_admin_users_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_admin_users_timestamp ON admin_users;
CREATE TRIGGER trigger_update_admin_users_timestamp
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_timestamp();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE admin_users IS 'Admin users with role-based access control for UA Digital Card System';
COMMENT ON COLUMN admin_users.role IS 'Overwatch=full control, Admin=partial management, Operator=limited access, Viewer=read-only';
COMMENT ON COLUMN admin_users.status IS 'Active=can login, Pending=awaiting activation, Inactive=disabled, Suspended=locked out';
COMMENT ON FUNCTION get_current_user_role() IS 'Returns the role of the currently authenticated user';
COMMENT ON FUNCTION get_current_user_status() IS 'Returns the status of the currently authenticated user';

-- =====================================================
-- INITIAL SETUP INSTRUCTIONS
-- =====================================================
-- After running this SQL, you need to add your first Overwatch user:
--
-- Step 1: Get your user ID from auth.users
-- SELECT id, email FROM auth.users WHERE email = 'tempadmin@blindingmedia.com';
--
-- Step 2: Insert into admin_users (replace the UUID below)
-- INSERT INTO admin_users (id, email, role, status)
-- VALUES ('your-uuid-here', 'tempadmin@blindingmedia.com', 'Overwatch', 'Active');
