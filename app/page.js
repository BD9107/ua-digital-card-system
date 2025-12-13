'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

// Clear ALL Supabase storage
function clearAllSupabaseStorage() {
  if (typeof window === 'undefined') return
  
  // Clear localStorage
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sb-') || key.includes('supabase')) {
      localStorage.removeItem(key)
    }
  })
  
  // Clear sessionStorage
  Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith('sb-') || key.includes('supabase')) {
      sessionStorage.removeItem(key)
    }
  })
}

export default function HomePage() {
  const [loading, setLoading] = useState(true)
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState('')
  const [errorType, setErrorType] = useState('')
  const [success, setSuccess] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [sendingReset, setSendingReset] = useState(false)
  const [attemptsRemaining, setAttemptsRemaining] = useState(null)
  const [contactInfo, setContactInfo] = useState(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // ALWAYS clear old sessions when landing on login page
    clearAllSupabaseStorage()
    
    // Check URL params for messages
    const expired = searchParams.get('expired')
    const blocked = searchParams.get('blocked')
    
    if (expired === 'true') {
      setError('Your session has expired. Please sign in again.')
      setErrorType('SESSION_EXPIRED')
    }
    
    if (blocked === 'suspended') {
      setErrorType('SUSPENDED')
      setError('Your account has been suspended.')
      setContactInfo({
        message: 'Contact your Overwatch administrator to restore access.',
        action: 'An Overwatch user must manually change your status back to Active.'
      })
    } else if (blocked === 'inactive') {
      setErrorType('INACTIVE')
      setError('Your account is currently inactive. Contact an administrator to reactivate.')
    }
    
    // Always show login page - no auto-redirect
    setLoading(false)
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setErrorType('')
    setAttemptsRemaining(null)
    setContactInfo(null)
    setSigningIn(true)

    try {
      // Call our secure login endpoint
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        // Handle errors
        if (data.error === 'SUSPENDED') {
          setErrorType('SUSPENDED')
          setError(data.message)
          setContactInfo(data.contact_info)
        } else if (data.error === 'INACTIVE') {
          setErrorType('INACTIVE')
          setError(data.message)
        } else {
          setErrorType('INVALID')
          setError(data.error || 'Invalid credentials')
          if (data.attempts_remaining !== undefined) {
            setAttemptsRemaining(data.attempts_remaining)
          }
        }
        return
      }
      
      // Login successful - set session and redirect
      const supabase = createClient()
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        })
      }
      
      router.push('/admin/dashboard')
    } catch (error) {
      setError('An error occurred. Please try again.')
      console.error('Login error:', error)
    } finally {
      setSigningIn(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSendingReset(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/callback`
      })

      if (error) throw error

      setSuccess(`Password reset email sent to ${resetEmail}. Please check your inbox.`)
      setResetEmail('')
    } catch (error) {
      setError(error.message)
    } finally {
      setSendingReset(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F7F9FC] via-[#EEF2FF] to-[#E0E7FF]">
        <div className="text-gray-700 text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F9FC] via-[#EEF2FF] to-[#E0E7FF]">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <div className="mb-12">
            <div className="w-24 h-24 bg-gradient-to-br from-[#1B9E9E] to-[#2AB8B8] rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl">
              <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-[#1B9E9E] to-[#2AB8B8] bg-clip-text text-transparent mb-4 leading-tight pb-2">UA Digital Card System</h1>
            <p className="text-xl text-gray-600">Modern Digital Business Cards for Your Team</p>
          </div>

          {/* Login Form */}
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              {!showForgotPassword ? (
                <>
                  <h2 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-[#1B9E9E] to-[#2AB8B8] bg-clip-text text-transparent">
                    Admin Login
                  </h2>
                  <p className="text-center text-gray-500 mb-6 text-sm">
                    Sign in to manage digital cards
                  </p>

                  {/* Suspended Account Error */}
                  {errorType === 'SUSPENDED' && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        <div className="text-left">
                          <div className="text-sm font-semibold text-red-800">Account Suspended</div>
                          <div className="text-xs text-red-700 mt-1">{error}</div>
                          {contactInfo && (
                            <div className="mt-3 p-3 bg-white rounded-lg border border-red-100">
                              <div className="text-xs font-medium text-gray-800 mb-1">How to restore access:</div>
                              <div className="text-xs text-gray-600">{contactInfo.message}</div>
                              <div className="text-xs text-gray-500 mt-2 italic">{contactInfo.action}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Inactive Account Error */}
                  {errorType === 'INACTIVE' && (
                    <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        <div className="text-left">
                          <div className="text-sm font-medium text-gray-800">Account Inactive</div>
                          <div className="text-xs text-gray-600 mt-1">{error}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Session Expired */}
                  {errorType === 'SESSION_EXPIRED' && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-left">
                          <div className="text-sm font-medium text-amber-800">Session Expired</div>
                          <div className="text-xs text-amber-700 mt-1">{error}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Invalid Credentials Error */}
                  {errorType === 'INVALID' && error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <div>
                          <div>{error}</div>
                          {attemptsRemaining !== null && attemptsRemaining > 0 && (
                            <div className="text-xs mt-1 text-red-600 font-medium">
                              Warning: {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining before account lockout
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Generic error */}
                  {!errorType && error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2 text-sm">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B9E9E]/20 focus:border-[#1B9E9E]"
                        placeholder="admin@example.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2 text-sm">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B9E9E]/20 focus:border-[#1B9E9E]"
                        placeholder="••••••••"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={signingIn}
                      className="w-full bg-gradient-to-r from-[#1B9E9E] to-[#2AB8B8] text-white py-3.5 px-4 rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {signingIn ? 'Signing in...' : 'Sign In'}
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <button
                      onClick={() => {
                        setShowForgotPassword(true)
                        setError('')
                        setErrorType('')
                        setSuccess('')
                      }}
                      className="text-[#1B9E9E] hover:text-[#178585] text-sm font-medium transition-colors"
                    >
                      Forgot your password?
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-[#1B9E9E] to-[#2AB8B8] bg-clip-text text-transparent">
                    Reset Password
                  </h2>
                  <p className="text-center text-gray-500 mb-6 text-sm">
                    Enter your email to receive a password reset link
                  </p>

                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm">
                      {success}
                    </div>
                  )}

                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2 text-sm">Email Address</label>
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B9E9E]/20 focus:border-[#1B9E9E]"
                        placeholder="admin@example.com"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={sendingReset}
                      className="w-full bg-gradient-to-r from-[#1B9E9E] to-[#2AB8B8] text-white py-3.5 px-4 rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {sendingReset ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <button
                      onClick={() => {
                        setShowForgotPassword(false)
                        setError('')
                        setSuccess('')
                      }}
                      className="text-[#1B9E9E] hover:text-[#178585] text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back to Login
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-gray-500 text-sm font-medium">Powered by Blinding Media</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
