'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Switch } from '@/components/ui/switch'

export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [adminUser, setAdminUser] = useState(null)
  const [pendingUsersCount, setPendingUsersCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState([])
  const [importing, setImporting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const router = useRouter()
  const supabaseRef = useRef(null)
  const initializedRef = useRef(false)

  // Check if user has view-only access (non-Active status)
  const isViewOnly = adminUser && adminUser.status !== 'Active'
  const isOverwatch = adminUser && adminUser.role === 'Overwatch'

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const checkAuth = async () => {
      try {
        const supabaseClient = createClient()
        supabaseRef.current = supabaseClient
        
        const { data: { session } } = await supabaseClient.auth.getSession()

        if (!session) {
          router.push('/')
          return
        }

        setUser(session.user)
        
        // Fetch admin user info
        const adminResponse = await fetch('/api/admin-users/me', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        
        if (adminResponse.ok) {
          const adminData = await adminResponse.json()
          setAdminUser(adminData)
          
          // If Overwatch, fetch pending users count
          if (adminData.role === 'Overwatch') {
            const usersResponse = await fetch('/api/admin-users', {
              headers: {
                'Authorization': `Bearer ${session.access_token}`
              }
            })
            if (usersResponse.ok) {
              const usersData = await usersResponse.json()
              const pending = usersData.filter(u => u.status === 'Pending').length
              setPendingUsersCount(pending)
            }
          }
        }
        
        setLoading(false)
        fetchEmployees(supabaseClient)

        // Set up auth state listener
        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
          (event, session) => {
            if (event === 'SIGNED_OUT') {
              router.push('/')
            }
          }
        )

        return () => subscription.unsubscribe()
      } catch (error) {
        console.error('Error initializing:', error)
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const fetchEmployees = async (supabaseClient) => {
    const client = supabaseClient || supabaseRef.current
    if (!client) return
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
    if (supabaseRef.current) {
      await supabaseRef.current.auth.signOut()
    }
    router.push('/')
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return
    if (!supabaseRef.current) return

    try {
      const { data: { session } } = await supabaseRef.current.auth.getSession()
      
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      await response.json()
      fetchEmployees()
      alert('Employee deleted successfully!')
    } catch (error) {
      console.error('Error deleting employee:', error)
    }
  }

  const handleToggleActive = async (employee) => {
    if (!supabaseRef.current) return
    try {
      const { data: { session } } = await supabaseRef.current.auth.getSession()
      
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ is_active: !employee.is_active })
      })
      
      if (response.ok) {
        fetchEmployees()
        alert(`Employee ${!employee.is_active ? 'activated' : 'deactivated'} successfully!`)
      } else {
        throw new Error('Failed to update employee status')
      }
    } catch (error) {
      console.error('Error updating employee:', error)
      alert('Failed to update employee status')
    }
  }

  const handleCSVImport = async (e) => {
    const file = e.target.files[0]
    if (!file || !supabaseRef.current) return

    setImporting(true)

    try {
      // Get session token
      const { data: { session } } = await supabaseRef.current.auth.getSession()
      
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
      fetchEmployees()
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
      {/* Pending Approval Banner for non-Active users */}
      {isViewOnly && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="container mx-auto px-6 py-3">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <span className="font-medium text-amber-800">Your account is pending approval.</span>
                <span className="text-amber-700 ml-1">You have view-only access until an administrator activates your account.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Banner for Overwatch - Pending Users */}
      {isOverwatch && pendingUsersCount > 0 && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="container mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {pendingUsersCount}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">{pendingUsersCount} user{pendingUsersCount > 1 ? 's' : ''} pending approval.</span>
                  <span className="text-blue-700 ml-1">Review and activate new admin accounts.</span>
                </div>
              </div>
              <Link
                href="/admin/users"
                className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Review Now
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Modern Light Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1B9E9E] to-[#2AB8B8] bg-clip-text text-transparent">Admin Dashboard</h1>
              <p className="text-gray-500 mt-1 text-sm">
                Manage your team&apos;s digital cards
                {adminUser && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                    {adminUser.role} • {adminUser.status}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {isOverwatch && (
                <Link
                  href="/admin/users"
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Admin Users
                  {pendingUsersCount > 0 && (
                    <span className="ml-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {pendingUsersCount}
                    </span>
                  )}
                </Link>
              )}
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
              {!isViewOnly ? (
                <Link
                  href="/admin/employees/new"
                  className="btn-primary flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Employee
                </Link>
              ) : (
                <button
                  disabled
                  className="btn-primary flex items-center gap-2 opacity-50 cursor-not-allowed"
                  title="Your account is pending approval"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Employee
                </button>
              )}

              {!isViewOnly ? (
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
              ) : (
                <button
                  disabled
                  className="btn-secondary flex items-center gap-2 opacity-50 cursor-not-allowed"
                  title="Your account is pending approval"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Import CSV
                </button>
              )}

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

            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B9E9E]/20 focus:border-[#1B9E9E] transition-all w-64"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Clear search"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="text-sm text-gray-600">
                {searchQuery ? (
                  <>
                    Showing: <span className="font-semibold text-[#1B9E9E]">
                      {employees.filter(e => 
                        e.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        e.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        e.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        e.department?.toLowerCase().includes(searchQuery.toLowerCase())
                      ).length}
                    </span> of {employees.length}
                  </>
                ) : (
                  <>Total Employees: <span className="font-semibold">{employees.length}</span></>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className="container mx-auto px-4 py-8">
        {(() => {
          // Filter employees based on search query
          let filteredEmployees = employees.filter(employee => {
            if (!searchQuery) return true
            const query = searchQuery.toLowerCase()
            return (
              employee.first_name?.toLowerCase().includes(query) ||
              employee.last_name?.toLowerCase().includes(query) ||
              employee.job_title?.toLowerCase().includes(query) ||
              employee.department?.toLowerCase().includes(query)
            )
          })

          // Sort employees
          if (sortField) {
            filteredEmployees = [...filteredEmployees].sort((a, b) => {
              let aVal = a[sortField] || ''
              let bVal = b[sortField] || ''
              
              // For name sorting, combine first and last name
              if (sortField === 'name') {
                aVal = `${a.first_name} ${a.last_name}`
                bVal = `${b.first_name} ${b.last_name}`
              }
              
              if (sortDirection === 'asc') {
                return aVal.localeCompare(bVal)
              } else {
                return bVal.localeCompare(aVal)
              }
            })
          }

          return filteredEmployees.length === 0 ? (
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
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      if (sortField === 'name') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                      } else {
                        setSortField('name')
                        setSortDirection('asc')
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      Employee
                      <svg className={`w-4 h-4 transition-transform ${sortField === 'name' ? (sortDirection === 'desc' ? 'rotate-180' : '') : 'opacity-30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      if (sortField === 'job_title') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                      } else {
                        setSortField('job_title')
                        setSortDirection('asc')
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      Position
                      <svg className={`w-4 h-4 transition-transform ${sortField === 'job_title' ? (sortDirection === 'desc' ? 'rotate-180' : '') : 'opacity-30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors w-40"
                    onClick={() => {
                      if (sortField === 'department') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                      } else {
                        setSortField('department')
                        setSortDirection('asc')
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      Department
                      <svg className={`w-4 h-4 transition-transform ${sortField === 'department' ? (sortDirection === 'desc' ? 'rotate-180' : '') : 'opacity-30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Public URL</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEmployees.map((employee, index) => (
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
                        className="text-[#1B9E9E] hover:text-[#178888] font-medium flex items-center gap-1"
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
        )
        })()}
      </div>
    </div>
  )
}
