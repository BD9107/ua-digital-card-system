'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ProfessionalLinksManager from '@/components/ProfessionalLinksManager'
import Toast from '@/components/Toast'

export default function EditEmployee({ params }) {
  const { id } = params
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [employee, setEmployee] = useState(null)
  const [formData, setFormData] = useState(null)
  const [professionalLinks, setProfessionalLinks] = useState([])
  const [qrCode, setQrCode] = useState(null)
  const [toast, setToast] = useState(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/')
        return
      }
      fetchEmployee()
    }
    checkAuth()
  }, [id])

  const fetchEmployee = async () => {
    try {
      // Get session token
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(`/api/employees/${id}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      if (!response.ok) throw new Error('Failed to fetch employee')
      
      const data = await response.json()
      setEmployee(data)
      setFormData(data)
      setProfessionalLinks(data.professional_links || [])
      
      // Fetch QR code
      const qrResponse = await fetch(`/api/qrcode?id=${id}`)
      const qrData = await qrResponse.json()
      setQrCode(qrData.qrCode)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

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
    setSaving(true)
    setError(null)

    try {
      // Get session token
      const { data: { session } } = await supabase.auth.getSession()
      
      // Include professional links in the update
      const updateData = {
        ...formData,
        professional_links: professionalLinks
      }
      
      const response = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update employee')
      }

      alert('Employee and links updated successfully!')
      router.push('/admin/dashboard')
    } catch (error) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)

    try {
      // Get session token
      const { data: { session } } = await supabase.auth.getSession()
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('employeeId', id)

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: formData
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      const result = await response.json()
      setFormData(prev => ({ ...prev, photo_url: result.url }))
      setToast({ message: 'Photo uploaded successfully!', type: 'success' })
    } catch (error) {
      setToast({ message: `Upload failed: ${error.message}`, type: 'error' })
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  if (error && !employee) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">{error}</div>
        <Link href="/admin/dashboard" className="text-blue-600 hover:underline">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const profileUrl = `${baseUrl}/staff/${id}`

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-5">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1B9E9E] to-[#2AB8B8] bg-clip-text text-transparent">Edit Employee</h1>
          <p className="text-gray-500 mt-1 text-sm">{formData?.first_name} {formData?.last_name}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-8">
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
                      value={formData?.first_name || ''}
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
                      value={formData?.last_name || ''}
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
                    value={formData?.email || ''}
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
                      value={formData?.phone || ''}
                      onChange={handleChange}
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
                      value={formData?.whatsapp || ''}
                      onChange={handleChange}
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
                      value={formData?.job_title || ''}
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
                      value={formData?.department || ''}
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
                    value={formData?.website || ''}
                    onChange={handleChange}
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
                    value={formData?.company || ''}
                    onChange={handleChange}
                    placeholder="University of Aruba"
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

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 btn-primary"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <Link
                    href="/admin/dashboard"
                    className="flex-1 btn-outline text-center"
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Photo Upload */}
            <div className="card-material">
              <h3 className="text-lg font-semibold mb-4">Employee Photo</h3>
              {formData?.photo_url && (
                <div className="mb-4 text-center">
                  <img 
                    src={formData.photo_url} 
                    alt="Employee" 
                    className="w-32 h-32 object-cover rounded-lg mx-auto shadow-md"
                  />
                </div>
              )}
              <label className="block w-full text-center bg-gradient-to-r from-[#1B9E9E] to-[#2AB8B8] text-white px-4 py-3 rounded-xl hover:shadow-lg cursor-pointer transition-all font-semibold">
                {uploading ? 'Uploading...' : formData?.photo_url ? 'Change Photo' : 'Upload Photo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            {/* QR Code */}
            <div className="card-material">
              <h3 className="text-lg font-semibold mb-4">QR Code</h3>
              {qrCode && (
                <div className="text-center">
                  <img src={qrCode} alt="QR Code" className="w-full max-w-[200px] mx-auto" />
                  <a
                    href={qrCode}
                    download={`qr-${formData?.first_name}-${formData?.last_name}.png`}
                    className="inline-block mt-4 text-[#1B9E9E] hover:text-[#178888] font-medium text-sm"
                  >
                    Download QR Code
                  </a>
                </div>
              )}
            </div>

            {/* Public URL */}
            <div className="card-material">
              <h3 className="text-lg font-medium mb-4">Public Profile</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600 font-medium">URL:</label>
                  <div className="text-sm bg-gray-50 p-2 rounded break-all mt-1">
                    {profileUrl}
                  </div>
                </div>
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center btn-secondary"
                >
                  View Profile
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
