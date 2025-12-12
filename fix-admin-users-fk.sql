-- =====================================================
-- FIX ADMIN_USERS TABLE - REMOVE FOREIGN KEY CONSTRAINT
-- Run this in Supabase SQL Editor
-- =====================================================
-- This allows creating admin_users records without requiring
-- the user to exist in auth.users first
-- =====================================================

-- Step 1: Drop the foreign key constraint
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_id_fkey;

-- Step 2: Keep id as primary key but remove the reference
-- The id column will now accept any UUID

-- Step 3: Verify the change
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'admin_users';
