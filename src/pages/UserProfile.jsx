import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/auditLogger'
import Layout from '../components/Layout'
import { useToast } from '../contexts/ToastContext'

const UserProfile = () => {
  const { user, userProfile } = useAuth()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [profileData, setProfileData] = useState({
    full_name: userProfile?.full_name || '',
  })
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    if (!profileData.full_name.trim()) {
      toast.warning('Name cannot be empty')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ full_name: profileData.full_name.trim() })
        .eq('id', user.id)

      if (error) throw error

      await logActivity(supabase, user.id, userProfile?.company_id, 'profile_updated', 'user', user.id, 'Updated profile information')
      toast.success('Profile updated successfully')
    } catch (err) {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    const pw = passwordData.newPassword
    if (pw.length < 12 || !/[A-Z]/.test(pw) || !/[a-z]/.test(pw) || !/[0-9]/.test(pw) || !/[^A-Za-z0-9]/.test(pw)) {
      toast.warning('Password must be at least 12 characters with uppercase, lowercase, number, and special character')
      return
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.warning('Passwords do not match')
      return
    }
    setChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })
      if (error) throw error

      await logActivity(supabase, user.id, userProfile?.company_id, 'password_changed', 'user', user.id, 'Changed account password')
      toast.success('Password changed successfully')
      setPasswordData({ newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error('Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  const roleLabels = {
    super_admin: 'Super Admin',
    admin: 'Administrator',
    lead_auditor: 'Lead Auditor',
    user: 'User',
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-white">My Profile</h1>

        {/* Account Info */}
        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Account Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-white/50">Role</span>
              <p className="text-white font-medium">{roleLabels[userProfile?.role] || userProfile?.role || 'N/A'}</p>
            </div>
            <div>
              <span className="text-white/50">Company</span>
              <p className="text-white font-medium">{userProfile?.company?.name || 'N/A'}</p>
            </div>
            <div>
              <span className="text-white/50">Member Since</span>
              <p className="text-white font-medium">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-ZA') : 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-white/50">Last Sign In</span>
              <p className="text-white font-medium">
                {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('en-ZA') : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Edit Profile */}
        <form onSubmit={handleUpdateProfile} className="glass glass-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Edit Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">Full Name</label>
              <input
                type="text"
                value={profileData.full_name}
                onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                className="glass-input w-full px-4 py-2.5 rounded-xl text-white"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                disabled
                className="glass-input w-full px-4 py-2.5 rounded-xl text-white/50 cursor-not-allowed"
              />
              <p className="text-xs text-white/40 mt-1">Email changes must be requested through your company administrator</p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary px-6 py-2.5 rounded-xl font-semibold disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Change Password */}
        <form onSubmit={handleChangePassword} className="glass glass-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Change Password</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-white pr-12"
                  placeholder="Minimum 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="glass-input w-full px-4 py-2.5 rounded-xl text-white"
                placeholder="Re-enter new password"
              />
            </div>
            <button
              type="submit"
              disabled={changingPassword}
              className="btn-primary px-6 py-2.5 rounded-xl font-semibold disabled:opacity-50"
            >
              {changingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}

export default UserProfile
