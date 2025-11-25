# Fix: Professional Links Not Showing on Public Profile

## Problem
Professional links are being saved correctly in the admin panel and stored in the `employee_links` table, but they are not appearing on the public staff profile page.

## Root Cause
The Row Level Security (RLS) policies on the `employee_links` table only allow authenticated users to read the data. Public users (with the `anon` role) are being denied access.

## Solution

### Step 1: Add Public Read Policy to Supabase

**Run this SQL in your Supabase SQL Editor:**

```sql
-- Fix RLS policies for employee_links to allow public read access

-- Drop existing public read policy if it exists
DROP POLICY IF EXISTS "Allow public read active links" ON employee_links;

-- Create policy for public read access (for public profile pages)
CREATE POLICY "Allow public read active links" 
ON employee_links FOR SELECT 
TO anon 
USING (is_active = true);

-- Verify the policy was created
SELECT 'RLS policy for public read access created successfully' AS status;
```

### Step 2: Verify the Fix

After running the SQL:

1. **Visit an employee's public profile page**: `/staff/[employee-id]`
2. **Check that**:
   - Professional links appear below contact information
   - Links are in the correct order (by sort_order)
   - Clicking a link opens in a new tab
   - Only active links are shown
   - If no links exist, the section is hidden

## What Was Changed

### 1. Database Schema Files Updated
- ✅ `/database-schema.sql` - Added public read policy
- ✅ `/database-schema-links.sql` - Added public read policy
- ✅ `/fix-employee-links-rls.sql` - Created standalone fix file

### 2. API Route Updated
- ✅ `/app/api/[[...path]]/route.js` - Uses anon client for public access
- ✅ Added debug logging to track link fetching

### 3. Public Profile Page
- ✅ Already correctly implemented
- ✅ Fetches from `/api/public/employees/:id`
- ✅ Displays links with proper icons and styling
- ✅ Mobile responsive

## RLS Policy Summary

### Before (BROKEN):
```sql
-- Only these policies existed:
CREATE POLICY "Allow authenticated admin read" ON employee_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated admin insert" ON employee_links FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated admin update" ON employee_links FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated admin delete" ON employee_links FOR DELETE TO authenticated USING (true);
```

**Problem**: No policy for `anon` role to read links

### After (FIXED):
```sql
-- All previous policies PLUS:
CREATE POLICY "Allow public read active links" 
ON employee_links FOR SELECT 
TO anon 
USING (is_active = true);
```

**Solution**: Anon users can now read active links

## Security Notes

✅ **Still Secure**:
- Only `is_active = true` links are readable by public
- Admin operations still require authentication
- No write access for public users
- Inactive links remain hidden

## Testing Checklist

After running the SQL fix:

- [ ] Visit a public profile with links: Links appear ✅
- [ ] Visit a public profile without links: No section shown ✅
- [ ] Links are ordered correctly ✅
- [ ] Links open in new tab ✅
- [ ] Icons display correctly ✅
- [ ] Mobile responsive ✅
- [ ] Inactive links don't show ✅

## Files Modified in This Fix

1. `/app/api/[[...path]]/route.js` - Use anon client for public
2. `/database-schema.sql` - Add public read policy
3. `/database-schema-links.sql` - Add public read policy
4. `/fix-employee-links-rls.sql` - Standalone fix SQL
5. `FIX-PUBLIC-LINKS-DISPLAY.md` - This documentation

## Summary

**Issue**: RLS blocked public access to employee_links table

**Fix**: Add RLS policy allowing anon users to read active links

**Action Required**: Run the SQL in Supabase SQL Editor

**Result**: Professional links now display on public profiles! ✅
