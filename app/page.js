'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function HomePage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        router.push('/admin/dashboard')
      } else {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#003366] to-[#004488]">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0033AA] to-[#0052d6]">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <div className="mb-12">
            <div className="w-20 h-20 bg-[#FBE122] rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg elevation-4">
              <svg className="w-12 h-12 text-[#0033AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">UA Digital Card System</h1>
            <p className="text-xl text-gray-200">Modern Digital Business Cards for Your Team</p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 elevation-4">
              <div className="w-12 h-12 bg-[#FBE122] rounded-xl mx-auto mb-4 flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-[#0033AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">QR Code Profiles</h3>
              <p className="text-gray-200 text-sm">Instant access with QR codes</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 elevation-4">
              <div className="w-12 h-12 bg-[#FBE122] rounded-xl mx-auto mb-4 flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-[#0033AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Mobile First</h3>
              <p className="text-gray-200 text-sm">Optimized for mobile devices</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 elevation-4">
              <div className="w-12 h-12 bg-[#FBE122] rounded-xl mx-auto mb-4 flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-[#0033AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Easy Contact Save</h3>
              <p className="text-gray-200 text-sm">One-click vCard download</p>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-4">
            <Link
              href="/admin/login"
              className="inline-block bg-[#FFD700] text-[#002147] px-8 py-4 rounded-lg font-medium text-lg hover:bg-[#FFC700] transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Admin Login
            </Link>
            <p className="text-gray-300 text-sm">
              Manage your team's digital business cards
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
