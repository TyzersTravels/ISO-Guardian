import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/auditLogger'
import Layout from '../components/Layout'

const UserManagement = () => {
  const { userProfile } = useAuth()
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin'
  const isSuperAdmin = userProfile?.role === 'super_admin'

  useEffect(() => {
    if (userProfile) fetchUsers()
  }, [userProfile])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const query = supabase.from('users').select('*').order('created_at', { ascending: false })

      // Non-super-admins only see their own company
      if (!isSuperAdmin) {
        query.eq('company_id', userProfile.company_id)
      }

      const { data, error } = await query
      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (error) throw error

      await logActivity({
        companyId: userProfile.company_id,
        userId: userProfile.id,
        action: 'updated',
        entityType: 'user',
        entityId: userId,
        changes: { role: newRole }
      })

      fetchUsers()
    } catch (err) {
      console.error('Error updating role:', err)
      toast.error('Failed to update role: ' + err.message)
    }
  }

  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active'
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (error) throw error

      await logActivity({
        companyId: userProfile.company_id,
        userId: userProfile.id,
        action: 'updated',
        entityType: 'user',
        entityId: userId,
        changes: { status: newStatus }
      })

      fetchUsers()
    } catch (err) {
      console.error('Error toggling user status:', err)
      toast.error('Failed to update user: ' + err.message)
    }
  }

  const updateUserDetails = async (userId, updates) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (error) throw error

      await logActivity({
        companyId: userProfile.company_id,
        userId: userProfile.id,
        action: 'updated',
        entityType: 'user',
        entityId: userId,
        changes: updates
      })

      setEditingUser(null)
      fetchUsers()
    } catch (err) {
      console.error('Error updating user:', err)
      toast.error('Failed to update user: ' + err.message)
    }
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="text-center text-white p-8">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-white/60">Only administrators can manage users.</p>
        </div>
      </Layout>
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
        </div>
      </Layout>
    )
  }

  const activeUsers = users.filter(u => u.status !== 'suspended')
  const suspendedUsers = users.filter(u => u.status === 'suspended')

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">User Management</h1>
            <p className="text-white/60 text-sm mt-1">
              {users.length} user{users.length !== 1 ? 's' : ''} in {isSuperAdmin ? 'platform' : 'your company'}
            </p>
          </div>
          <button
            onClick={() => setShowInviteForm(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl font-semibold transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Invite User
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass glass-border rounded-xl p-4">
            <div className="text-2xl font-bold text-cyan-400">{users.length}</div>
            <div className="text-xs text-white/60">Total Users</div>
          </div>
          <div className="glass glass-border rounded-xl p-4">
            <div className="text-2xl font-bold text-green-400">{activeUsers.length}</div>
            <div className="text-xs text-white/60">Active</div>
          </div>
          <div className="glass glass-border rounded-xl p-4">
            <div className="text-2xl font-bold text-purple-400">{users.filter(u => u.role === 'admin' || u.role === 'super_admin').length}</div>
            <div className="text-xs text-white/60">Admins</div>
          </div>
          <div className="glass glass-border rounded-xl p-4">
            <div className="text-2xl font-bold text-amber-400">{suspendedUsers.length}</div>
            <div className="text-xs text-white/60">Suspended</div>
          </div>
        </div>

        {/* User List */}
        <div className="glass glass-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="font-bold text-white">Team Members</h3>
          </div>
          <div className="divide-y divide-white/10">
            {users.map(u => (
              <div key={u.id} className="p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                      {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">{u.full_name || 'No name'}</span>
                        {u.id === userProfile.id && (
                          <span className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-full">You</span>
                        )}
                        {u.status === 'suspended' && (
                          <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-300 rounded-full">Suspended</span>
                        )}
                      </div>
                      <div className="text-sm text-white/50">{u.email}</div>
                      {u.last_login && (
                        <div className="text-xs text-white/30 mt-0.5">
                          Last login: {new Date(u.last_login).toLocaleDateString('en-ZA')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Role selector */}
                    <select
                      value={u.role || 'user'}
                      onChange={(e) => updateUserRole(u.id, e.target.value)}
                      disabled={u.id === userProfile.id || (!isSuperAdmin && u.role === 'super_admin')}
                      className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="user" className="bg-slate-800">User</option>
                      <option value="lead_auditor" className="bg-slate-800">Lead Auditor</option>
                      <option value="admin" className="bg-slate-800">Admin</option>
                      {isSuperAdmin && <option value="super_admin" className="bg-slate-800">Super Admin</option>}
                    </select>

                    {/* Standards access */}
                    <button
                      onClick={() => setEditingUser(u)}
                      disabled={u.id === userProfile.id}
                      className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Edit
                    </button>

                    {/* Suspend/Activate */}
                    {u.id !== userProfile.id && (
                      <button
                        onClick={() => toggleUserStatus(u.id, u.status)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          u.status === 'suspended'
                            ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                            : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                        }`}
                      >
                        {u.status === 'suspended' ? 'Activate' : 'Suspend'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* POPIA Notice */}
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-xs text-purple-300/70">
              <strong className="text-purple-300">POPIA Notice:</strong> User data is protected under the Protection of Personal Information Act.
              Suspending a user revokes their access but retains their data for compliance purposes.
              For data subject deletion requests, contact your Information Officer.
            </p>
          </div>
        </div>

        {/* Invite User Modal */}
        {showInviteForm && (
          <InviteUserModal
            userProfile={userProfile}
            onClose={() => setShowInviteForm(false)}
            onInvited={() => { fetchUsers(); setShowInviteForm(false); }}
          />
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <EditUserModal
            user={editingUser}
            isSuperAdmin={isSuperAdmin}
            onClose={() => setEditingUser(null)}
            onSave={updateUserDetails}
          />
        )}
      </div>

    </Layout>
  )
}

const InviteUserModal = ({ userProfile, onClose, onInvited }) => {
  const toast = useToast()
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'user',
    standards_access: []
  })
  const [submitting, setSubmitting] = useState(false)

  const availableStandards = ['ISO_9001', 'ISO_14001', 'ISO_45001']

  const toggleStandard = (std) => {
    setFormData(prev => ({
      ...prev,
      standards_access: prev.standards_access.includes(std)
        ? prev.standards_access.filter(s => s !== std)
        : [...prev.standards_access, std]
    }))
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!formData.email?.trim() || !formData.full_name?.trim()) {
      toast.warning('Name and email are required.')
      return
    }
    setSubmitting(true)

    try {
      // Create user record (auth account is created separately via Supabase invite or signup)
      const { error } = await supabase
        .from('users')
        .insert([{
          email: formData.email.trim().toLowerCase(),
          full_name: formData.full_name.trim(),
          role: formData.role,
          company_id: userProfile.company_id,
          standards_access: formData.standards_access.length > 0 ? formData.standards_access : ['ISO_9001'],
          status: 'pending_invite',
          created_at: new Date().toISOString()
        }])

      if (error) throw error

      await logActivity({
        companyId: userProfile.company_id,
        userId: userProfile.id,
        action: 'created',
        entityType: 'user',
        entityId: formData.email.trim(),
        changes: { role: formData.role, name: formData.full_name.trim() }
      })

      toast.success(`User record created for ${formData.full_name}. They will need to sign up at your ISOGuardian URL with the email ${formData.email} to activate their account.`)
      onInvited()
    } catch (err) {
      console.error('Error inviting user:', err)
      if (err.message?.includes('duplicate') || err.code === '23505') {
        toast.error('A user with this email already exists.')
      } else {
        toast.error('Failed to invite user: ' + err.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl p-6 max-w-lg w-full border border-white/20 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Invite New User</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">{'\u2715'}</button>
        </div>

        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="text-sm text-white/60 block mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))}
              placeholder="e.g. John Smith"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-sm text-white/60 block mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
              placeholder="john@company.co.za"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-sm text-white/60 block mb-1">Role</label>
            <select
              value={formData.role}
              onChange={e => setFormData(p => ({ ...p, role: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="user" className="bg-slate-800">User</option>
              <option value="lead_auditor" className="bg-slate-800">Lead Auditor</option>
              <option value="admin" className="bg-slate-800">Admin</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-white/60 block mb-2">Standards Access</label>
            <div className="flex flex-wrap gap-2">
              {availableStandards.map(std => (
                <button
                  key={std}
                  type="button"
                  onClick={() => toggleStandard(std)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    formData.standards_access.includes(std)
                      ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                      : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {std.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl disabled:opacity-50 transition-all"
            >
              {submitting ? 'Creating...' : 'Create User'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 glass glass-border text-white rounded-xl hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const EditUserModal = ({ user, isSuperAdmin, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    standards_access: user.standards_access || []
  })
  const [saving, setSaving] = useState(false)

  const availableStandards = ['ISO_9001', 'ISO_14001', 'ISO_45001']

  const toggleStandard = (std) => {
    setFormData(prev => ({
      ...prev,
      standards_access: prev.standards_access.includes(std)
        ? prev.standards_access.filter(s => s !== std)
        : [...prev.standards_access, std]
    }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    await onSave(user.id, {
      full_name: formData.full_name.trim(),
      standards_access: formData.standards_access
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl p-6 max-w-lg w-full border border-white/20 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Edit User</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">{'\u2715'}</button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm text-white/60 block mb-1">Email</label>
            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/50">{user.email}</div>
          </div>

          <div>
            <label className="text-sm text-white/60 block mb-1">Full Name</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-sm text-white/60 block mb-2">Standards Access</label>
            <div className="flex flex-wrap gap-2">
              {availableStandards.map(std => (
                <button
                  key={std}
                  type="button"
                  onClick={() => toggleStandard(std)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    formData.standards_access.includes(std)
                      ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                      : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {std.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl disabled:opacity-50 transition-all"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserManagement
