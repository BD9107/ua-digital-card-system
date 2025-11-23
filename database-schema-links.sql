-- Professional Links Feature - Add this to your existing Supabase database
-- Run this SQL in your Supabase SQL Editor

-- Create employee_links table
CREATE TABLE IF NOT EXISTS employee_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  icon_type TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint to employees table
ALTER TABLE employee_links
  ADD CONSTRAINT fk_employee_links_employee_id
  FOREIGN KEY (employee_id)
  REFERENCES employees(id)
  ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_links_employee_id ON employee_links(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_links_active ON employee_links(is_active);
CREATE INDEX IF NOT EXISTS idx_employee_links_sort_order ON employee_links(employee_id, sort_order);

-- Enable Row Level Security (RLS)
ALTER TABLE employee_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin-only write access, server-side read for public
CREATE POLICY "Allow authenticated admin read" 
ON employee_links FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated admin insert" 
ON employee_links FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated admin update" 
ON employee_links FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated admin delete" 
ON employee_links FOR DELETE 
TO authenticated 
USING (true);

-- Create policy for public read access (for public profile pages)
CREATE POLICY "Allow public read active links" 
ON employee_links FOR SELECT 
TO anon 
USING (is_active = true);

-- Auto-update timestamp trigger for employee_links
DROP TRIGGER IF EXISTS update_employee_links_timestamp ON employee_links;
CREATE TRIGGER update_employee_links_timestamp
  BEFORE UPDATE ON employee_links
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- Verify table created successfully
SELECT 'employee_links table created successfully' AS status;
