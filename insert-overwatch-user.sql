-- =====================================================
-- CHECK AND INSERT OVERWATCH USER
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Check if user exists in auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'tempadmin@blindingmedia.com';

-- Step 2: Check if user exists in admin_users
SELECT * FROM admin_users 
WHERE email = 'tempadmin@blindingmedia.com';

-- Step 3: If user does NOT exist in admin_users, run this INSERT:
-- (This inserts the user as Overwatch with Active status)
INSERT INTO admin_users (id, email, role, status)
SELECT id, email, 'Overwatch', 'Active'
FROM auth.users
WHERE email = 'tempadmin@blindingmedia.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'Overwatch',
  status = 'Active';

-- Step 4: Verify the insert worked
SELECT * FROM admin_users WHERE email = 'tempadmin@blindingmedia.com';
