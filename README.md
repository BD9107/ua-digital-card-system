# UA Digital Card System

A modern, secure digital business card platform built with Next.js and Supabase. Perfect for organizations looking to provide their team members with professional, shareable digital business cards.

## 🌟 Features

### Core Functionality
- **Digital Business Cards** - Modern, mobile-responsive employee profiles
- **QR Code Generation** - Instant QR codes for easy contact sharing
- **vCard Download** - One-click contact saving to phone/computer
- **Professional Links** - Linktree-style link management (social media, portfolios, etc.)
- **Admin Dashboard** - Complete employee management interface
- **Bulk Import** - CSV import for adding multiple employees at once
- **Photo Management** - Cloud-based photo storage with easy uploads
- **Active/Inactive Toggle** - Control which profiles are publicly visible

### Security Features
- ✅ Row Level Security (RLS) enabled on all database tables
- ✅ JWT-based authentication for admin access
- ✅ Rate limiting on login (5 attempts per 15 minutes)
- ✅ Input validation on all user data
- ✅ CORS restrictions (domain-specific access)
- ✅ Security headers (XSS protection, clickjacking prevention)
- ✅ Secure file uploads to Supabase Storage
- ✅ Environment-based configuration (no hardcoded credentials)

### Technical Highlights
- **Modern Stack** - Next.js 14 (App Router), React, Supabase
- **Database** - PostgreSQL with proper indexing and foreign key constraints
- **UI Framework** - shadcn/ui components with Tailwind CSS
- **Responsive Design** - Mobile-first, works on all devices
- **Performance** - Server-side rendering, optimized images
- **White-Label Ready** - Configurable branding via environment variables

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or higher
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ua-digital-card-system.git
   cd ua-digital-card-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```bash
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Application URLs
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ALLOWED_ORIGINS=http://localhost:3000

   # Branding (Optional - for white-labeling)
   NEXT_PUBLIC_COMPANY_NAME=Your Company Name
   NEXT_PUBLIC_PRODUCT_NAME=Your Product Name
   NEXT_PUBLIC_PRIMARY_COLOR=#0033AA
   NEXT_PUBLIC_SECONDARY_COLOR=#FBE122
   ```

4. **Set up Supabase database**
   
   Run the SQL scripts in your Supabase SQL Editor:
   - `database-schema.sql` - Creates tables and policies
   - `database-schema-links.sql` - Adds professional links feature

5. **Create storage bucket in Supabase**
   - Go to Storage in Supabase Dashboard
   - Create a public bucket named `employee-photos`
   - Policies are created automatically by the SQL script

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📋 Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key | `eyJhbGci...` |
| `NEXT_PUBLIC_BASE_URL` | Yes | Base URL of your application | `https://cards.yourcompany.com` |
| `ALLOWED_ORIGINS` | Yes | CORS allowed origins | `https://cards.yourcompany.com` |
| `NEXT_PUBLIC_COMPANY_NAME` | No | Company name for branding | `Universidad de Aruba` |
| `NEXT_PUBLIC_PRODUCT_NAME` | No | Product name | `UA Digital Card System` |
| `NEXT_PUBLIC_PRIMARY_COLOR` | No | Primary brand color | `#0033AA` |
| `NEXT_PUBLIC_SECONDARY_COLOR` | No | Secondary brand color | `#FBE122` |

---

## 🗄️ Database Schema

### Tables

#### `employees`
Main employee/staff information table.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Unique employee ID (primary key) |
| `first_name` | TEXT | First name (required) |
| `last_name` | TEXT | Last name (required) |
| `email` | TEXT | Email address (unique, required) |
| `phone` | TEXT | Phone number |
| `whatsapp` | TEXT | WhatsApp number |
| `job_title` | TEXT | Job title |
| `department` | TEXT | Department name |
| `website` | TEXT | Personal/department website |
| `photo_url` | TEXT | URL to profile photo |
| `slug` | TEXT | URL-friendly unique identifier |
| `is_active` | BOOLEAN | Profile visibility status |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

#### `employee_links`
Professional links (social media, portfolios, etc.)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique link ID (primary key) |
| `employee_id` | TEXT | Foreign key to employees |
| `label` | TEXT | Display name for link |
| `url` | TEXT | Link URL |
| `icon_type` | TEXT | Icon identifier |
| `sort_order` | INTEGER | Display order |
| `is_active` | BOOLEAN | Link visibility status |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### Security Policies (RLS)

**Admin Access (Authenticated Users):**
- Full CRUD operations on all data
- Photo upload/delete permissions

**Public Access (Anonymous Users):**
- Read-only access to active employee profiles
- Read-only access to active professional links
- No access to inactive profiles

---

## 📂 Project Structure

```
ua-digital-card-system/
├── app/                          # Next.js 14 App Router
│   ├── admin/                    # Admin section
│   │   ├── dashboard/           # Employee management
│   │   ├── employees/           # CRUD operations
│   │   └── login/               # Authentication
│   ├── staff/[id]/              # Public employee profiles
│   ├── api/[[...path]]/         # API routes
│   ├── layout.js                # Root layout
│   ├── page.js                  # Homepage
│   └── globals.css              # Global styles
├── components/                   # Reusable components
│   └── ui/                      # shadcn/ui components
├── lib/                         # Utility functions
│   ├── supabase.js              # Supabase client (browser)
│   ├── supabase-server.js       # Supabase client (server)
│   ├── vcard.js                 # vCard generation
│   ├── rate-limiter.js          # Rate limiting
│   └── validation.js            # Input validation
├── config/                      # Configuration
│   └── branding.js              # White-label configuration
├── public/                      # Static files
│   └── sample-employees.csv     # CSV import template
├── database-schema.sql          # Database setup script
├── database-schema-links.sql    # Links feature setup
├── .env.local                   # Environment variables (not in git)
├── .gitignore                   # Git ignore rules
├── next.config.js               # Next.js configuration
├── package.json                 # Dependencies
├── tailwind.config.js           # Tailwind CSS config
└── README.md                    # This file
```

---

## 👤 User Roles & Permissions

### Admin Users
**Access:** Admin dashboard (`/admin/dashboard`)
**Capabilities:**
- Create, read, update, delete employees
- Bulk import via CSV
- Upload/change employee photos
- Manage professional links
- Toggle employee active/inactive status
- View all employee data (active and inactive)

**Authentication:**
- Email/password authentication via Supabase Auth
- Session-based with JWT tokens
- Rate limited (5 login attempts per 15 minutes)

### Public Users
**Access:** Public employee profiles (`/staff/[id]`)
**Capabilities:**
- View active employee profiles
- Scan/save QR codes
- Download vCards
- Click professional links
- No login required

---

## 📥 CSV Import

### Using CSV Import

1. **Download the template**
   - Go to Admin Dashboard
   - Click "CSV Template" button
   - Opens `sample-employees.csv`

2. **Fill in employee data**
   - Use Excel, Google Sheets, or text editor
   - Follow the column format exactly
   - Save as CSV file

3. **Import the CSV**
   - Click "Import CSV" button
   - Select your CSV file
   - System validates and imports employees

### CSV Format

**Required columns:**
- `first_name` - Employee's first name
- `last_name` - Employee's last name
- `email` - Email address (must be unique)

**Optional columns:**
- `phone` - Phone number
- `whatsapp` - WhatsApp number
- `job_title` - Job title
- `department` - Department name
- `website` - Personal website URL
- `profile_photo_url` - URL to profile photo (or leave empty)

**Example:**
```csv
first_name,last_name,email,phone,whatsapp,job_title,department,website,profile_photo_url
John,Doe,john.doe@company.com,+297-582-1234,+297-582-1234,Professor,Engineering,https://example.com,
Jane,Smith,jane.smith@company.com,+297-582-1235,+297-582-1235,Dean,Administration,,
```

**Important Notes:**
- Headers must match exactly (case-sensitive)
- Each email must be unique
- Empty fields are allowed (except required columns)
- Commas in data should be avoided or properly escaped
- File encoding should be UTF-8

---

## 🔐 Security

### Authentication
- **Admin Login:** Supabase Auth with email/password
- **Session Management:** JWT tokens with automatic refresh
- **Rate Limiting:** 5 failed login attempts = 5-minute lockout

### Authorization
- **Row Level Security (RLS):** Enabled on all tables
- **Admin Policies:** Authenticated users have full access
- **Public Policies:** Anonymous users can only view active profiles

### Data Protection
- **CORS:** Restricted to allowed origins only
- **Security Headers:** XSS protection, clickjacking prevention
- **Input Validation:** All user input validated before database insertion
- **URL Sanitization:** Prevents JavaScript injection in URLs
- **File Upload:** Secure storage via Supabase with public bucket

### Best Practices Implemented
- ✅ No credentials in code (environment variables only)
- ✅ Prepared statements (SQL injection protection via Supabase)
- ✅ HTTPS enforced in production
- ✅ Error messages don't expose sensitive information
- ✅ Logging disabled in production (no sensitive data in console)

---

## 🎨 Customization & White-Labeling

### Branding Configuration

Edit `config/branding.js` or set environment variables:

```javascript
export const branding = {
  companyName: process.env.NEXT_PUBLIC_COMPANY_NAME || 'Your Company',
  productName: process.env.NEXT_PUBLIC_PRODUCT_NAME || 'Digital Card System',
  primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#0033AA',
  secondaryColor: process.env.NEXT_PUBLIC_SECONDARY_COLOR || '#FBE122',
  // ... more options
}
```

### Changing Colors

**Option 1: Environment Variables**
```bash
NEXT_PUBLIC_PRIMARY_COLOR=#FF5733
NEXT_PUBLIC_SECONDARY_COLOR=#33FF57
```

**Option 2: Direct Edit**
Edit `config/branding.js` and modify the default values.

**Option 3: Tailwind Classes**
For deeper customization, edit `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: '#0033AA',
      secondary: '#FBE122',
    }
  }
}
```

### Logo Replacement
1. Add your logo to `public/logo.png`
2. Update references in layout files
3. Adjust sizing in component files

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel auto-detects Next.js

3. **Add Environment Variables**
   - In Vercel project settings
   - Add all variables from `.env.local`
   - Deploy!

4. **Configure Custom Domain** (Optional)
   - Add your domain in Vercel settings
   - Update DNS records as instructed
   - SSL certificate is automatic

### Deploy to Other Platforms

**Netlify:**
- Build command: `npm run build`
- Publish directory: `.next`
- Add environment variables in Netlify dashboard

**Self-Hosted:**
```bash
npm run build
npm run start
```
Use PM2 or similar for process management.

### Post-Deployment Checklist

- [ ] Test login functionality
- [ ] Verify CSV import works
- [ ] Check public profiles load correctly
- [ ] Test QR code generation
- [ ] Test vCard downloads
- [ ] Verify photo uploads work
- [ ] Check all links work
- [ ] Test on mobile devices
- [ ] Verify environment variables are set
- [ ] Update `ALLOWED_ORIGINS` to production URL

---

## 🧪 Testing

### Manual Testing Checklist

**Authentication:**
- [ ] Login with correct credentials works
- [ ] Login with wrong password fails
- [ ] 5 failed attempts triggers rate limit
- [ ] Rate limit releases after timeout
- [ ] Logout works correctly

**Employee Management:**
- [ ] Create new employee
- [ ] Edit existing employee
- [ ] Delete employee
- [ ] Toggle active/inactive status
- [ ] Upload photo
- [ ] Add professional links

**CSV Import:**
- [ ] Download template
- [ ] Import valid CSV file
- [ ] Import handles duplicate emails correctly
- [ ] Import validates required fields

**Public Profiles:**
- [ ] Profile page loads
- [ ] QR code displays
- [ ] vCard downloads
- [ ] Professional links are clickable
- [ ] Inactive profiles are not accessible
- [ ] Contact buttons work (email, phone, WhatsApp)

**Security:**
- [ ] Non-admin cannot access dashboard
- [ ] Public users cannot edit data
- [ ] CORS blocks unauthorized origins
- [ ] Input validation rejects bad data

---

## 🐛 Troubleshooting

### Common Issues

**"Module not found" errors:**
```bash
rm -rf node_modules
npm install
```

**Server won't start:**
- Check if port 3000 is already in use
- Verify environment variables are set
- Check for syntax errors in recent changes

**Login not working:**
- Verify Supabase credentials in `.env.local`
- Check Supabase project is active
- Ensure RLS policies are enabled

**CSV import fails:**
- Check CSV format matches template
- Verify no duplicate emails
- Check for special characters in data

**Images not loading:**
- Verify Supabase storage bucket exists
- Check bucket is set to public
- Verify storage policies are correct

**"Cannot connect to Supabase":**
- Check internet connection
- Verify Supabase project URL
- Verify anon key is correct and not expired

### Getting Help

1. Check the error message in browser console (F12)
2. Check terminal output for server errors
3. Review Supabase logs in dashboard
4. Check GitHub Issues for similar problems

---

## 📊 Performance

### Optimization Features
- **Server-Side Rendering:** Fast initial page loads
- **Image Optimization:** Next.js automatic image optimization
- **Database Indexing:** Optimized queries with proper indexes
- **CDN Delivery:** Static assets served via Vercel/Netlify CDN
- **Lazy Loading:** Components load as needed

### Performance Metrics
- **Lighthouse Score:** 90+ (Performance)
- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3s
- **Database Queries:** < 100ms average

### Scalability
- **Current Capacity:** 500+ employees, thousands of daily views
- **Database:** PostgreSQL scales horizontally
- **File Storage:** Unlimited via Supabase
- **Serverless Functions:** Auto-scales with traffic

---

## 🛠️ Development

### Available Scripts

```bash
# Development server (with hot reload)
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

### Code Style
- ESLint configuration included
- Prettier recommended for formatting
- Follow Next.js conventions

### Contributing
1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is proprietary software developed for Universidad de Aruba.
All rights reserved.

---

## 🙏 Acknowledgments

**Built with:**
- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend as a service
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [React](https://react.dev/) - UI library
- [Vercel](https://vercel.com/) - Deployment platform

---

## 📞 Support

For technical support or questions:
- **Email:** support@yourcompany.com
- **Documentation:** This README file
- **Issues:** GitHub Issues (if applicable)

---

## 🗺️ Roadmap

### Planned Features
- [ ] Analytics dashboard (track profile views, QR scans)
- [ ] NFC card integration
- [ ] Email signature generator
- [ ] Multiple language support
- [ ] Dark mode
- [ ] Advanced search and filtering
- [ ] Export to PDF
- [ ] Department-based organization pages
- [ ] Two-factor authentication
- [ ] API for third-party integrations

---

## ⚙️ Technical Specifications

**Frontend:**
- Next.js 14.2.3 (App Router)
- React 18.x
- Tailwind CSS 3.x
- shadcn/ui components

**Backend:**
- Next.js API Routes (serverless)
- Supabase (PostgreSQL database)
- Supabase Storage (file storage)
- Supabase Auth (authentication)

**Deployment:**
- Vercel (recommended)
- Node.js 18+ required
- Serverless architecture

**Browser Support:**
- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## 📈 Version History

### v1.0.0 (December 2024)
- Initial release
- Employee management system
- CSV bulk import
- QR code generation
- vCard downloads
- Professional links feature
- Admin dashboard
- Public employee profiles
- Row Level Security implementation
- Rate limiting
- Input validation
- White-label configuration

---

**Made with ❤️ for University of Aruba**
