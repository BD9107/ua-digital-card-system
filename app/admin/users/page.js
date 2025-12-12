'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AdminUsersPage() {
  const [currentUser, setCurrentUser] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedUsers, setSelectedUsers] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [showBulkMenu, setShowBulkMenu] = useState(false)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const router = useRouter()
  const supabase = createClient()
  const menuRef = useRef(null)

  useEffect(() => {
    checkAuthAndFetch()
    
    // Close menus when clicking outside
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null)
        setShowBulkMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const checkAuthAndFetch = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/')
        return
      }

      // Get current user's admin role via API
      const response = await fetch('/api/admin-users/me', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        alert('You do not have admin access')
        router.push('/admin/dashboard')
        return
      }

      const adminUser = await response.json()
      setCurrentUser(adminUser)
      fetchUsers(session.access_token)
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/')
    }
  }

  const fetchUsers = async (token) => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = token || session?.access_token
      
      const response = await fetch('/api/admin-users', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch admin users')
      }

      const data = await response.json()
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      alert('Failed to load admin users')
    } finally {
      setLoading(false)
    }
  }

  const getFilteredUsers = () => {
    let filtered = users

    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter)
    }

    return filtered
  }

  const getPaginatedUsers = () => {
    const filtered = getFilteredUsers()
    const start = (page - 1) * rowsPerPage
    const end = start + rowsPerPage
    return filtered.slice(start, end)
  }

  const handleCreateUser = async (email, role) => {
    if (currentUser.role !== 'Overwatch') {
      alert('Only Overwatch can create admin users')
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/admin-users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ email, role, status: 'Pending' })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create user')
      }

      const result = await response.json()
      alert(result.message || 'Admin user created successfully! Status is Pending.')
      setShowAddModal(false)
      fetchUsers()
    } catch (error) {
      console.error('Error creating user:', error)
      alert(`Error: ${error.message}`)
    }
  }

  const handleUpdateStatus = async (userId, newStatus) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`/api/admin-users/${userId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update status')
      }

      const result = await response.json()
      alert(result.message || 'Status updated successfully')
      setOpenMenuId(null)
      fetchUsers()
    } catch (error) {
      console.error('Error updating status:', error)
      alert(`Failed to update status: ${error.message}`)
    }
  }

  const handleUpdateRole = async (userId, newRole) => {
    if (currentUser.role !== 'Overwatch') {
      alert('Only Overwatch can change roles')
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`/api/admin-users/${userId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ role: newRole })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update role')
      }

      alert('Role updated successfully')
      setOpenMenuId(null)
      fetchUsers()
    } catch (error) {
      console.error('Error updating role:', error)
      alert(`Failed to update role: ${error.message}`)
    }
  }

  const handleDelete = async (userId) => {
    if (currentUser.role !== 'Overwatch') {
      alert('Only Overwatch can delete admin users')
      return
    }

    if (!confirm('Are you sure you want to delete this admin user?')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`/api/admin-users/${userId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${session?.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete user')
      }

      alert('Admin user deleted successfully')
      setOpenMenuId(null)
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert(`Failed to delete user: ${error.message}`)
    }
  }

  // Bulk Operations
  const handleBulkAction = async (action, value) => {
    if (selectedUsers.length === 0) {
      alert('No users selected')
      return
    }

    if (currentUser.role !== 'Overwatch') {
      alert('Only Overwatch can perform bulk operations')
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/admin-users/bulk', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ action, ids: selectedUsers, value })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Bulk operation failed')
      }

      const result = await response.json()
      alert(result.message || 'Bulk operation completed')
      setSelectedUsers([])
      setShowBulkMenu(false)
      fetchUsers()
    } catch (error) {
      console.error('Bulk operation error:', error)
      alert(`Bulk operation failed: ${error.message}`)
    }
  }

  const getRoleBadge = (role) => {
    const badges = {
      Overwatch: { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: '🛡️' },
      Admin: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '🔷' },
      Operator: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '🔧' },
      Viewer: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: '👁️' }
    }
    const badge = badges[role] || badges.Viewer
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${badge.color}`}>
        <span>{badge.icon}</span>
        {role}
      </span>
    )
  }

  const getStatusBadge = (status) => {
    const badges = {
      Active: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
      Pending: { color: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
      Inactive: { color: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
      Suspended: { color: 'bg-red-100 text-red-800 border-red-200', dot: 'bg-red-500' }
    }
    const badge = badges[status] || badges.Inactive
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${badge.color}`}>
        <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
        {status}
      </span>
    )
  }

  const getInitials = (email) => email.substring(0, 2).toUpperCase()

  const canEdit = (user) => {
    if (currentUser.role === 'Overwatch') return true
    if (currentUser.role === 'Admin' && user.role !== 'Overwatch') return true
    return false
  }

  const canDelete = () => currentUser.role === 'Overwatch'

  const totalPages = Math.ceil(getFilteredUsers().length / rowsPerPage) || 1

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B9E9E]"></div>
          <span className="text-gray-700 text-lg">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC]" ref={menuRef}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1B9E9E] to-[#2AB8B8] bg-clip-text text-transparent">
                Admin Users Management
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                Manage system administrators and permissions • Logged in as: <span className="font-medium text-[#1B9E9E]">{currentUser?.role}</span>
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors text-sm font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Top Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <input
                  type="text"
                  placeholder="Search by email or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B9E9E]/20 focus:border-[#1B9E9E] transition-all"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B9E9E]/20 focus:border-[#1B9E9E] bg-white"
              >
                <option value="all">All Roles</option>
                <option value="Overwatch">🛡️ Overwatch</option>
                <option value="Admin">🔷 Admin</option>
                <option value="Operator">🔧 Operator</option>
                <option value="Viewer">👁️ Viewer</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B9E9E]/20 focus:border-[#1B9E9E] bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="Active">✅ Active</option>
                <option value="Pending">⏳ Pending</option>
                <option value="Inactive">⚫ Inactive</option>
                <option value="Suspended">🚫 Suspended</option>
              </select>

              {/* Reset */}
              <button
                onClick={() => {
                  setSearchQuery('')
                  setRoleFilter('all')
                  setStatusFilter('all')
                }}
                className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors text-sm font-medium"
              >
                Reset
              </button>
            </div>

            <div className="flex gap-3">
              {/* Bulk Actions (Overwatch only) */}
              {currentUser?.role === 'Overwatch' && selectedUsers.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowBulkMenu(!showBulkMenu)}
                    className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                  >
                    <span>Bulk Actions ({selectedUsers.length})</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showBulkMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-20 py-2">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Change Role</div>
                      {['Overwatch', 'Admin', 'Operator', 'Viewer'].map(role => (
                        <button
                          key={role}
                          onClick={() => handleBulkAction('update_role', role)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          {role}
                        </button>
                      ))}
                      <div className="border-t border-gray-100 my-2"></div>
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Change Status</div>
                      {['Active', 'Pending', 'Inactive', 'Suspended'].map(status => (
                        <button
                          key={status}
                          onClick={() => handleBulkAction('update_status', status)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                        >
                          {status}
                        </button>
                      ))}
                      <div className="border-t border-gray-100 my-2"></div>
                      <button
                        onClick={() => {
                          if (confirm(`Delete ${selectedUsers.length} users?`)) {
                            handleBulkAction('delete')
                          }
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        Delete Selected
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Add User Button (Overwatch only) */}
              {currentUser?.role === 'Overwatch' && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-gradient-to-r from-[#1B9E9E] to-[#2AB8B8] text-white px-6 py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Admin User
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="text-2xl font-bold text-gray-900">{users.length}</div>
            <div className="text-sm text-gray-500">Total Users</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="text-2xl font-bold text-emerald-600">{users.filter(u => u.status === 'Active').length}</div>
            <div className="text-sm text-gray-500">Active</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="text-2xl font-bold text-amber-600">{users.filter(u => u.status === 'Pending').length}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="text-2xl font-bold text-red-600">{users.filter(u => u.status === 'Suspended').length}</div>
            <div className="text-sm text-gray-500">Suspended</div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-[#F7F9FC] to-[#EEF2FF] border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-[#1B9E9E] focus:ring-[#1B9E9E]"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(getPaginatedUsers().map(u => u.id))
                      } else {
                        setSelectedUsers([])
                      }
                    }}
                    checked={selectedUsers.length === getPaginatedUsers().length && getPaginatedUsers().length > 0}
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-40">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {getPaginatedUsers().map((user, index) => (
                <tr 
                  key={user.id} 
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-[#1B9E9E]/5 transition-colors`}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-[#1B9E9E] focus:ring-[#1B9E9E]"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id])
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                        }
                      }}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1B9E9E] to-[#2AB8B8] flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        {getInitials(user.email)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.email}</div>
                        <div className="text-xs text-gray-500">
                          Created: {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative">
                      <button 
                        onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                        </svg>
                      </button>
                      
                      {openMenuId === user.id && (
                        <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 z-20 py-2">
                          {canEdit(user) && currentUser.role === 'Overwatch' && (
                            <>
                              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Change Role</div>
                              {['Overwatch', 'Admin', 'Operator', 'Viewer'].map(role => (
                                <button
                                  key={role}
                                  onClick={() => handleUpdateRole(user.id, role)}
                                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${user.role === role ? 'text-[#1B9E9E] font-medium' : ''}`}
                                >
                                  {user.role === role && '✓ '}{role}
                                </button>
                              ))}
                              <div className="border-t border-gray-100 my-2"></div>
                            </>
                          )}
                          
                          {canEdit(user) && (
                            <>
                              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Change Status</div>
                              {['Active', 'Pending', 'Inactive', 'Suspended'].map(status => (
                                <button
                                  key={status}
                                  onClick={() => handleUpdateStatus(user.id, status)}
                                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${user.status === status ? 'text-[#1B9E9E] font-medium' : ''}`}
                                >
                                  {user.status === status && '✓ '}{status}
                                </button>
                              ))}
                            </>
                          )}
                          
                          {canDelete() && user.id !== currentUser.id && (
                            <>
                              <div className="border-t border-gray-100 my-2"></div>
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                              >
                                Delete User
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {getPaginatedUsers().length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">No admin users found</h3>
              <p className="text-gray-500 text-sm">
                {searchQuery || roleFilter !== 'all' || statusFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Create your first admin user to get started'}
              </p>
            </div>
          )}

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value))
                  setPage(1)
                }}
                className="px-2 py-1 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-500 ml-4">
                Showing {((page - 1) * rowsPerPage) + 1}-{Math.min(page * rowsPerPage, getFilteredUsers().length)} of {getFilteredUsers().length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Previous
              </button>
              <span className="px-4 py-1.5 bg-[#1B9E9E] text-white rounded-lg text-sm font-medium">
                {page}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onCreate={handleCreateUser}
        />
      )}
    </div>
  )
}

// Add User Modal Component
function AddUserModal({ onClose, onCreate }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Viewer')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      alert('Email is required')
      return
    }
    setLoading(true)
    try {
      await onCreate(email, role)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-[#1B9E9E] to-[#2AB8B8] px-8 py-6">
          <h2 className="text-2xl font-bold text-white">Add Admin User</h2>
          <p className="text-white/80 text-sm mt-1">Create a new administrator account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8">
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B9E9E]/20 focus:border-[#1B9E9E] transition-all"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B9E9E]/20 focus:border-[#1B9E9E] bg-white"
            >
              <option value="Overwatch">🛡️ Overwatch - Full system control</option>
              <option value="Admin">🔷 Admin - Manage employees</option>
              <option value="Operator">🔧 Operator - Limited access</option>
              <option value="Viewer">👁️ Viewer - Read only</option>
            </select>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="text-sm font-medium text-amber-800">Account will be created as Pending</div>
                <div className="text-xs text-amber-700 mt-1">
                  Change status to Active to send a password reset email invitation.
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-[#1B9E9E] to-[#2AB8B8] text-white px-4 py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
