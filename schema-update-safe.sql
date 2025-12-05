-- Safe Schema Update Script
-- This script updates indexes, triggers, and policies WITHOUT deleting data
-- Run this in your Supabase SQL Editor

-- ==================================================
-- PART 1: Ensure RLS is enabled
-- ==================================================

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_links ENABLE ROW LEVEL SECURITY;

-- ==================================================
-- PART 2: Drop and recreate RLS policies (safe - just security rules)
-- ==================================================

-- Drop existing policies on employees
DROP POLICY IF EXISTS "Allow admin read" ON employees;
DROP POLICY IF EXISTS "Allow admin insert" ON employees;
DROP POLICY IF EXISTS "Allow admin update" ON employees;
DROP POLICY IF EXISTS "Allow admin delete" ON employees;
DROP POLICY IF EXISTS "Allow public read active employees" ON employees;

-- Recreate policies for employees
CREATE POLICY "Allow admin read" ON employees FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin insert" ON employees FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow admin update" ON employees FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin delete" ON employees FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow public read active employees" ON employees FOR SELECT USING (is_active = true);

-- Drop existing policies on employee_links
DROP POLICY IF EXISTS "Allow authenticated admin read" ON employee_links;
DROP POLICY IF EXISTS "Allow authenticated admin insert" ON employee_links;
DROP POLICY IF EXISTS "Allow authenticated admin update" ON employee_links;
DROP POLICY IF EXISTS "Allow authenticated admin delete" ON employee_links;
DROP POLICY IF EXISTS "Allow public read active links" ON employee_links;

-- Recreate policies for employee_links
CREATE POLICY "Allow authenticated admin read" ON employee_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated admin insert" ON employee_links FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated admin update" ON employee_links FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated admin delete" ON employee_links FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow public read active links" ON employee_links FOR SELECT TO anon USING (is_active = true);

-- ==================================================
-- PART 3: Create/Update indexes (safe - IF NOT EXISTS)
-- ==================================================

CREATE INDEX IF NOT EXISTS idx_employee_active ON employees(is_active);
CREATE INDEX IF NOT EXISTS idx_employee_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employee_created ON employees(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_employee_slug ON employees(slug);

CREATE INDEX IF NOT EXISTS idx_employee_links_employee_id ON employee_links(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_links_active ON employee_links(is_active);
CREATE INDEX IF NOT EXISTS idx_employee_links_sort_order ON employee_links(employee_id, sort_order);

-- ==================================================
-- PART 4: Create/Update timestamp function and triggers
-- ==================================================

-- Create or replace the timestamp update function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate triggers
DROP TRIGGER IF EXISTS update_employee_timestamp ON employees;
CREATE TRIGGER update_employee_timestamp
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_employee_links_timestamp ON employee_links;
CREATE TRIGGER update_employee_links_timestamp
  BEFORE UPDATE ON employee_links
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- ==================================================
-- PART 5: Ensure storage bucket exists
-- ==================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('employee-photos', 'employee-photos', true) 
ON CONFLICT (id) DO NOTHING;

-- ==================================================
-- PART 6: Update storage policies
-- ==================================================

-- Drop existing storage policies
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;

-- Recreate storage policies
CREATE POLICY "Allow authenticated uploads" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'employee-photos');

CREATE POLICY "Allow public read" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'employee-photos');

CREATE POLICY "Allow authenticated delete" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'employee-photos');

-- ==================================================
-- SCHEMA UPDATE COMPLETE
-- ==================================================
-- All indexes, triggers, and policies have been updated
-- Your existing data is safe and unchanged
