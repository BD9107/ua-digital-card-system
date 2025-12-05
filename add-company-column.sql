-- Migration: Add company column to employees table
-- Run this in your Supabase SQL Editor to add the company field

-- Add company column to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS company TEXT;

-- Add comment to document the column
COMMENT ON COLUMN employees.company IS 'Company name that appears on vCard';
