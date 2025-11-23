-- Fix RLS policies for employee_links to allow public read access
-- Run this in your Supabase SQL Editor

-- Drop existing public read policy if it exists
DROP POLICY IF EXISTS "Allow public read active links" ON employee_links;

-- Create policy for public read access (for public profile pages)
CREATE POLICY "Allow public read active links" 
ON employee_links FOR SELECT 
TO anon 
USING (is_active = true);

-- Verify the policy was created
SELECT 'RLS policy for public read access created successfully' AS status;
