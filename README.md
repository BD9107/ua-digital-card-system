# UA Custom Digital Card System

A full-stack web application for managing and sharing digital business cards for your team. Built with Next.js 14, Supabase, and TailwindCSS.

## Features

### Admin Features
- 🔐 Secure admin authentication with Supabase Auth
- 📊 Dashboard to manage all employees
- ➕ Create and edit employee profiles
- 📸 Upload employee photos to Supabase Storage
- 📤 Bulk import employees via CSV
- 🔗 Auto-generate public profile URLs
- 📱 Auto-generate QR codes for each employee
- ✅ Enable/disable employee profiles

### Public Profile Features
- 📱 Mobile-first responsive design
- 👤 Beautiful employee profile display
- 📞 Direct contact links (email, phone, WhatsApp, website)
- 📲 QR code display for easy sharing
- 💾 One-click vCard download to save contact

### Employee Profile Fields
- First name & Last name
- Email (required)
- Phone number
- WhatsApp number
- Job title
- Department
- Website or custom links
- Profile photo

## Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **QR Codes**: qrcode library
- **vCard**: vcards-js library
- **CSV Parsing**: papaparse

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for the project to be provisioned (takes ~2 minutes)
4. Go to Project Settings > API
5. Copy your **Project URL** and **anon/public key**

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Keep the other variables as is:
   ```env
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   MONGO_URL=mongodb://localhost:27017/nextjs-template
   ```

### 3. Setup Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `database-schema.sql` in this project
4. Copy the entire SQL content
5. Paste it into the SQL Editor and click **Run**

This will create:
- `employees` table with all required fields
- Row Level Security (RLS) policies
- Indexes for performance
- Auto-update timestamp triggers
- Storage bucket for employee photos

### 4. Setup Supabase Storage

1. In Supabase dashboard, go to **Storage**
2. The bucket `employee-photos` should be created automatically by the SQL script
3. If not, create it manually:
   - Click "New bucket"
   - Name: `employee-photos`
   - Public bucket: Yes
   - Click "Create bucket"

### 5. Create Admin User

1. In Supabase dashboard, go to **Authentication** > **Users**
2. Click "Add user" > "Create new user"
3. Enter:
   - Email: `admin@ua.aw`
   - Password: `TempAdmin123!`
   - Auto Confirm User: Yes (check this box)
4. Click "Create user"

**IMPORTANT**: Change this password after first login!

### 6. Configure Supabase Auth URLs (For Production)

When deploying to production:

1. Go to **Authentication** > **URL Configuration**
2. Add your production URL to:
   - **Site URL**: `https://your-domain.com`
   - **Redirect URLs**: Add these:
     - `https://your-domain.com/**`
     - `https://your-domain.com/auth/callback`

For local development, these should already work:
- `http://localhost:3000/**`

### 7. Install Dependencies

```bash
yarn install
```

### 8. Run the Development Server

```bash
yarn dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Usage Guide

### Admin Login

1. Go to [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
2. Login with:
   - Email: `admin@ua.aw`
   - Password: `TempAdmin123!`

### Managing Employees

#### Add Single Employee
1. Click "Add Employee" button
2. Fill in the employee details
3. Click "Create Employee"
4. After creation, click "Edit" to upload a photo

#### Bulk Import via CSV
1. Click "CSV Template" to download sample format
2. Fill in your employee data
3. Click "Import CSV" and select your file
4. Employees will be imported automatically

#### Edit Employee
1. Click "Edit" on any employee
2. Update details as needed
3. Upload photo if not already done
4. View and download QR code from sidebar
5. Click "Save Changes"

#### Disable Employee
1. Click "Disable" to temporarily hide the profile
2. Click "Enable" to reactivate

#### Delete Employee
1. Click "Delete" to permanently remove
2. Confirm the action

### Sharing Employee Profiles

Each employee gets:
1. **Public URL**: `/staff/[employee-id]`
2. **QR Code**: Auto-generated, can be downloaded
3. **vCard**: Click "Save Contact" button on public profile

### Public Profile Page

Mobile-optimized profile showing:
- Employee photo
- Name and title
- Department
- Contact information (clickable links)
- QR code
- Save Contact button (downloads .vcf file)

## CSV Import Format

The CSV file should have these columns:

```csv
first_name,last_name,email,phone,whatsapp,job_title,department,website,profile_photo_url
John,Doe,john.doe@ua.aw,+297-123-4567,+297-123-4567,Software Engineer,IT,https://johndoe.com,
Jane,Smith,jane.smith@ua.aw,+297-234-5678,+297-234-5678,Marketing Manager,Marketing,,
```

**Required fields**: first_name, last_name, email

See `sample-employees.csv` for a complete example.

## Project Structure

```
/app
├── app/
│   ├── page.js                      # Home page
│   ├── layout.js                    # Root layout
│   ├── globals.css                  # Global styles
│   ├── admin/
│   │   ├── login/page.js           # Admin login
│   │   ├── dashboard/page.js       # Admin dashboard
│   │   └── employees/
│   │       ├── new/page.js         # Create employee
│   │       └── [id]/page.js        # Edit employee
│   ├── staff/
│   │   └── [id]/page.js            # Public profile page
│   └── api/
│       └── [[...path]]/route.js    # All API routes
├── lib/
│   ├── supabase.js                 # Supabase client (browser)
│   ├── supabase-server.js          # Supabase client (server)
│   └── vcard.js                    # vCard generator
├── database-schema.sql              # Database setup SQL
├── sample-employees.csv             # CSV template
├── .env.example                     # Environment variables template
├── .env                            # Your environment variables (not in git)
└── README.md                       # This file
```

## API Routes

### Authentication
- `POST /api/auth` - Sign in/out
  - Body: `{ action: 'signin', email, password }`
  - Body: `{ action: 'signout' }`

### Employees (Admin Only)
- `GET /api/employees` - List all employees
- `POST /api/employees` - Create employee
- `GET /api/employees/[id]` - Get employee
- `PUT /api/employees/[id]` - Update employee
- `DELETE /api/employees/[id]` - Delete employee

### Public
- `GET /api/public/employees/[id]` - Get public employee profile
- `GET /api/qrcode?id=[id]` - Get QR code
- `GET /api/vcard?id=[id]` - Download vCard

### Uploads
- `POST /api/upload` - Upload employee photo
- `POST /api/import/csv` - Bulk import from CSV

## Deployment to Vercel

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Select your GitHub repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_BASE_URL` (set to your Vercel URL)
5. Click "Deploy"

### 3. Update Supabase Auth URLs

After deployment:
1. Copy your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Go to Supabase > Authentication > URL Configuration
3. Add to Redirect URLs:
   - `https://your-app.vercel.app/**`
   - `https://your-app.vercel.app/auth/callback`

## Branding Customization

Current branding uses UA colors:
- Primary: `#003366` (Deep blue)
- Secondary: `#F5F5F5` (Light gray)
- Accent: `#FFD700` (Gold)
- Font: Inter

To customize:
1. Edit `app/globals.css` - Update CSS variables
2. Edit component files - Replace color classes
3. Replace logo placeholder in header

## Security Notes

1. **Change default admin password** after first login
2. Row Level Security (RLS) is enabled on all tables
3. Storage policies restrict uploads to authenticated users
4. Public profiles are read-only
5. Always use environment variables for sensitive data

## Troubleshooting

### Error: "Your project's URL and Key are required"
- Make sure `.env` file exists with correct Supabase credentials
- Restart the dev server after updating `.env`

### Error: "Failed to fetch employees"
- Check if database schema is created in Supabase
- Verify admin user is created and authenticated
- Check browser console for detailed errors

### CSV Import Fails
- Ensure CSV has required fields: first_name, last_name, email
- Check for proper CSV formatting
- Verify no duplicate emails

### Photo Upload Fails
- Verify storage bucket `employee-photos` exists
- Check bucket is set to public
- Verify storage policies are created

### Can't Login
- Verify admin user is created in Supabase
- Check email and password are correct
- Ensure user is confirmed (Auto Confirm was checked)

## Support

For issues or questions:
1. Check Supabase logs in dashboard
2. Check browser console for errors
3. Verify all setup steps were completed
4. Check database tables exist and have data

## License

Private project for UA Company internal use.

---

**Initial Admin Credentials** (CHANGE IMMEDIATELY):
- Email: `admin@ua.aw`
- Password: `TempAdmin123!`
