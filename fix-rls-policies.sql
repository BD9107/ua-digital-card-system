-- Fix RLS Policies for Admin Access
-- Run this in your Supabase SQL Editor to fix the unauthorized error

-- Drop existing policies
DROP POLICY IF EXISTS "Allow admin read" ON employees;
DROP POLICY IF EXISTS "Allow admin insert" ON employees;
DROP POLICY IF EXISTS "Allow admin update" ON employees;
DROP POLICY IF EXISTS "Allow admin delete" ON employees;
DROP POLICY IF EXISTS "Allow public read active employees" ON employees;

-- Create corrected policies for authenticated users (admins)
CREATE POLICY "Allow authenticated read" 
ON employees FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated insert" 
ON employees FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated update" 
ON employees FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated delete" 
ON employees FOR DELETE 
TO authenticated 
USING (true);

-- Create policy for public read access (for public profile pages)
CREATE POLICY "Allow public read active employees" 
ON employees FOR SELECT 
TO anon 
USING (is_active = true);

-- Verify RLS is enabled
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
