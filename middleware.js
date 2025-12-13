import { NextResponse } from 'next/server'

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT_MS = 30 * 60 * 1000

// Cookie name for last activity timestamp
const LAST_ACTIVITY_COOKIE = 'ua_last_activity'

// Paths that don't require session check
const PUBLIC_PATHS = [
  '/',
  '/auth/callback',
  '/auth/confirm',
  '/staff',
  '/api/public',
  '/api/auth',
  '/api/login',
  '/api/qrcode',
  '/api/vcard',
]

// Check if path should skip session validation
function isPublicPath(pathname) {
  // Check exact matches and prefix matches
  return PUBLIC_PATHS.some(path => {
    if (path === pathname) return true
    if (pathname.startsWith('/staff/')) return true
    if (pathname.startsWith('/api/public/')) return true
    if (pathname.startsWith('/_next/')) return true
    if (pathname.startsWith('/favicon')) return true
    return false
  })
}

export function middleware(request) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }
  
  // Get the last activity timestamp from cookie
  const lastActivityCookie = request.cookies.get(LAST_ACTIVITY_COOKIE)
  const now = Date.now()
  
  // Create response to potentially modify
  const response = NextResponse.next()
  
  // Check if this is an authenticated admin route
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin') || pathname.startsWith('/api/employees')) {
    
    if (lastActivityCookie) {
      const lastActivity = parseInt(lastActivityCookie.value, 10)
      
      // Check if session has expired
      if (now - lastActivity > SESSION_TIMEOUT_MS) {
        // Session expired - redirect to login
        const loginUrl = new URL('/', request.url)
        loginUrl.searchParams.set('expired', 'true')
        
        // Clear the activity cookie
        const redirectResponse = NextResponse.redirect(loginUrl)
        redirectResponse.cookies.delete(LAST_ACTIVITY_COOKIE)
        
        return redirectResponse
      }
    }
    
    // Update the last activity timestamp
    response.cookies.set(LAST_ACTIVITY_COOKIE, now.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_TIMEOUT_MS / 1000, // Cookie expires with session
      path: '/'
    })
  }
  
  return response
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
