import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import QRCode from 'qrcode'
import { generateVCard } from '@/lib/vcard'
import Papa from 'papaparse'

// Create Supabase Admin Client (with service role key)
function createSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Helper function for auth middleware
async function authMiddleware(request) {
  try {
    // Try to get token from Authorization header first
    const authHeader = request.headers.get('authorization')
    let supabase
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      // Create supabase client with the token
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      )
      
      // Verify the token
      const { data: { user }, error } = await supabase.auth.getUser(token)
      
      if (error || !user) {
        console.error('Token verification failed:', error)
        return { error: 'Unauthorized - Invalid token', status: 401 }
      }
      
      // SECURITY CHECK: Verify user status in admin_users table
      const supabaseAdmin = createSupabaseAdmin()
      const { data: adminUser } = await supabaseAdmin
        .from('admin_users')
        .select('status')
        .eq('email', user.email)
        .single()
      
      if (adminUser?.status === 'Suspended') {
        console.log('Blocked suspended user:', user.email)
        return { error: 'ACCOUNT_SUSPENDED', status: 403, suspended: true }
      }
      
      if (adminUser?.status === 'Inactive') {
        console.log('Blocked inactive user:', user.email)
        return { error: 'ACCOUNT_INACTIVE', status: 403, inactive: true }
      }
      
      console.log('Auth successful via token for user:', user.email)
      return { supabase, user }
    }
    
    // Fallback to cookie-based auth
    supabase = await createSupabaseServer()
    
    // Get the session first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return { error: 'Unauthorized - Session error', status: 401 }
    }
    
    if (!session) {
      console.error('No session found')
      return { error: 'Unauthorized - No session', status: 401 }
    }
    
    // Get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('User error:', userError)
      return { error: 'Unauthorized - User error', status: 401 }
    }
    
    if (!user) {
      console.error('No user found')
      return { error: 'Unauthorized - No user', status: 401 }
    }
    
    // SECURITY CHECK: Verify user status in admin_users table
    const supabaseAdminForSession = createSupabaseAdmin()
    const { data: adminUserSession } = await supabaseAdminForSession
      .from('admin_users')
      .select('status')
      .eq('email', user.email)
      .single()
    
    if (adminUserSession?.status === 'Suspended') {
      console.log('Blocked suspended user:', user.email)
      return { error: 'ACCOUNT_SUSPENDED', status: 403, suspended: true }
    }
    
    if (adminUserSession?.status === 'Inactive') {
      console.log('Blocked inactive user:', user.email)
      return { error: 'ACCOUNT_INACTIVE', status: 403, inactive: true }
    }
    
    console.log('Auth successful via session for user:', user.email)
    return { supabase, user }
  } catch (error) {
    console.error('Auth middleware error:', error)
    return { error: 'Unauthorized - Exception', status: 401 }
  }
}

// Helper to generate slug from name
function generateSlug(firstName, lastName) {
  return `${firstName}-${lastName}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
}

// GET handler
export async function GET(request) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/', '')
  const segments = path.split('/').filter(Boolean)

  try {
    // Auth routes
    if (segments[0] === 'auth') {
      const action = url.searchParams.get('action')
      const supabase = await createSupabaseServer()
      
      if (action === 'user') {
        const { data, error } = await supabase.auth.getUser()
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 401 })
        }
        return NextResponse.json({ user: data.user })
      }
      
      if (action === 'session') {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 401 })
        }
        return NextResponse.json({ session: data.session })
      }
      
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Public employee profile (no auth required, with active links)
    if (segments[0] === 'public' && segments[1] === 'employees') {
      // Use client without auth for public access
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
      
      const id = segments[2]
      
      const { data: employee, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single()
      
      if (error || !employee) {
        console.error('Error fetching employee:', error)
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
      }
      
      // Fetch only active professional links
      const { data: links, error: linksError } = await supabase
        .from('employee_links')
        .select('id, label, url, icon_type, sort_order')
        .eq('employee_id', id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      
      if (linksError) {
        console.error('Error fetching public links:', linksError)
      }
      
      console.log(`Public profile for ${id}: Found ${links?.length || 0} professional links`)
      
      return NextResponse.json({
        ...employee,
        professional_links: links || []
      })
    }

    // QR Code generation
    if (segments[0] === 'qrcode') {
      const employeeId = url.searchParams.get('id')
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const profileUrl = `${baseUrl}/staff/${employeeId}`
      
      const qrCode = await QRCode.toDataURL(profileUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#616264',
          light: '#FFFFFF'
        }
      })
      
      return NextResponse.json({ qrCode })
    }

    // vCard download
    if (segments[0] === 'vcard') {
      const employeeId = url.searchParams.get('id')
      const supabase = await createSupabaseServer()
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .eq('is_active', true)
        .single()
      
      if (error || !data) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
      }
      
      const vcardData = generateVCard(data)
      const fileName = `${data.first_name}-${data.last_name}.vcf`
      
      return new NextResponse(vcardData, {
        headers: {
          'Content-Type': 'text/vcard',
          'Content-Disposition': `attachment; filename="${fileName}"`
        }
      })
    }

    // CSV Template Download (public)
    if (segments[0] === 'csv-template') {
      const csvHeader = 'first_name,last_name,email,phone,whatsapp,job_title,department,website,profile_photo_url'
      const csvExample = 'John,Doe,john.doe@example.com,+1234567890,+1234567890,Software Engineer,Engineering,https://example.com,https://example.com/photo.jpg'
      const csvContent = `${csvHeader}\n${csvExample}`
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="employee-import-template.csv"'
        }
      })
    }

    // Protected routes - require authentication
    const authResult = await authMiddleware(request)
    if (authResult.error) {
      // Special handling for suspended/inactive accounts
      if (authResult.suspended || authResult.inactive) {
        return NextResponse.json({ 
          error: authResult.error,
          blocked: authResult.suspended ? 'suspended' : 'inactive'
        }, { status: 403 })
      }
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }
    const { supabase } = authResult

    // Get all employees
    if (segments[0] === 'employees' && segments.length === 1) {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json(data || [])
    }

    // Get single employee (with professional links)
    if (segments[0] === 'employees' && segments[1]) {
      const { data: employee, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', segments[1])
        .single()
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      // Fetch professional links for this employee
      const { data: links, error: linksError } = await supabase
        .from('employee_links')
        .select('*')
        .eq('employee_id', segments[1])
        .order('sort_order', { ascending: true })
      
      if (linksError) {
        console.error('Error fetching links:', linksError)
      }
      
      return NextResponse.json({
        ...employee,
        professional_links: links || []
      })
    }

    // =====================================================
    // ADMIN USERS ENDPOINTS
    // =====================================================
    
    // GET /api/admin-users - List all admin users (with role-based filtering)
    if (segments[0] === 'admin-users' && segments.length === 1) {
      const { data: currentAdmin, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', authResult.user.id)
        .single()
      
      if (adminError || !currentAdmin) {
        return NextResponse.json({ error: 'You are not an admin user' }, { status: 403 })
      }
      
      // Viewer can only see themselves
      if (currentAdmin.role === 'Viewer') {
        return NextResponse.json([currentAdmin])
      }
      
      // Others can see all users (RLS will filter based on their role)
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching admin users:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json(data || [])
    }
    
    // GET /api/admin-users/me - Get current user's admin profile
    if (segments[0] === 'admin-users' && segments[1] === 'me') {
      // Query by email instead of UUID for RLS compatibility
      const userEmail = authResult.user.email
      console.log('=== ADMIN-USERS/ME REQUEST ===')
      console.log('User email:', userEmail)
      
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', userEmail)
        .single()
      
      if (error) {
        console.error('Error fetching admin user:', error)
        return NextResponse.json({ error: 'Admin user not found', details: error.message }, { status: 404 })
      }
      
      console.log('Admin user status:', data?.status)
      
      // BLOCK SUSPENDED/INACTIVE users right here
      if (data?.status === 'Suspended') {
        console.log('BLOCKING SUSPENDED USER at /api/admin-users/me')
        return NextResponse.json({ 
          error: 'ACCOUNT_SUSPENDED', 
          blocked: 'suspended',
          message: 'Your account has been suspended'
        }, { status: 403 })
      }
      
      if (data?.status === 'Inactive') {
        console.log('BLOCKING INACTIVE USER at /api/admin-users/me')
        return NextResponse.json({ 
          error: 'ACCOUNT_INACTIVE', 
          blocked: 'inactive',
          message: 'Your account is inactive'
        }, { status: 403 })
      }
      
      return NextResponse.json(data)
    }
    
    // GET /api/admin-users/[id] - Get single admin user
    if (segments[0] === 'admin-users' && segments[1]) {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', segments[1])
        .single()
      
      if (error) {
        return NextResponse.json({ error: 'Admin user not found' }, { status: 404 })
      }
      
      return NextResponse.json(data)
    }

    return NextResponse.json({ message: 'API is running' })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST handler
export async function POST(request) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/', '')
  const segments = path.split('/').filter(Boolean)

  try {
    // =====================================================
    // POST /api/login - Secure login with lockout protection
    // =====================================================
    if (segments[0] === 'login') {
      const body = await request.json()
      const { email, password } = body
      
      console.log('=== LOGIN ATTEMPT ===')
      console.log('Email:', email)
      
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
      }
      
      const supabaseAdmin = createSupabaseAdmin()
      
      // First check if user exists in admin_users and their status
      const { data: adminUser, error: adminError } = await supabaseAdmin
        .from('admin_users')
        .select('id, email, role, status, failed_login_attempts, lockout_reason')
        .eq('email', email.toLowerCase())
        .single()
      
      console.log('Admin user lookup result:', adminUser ? { email: adminUser.email, status: adminUser.status, role: adminUser.role } : 'NOT FOUND')
      console.log('Admin error:', adminError)
      
      // Check if user is suspended or inactive BEFORE attempting login
      if (adminUser) {
        console.log('Checking status:', adminUser.status)
        
        if (adminUser.status === 'Suspended') {
          console.log('BLOCKING SUSPENDED USER:', email)
          return NextResponse.json({ 
            error: 'SUSPENDED',
            message: 'Your account has been suspended due to multiple failed login attempts.',
            lockout_reason: adminUser.lockout_reason || 'Security lockout',
            contact_info: {
              message: 'Contact your Overwatch administrator to restore access.',
              action: 'An Overwatch user must manually change your status back to Active.'
            }
          }, { status: 403 })
        }
        
        if (adminUser.status === 'Inactive') {
          console.log('BLOCKING INACTIVE USER:', email)
          return NextResponse.json({ 
            error: 'INACTIVE',
            message: 'Your account is currently inactive. Contact an administrator to reactivate.'
          }, { status: 403 })
        }
      }
      
      // Attempt login with Supabase Auth
      const supabase = await createSupabaseServer()
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (loginError) {
        // Login failed - record the failed attempt if user exists in admin_users
        if (adminUser) {
          // Get current failed attempts
          const currentAttempts = adminUser.failed_login_attempts || 0
          const now = new Date().toISOString()
          
          // Get first failed login time
          const { data: currentData } = await supabaseAdmin
            .from('admin_users')
            .select('first_failed_login_at')
            .eq('email', email.toLowerCase())
            .single()
          
          let firstFailedAt = currentData?.first_failed_login_at
          
          // Check if 10 minute window has passed - reset if so
          if (firstFailedAt) {
            const firstFailedTime = new Date(firstFailedAt)
            const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
            
            if (firstFailedTime < tenMinutesAgo) {
              // Reset the counter
              firstFailedAt = now
              await supabaseAdmin
                .from('admin_users')
                .update({
                  failed_login_attempts: 1,
                  first_failed_login_at: now,
                  last_failed_login_at: now
                })
                .eq('email', email.toLowerCase())
              
              return NextResponse.json({ 
                error: 'Invalid credentials',
                attempts_remaining: 4
              }, { status: 401 })
            }
          }
          
          // Increment failed attempts
          const newAttempts = currentAttempts + 1
          
          const updateData = {
            failed_login_attempts: newAttempts,
            last_failed_login_at: now
          }
          
          // Set first_failed_login_at if this is the first attempt
          if (!firstFailedAt) {
            updateData.first_failed_login_at = now
          }
          
          // Check if we need to suspend the user
          if (newAttempts >= 5) {
            updateData.status = 'Suspended'
            updateData.lockout_reason = 'Automatic lockout: 5 failed login attempts within 10 minutes at ' + now
            
            await supabaseAdmin
              .from('admin_users')
              .update(updateData)
              .eq('email', email.toLowerCase())
            
            return NextResponse.json({ 
              error: 'SUSPENDED',
              message: 'Your account has been suspended due to multiple failed login attempts.',
              lockout_reason: 'Too many failed login attempts',
              contact_info: {
                message: 'Contact your Overwatch administrator to restore access.',
                action: 'An Overwatch user must manually change your status back to Active.'
              }
            }, { status: 403 })
          }
          
          await supabaseAdmin
            .from('admin_users')
            .update(updateData)
            .eq('email', email.toLowerCase())
          
          return NextResponse.json({ 
            error: 'Invalid credentials',
            attempts_remaining: 5 - newAttempts
          }, { status: 401 })
        }
        
        // User not in admin_users - generic error
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }
      
      // Login successful!
      // Check if user exists in admin_users table
      if (!adminUser) {
        // User authenticated but not an admin - sign them out
        await supabase.auth.signOut()
        return NextResponse.json({ 
          error: 'You do not have admin access. Contact an administrator.'
        }, { status: 403 })
      }
      
      // Reset failed login attempts on successful login
      await supabaseAdmin
        .from('admin_users')
        .update({
          failed_login_attempts: 0,
          first_failed_login_at: null,
          last_failed_login_at: null
        })
        .eq('email', email.toLowerCase())
      
      // Set last activity cookie for session timeout
      const response = NextResponse.json({ 
        user: data.user, 
        session: data.session,
        admin: {
          role: adminUser.role,
          status: adminUser.status
        }
      })
      
      // Set the last activity cookie
      response.cookies.set('ua_last_activity', Date.now().toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 60, // 30 minutes
        path: '/'
      })
      
      return response
    }
    
    // Legacy auth routes (keep for backward compatibility)
    if (segments[0] === 'auth') {
      const body = await request.json()
      const { action, email, password } = body
      const supabase = await createSupabaseServer()
      
      if (action === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 401 })
        }
        
        return NextResponse.json({ user: data.user, session: data.session })
      }
      
      if (action === 'signout') {
        const { error } = await supabase.auth.signOut()
        
        // Clear the activity cookie
        const response = NextResponse.json({ success: true })
        response.cookies.delete('ua_last_activity')
        
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        
        return response
      }
      
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Protected routes
    const authResult = await authMiddleware(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }
    const { supabase } = authResult

    // =====================================================
    // POST /api/admin-users - Create new admin user (Overwatch or Admin)
    // Role hierarchy: Overwatch > Admin > Operator > Viewer
    // =====================================================
    if (segments[0] === 'admin-users' && segments.length === 1) {
      // Check current user's role
      const { data: currentAdmin, error: adminError } = await supabase
        .from('admin_users')
        .select('role')
        .eq('email', authResult.user.email)
        .single()
      
      // Only Overwatch and Admin can create users
      if (adminError || !currentAdmin || !['Overwatch', 'Admin'].includes(currentAdmin.role)) {
        return NextResponse.json({ error: 'Only Overwatch and Admin can create admin users' }, { status: 403 })
      }
      
      const body = await request.json()
      const { email, role, status = 'Pending' } = body
      
      if (!email || !role) {
        return NextResponse.json({ error: 'Email and role are required' }, { status: 400 })
      }
      
      // Validate role
      const validRoles = ['Overwatch', 'Admin', 'Operator', 'Viewer']
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }
      
      // Admin can only create Operator or Viewer roles
      if (currentAdmin.role === 'Admin' && ['Overwatch', 'Admin'].includes(role)) {
        return NextResponse.json({ error: 'Admins can only create Operator or Viewer users' }, { status: 403 })
      }
      
      // Validate status
      const validStatuses = ['Active', 'Inactive', 'Pending', 'Suspended']
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      
      // Check if user already exists in admin_users
      const { data: existingAdmin } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .single()
      
      if (existingAdmin) {
        return NextResponse.json({ error: 'This email is already an admin user' }, { status: 409 })
      }
      
      // Use admin client to invite the user
      const supabaseAdmin = createSupabaseAdmin()
      
      // Invite user via Supabase Auth (sends email with magic link)
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`
      })
      
      if (inviteError) {
        console.error('Invite error:', inviteError)
        
        // Check if user already exists in auth
        if (inviteError.message.includes('already') || inviteError.message.includes('exists') || inviteError.message.includes('registered')) {
          // User exists in auth, get their ID
          const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
          const existingAuthUser = authUsers?.users?.find(u => u.email === email)
          
          if (existingAuthUser) {
            // Insert into admin_users with existing auth ID
            const { data: newAdmin, error: insertError } = await supabaseAdmin
              .from('admin_users')
              .insert([{
                id: existingAuthUser.id,
                email: email,
                role: role,
                status: status
              }])
              .select()
              .single()
            
            if (insertError) {
              console.error('Error inserting admin user:', insertError)
              return NextResponse.json({ error: insertError.message }, { status: 500 })
            }
            
            // Send password reset email to existing user
            try {
              await supabaseAdmin.auth.resetPasswordForEmail(email, {
                redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`
              })
              return NextResponse.json({ 
                success: true, 
                admin: newAdmin,
                message: `Admin user created. Password reset email sent to ${email}.`
              })
            } catch (resetError) {
              console.error('Password reset email error:', resetError)
              return NextResponse.json({ 
                success: true, 
                admin: newAdmin,
                message: `Admin user created. User can use "Forgot Password" to set up their account.`
              })
            }
          }
        }
        
        return NextResponse.json({ error: inviteError.message }, { status: 500 })
      }
      
      // Insert into admin_users table with the new auth user ID
      const { data: newAdmin, error: insertError } = await supabaseAdmin
        .from('admin_users')
        .insert([{
          id: inviteData.user.id,
          email: email,
          role: role,
          status: status
        }])
        .select()
        .single()
      
      if (insertError) {
        console.error('Error inserting admin user:', insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
      
      return NextResponse.json({ 
        success: true, 
        admin: newAdmin,
        message: `Admin user created and invitation email sent to ${email}. Status: ${status}.`
      })
    }
    
    // =====================================================
    // POST /api/admin-users/bulk - Bulk operations (Overwatch or Admin with restrictions)
    // Role hierarchy: Overwatch > Admin > Operator > Viewer
    // =====================================================
    if (segments[0] === 'admin-users' && segments[1] === 'bulk') {
      // Check current user's role
      const { data: currentAdmin, error: adminError } = await supabase
        .from('admin_users')
        .select('role')
        .eq('email', authResult.user.email)
        .single()
      
      // Only Overwatch and Admin can perform bulk operations
      if (adminError || !currentAdmin || !['Overwatch', 'Admin'].includes(currentAdmin.role)) {
        return NextResponse.json({ error: 'Only Overwatch and Admin can perform bulk operations' }, { status: 403 })
      }
      
      const body = await request.json()
      const { action, ids, value } = body
      
      if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: 'Action and ids array are required' }, { status: 400 })
      }
      
      const supabaseAdmin = createSupabaseAdmin()
      
      // Get target users to check their roles
      const { data: targetUsers } = await supabaseAdmin
        .from('admin_users')
        .select('id, role, status, email')
        .in('id', ids)
      
      // Admin restrictions: Can only manage Operators and Viewers
      if (currentAdmin.role === 'Admin') {
        const higherRoleUsers = targetUsers?.filter(u => ['Overwatch', 'Admin'].includes(u.role)) || []
        if (higherRoleUsers.length > 0) {
          return NextResponse.json({ 
            error: 'Admins can only perform bulk actions on Operators and Viewers' 
          }, { status: 403 })
        }
        
        // Admin cannot do role changes or delete
        if (action === 'update_role' || action === 'delete') {
          return NextResponse.json({ 
            error: 'Admins can only change status in bulk operations' 
          }, { status: 403 })
        }
      }
      
      if (action === 'update_role') {
        const validRoles = ['Overwatch', 'Admin', 'Operator', 'Viewer']
        if (!validRoles.includes(value)) {
          return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
        }
        
        const { error } = await supabaseAdmin
          .from('admin_users')
          .update({ role: value })
          .in('id', ids)
        
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        
        return NextResponse.json({ success: true, message: `Updated role to ${value} for ${ids.length} users` })
      }
      
      if (action === 'update_status') {
        const validStatuses = ['Active', 'Inactive', 'Pending', 'Suspended']
        if (!validStatuses.includes(value)) {
          return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }
        
        // If activating users, just update status - no password reset needed
        // Users already set their password during initial invite flow
        if (value === 'Active') {
          // Get count of users being activated from Pending
          const { data: pendingUsers } = await supabaseAdmin
            .from('admin_users')
            .select('id, email')
            .in('id', ids)
            .eq('status', 'Pending')
          
          // Update status
          const { error } = await supabaseAdmin
            .from('admin_users')
            .update({ status: value })
            .in('id', ids)
          
          if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
          }
          
          const activatedCount = pendingUsers?.length || 0
          return NextResponse.json({ 
            success: true, 
            message: `Activated ${activatedCount} user(s) successfully!`
          })
        }
        
        const { error } = await supabaseAdmin
          .from('admin_users')
          .update({ status: value })
          .in('id', ids)
        
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        
        return NextResponse.json({ success: true, message: `Updated status to ${value} for ${ids.length} users` })
      }
      
      if (action === 'delete') {
        const supabaseAdmin = createSupabaseAdmin()
        const { error } = await supabaseAdmin
          .from('admin_users')
          .delete()
          .in('id', ids)
        
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        
        return NextResponse.json({ success: true, message: `Deleted ${ids.length} users` })
      }
      
      return NextResponse.json({ error: 'Invalid bulk action' }, { status: 400 })
    }

    // Create employee (with optional professional links)
    // Permissions: Overwatch, Admin, Operator can create. Viewer cannot.
    if (segments[0] === 'employees' && segments.length === 1) {
      // Get current user's role
      const { data: currentAdmin } = await supabase
        .from('admin_users')
        .select('role')
        .eq('email', authResult.user.email)
        .single()
      
      // Check permissions - Viewer cannot create employees
      if (!currentAdmin || currentAdmin.role === 'Viewer') {
        return NextResponse.json({ error: 'Viewers do not have permission to add employees' }, { status: 403 })
      }
      
      const body = await request.json()
      
      // Extract professional_links if provided
      const { professional_links, ...employeeData } = body
      
      // Generate unique ID and slug
      const employeeId = `emp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const slug = generateSlug(employeeData.first_name, employeeData.last_name)
      
      const { data, error } = await supabase
        .from('employees')
        .insert([{
          id: employeeId,
          slug,
          ...employeeData,
        }])
        .select()
        .single()
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      // Handle professional links if provided
      if (professional_links && Array.isArray(professional_links) && professional_links.length > 0) {
        const linksToInsert = professional_links.map((link, index) => ({
          employee_id: employeeId,
          label: link.label,
          url: link.url.startsWith('http') ? link.url : `https://${link.url}`,
          icon_type: link.icon_type || 'web',
          sort_order: link.sort_order !== undefined ? link.sort_order : index,
          is_active: link.is_active !== undefined ? link.is_active : true
        }))
        
        const { error: linksError } = await supabase
          .from('employee_links')
          .insert(linksToInsert)
        
        if (linksError) {
          console.error('Error creating links:', linksError)
        }
      }
      
      return NextResponse.json(data)
    }

    // CSV Import
    // Permissions: Overwatch, Admin, Operator can import. Viewer cannot.
    if (segments[0] === 'import' && segments[1] === 'csv') {
      // Get current user's role
      const { data: currentAdmin } = await supabase
        .from('admin_users')
        .select('role')
        .eq('email', authResult.user.email)
        .single()
      
      // Check permissions - Viewer cannot import
      if (!currentAdmin || currentAdmin.role === 'Viewer') {
        return NextResponse.json({ error: 'Viewers do not have permission to import employees' }, { status: 403 })
      }
      
      const formData = await request.formData()
      const file = formData.get('file')
      
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      }
      
      const text = await file.text()
      const result = Papa.parse(text, { header: true, skipEmptyLines: true })
      
      const employees = result.data.map(row => ({
        id: `emp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        slug: generateSlug(row.first_name, row.last_name),
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        phone: row.phone || null,
        whatsapp: row.whatsapp || null,
        job_title: row.job_title || null,
        department: row.department || null,
        website: row.website || null,
        photo_url: row.profile_photo_url || null,
        is_active: true
      }))
      
      const { data, error } = await supabase
        .from('employees')
        .insert(employees)
        .select()
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json({ 
        success: true, 
        count: data.length,
        employees: data 
      })
    }

    // Photo upload
    if (segments[0] === 'upload') {
      const formData = await request.formData()
      const file = formData.get('file')
      const employeeId = formData.get('employeeId')
      
      if (!file || !employeeId) {
        return NextResponse.json(
          { error: 'File and employeeId are required' },
          { status: 400 }
        )
      }
      
      // Get employee details to include name in filename
      const { data: employee } = await supabase
        .from('employees')
        .select('first_name, last_name')
        .eq('id', employeeId)
        .single()
      
      const fileBuffer = await file.arrayBuffer()
      const employeeName = employee ? `${employee.first_name}_${employee.last_name}` : employeeId
      const sanitizedName = employeeName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()
      const fileName = `${sanitizedName}_${Date.now()}.${file.name.split('.').pop()}`
      
      const { data, error } = await supabase
        .storage
        .from('employee-photos')
        .upload(fileName, fileBuffer, {
          contentType: file.type,
          upsert: true
        })
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      const { data: { publicUrl } } = supabase
        .storage
        .from('employee-photos')
        .getPublicUrl(fileName)
      
      const { error: updateError } = await supabase
        .from('employees')
        .update({ photo_url: publicUrl })
        .eq('id', employeeId)
      
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
      
      return NextResponse.json({ url: publicUrl })
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT handler
export async function PUT(request) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/', '')
  const segments = path.split('/').filter(Boolean)

  try {
    const authResult = await authMiddleware(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }
    const { supabase } = authResult

    // =====================================================
    // PUT /api/admin-users/[id] - Update admin user
    // =====================================================
    if (segments[0] === 'admin-users' && segments[1]) {
      const targetId = segments[1]
      const body = await request.json()
      const { role, status, email } = body
      
      // Get current user's admin info (by email for RLS compatibility)
      const { data: currentAdmin, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', authResult.user.email)
        .single()
      
      if (adminError || !currentAdmin) {
        return NextResponse.json({ error: 'You are not an admin user' }, { status: 403 })
      }
      
      // Use admin client to bypass RLS for reading target user
      const supabaseAdmin = createSupabaseAdmin()
      
      // Get the target user's current data
      const { data: targetUser, error: targetError } = await supabaseAdmin
        .from('admin_users')
        .select('*')
        .eq('id', targetId)
        .single()
      
      if (targetError || !targetUser) {
        return NextResponse.json({ error: 'Admin user not found' }, { status: 404 })
      }
      
      // Permission checks based on role hierarchy
      // Overwatch > Admin > Operator > Viewer
      if (currentAdmin.role === 'Viewer' || currentAdmin.role === 'Operator') {
        return NextResponse.json({ error: 'You do not have permission to update admin users' }, { status: 403 })
      }
      
      // Admin restrictions
      if (currentAdmin.role === 'Admin') {
        // Admin cannot modify Overwatch or other Admins
        if (['Overwatch', 'Admin'].includes(targetUser.role)) {
          return NextResponse.json({ error: 'Admins can only modify Operators and Viewers' }, { status: 403 })
        }
        // Admin cannot change roles
        if (role) {
          return NextResponse.json({ error: 'Admins cannot change user roles' }, { status: 403 })
        }
      }
      
      // Build update object
      const updateData = {}
      if (email) updateData.email = email
      
      // Only Overwatch can change roles
      if (role && currentAdmin.role === 'Overwatch') {
        const validRoles = ['Overwatch', 'Admin', 'Operator', 'Viewer']
        if (!validRoles.includes(role)) {
          return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
        }
        updateData.role = role
      }
      
      // Overwatch and Admin can change status (Admin only for Operators/Viewers - already checked above)
      if (status) {
        const validStatuses = ['Active', 'Inactive', 'Pending', 'Suspended']
        if (!validStatuses.includes(status)) {
          return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }
        updateData.status = status
      }
      
      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
      }
      
      // If activating a suspended user, also reset their failed login attempts
      if (status === 'Active' && targetUser.status === 'Suspended') {
        updateData.failed_login_attempts = 0
        updateData.first_failed_login_at = null
        updateData.last_failed_login_at = null
        updateData.lockout_reason = null
      }
      
      // Perform the update using admin client
      const { data, error } = await supabaseAdmin
        .from('admin_users')
        .update(updateData)
        .eq('id', targetId)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating admin user:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      // Custom messages for different status transitions
      if (status === 'Active' && targetUser.status === 'Suspended') {
        return NextResponse.json({ 
          ...data, 
          message: `User ${targetUser.email} has been reactivated. Failed login attempts have been reset.` 
        })
      }
      
      if (status === 'Active' && targetUser.status === 'Pending') {
        return NextResponse.json({ 
          ...data, 
          message: `User ${targetUser.email} has been activated successfully!` 
        })
      }
      
      return NextResponse.json(data)
    }

    // Update employee (with professional links)
    // Permissions: Overwatch, Admin, Operator can edit
    // Only Overwatch and Admin can change is_active status
    // Viewer cannot edit
    if (segments[0] === 'employees' && segments[1]) {
      // Get current user's role
      const { data: currentAdmin } = await supabase
        .from('admin_users')
        .select('role')
        .eq('email', authResult.user.email)
        .single()
      
      // Check permissions
      if (!currentAdmin || currentAdmin.role === 'Viewer') {
        return NextResponse.json({ error: 'Viewers do not have permission to edit employees' }, { status: 403 })
      }
      
      const body = await request.json()
      const id = segments[1]
      
      // Extract professional_links if provided
      const { professional_links, ...employeeData } = body
      
      // Operator cannot change is_active status
      if (currentAdmin.role === 'Operator' && 'is_active' in employeeData) {
        return NextResponse.json({ error: 'Operators cannot change employee status. Contact an Admin or Overwatch.' }, { status: 403 })
      }
      
      // Update slug if name changed
      if (employeeData.first_name || employeeData.last_name) {
        const { data: existing } = await supabase
          .from('employees')
          .select('first_name, last_name')
          .eq('id', id)
          .single()
        
        const firstName = employeeData.first_name || existing.first_name
        const lastName = employeeData.last_name || existing.last_name
        employeeData.slug = generateSlug(firstName, lastName)
      }
      
      const { data, error } = await supabase
        .from('employees')
        .update(employeeData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      // Handle professional links if provided
      if (professional_links && Array.isArray(professional_links)) {
        // Delete all existing links for this employee
        await supabase
          .from('employee_links')
          .delete()
          .eq('employee_id', id)
        
        // Insert new links
        if (professional_links.length > 0) {
          const linksToInsert = professional_links.map((link, index) => ({
            employee_id: id,
            label: link.label,
            url: link.url.startsWith('http') ? link.url : `https://${link.url}`,
            icon_type: link.icon_type || 'web',
            sort_order: link.sort_order !== undefined ? link.sort_order : index,
            is_active: link.is_active !== undefined ? link.is_active : true
          }))
          
          const { error: linksError } = await supabase
            .from('employee_links')
            .insert(linksToInsert)
          
          if (linksError) {
            console.error('Error updating links:', linksError)
            return NextResponse.json({ 
              error: 'Employee updated but links failed: ' + linksError.message 
            }, { status: 500 })
          }
        }
      }
      
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE handler
export async function DELETE(request) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/', '')
  const segments = path.split('/').filter(Boolean)

  try {
    const authResult = await authMiddleware(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }
    const { supabase } = authResult

    // =====================================================
    // DELETE /api/admin-users/[id] - Delete admin user (Overwatch only)
    // =====================================================
    if (segments[0] === 'admin-users' && segments[1]) {
      const targetId = segments[1]
      
      // Check if current user is Overwatch
      const { data: currentAdmin, error: adminError } = await supabase
        .from('admin_users')
        .select('role')
        .eq('id', authResult.user.id)
        .single()
      
      if (adminError || !currentAdmin || currentAdmin.role !== 'Overwatch') {
        return NextResponse.json({ error: 'Only Overwatch can delete admin users' }, { status: 403 })
      }
      
      // Prevent self-deletion
      if (targetId === authResult.user.id) {
        return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
      }
      
      // Delete from admin_users table
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', targetId)
      
      if (error) {
        console.error('Error deleting admin user:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json({ success: true, message: 'Admin user deleted successfully' })
    }

    // Delete employee (Overwatch only)
    if (segments[0] === 'employees' && segments[1]) {
      // Get current user's role
      const { data: currentAdmin } = await supabase
        .from('admin_users')
        .select('role')
        .eq('email', authResult.user.email)
        .single()
      
      // Only Overwatch can delete employees
      if (!currentAdmin || currentAdmin.role !== 'Overwatch') {
        return NextResponse.json({ error: 'Only Overwatch can delete employees' }, { status: 403 })
      }
      
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', segments[1])
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
