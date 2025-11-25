# Professional Links Feature (Linktree-style)

## Overview
This feature adds Linktree-style professional links to employee profiles, allowing admins to add multiple social media, research, and custom links to each employee's digital card.

---

## 📋 What Was Implemented

### 1. Database Changes
- **New Table**: `employee_links`
  - Stores professional links for each employee
  - Foreign key relationship with `employees` table
  - Includes label, URL, icon type, sort order, and active status
  - Cascade delete when employee is removed

### 2. Admin UI Enhancements
- **Professional Links Manager Component**
  - Add/remove links dynamically
  - Reorder links with up/down arrows
  - Choose from 11 icon types
  - URL validation (automatically adds https://)
  
- **Updated Pages**:
  - Edit Employee page: Manage links in dedicated section
  - New Employee page: Optionally add links during creation

### 3. Public Profile Display
- **Professional Links Section**
  - Displays below contact information
  - Only shows for employees with active links
  - Themed icons based on link type
  - Opens links in new tab with security attributes
  - Fully responsive design

### 4. API Enhancements
- GET `/api/employees/:id` - Returns employee with all links
- GET `/api/public/employees/:id` - Returns employee with active links only
- POST `/api/employees` - Create employee with optional links
- PUT `/api/employees/:id` - Update employee and manage links
- Automatic URL validation and https:// prefix

---

## 🗄️ Database Setup

### Run this SQL in your Supabase SQL Editor:

```sql
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

-- Add foreign key constraint
ALTER TABLE employee_links
  ADD CONSTRAINT fk_employee_links_employee_id
  FOREIGN KEY (employee_id)
  REFERENCES employees(id)
  ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_employee_links_employee_id ON employee_links(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_links_active ON employee_links(is_active);
CREATE INDEX IF NOT EXISTS idx_employee_links_sort_order ON employee_links(employee_id, sort_order);

-- Enable RLS
ALTER TABLE employee_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS update_employee_links_timestamp ON employee_links;
CREATE TRIGGER update_employee_links_timestamp
  BEFORE UPDATE ON employee_links
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();
```

**Note**: This SQL is already included in the updated `database-schema.sql` file.

---

## 🎨 Supported Icon Types

The component supports 11 icon types with branded icons:
1. **LinkedIn** - Professional networking
2. **GitHub** - Code repositories
3. **Google Scholar** - Academic publications
4. **ORCID** - Research identifier
5. **Linktree** - Link aggregator
6. **Twitter/X** - Social media
7. **Instagram** - Social media
8. **Facebook** - Social media
9. **YouTube** - Video content
10. **Website** - Generic web icon
11. **Other** - Generic link icon

---

## 📁 Files Modified

### New Files:
- `/components/ProfessionalLinksManager.jsx` - Reusable admin component
- `/database-schema-links.sql` - Standalone SQL file
- `PROFESSIONAL-LINKS-FEATURE.md` - This documentation

### Modified Files:
- `/app/api/[[...path]]/route.js` - API endpoints for links
- `/app/admin/employees/[id]/page.js` - Edit page with links
- `/app/admin/employees/new/page.js` - Create page with links
- `/app/staff/[id]/page.js` - Public profile with links display
- `/database-schema.sql` - Updated with employee_links table

---

## 🧪 Testing Checklist

### Admin Features:
- [x] Create employee without links
- [x] Create employee with links
- [x] Edit employee and add links
- [x] Edit employee and remove links
- [x] Reorder links with up/down arrows
- [x] URL validation (adds https:// if missing)
- [x] Different icon types display correctly

### Public Profile:
- [x] Employee without links shows no section
- [x] Employee with links shows "Professional Links" section
- [x] Links open in new tab
- [x] Icons match the selected icon_type
- [x] Mobile responsive design
- [x] Proper ordering by sort_order

### Existing Functionality:
- [x] All previous features work unchanged
- [x] CSV import still works
- [x] Photo upload still works
- [x] vCard download still works
- [x] QR code generation still works

---

## 🎯 Usage Instructions

### For Admins:

**Adding Links to New Employee:**
1. Go to "Add Employee"
2. Fill in basic info
3. Scroll to "Professional Links" section
4. Click "Add Link"
5. Enter label (e.g., "LinkedIn Profile")
6. Enter URL (https:// is optional)
7. Choose icon type
8. Add more links as needed
9. Use arrows to reorder
10. Click "Create Employee"

**Adding Links to Existing Employee:**
1. Go to Dashboard
2. Click "Edit" on an employee
3. Scroll to "Professional Links" section
4. Click "Add Link" to add new links
5. Click "Remove" (trash icon) to delete links
6. Use up/down arrows to reorder
7. Click "Save Changes"

### For Public Users:

Professional links appear automatically on the employee's public profile page below the contact information. They can click any link to visit the external page.

---

## 🔒 Security

- **RLS Policies**: Only authenticated admins can manage links
- **Public Access**: Links are read via server-side API, not direct Supabase queries
- **Link Safety**: All external links open with `target="_blank"` and `rel="noopener noreferrer"`
- **URL Validation**: Automatically adds https:// prefix if missing

---

## 🚀 Future Enhancements (Optional)

- Analytics tracking for link clicks
- Custom icon upload option
- Link preview/thumbnail
- Bulk edit/import links via CSV
- Link scheduling (publish/expire dates)
- Click tracking and statistics

---

## 📝 Notes

- Links are ordered by `sort_order` (starts at 0)
- Inactive links are never shown on public profiles
- Deleting an employee cascades to delete all their links
- URLs are automatically validated and prefixed
- Empty label or URL will show validation error

---

## ✅ Backward Compatibility

This feature is **100% backward compatible**:
- Employees without links display normally
- All existing functionality remains unchanged
- No breaking changes to API or database
- Works alongside all existing features

---

**Feature Status**: ✅ Complete and tested on `feature/linktree-links-section` branch
