# Quick Setup Guide for UA Digital Card System

## 🚀 Quick Start (5 minutes)

### Step 1: Create Supabase Project (2 min)
1. Visit https://supabase.com and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name**: UA Digital Cards
   - **Database Password**: (create a strong password)
   - **Region**: Choose closest to you
4. Click "Create new project"
5. Wait ~2 minutes for provisioning

### Step 2: Get Supabase Credentials (1 min)
1. In your Supabase project, click ⚙️ **Settings** (bottom left)
2. Click **API** in the sidebar
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

### Step 3: Configure Environment (30 sec)
1. Open the file `.env` in your project root
2. Replace these lines:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   With your actual values from Step 2

### Step 4: Setup Database (1 min)
1. In Supabase, click **SQL Editor** (left sidebar)
2. Click **New query**
3. Open `database-schema.sql` file from this project
4. Copy ALL the SQL content
5. Paste into Supabase SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. You should see "Success. No rows returned"

### Step 5: Create Admin User (30 sec)
1. In Supabase, click **Authentication** (left sidebar)
2. Click **Users** tab
3. Click **Add user** dropdown → **Create new user**
4. Enter:
   - **Email**: `admin@ua.aw`
   - **Password**: `TempAdmin123!`
   - ✅ Check "Auto Confirm User"
5. Click **Create user**

### Step 6: Run the Application (30 sec)
```bash
# If dependencies are not installed
yarn install

# Start the development server
yarn dev
```

### Step 7: Login and Test
1. Open http://localhost:3000
2. Click "Admin Login"
3. Login with:
   - Email: `admin@ua.aw`
   - Password: `TempAdmin123!`
4. You're in! 🎉

---

## ✅ What You Should See

After setup, you should be able to:

1. **Login** to admin dashboard
2. **Add employees** manually
3. **Import employees** from CSV (use `sample-employees.csv` as template)
4. **Upload photos** for each employee
5. **View public profiles** at `/staff/[employee-id]`
6. **Download QR codes** for each employee
7. **Save contacts** as vCard files

---

## 📋 Environment Variables You Need

Only 2 variables are required:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxxxxx
```

The other variables are pre-configured and should not be changed:
- `NEXT_PUBLIC_BASE_URL` - Auto-configured
- `MONGO_URL` - Template remnant (not used)

---

## 🐛 Common Issues

### Issue: "Your project's URL and Key are required"
**Solution**: 
- Make sure `.env` file exists (not just `.env.example`)
- Verify you pasted the correct URL and key
- Restart dev server: Stop (Ctrl+C) and run `yarn dev` again

### Issue: "Failed to fetch employees" or 401 Error
**Solution**:
- Make sure you ran the `database-schema.sql` in Supabase
- Verify admin user was created with "Auto Confirm User" checked
- Try logging out and logging in again

### Issue: CSV Import doesn't work
**Solution**:
- Use the `sample-employees.csv` as a template
- Required fields: first_name, last_name, email
- Make sure there are no duplicate emails

### Issue: Photo upload fails
**Solution**:
- Verify the SQL script created the storage bucket
- Check in Supabase: Storage → Should see "employee-photos" bucket
- If not, create it manually as a public bucket

---

## 📦 What's Included

- ✅ Complete admin dashboard
- ✅ Employee CRUD operations
- ✅ Photo upload to Supabase Storage
- ✅ CSV bulk import
- ✅ QR code generation
- ✅ vCard download
- ✅ Mobile-first public profiles
- ✅ Supabase authentication
- ✅ PostgreSQL database with RLS

---

## 🎨 Branding

Current colors (UA style):
- **Primary**: #003366 (Deep blue)
- **Accent**: #FFD700 (Gold)
- **Secondary**: #F5F5F5 (Light gray)

To change branding:
1. Update colors in `app/globals.css`
2. Replace color values in components
3. Update logo placeholder

---

## 🔒 Security Reminders

1. ⚠️ **Change the default admin password** after first login
2. ⚠️ Never commit `.env` file to Git
3. ✅ RLS is enabled - only authenticated users can manage employees
4. ✅ Public profiles are read-only
5. ✅ Storage is protected - only admins can upload

---

## 📞 Support Checklist

Before asking for help, verify:
- [ ] Supabase project is created and active
- [ ] `.env` file has correct credentials
- [ ] Database schema SQL was run successfully
- [ ] Admin user is created and confirmed
- [ ] Dev server is running without errors
- [ ] Browser console shows no errors

---

## 🚢 Deploying to Production

See full deployment guide in `README.md`

Quick steps:
1. Push code to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel
4. Update Supabase auth URLs
5. Deploy!

---

**That's it! You're ready to manage digital business cards! 🎉**

For detailed documentation, see `README.md`
