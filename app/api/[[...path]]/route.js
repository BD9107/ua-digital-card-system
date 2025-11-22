import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import QRCode from 'qrcode'
import { generateVCard } from '@/lib/vcard'
import Papa from 'papaparse'

// Helper function for auth middleware
async function authMiddleware(request) {
  try {
    // Try to get token from Authorization header first
    const authHeader = request.headers.get('authorization')
    let supabase
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      // Create supabase client with the token
      const { createClient } = await import('@supabase/supabase-js')
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

    // Public employee profile (no auth required)
    if (segments[0] === 'public' && segments[1] === 'employees') {
      const supabase = await createSupabaseServer()
      const id = segments[2]
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single()
      
      if (error || !data) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
      }
      
      return NextResponse.json(data)
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
          dark: '#003366',
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

    // Protected routes - require authentication
    const authResult = await authMiddleware()
    if (authResult.error) {
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

    // Get single employee
    if (segments[0] === 'employees' && segments[1]) {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', segments[1])
        .single()
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
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
    // Auth routes
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
        
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        
        return NextResponse.json({ success: true })
      }
      
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Protected routes
    const authResult = await authMiddleware()
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }
    const { supabase } = authResult

    // Create employee
    if (segments[0] === 'employees' && segments.length === 1) {
      const body = await request.json()
      
      // Generate unique ID and slug
      const employeeId = `emp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const slug = generateSlug(body.first_name, body.last_name)
      
      const { data, error } = await supabase
        .from('employees')
        .insert([{
          id: employeeId,
          slug,
          ...body,
        }])
        .select()
        .single()
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json(data)
    }

    // CSV Import
    if (segments[0] === 'import' && segments[1] === 'csv') {
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
      
      const fileBuffer = await file.arrayBuffer()
      const fileName = `${employeeId}_${Date.now()}.${file.name.split('.').pop()}`
      
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
    const authResult = await authMiddleware()
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }
    const { supabase } = authResult

    // Update employee
    if (segments[0] === 'employees' && segments[1]) {
      const body = await request.json()
      const id = segments[1]
      
      // Update slug if name changed
      if (body.first_name || body.last_name) {
        const { data: existing } = await supabase
          .from('employees')
          .select('first_name, last_name')
          .eq('id', id)
          .single()
        
        const firstName = body.first_name || existing.first_name
        const lastName = body.last_name || existing.last_name
        body.slug = generateSlug(firstName, lastName)
      }
      
      const { data, error } = await supabase
        .from('employees')
        .update(body)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
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
    const authResult = await authMiddleware()
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }
    const { supabase } = authResult

    // Delete employee
    if (segments[0] === 'employees' && segments[1]) {
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
