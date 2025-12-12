-- =====================================================
-- ADMIN USERS MANAGEMENT SYSTEM
-- Run this in Supabase SQL Editor
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

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_status ON admin_users(status);

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create function to get current user's role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS text AS $$
  SELECT role FROM admin_users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- =====================================================
-- RLS POLICIES FOR admin_users
-- =====================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Overwatch full access" ON admin_users;
DROP POLICY IF EXISTS "Admin read access" ON admin_users;
DROP POLICY IF EXISTS "Admin update limited" ON admin_users;
DROP POLICY IF EXISTS "Operator read only" ON admin_users;
DROP POLICY IF EXISTS "Viewer own record" ON admin_users;

-- OVERWATCH: Full access (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Overwatch full access" ON admin_users
  FOR ALL
  TO authenticated
  USING (get_current_user_role() = 'Overwatch')
  WITH CHECK (get_current_user_role() = 'Overwatch');

-- ADMIN: Can SELECT all, UPDATE email only (non-Overwatch accounts)
CREATE POLICY "Admin read access" ON admin_users
  FOR SELECT
  TO authenticated
  USING (get_current_user_role() = 'Admin');

CREATE POLICY "Admin update limited" ON admin_users
  FOR UPDATE
  TO authenticated
  USING (
    get_current_user_role() = 'Admin' AND 
    role != 'Overwatch'
  )
  WITH CHECK (
    get_current_user_role() = 'Admin' AND 
    role != 'Overwatch' AND
    -- Only allow email changes, not role or status
    role = (SELECT role FROM admin_users WHERE id = admin_users.id) AND
    status = (SELECT status FROM admin_users WHERE id = admin_users.id)
  );

-- OPERATOR: Read-only access
CREATE POLICY "Operator read only" ON admin_users
  FOR SELECT
  TO authenticated
  USING (get_current_user_role() = 'Operator');

-- VIEWER: Can only see their own record
CREATE POLICY "Viewer own record" ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() = 'Viewer' AND 
    id = auth.uid()
  );

-- =====================================================
-- TRIGGER: Update timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_admin_users_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_admin_users_timestamp ON admin_users;
CREATE TRIGGER update_admin_users_timestamp
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_timestamp();

-- =====================================================
-- INITIAL DATA: Create first Overwatch user
-- =====================================================
-- You'll need to manually insert the first Overwatch user
-- using their auth.users id after they sign up:
--
-- INSERT INTO admin_users (id, email, role, status)
-- VALUES ('your-auth-user-id', 'tempadmin@blindingmedia.com', 'Overwatch', 'Active');

COMMENT ON TABLE admin_users IS 'Admin users with role-based access control';
COMMENT ON COLUMN admin_users.role IS 'Overwatch=full control, Admin=partial, Operator=limited, Viewer=read-only';
COMMENT ON COLUMN admin_users.status IS 'Active=can login, Pending=awaiting invite, Inactive=disabled, Suspended=locked';
