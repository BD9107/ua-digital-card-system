'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

function AuthCallbackContent() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    handleAuthCallback()
  }, [])

  const handleAuthCallback = async () => {
    try {
      const hash = window.location.hash

      // Check for error in query params first (from /auth/confirm redirect)
      const errorParam = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')
      
      if (errorParam) {
        setError(errorDescription || errorParam)
        setLoading(false)
        return
      }

      // Check hash parameters (most common for Supabase implicit flow)
      if (hash && hash.length > 1) {
        const hashParams = new URLSearchParams(hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')
        const errorCode = hashParams.get('error')
        const hashErrorDescription = hashParams.get('error_description')

        if (errorCode) {
          setError(hashErrorDescription || errorCode || 'Authentication failed')
          setLoading(false)
          return
        }

        if (accessToken && refreshToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (sessionError) {
            setError(`Session error: ${sessionError.message}`)
            setLoading(false)
            return
          }

          if (data.user) {
            setUserEmail(data.user.email || '')
            setLoading(false)
            return
          }
        }
      }

      // Check if there's an existing session
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        setUserEmail(session.user.email || '')
        setLoading(false)
        return
      }

      // No valid auth found
      setError('No valid authentication found. The link may have expired. Please use "Forgot Password" on the login page to request a new link.')
      setLoading(false)
    } catch (err) {
      setError(`An error occurred: ${err.message}`)
      setLoading(false)
    }
  }

  const handleSetPassword = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setUpdating(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setError(error.message)
        setUpdating(false)
        return
      }

      setSuccess(true)
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/admin/dashboard')
      }, 2000)
    } catch (err) {
      setError('Failed to set password. Please try again.')
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F9FC] via-[#EEF2FF] to-[#E0E7FF] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B9E9E] mb-4"></div>
            <p className="text-gray-600">Verifying your invitation...</p>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F9FC] via-[#EEF2FF] to-[#E0E7FF] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Set Successfully!</h2>
          <p className="text-gray-600 mb-4">Redirecting you to the dashboard...</p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1B9E9E] mx-auto"></div>
        </div>
      </div>
    )
  }

  if (error && !userEmail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F9FC] via-[#EEF2FF] to-[#E0E7FF] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Invalid or Expired</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-[#1B9E9E] to-[#2AB8B8] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F9FC] via-[#EEF2FF] to-[#E0E7FF] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[#1B9E9E] to-[#2AB8B8] rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1B9E9E] to-[#2AB8B8] bg-clip-text text-transparent">
            Set Your Password
          </h1>
          <p className="text-gray-500 mt-2">Create a secure password for your account</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <form onSubmit={handleSetPassword} className="p-8">
            {userEmail && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500">Setting password for:</p>
                <p className="font-medium text-gray-900">{userEmail}</p>
              </div>
            )}

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B9E9E]/20 focus:border-[#1B9E9E] transition-all"
                required
                minLength={6}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B9E9E]/20 focus:border-[#1B9E9E] transition-all"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={updating}
              className="w-full bg-gradient-to-r from-[#1B9E9E] to-[#2AB8B8] text-white px-4 py-3.5 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {updating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Setting Password...
                </>
              ) : (
                'Set Password & Continue'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">Powered by Blinding Media</p>
        </div>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#F7F9FC] via-[#EEF2FF] to-[#E0E7FF] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B9E9E] mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
