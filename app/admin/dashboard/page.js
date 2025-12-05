'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Switch } from '@/components/ui/switch'

export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState([])
  const [importing, setImporting] = useState(false)
  const [supabase, setSupabase] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabaseClient = createClient()
        setSupabase(supabaseClient)
        
        const { data: { session } } = await supabaseClient.auth.getSession()

        if (!session) {
          router.push('/')
          return
        }

        setUser(session.user)
        setLoading(false)
        fetchEmployees(supabaseClient)
      } catch (error) {
        console.error('Error initializing:', error)
        setLoading(false)
      }
    }

    checkAuth()

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (event === 'SIGNED_OUT') {
            router.push('/')
          }
        }
      )

      return () => subscription.unsubscribe()
    }
  }, [supabase])

  const fetchEmployees = async (supabaseClient) => {
    if (!supabaseClient) return
    try {
      // Get session token
      const { data: { session } } = await supabaseClient.auth.getSession()
      
      const response = await fetch('/api/employees', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch employees')
      }

      const data = await response.json()
      setEmployees(data)
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    router.push('/admin/login')
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this employee?')) return
    if (!supabase) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      fetchEmployees(supabase)
    } catch (error) {
      console.error('Error deleting employee:', error)
    }
  }

  const handleToggleActive = async (employee) => {
    if (!supabase) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      await fetch(`/api/employees/${employee.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ is_active: !employee.is_active })
      })
      fetchEmployees(supabase)
    } catch (error) {
      console.error('Error updating employee:', error)
    }
  }

  const handleCSVImport = async (e) => {
    const file = e.target.files[0]
    if (!file || !supabase) return

    setImporting(true)

    try {
      // Get session token
      const { data: { session } } = await supabase.auth.getSession()
      
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/import/csv', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Import failed')
      }

      const result = await response.json()
      alert(`Successfully imported ${result.count} employees!`)
      fetchEmployees(supabase)
    } catch (error) {
      alert(`Import failed: ${error.message}`)
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* Modern Light Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1B9E9E] to-[#2AB8B8] bg-clip-text text-transparent">Admin Dashboard</h1>
              <p className="text-gray-500 mt-1 text-sm">Manage your team's digital cards</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-3">
              <Link
                href="/admin/employees/new"
                className="btn-primary flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Employee
              </Link>

              <label className="btn-secondary cursor-pointer flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {importing ? 'Importing...' : 'Import CSV'}
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVImport}
                  disabled={importing}
                  className="hidden"
                />
              </label>

              <a
                href="/sample-employees.csv"
                download
                className="btn-outline flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                CSV Template
              </a>
            </div>

            <div className="text-sm text-gray-600">
              Total Employees: <span className="font-semibold">{employees.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className="container mx-auto px-4 py-8">
        {employees.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No employees yet</h3>
            <p className="text-gray-600 mb-6">Add your first employee or import from CSV</p>
            <Link
              href="/admin/employees/new"
              className="btn-primary inline-block"
            >
              Add First Employee
            </Link>
          </div>
        ) : (
          <div className="card-material overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-[#F7F9FC] to-[#EEF2FF] border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Public URL</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {employees.map((employee, index) => (
                  <tr key={employee.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 1 ? 'bg-gray-50' : 'bg-white'} ${!employee.is_active ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-5">
                      <div className="flex items-center">
                        {employee.photo_url ? (
                          <img src={employee.photo_url} alt="" className="h-12 w-12 rounded-full object-cover shadow-md elevation-2" />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#1B9E9E] to-[#2AB8B8] flex items-center justify-center shadow-sm">
                            <span className="text-white font-semibold text-lg">
                              {employee.first_name[0]}{employee.last_name[0]}
                            </span>
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.first_name} {employee.last_name}
                          </div>
                          {employee.job_title && (
                            <div className="text-xs text-gray-500 mt-0.5">{employee.job_title}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm text-gray-900">{employee.email}</div>
                      {employee.phone && (
                        <div className="text-xs text-gray-500 mt-0.5">{employee.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      {employee.job_title && (
                        <div className="text-sm text-gray-900">{employee.job_title}</div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      {employee.department && (
                        <span className="badge-department">{employee.department}</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span className={employee.is_active ? 'badge-active' : 'badge-inactive'}>
                        {employee.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm">
                      <a
                        href={`${baseUrl}/staff/${employee.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0033AA] hover:text-[#002a8f] font-medium flex items-center gap-1"
                      >
                        View
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/employees/${employee.id}`}
                          className="p-2.5 text-[#1B9E9E] hover:bg-[#1B9E9E]/10 rounded-xl transition-colors"
                          title="Edit employee"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl min-w-[110px]" title={employee.is_active ? 'Disable staff card' : 'Enable staff card'}>
                          <Switch
                            checked={employee.is_active}
                            onCheckedChange={() => handleToggleActive(employee)}
                            className="data-[state=checked]:bg-[#4caf50] data-[state=unchecked]:bg-gray-300"
                          />
                          <span className={`text-xs font-medium w-14 ${employee.is_active ? 'text-[#4caf50]' : 'text-gray-500'}`}>
                            {employee.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDelete(employee.id)}
                          className="p-2.5 text-[#F76EA1] hover:bg-[#F76EA1]/10 rounded-xl transition-colors"
                          title="Delete employee"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
