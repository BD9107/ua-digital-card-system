'use client'

import { useEffect, useState } from 'react'
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
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuthAndFetch()
  }, [])

  const checkAuthAndFetch = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/')
        return
      }

      // Get current user's admin role
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error || !adminUser) {
        alert('You do not have admin access')
        router.push('/admin/dashboard')
        return
      }

      setCurrentUser(adminUser)
      fetchUsers()
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/')
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
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

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    // Status filter
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
      // Create user via API
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role, status: 'Pending' })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create user')
      }

      alert('Admin user created successfully! Status is Pending.')
      setShowAddModal(false)
      fetchUsers()
    } catch (error) {
      console.error('Error creating user:', error)
      alert(`Error: ${error.message}`)
    }
  }

  const handleUpdateStatus = async (userId, newStatus) => {
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ status: newStatus })
        .eq('id', userId)

      if (error) throw error

      // If changing to Active, send invite email
      if (newStatus === 'Active') {
        const user = users.find(u => u.id === userId)
        if (user) {
          await supabase.auth.resetPasswordForEmail(user.email, {
            redirectTo: `${window.location.origin}/admin/dashboard`
          })
          alert(`Status updated and invite email sent to ${user.email}`)
        }
      } else {
        alert('Status updated successfully')
      }

      fetchUsers()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  const handleUpdateRole = async (userId, newRole) => {
    if (currentUser.role !== 'Overwatch') {
      alert('Only Overwatch can change roles')
      return
    }

    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error
      alert('Role updated successfully')
      fetchUsers()
    } catch (error) {
      console.error('Error updating role:', error)
      alert('Failed to update role')
    }
  }

  const handleDelete = async (userId) => {
    if (currentUser.role !== 'Overwatch') {
      alert('Only Overwatch can delete admin users')
      return
    }

    if (!confirm('Are you sure you want to delete this admin user?')) return

    try {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', userId)

      if (error) throw error
      alert('Admin user deleted successfully')
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
    }
  }

  const getRoleBadge = (role) => {
    const badges = {
      Overwatch: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '🛡️' },
      Admin: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '🔷' },
      Operator: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '🔧' },
      Viewer: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: '👁️' }
    }
    const badge = badges[role] || badges.Viewer
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border ${badge.color}`}>
        <span>{badge.icon}</span>
        {role}
      </span>
    )
  }

  const getStatusBadge = (status) => {
    const badges = {
      Active: 'bg-green-100 text-green-800 border-green-200',
      Pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Inactive: 'bg-gray-100 text-gray-600 border-gray-200',
      Suspended: 'bg-red-100 text-red-800 border-red-200'
    }
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${badges[status]}`}>
        {status}
      </span>
    )
  }

  const getInitials = (email) => {
    return email.substring(0, 2).toUpperCase()
  }

  const canEdit = (user) => {
    if (currentUser.role === 'Overwatch') return true
    if (currentUser.role === 'Admin' && user.role !== 'Overwatch') return true
    return false
  }

  const canDelete = (user) => {
    return currentUser.role === 'Overwatch'
  }

  const totalPages = Math.ceil(getFilteredUsers().length / rowsPerPage)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
        <div className="text-gray-700 text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1B9E9E] to-[#2AB8B8] bg-clip-text text-transparent">
                Admin Users Management
              </h1>
              <p className="text-gray-500 mt-1 text-sm">Manage system administrators and permissions</p>
            </div>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors text-sm font-medium"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Top Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search by email or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B9E9E]/20 focus:border-[#1B9E9E] transition-all"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
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
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B9E9E]/20 focus:border-[#1B9E9E]"
              >
                <option value="all">All Roles</option>
                <option value="Overwatch">Overwatch</option>
                <option value="Admin">Admin</option>
                <option value="Operator">Operator</option>
                <option value="Viewer">Viewer</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B9E9E]/20 focus:border-[#1B9E9E]"
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>

              {/* Reset */}
              <button
                onClick={() => {
                  setSearchQuery('')
                  setRoleFilter('all')
                  setStatusFilter('all')
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors text-sm font-medium"
              >
                Reset
              </button>
            </div>

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

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-[#F7F9FC] to-[#EEF2FF] border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {getPaginatedUsers().map((user, index) => (
                <tr key={user.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
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
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1B9E9E] to-[#2AB8B8] flex items-center justify-center text-white font-semibold text-sm">
                        {getInitials(user.email)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.email}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
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
                    <div className="relative inline-block text-left">
                      <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                        <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                        </svg>
                      </button>
                      {/* Actions menu - simplified for now */}
                      <div className="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                        {canEdit(user) && (
                          <>
                            <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100">Change Role</button>
                            <button
                              onClick={() => {
                                const newStatus = prompt('Enter new status (Active/Pending/Inactive/Suspended):', user.status)
                                if (newStatus && ['Active', 'Pending', 'Inactive', 'Suspended'].includes(newStatus)) {
                                  handleUpdateStatus(user.id, newStatus)
                                }
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                            >
                              Change Status
                            </button>
                          </>
                        )}
                        {canDelete(user) && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {getPaginatedUsers().length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No admin users found
            </div>
          )}

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value))
                  setPage(1)
                }}
                className="px-2 py-1 border border-gray-300 rounded"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
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

// Simple Add User Modal Component
function AddUserModal({ onClose, onCreate }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Viewer')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email) {
      alert('Email is required')
      return
    }
    onCreate(email, role)
    setEmail('')
    setRole('Viewer')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Add Admin User</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B9E9E]/20 focus:border-[#1B9E9E]"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B9E9E]/20 focus:border-[#1B9E9E]"
            >
              <option value="Overwatch">Overwatch</option>
              <option value="Admin">Admin</option>
              <option value="Operator">Operator</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-[#1B9E9E] to-[#2AB8B8] text-white px-4 py-2 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
