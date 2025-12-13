-- =====================================================
-- SESSION SECURITY MIGRATION
-- Run this in Supabase SQL Editor
-- =====================================================
-- Adds columns to track failed login attempts for lockout feature
-- =====================================================

-- Add columns to admin_users for login attempt tracking
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS first_failed_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS lockout_reason TEXT;

-- Create index for faster lookups during login
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- =====================================================
-- Helper function to reset failed login attempts
-- Call this after successful login
-- =====================================================
CREATE OR REPLACE FUNCTION reset_failed_login_attempts(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE admin_users 
  SET 
    failed_login_attempts = 0,
    first_failed_login_at = NULL,
    last_failed_login_at = NULL
  WHERE email = user_email;
END;
$$;

-- =====================================================
-- Helper function to record failed login attempt
-- Returns TRUE if user should be suspended (5+ attempts in 10 min)
-- =====================================================
CREATE OR REPLACE FUNCTION record_failed_login(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_attempts INTEGER;
  first_attempt TIMESTAMPTZ;
  should_suspend BOOLEAN := FALSE;
BEGIN
  -- Get current state
  SELECT failed_login_attempts, first_failed_login_at 
  INTO current_attempts, first_attempt
  FROM admin_users 
  WHERE email = user_email;
  
  -- If no record found, exit
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if the 10-minute window has passed (reset counter if so)
  IF first_attempt IS NOT NULL AND first_attempt < NOW() - INTERVAL '10 minutes' THEN
    -- Reset the counter, start fresh
    UPDATE admin_users 
    SET 
      failed_login_attempts = 1,
      first_failed_login_at = NOW(),
      last_failed_login_at = NOW()
    WHERE email = user_email;
    RETURN FALSE;
  END IF;
  
  -- Increment the counter
  IF first_attempt IS NULL THEN
    -- First failed attempt
    UPDATE admin_users 
    SET 
      failed_login_attempts = 1,
      first_failed_login_at = NOW(),
      last_failed_login_at = NOW()
    WHERE email = user_email;
  ELSE
    -- Subsequent attempt within the window
    UPDATE admin_users 
    SET 
      failed_login_attempts = failed_login_attempts + 1,
      last_failed_login_at = NOW()
    WHERE email = user_email;
    
    -- Check if we've hit the threshold
    SELECT failed_login_attempts INTO current_attempts
    FROM admin_users 
    WHERE email = user_email;
    
    IF current_attempts >= 5 THEN
      -- Suspend the user
      UPDATE admin_users 
      SET 
        status = 'Suspended',
        lockout_reason = 'Automatic lockout: 5 failed login attempts within 10 minutes'
      WHERE email = user_email;
      should_suspend := TRUE;
    END IF;
  END IF;
  
  RETURN should_suspend;
END;
$$;

-- =====================================================
-- Verify changes
-- =====================================================
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'admin_users' 
AND column_name IN ('failed_login_attempts', 'first_failed_login_at', 'last_failed_login_at', 'lockout_reason');
