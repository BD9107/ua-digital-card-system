import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/auth/callback'

  const redirectUrl = new URL(next, requestUrl.origin)

  // Create admin client to verify tokens server-side
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  try {
    // Handle token_hash verification (for invite and recovery emails)
    if (token_hash && type) {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type
      })

      if (error) {
        console.error('Token verification error:', error)
        redirectUrl.searchParams.set('error', error.message)
        return NextResponse.redirect(redirectUrl)
      }

      if (data?.session) {
        // Pass the session tokens to the callback page
        redirectUrl.hash = `access_token=${data.session.access_token}&refresh_token=${data.session.refresh_token}&type=${type}`
        return NextResponse.redirect(redirectUrl)
      }
    }

    // Handle code exchange (PKCE flow) - this won't work without code_verifier
    // so we'll redirect with an error message
    if (code) {
      redirectUrl.searchParams.set('error', 'pkce_error')
      redirectUrl.searchParams.set('error_description', 'Please use the "Forgot Password" feature from the same browser/device where you requested the reset.')
      return NextResponse.redirect(redirectUrl)
    }

    // No valid parameters
    redirectUrl.searchParams.set('error', 'missing_params')
    redirectUrl.searchParams.set('error_description', 'Invalid or missing authentication parameters')
    return NextResponse.redirect(redirectUrl)

  } catch (error) {
    console.error('Auth confirm error:', error)
    redirectUrl.searchParams.set('error', 'server_error')
    redirectUrl.searchParams.set('error_description', error.message)
    return NextResponse.redirect(redirectUrl)
  }
}
