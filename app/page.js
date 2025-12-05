'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function HomePage() {
  const [loading, setLoading] = useState(true)
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          router.push('/admin/dashboard')
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Error initializing Supabase:', error)
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSigningIn(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push('/admin/dashboard')
    } catch (error) {
      setError(error.message)
    } finally {
      setSigningIn(false)
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
            <h1 className="text-6xl font-bold bg-gradient-to-r from-[#1B9E9E] to-[#C4B896] bg-clip-text text-transparent mb-4 leading-tight pb-2">UA Digital Card System</h1>
            <p className="text-xl text-gray-600">Modern Digital Business Cards for Your Team</p>
          </div>

          {/* Login Form */}
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-[#6C8EF9] to-[#8B7FF9] bg-clip-text text-transparent">
                Admin Login
              </h2>
              <p className="text-center text-gray-500 mb-6 text-sm">
                Sign in to manage digital cards
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-sm">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-material"
                    placeholder="admin@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-sm">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-material"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={signingIn}
                  className="w-full bg-gradient-to-r from-[#6C8EF9] to-[#8B7FF9] text-white py-3.5 px-4 rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {signingIn ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
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
