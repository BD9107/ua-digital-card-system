import { NextResponse } from 'next/server'

// Simplified middleware - just pass through for now
// Session timeout removed to simplify debugging
export function middleware(request) {
  return NextResponse.next()
}

export const config = {
  matcher: []
}
