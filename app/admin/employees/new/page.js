'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProfessionalLinksManager from '@/components/ProfessionalLinksManager'

export default function NewEmployee() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [professionalLinks, setProfessionalLinks] = useState([])
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    whatsapp: '',
    job_title: '',
    department: '',
    website: '',
    company: ''
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/admin/login')
      }
    }
    checkAuth()
  }, [])

  const formatPhoneNumber = (value) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '')
    
    // Format to (+297) XXX XXXX
    if (digits.length === 0) return ''
    if (digits.length <= 3) return `(+${digits}`
    if (digits.length <= 6) return `(+${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(+${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6, 10)}`
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    
    // Format phone and whatsapp numbers
    if (name === 'phone' || name === 'whatsapp') {
      const formatted = formatPhoneNumber(value)
      setFormData(prev => ({ ...prev, [name]: formatted }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Get session token
      const { data: { session } } = await supabase.auth.getSession()
      
      // Include professional links in the create
      const createData = {
        ...formData,
        professional_links: professionalLinks
      }
      
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(createData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create employee')
      }

      router.push('/admin/dashboard')
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#003366] text-white">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Add New Employee</h1>
          <p className="text-gray-300 mt-1">Create a new digital card</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="input-material"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="input-material"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input-material"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(+297) 555 5555"
                  className="input-material"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  placeholder="(+297) 555 5555"
                  className="input-material"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleChange}
                  className="input-material"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="input-material"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Website / Custom Link
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://"
                className="input-material"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Company Name
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="UA Company"
                className="input-material"
              />
              <p className="text-xs text-gray-500 mt-1">This will appear on the vCard</p>
            </div>

            {/* Professional Links Section */}
            <div className="border-t pt-6">
              <ProfessionalLinksManager
                initialLinks={professionalLinks}
                onChange={setProfessionalLinks}
              />
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary"
              >
                {loading ? 'Creating...' : 'Create Employee'}
              </button>
              <Link
                href="/admin/dashboard"
                className="flex-1 btn-outline text-center"
              >
                Cancel
              </Link>
            </div>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> You can upload a photo after creating the employee profile.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
