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
            <div className="w-24 h-24 bg-gradient-to-br from-[#6C8EF9] to-[#8B7FF9] rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl">
              <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-[#6C8EF9] to-[#8B7FF9] bg-clip-text text-transparent mb-4">UA Digital Card System</h1>
            <p className="text-xl text-gray-600">Modern Digital Business Cards for Your Team</p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-[#6C8EF9] to-[#8B7FF9] rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-md">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">QR Code Profiles</h3>
              <p className="text-gray-600">Instant access with QR codes</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-[#8B7FF9] to-[#B57FF9] rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-md">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Mobile First</h3>
              <p className="text-gray-600">Optimized for mobile devices</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-[#5EC7E8] to-[#6C8EF9] rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-md">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Easy Contact Save</h3>
              <p className="text-gray-600">One-click vCard download</p>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-4">
            <Link
              href="/admin/login"
              className="inline-block bg-gradient-to-r from-[#6C8EF9] to-[#8B7FF9] text-white px-10 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all duration-200 shadow-lg"
            >
              Admin Login
            </Link>
            <p className="text-gray-500 text-sm">
              Manage your team's digital business cards
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
