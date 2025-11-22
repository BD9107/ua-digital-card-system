# Environment Variables Required

## 📋 Checklist - Fill in these values in your `.env` file

Copy this template and fill in YOUR values from Supabase:

```env
# ==================================================
# SUPABASE CREDENTIALS (REQUIRED - GET FROM SUPABASE)
# ==================================================
# 1. Go to https://supabase.com/dashboard
# 2. Select your project
# 3. Go to Settings (⚙️) > API
# 4. Copy these values:

NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...

# ==================================================
# APPLICATION URLS (PRE-CONFIGURED - DO NOT MODIFY)
# ==================================================
NEXT_PUBLIC_BASE_URL=http://localhost:3000
MONGO_URL=mongodb://localhost:27017/nextjs-template
```

---

## 🎯 Where to Find Your Supabase Credentials

### Step-by-Step:

1. **Login to Supabase**
   - Go to: https://supabase.com/dashboard
   - Sign in with your account

2. **Select Your Project**
   - Click on your "UA Digital Cards" project

3. **Navigate to API Settings**
   - Click the ⚙️ **Settings** icon (bottom left)
   - Click **API** in the settings menu

4. **Copy These Two Values**:

   **Project URL**:
   ```
   Location: Under "Config" section
   Label: "Project URL"
   Format: https://xxxxxxxxxxxxx.supabase.co
   ```

   **anon/public Key**:
   ```
   Location: Under "Project API keys" section
   Label: "anon" or "anon public"
   Format: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey... (very long)
   ```

5. **Paste in `.env` File**
   - Open `/app/.env` file
   - Replace the placeholder values
   - Save the file

6. **Restart Dev Server**
   ```bash
   # Stop the server (Ctrl+C)
   # Start again
   yarn dev
   ```

---

## ✅ Verification

After setting up, verify your configuration:

### Test 1: Homepage Loads
- Visit: http://localhost:3000
- Should see: UA Digital Card System homepage (no errors)

### Test 2: Admin Login Page
- Visit: http://localhost:3000/admin/login
- Should see: Login form (no errors)

### Test 3: API Working
- Visit: http://localhost:3000/api
- Should see: `{"message":"API is running"}`

If you see errors about "Your project's URL and Key are required", your `.env` is not configured correctly.

---

## 🔍 Common Mistakes

### ❌ Wrong: Using `.env.example`
The file must be named `.env` (not `.env.example`)

### ❌ Wrong: Missing quotes or extra spaces
```env
NEXT_PUBLIC_SUPABASE_URL = https://xxx.supabase.co  # WRONG (space before =)
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"  # WRONG (quotes)
```

### ✅ Correct: No spaces, no quotes
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
```

### ❌ Wrong: Copying the service_role key
Use the **anon/public** key, NOT the service_role key

### ❌ Wrong: Not restarting server
After changing `.env`, always restart: Ctrl+C, then `yarn dev`

---

## 🔒 Security

### What's Safe to Share?
- ❌ **Service Role Key** - Never share or commit to Git
- ✅ **Anon/Public Key** - Safe for frontend, can be public

### Git Safety
The `.env` file is in `.gitignore` - it won't be committed to Git
The `.env.example` is safe - it has no real credentials

---

## 🚨 If You See This Error

```
Error: Your project's URL and Key are required to create a Supabase client!
```

**This means**:
1. `.env` file doesn't exist, OR
2. `.env` file has wrong values, OR
3. You didn't restart the dev server

**Fix**:
1. Make sure `.env` exists in `/app/` folder
2. Verify values are correct (no typos)
3. Restart: `Ctrl+C` then `yarn dev`

---

## 📞 Still Having Issues?

Double-check this checklist:

- [ ] I created a Supabase project
- [ ] I copied the Project URL from Settings > API
- [ ] I copied the anon/public key from Settings > API
- [ ] I created a `.env` file (not `.env.example`)
- [ ] I pasted both values without spaces or quotes
- [ ] I saved the `.env` file
- [ ] I restarted the dev server
- [ ] I can visit http://localhost:3000 without errors

If all checked ✅ and still not working:
1. Delete `.next` folder: `rm -rf .next`
2. Restart: `yarn dev`

---

## 📝 Quick Copy Template

```env
NEXT_PUBLIC_SUPABASE_URL=PASTE_YOUR_URL_HERE
NEXT_PUBLIC_SUPABASE_ANON_KEY=PASTE_YOUR_KEY_HERE
NEXT_PUBLIC_BASE_URL=http://localhost:3000
MONGO_URL=mongodb://localhost:27017/nextjs-template
```

Replace `PASTE_YOUR_URL_HERE` and `PASTE_YOUR_KEY_HERE` with your actual values.

---

**Ready to continue?** Go to `SETUP-GUIDE.md` for the next steps! 🚀
