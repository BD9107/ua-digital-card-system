'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function PublicProfile({ params }) {
  const { id } = params
  const [employee, setEmployee] = useState(null)
  const [qrCode, setQrCode] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchEmployee()
  }, [id])

  const fetchEmployee = async () => {
    try {
      const response = await fetch(`/api/public/employees/${id}`)
      if (!response.ok) throw new Error('Employee not found')
      
      const data = await response.json()
      setEmployee(data)
      
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

  const handleSaveContact = async () => {
    try {
      const response = await fetch(`/api/vcard?id=${id}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${employee.first_name}-${employee.last_name}.vcf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      alert('Failed to download contact')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#003366] to-[#004488] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#003366] to-[#004488] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Employee Not Found</h2>
          <p className="text-gray-600">This digital card is not available or has been disabled.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003366] to-[#004488] py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-[#003366] to-[#004488] h-32"></div>
          
          {/* Profile Photo */}
          <div className="relative -mt-16 mb-4 text-center">
            {employee.photo_url ? (
              <img 
                src={employee.photo_url} 
                alt={`${employee.first_name} ${employee.last_name}`}
                className="w-32 h-32 rounded-full mx-auto border-4 border-white shadow-lg object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-full mx-auto border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center">
                <span className="text-4xl text-gray-500 font-semibold">
                  {employee.first_name[0]}{employee.last_name[0]}
                </span>
              </div>
            )}
          </div>

          {/* Employee Info */}
          <div className="px-6 pb-6">
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
              {employee.first_name} {employee.last_name}
            </h1>
            
            {employee.job_title && (
              <p className="text-center text-lg text-[#003366] font-semibold mb-1">
                {employee.job_title}
              </p>
            )}
            
            {employee.department && (
              <p className="text-center text-gray-600 mb-6">
                {employee.department}
              </p>
            )}

            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              {employee.email && (
                <a 
                  href={`mailto:${employee.email}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-[#003366] rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500">Email</div>
                    <div className="text-sm font-medium text-gray-900 truncate">{employee.email}</div>
                  </div>
                </a>
              )}

              {employee.phone && (
                <a 
                  href={`tel:${employee.phone}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-[#003366] rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500">Phone</div>
                    <div className="text-sm font-medium text-gray-900">{employee.phone}</div>
                  </div>
                </a>
              )}

              {employee.whatsapp && (
                <a 
                  href={`https://wa.me/${employee.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500">WhatsApp</div>
                    <div className="text-sm font-medium text-gray-900">{employee.whatsapp}</div>
                  </div>
                </a>
              )}

              {employee.website && (
                <a 
                  href={employee.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-[#003366] rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500">Website</div>
                    <div className="text-sm font-medium text-gray-900 truncate">{employee.website}</div>
                  </div>
                </a>
              )}
            </div>

            {/* QR Code */}
            {qrCode && (
              <div className="mb-6 text-center">
                <p className="text-sm text-gray-600 mb-3">Scan to share</p>
                <img src={qrCode} alt="QR Code" className="w-40 h-40 mx-auto" />
              </div>
            )}

            {/* Save Contact Button */}
            <button
              onClick={handleSaveContact}
              className="w-full bg-[#FFD700] text-[#003366] py-4 rounded-lg font-bold text-lg hover:bg-[#FFC700] transition-colors shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Save Contact
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-white text-sm">
          <p>Powered by UA Digital Card System</p>
        </div>
      </div>
    </div>
  )
}
