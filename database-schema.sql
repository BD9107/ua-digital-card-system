-- Custom Digital Card System Database Schema
-- Run this in your Supabase SQL Editor

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  job_title TEXT,
  department TEXT,
  website TEXT,
  photo_url TEXT,
  slug TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access (authenticated users)
CREATE POLICY "Allow admin read" ON employees FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin insert" ON employees FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow admin update" ON employees FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin delete" ON employees FOR DELETE USING (auth.role() = 'authenticated');

-- Create policy for public read access (for public profile pages)
CREATE POLICY "Allow public read active employees" ON employees FOR SELECT USING (is_active = true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_active ON employees(is_active);
CREATE INDEX IF NOT EXISTS idx_employee_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employee_created ON employees(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_employee_slug ON employees(slug);

-- Auto-update timestamp trigger function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS update_employee_timestamp ON employees;
CREATE TRIGGER update_employee_timestamp
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- Create storage bucket for employee photos
-- Note: This needs to be done via Supabase dashboard Storage section
-- Bucket name: employee-photos
-- Make it public for easy access

-- Storage policies (run after creating bucket in dashboard)
INSERT INTO storage.buckets (id, name, public) VALUES ('employee-photos', 'employee-photos', true) ON CONFLICT DO NOTHING;

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
