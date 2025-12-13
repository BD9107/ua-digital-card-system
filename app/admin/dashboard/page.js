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
  const [blocked, setBlocked] = useState(false)
  const [blockReason, setBlockReason] = useState('')
  const [employees, setEmployees] = useState([])
  const [importing, setImporting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const router = useRouter()
  const supabaseRef = useRef(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const checkAuthAndStatus = async () => {
      try {
        const supabaseClient = createClient()
        supabaseRef.current = supabaseClient
        
        const { data: { session } } = await supabaseClient.auth.getSession()

        if (!session) {
          router.push('/')
          return
        }

        setUser(session.user)
        
        // Fetch admin user info - this is the ONLY check we need
        const adminResponse = await fetch('/api/admin-users/me', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        
        if (!adminResponse.ok) {
          // If API returns error, sign out and redirect
          await forceSignOut(supabaseClient)
          router.push('/')
          return
        }
        
        const adminData = await adminResponse.json()
        
        // SIMPLE CHECK: Is user Suspended or Inactive?
        if (adminData.status === 'Suspended') {
          console.log('USER IS SUSPENDED - BLOCKING ACCESS')
          setBlocked(true)
          setBlockReason('suspended')
          await forceSignOut(supabaseClient)
          return
        }
        
        if (adminData.status === 'Inactive') {
          console.log('USER IS INACTIVE - BLOCKING ACCESS')
          setBlocked(true)
          setBlockReason('inactive')
          await forceSignOut(supabaseClient)
          return
        }
        
        // User is OK - proceed
        setAdminUser(adminData)
        
        // Fetch pending users count for Overwatch/Admin
        if (['Overwatch', 'Admin'].includes(adminData.role)) {
          const usersResponse = await fetch('/api/admin-users', {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          })
          if (usersResponse.ok) {
            const usersData = await usersResponse.json()
            const pendingForRole = adminData.role === 'Overwatch' 
              ? usersData.filter(u => u.status === 'Pending')
              : usersData.filter(u => u.status === 'Pending' && ['Operator', 'Viewer'].includes(u.role))
            setPendingUsersCount(pendingForRole.length)
          }
        }
        
        setLoading(false)
        fetchEmployees(supabaseClient)

        // Auth state listener
        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_OUT' || !session) {
            router.push('/')
          }
        })

        return () => subscription?.unsubscribe()
      } catch (error) {
        console.error('Auth error:', error)
        router.push('/')
      }
    }
    
    checkAuthAndStatus()
  }, [router])

  // Force sign out helper
  const forceSignOut = async (supabase) => {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error('Sign out error:', e)
    }
    // Clear all storage
    document.cookie = 'ua_last_activity=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key)
        }
      })
    }
  }

  const fetchEmployees = async (supabase) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/employees', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      const data = await response.json()
      setEmployees(data)
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const handleSignOut = async () => {
    if (supabaseRef.current) {
      await forceSignOut(supabaseRef.current)
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
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      })
      await response.json()
      fetchEmployees(supabaseRef.current)
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
        fetchEmployees(supabaseRef.current)
      }
    } catch (error) {
      console.error('Error toggling status:', error)
    }
  }

  const handleCSVImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!supabaseRef.current) return

    setImporting(true)
    try {
      const { data: { session } } = await supabaseRef.current.auth.getSession()
      
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/import/csv', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
        body: formData
      })

      const result = await response.json()
      alert(`Successfully imported ${result.count} employees!`)
      fetchEmployees(supabaseRef.current)
    } catch (error) {
      alert(`Import failed: ${error.message}`)
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  // BLOCKED STATE - Show message and redirect
  if (blocked) {
    // Redirect after showing message briefly
    setTimeout(() => {
      router.push(`/?blocked=${blockReason}`)
    }, 100)
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F7F9FC] via-[#EEF2FF] to-[#E0E7FF]">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {blockReason === 'suspended' ? 'Account Suspended' : 'Account Inactive'}
          </h2>
          <p className="text-gray-600 mb-4">
            {blockReason === 'suspended' 
              ? 'Your account has been suspended. Contact Overwatch to restore access.'
              : 'Your account is inactive. Contact an administrator.'}
          </p>
          <p className="text-sm text-gray-400">Redirecting...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  // Permission helpers
  const isViewOnly = adminUser && adminUser.status === 'Pending'
  const isOverwatch = adminUser && adminUser.role === 'Overwatch'
  const isAdmin = adminUser && adminUser.role === 'Admin'
  const isViewer = adminUser && adminUser.role === 'Viewer'
  const canAddEmployee = !isViewOnly && !isViewer
  const canEditEmployee = !isViewOnly && !isViewer
  const canDeleteEmployee = !isViewOnly && isOverwatch
  const canChangeEmployeeStatus = !isViewOnly && (isOverwatch || isAdmin)
  const canAccessAdminUsers = isOverwatch || isAdmin

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  // Filter employees
  let filteredEmployees = employees.filter(emp => {
    const searchLower = searchQuery.toLowerCase()
    return (
      (emp.first_name?.toLowerCase() || '').includes(searchLower) ||
      (emp.last_name?.toLowerCase() || '').includes(searchLower) ||
      (emp.email?.toLowerCase() || '').includes(searchLower) ||
      (emp.job_title?.toLowerCase() || '').includes(searchLower) ||
      (emp.department?.toLowerCase() || '').includes(searchLower)
    )
  })

  // Sort employees
  if (sortField) {
    filteredEmployees = [...filteredEmployees].sort((a, b) => {
      const aVal = a[sortField] || ''
      const bVal = b[sortField] || ''
      const comparison = String(aVal).localeCompare(String(bVal))
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* Pending Approval Banner */}
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

      {/* Pending Users Notification for Overwatch/Admin */}
      {canAccessAdminUsers && pendingUsersCount > 0 && (
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
              <Link href="/admin/users" className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                Review Now
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#1B9E9E] to-[#2AB8B8] rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">UA Digital Card System</h1>
                <p className="text-sm text-gray-500">Employee Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {canAccessAdminUsers && (
                <Link href="/admin/users" className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2">
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
              
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{user?.email}</div>
                  <div className="text-xs text-gray-500">
                    {adminUser?.role} • {adminUser?.status}
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                  title="Sign out"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Employees</h2>
            <p className="text-gray-500 mt-1">{filteredEmployees.length} total employees</p>
          </div>
          
          <div className="flex gap-3">
            {canAddEmployee ? (
              <Link href="/admin/employees/new" className="btn-primary flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Employee
              </Link>
            ) : (
              <button disabled className="btn-primary flex items-center gap-2 opacity-50 cursor-not-allowed" title={isViewOnly ? "Your account is pending approval" : "Viewers cannot add employees"}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Employee
              </button>
            )}

            {canAddEmployee ? (
              <label className="btn-secondary cursor-pointer flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {importing ? 'Importing...' : 'Import CSV'}
                <input type="file" accept=".csv" onChange={handleCSVImport} disabled={importing} className="hidden" />
              </label>
            ) : (
              <button disabled className="btn-secondary flex items-center gap-2 opacity-50 cursor-not-allowed" title={isViewOnly ? "Your account is pending approval" : "Viewers cannot import employees"}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Import CSV
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search employees by name, email, title, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B9E9E]/20 focus:border-[#1B9E9E]"
            />
          </div>
        </div>

        {/* Employee Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('first_name')}>
                  Employee {sortField === 'first_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('job_title')}>
                  Title {sortField === 'job_title' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('department')}>
                  Department {sortField === 'department' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Card Link</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEmployees.map(employee => (
                <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1B9E9E] to-[#2AB8B8] flex items-center justify-center text-white font-semibold text-lg">
                        {employee.first_name?.[0]}{employee.last_name?.[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{employee.first_name} {employee.last_name}</div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-gray-700">{employee.job_title || '-'}</td>
                  <td className="px-6 py-5 text-gray-700">{employee.department || '-'}</td>
                  <td className="px-6 py-5">
                    {employee.slug && (
                      <a href={`${baseUrl}/staff/${employee.slug}`} target="_blank" rel="noopener noreferrer" className="text-[#1B9E9E] hover:underline text-sm font-medium">
                        View Card →
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-3">
                      {canEditEmployee ? (
                        <Link href={`/admin/employees/${employee.id}`} className="p-2.5 text-[#1B9E9E] hover:bg-[#1B9E9E]/10 rounded-xl transition-colors" title="Edit employee">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                      ) : (
                        <span className="p-2.5 text-gray-300 cursor-not-allowed" title="You don't have permission to edit">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </span>
                      )}
                      
                      {canChangeEmployeeStatus ? (
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
                      ) : (
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl min-w-[110px] opacity-50" title="You don't have permission to change status">
                          <Switch checked={employee.is_active} disabled className="data-[state=checked]:bg-[#4caf50] data-[state=unchecked]:bg-gray-300 cursor-not-allowed" />
                          <span className={`text-xs font-medium w-14 ${employee.is_active ? 'text-[#4caf50]' : 'text-gray-500'}`}>
                            {employee.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      )}
                      
                      {canDeleteEmployee ? (
                        <button onClick={() => handleDelete(employee.id)} className="p-2.5 text-[#F76EA1] hover:bg-[#F76EA1]/10 rounded-xl transition-colors" title="Delete employee">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      ) : (
                        <span className="p-2.5 text-gray-300 cursor-not-allowed" title="Only Overwatch can delete employees">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredEmployees.length === 0 && (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">No employees found</h3>
              <p className="text-gray-500">
                {searchQuery ? 'Try adjusting your search query' : 'Get started by adding your first employee'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
