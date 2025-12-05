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
      <div className="min-h-screen bg-gradient-to-br from-[#F7F9FC] via-[#EEF2FF] to-[#E0E7FF] flex items-center justify-center">
        <div className="text-gray-700 text-xl">Loading...</div>
      </div>
    )
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F9FC] via-[#EEF2FF] to-[#E0E7FF] flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-gradient-to-br from-[#F7F9FC] via-[#EEF2FF] to-[#E0E7FF] py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header with teal gradient */}
          <div className="bg-gradient-to-r from-[#1B9E9E] to-[#2AB8B8] h-32"></div>
          
          {/* Profile Photo */}
          <div className="relative -mt-16 mb-4 text-center">
            {employee.photo_url ? (
              <img 
                src={employee.photo_url} 
                alt={`${employee.first_name} ${employee.last_name}`}
                className="w-32 h-32 rounded-full mx-auto border-4 border-white shadow-lg object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-full mx-auto border-4 border-white shadow-lg bg-gradient-to-br from-[#1B9E9E] to-[#2AB8B8] flex items-center justify-center">
                <span className="text-4xl text-white font-semibold">
                  {employee.first_name[0]}{employee.last_name[0]}
                </span>
              </div>
            )}
          </div>

          {/* Employee Info */}
          <div className="px-6 pb-6">
            <h1 className="text-3xl font-medium text-center text-gray-900 mb-2">
              {employee.first_name} {employee.last_name}
            </h1>
            
            {employee.job_title && (
              <p className="text-center text-lg text-[#1B9E9E] font-semibold mb-1">
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
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors elevation-2"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-[#1B9E9E] to-[#2AB8B8] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
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
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors elevation-2"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-[#8B7FF9] to-[#B57FF9] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
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
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors elevation-2"
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
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors elevation-2"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-[#5EC7E8] to-[#6C8EF9] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
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

            {/* Professional Links Section */}
            {employee.professional_links && employee.professional_links.length > 0 && (
              <div className="space-y-3 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Professional Links</h3>
                {employee.professional_links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors elevation-2"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-[#1B9E9E] to-[#2AB8B8] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                      {link.icon_type === 'linkedin' && (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                      )}
                      {link.icon_type === 'github' && (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                      )}
                      {link.icon_type === 'scholar' && (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0L1 9l4 3v5.001c0 1.657 3.134 3 7 3s7-1.343 7-3V12l1-0.75V16h2V9L12 0zm5 13.001c0 0.448-1.791 1.5-5 1.5s-5-1.052-5-1.5V11.5l5 3.75l5-3.75v1.501z"/>
                        </svg>
                      )}
                      {link.icon_type === 'orcid' && (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 7.5c.663 0 1.2.537 1.2 1.2 0 .663-.537 1.2-1.2 1.2-.662 0-1.2-.537-1.2-1.2 0-.663.538-1.2 1.2-1.2zm-.369 3.3h.744v6.45h-.744v-6.45zm3.975 0h.744v6.45h-.744v-6.45z"/>
                        </svg>
                      )}
                      {link.icon_type === 'linktree' && (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2L2 12h3v8h14v-8h3L12 2zm0 3.84L17.16 11H15v7H9v-7H6.84L12 5.84z"/>
                        </svg>
                      )}
                      {link.icon_type === 'twitter' && (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      )}
                      {link.icon_type === 'instagram' && (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      )}
                      {link.icon_type === 'facebook' && (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                        </svg>
                      )}
                      {link.icon_type === 'youtube' && (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                        </svg>
                      )}
                      {(!link.icon_type || link.icon_type === 'web' || link.icon_type === 'other') && (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">{link.label}</div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ))}
              </div>
            )}

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
              className="w-full bg-gradient-to-r from-[#6C8EF9] to-[#8B7FF9] text-white py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Save Contact
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-600 text-sm font-medium">Powered by UA Digital Card System</p>
        </div>
      </div>
    </div>
  )
}
