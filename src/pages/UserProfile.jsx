import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/auditLogger'
import Layout from '../components/Layout'
import { useToast } from '../contexts/ToastContext'
import { useOnboarding } from '../components/OnboardingWelcome'

const UserProfile = () => {
  const { user, userProfile } = useAuth()
  const toast = useToast()
  const { resetOnboarding } = useOnboarding()
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

  // POPIA s24 — Request Data Deletion
  const [erasureRequest, setErasureRequest] = useState(null)
  const [erasureModalOpen, setErasureModalOpen] = useState(false)
  const [erasureReason, setErasureReason] = useState('')
  const [erasureAck, setErasureAck] = useState(false)
  const [submittingErasure, setSubmittingErasure] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    const fetchErasureStatus = async () => {
      const { data } = await supabase
        .from('erasure_requests')
        .select('id, status, requested_at, sla_deadline_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'processing'])
        .order('requested_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      setErasureRequest(data)
    }
    fetchErasureStatus()
  }, [user])

  const handleSubmitErasure = async () => {
    if (!erasureAck) {
      toast.warning('Please acknowledge the terms before submitting.')
      return
    }
    setSubmittingErasure(true)
    try {
      const { data: row, error } = await supabase
        .from('erasure_requests')
        .insert({
          user_id: user.id,
          company_id: userProfile?.company_id || null,
          user_email: user.email,
          user_full_name: userProfile?.full_name || null,
          reason: erasureReason.trim() || null,
          acknowledgement_signed: true,
        })
        .select('id, sla_deadline_at')
        .single()
      if (error) throw error

      await logActivity({
        companyId: userProfile?.company_id,
        userId: user.id,
        action: 'erasure_requested',
        entityType: 'user',
        entityId: user.id,
        changes: { request_id: row.id },
      })

      try {
        const { error: fnError } = await supabase.functions.invoke('notify-cancellation', {
          body: {
            type: 'erasure',
            request_id: row.id,
            user_id: user.id,
            user_email: user.email,
            user_full_name: userProfile?.full_name || null,
            company_id: userProfile?.company_id || null,
            reason: erasureReason.trim() || null,
            sla_deadline_at: row.sla_deadline_at,
          },
        })
        if (fnError && import.meta.env.DEV) {
          console.error('[notify-cancellation erasure] returned error:', fnError)
        }
      } catch (invokeErr) {
        if (import.meta.env.DEV) {
          console.error('[notify-cancellation erasure] threw:', invokeErr)
        }
      }

      toast.success('Erasure request submitted. We will process it within 30 days per POPIA s24.')
      setErasureModalOpen(false)
      setErasureReason('')
      setErasureAck(false)
      setErasureRequest({ id: row.id, status: 'pending', requested_at: new Date().toISOString(), sla_deadline_at: row.sla_deadline_at })
    } catch (err) {
      toast.error('Failed to submit erasure request. Please email support@isoguardian.co.za.')
    } finally {
      setSubmittingErasure(false)
    }
  }

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

      {/* Data & Privacy (POPIA s24) */}
      <div className="max-w-2xl mx-auto">
        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Data &amp; Privacy</h2>
          <p className="text-sm text-white/50 mb-4">
            Export a full copy of your data at any time, or request that we erase your
            personal information under POPIA s24.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/data-export"
              className="px-4 py-2 bg-white/10 border border-white/20 text-white/80 rounded-xl hover:bg-white/20 transition-all text-sm text-center"
            >
              Export My Data
            </a>
            {erasureRequest ? (
              <div className="flex-1 bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-2 text-xs text-orange-300">
                <p className="font-semibold">Erasure request submitted</p>
                <p className="mt-0.5 text-orange-300/70">
                  Status: {erasureRequest.status}. SLA deadline{' '}
                  {new Date(erasureRequest.sla_deadline_at).toLocaleDateString('en-ZA')}.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setErasureModalOpen(true)}
                className="px-4 py-2 bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 rounded-xl text-sm font-semibold transition-all"
              >
                Request Data Deletion (POPIA s24)
              </button>
            )}
          </div>
          <p className="text-xs text-white/40 mt-4">
            We process erasure requests within 30 days, subject to lawful retention obligations
            (POPIA s14 record-keeping, tax legislation, audit-trail integrity).
          </p>
        </div>
      </div>

      {/* Restart Tour */}
      <div className="glass glass-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-2">Platform Tour</h2>
        <p className="text-sm text-white/50 mb-4">Revisit the guided tour to learn about ISOGuardian's features.</p>
        <button
          onClick={() => {
            resetOnboarding()
            window.location.href = '/dashboard'
          }}
          className="px-4 py-2 bg-white/10 border border-white/20 text-white/80 rounded-xl hover:bg-white/20 transition-all text-sm"
        >
          Restart Tour
        </button>
      </div>

      {/* Erasure Request Modal */}
      {erasureModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => !submittingErasure && setErasureModalOpen(false)}
        >
          <div
            className="bg-slate-900 border border-white/20 rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-lg font-bold text-white">Request Data Deletion</h3>
              <p className="text-sm text-white/60 mt-1">
                Under POPIA s24, you may request erasure of your personal information held by ISOGuardian.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/70 space-y-2">
              <p><strong className="text-white">What gets erased:</strong> your name, email, profile data, and personal activity logs associated with your user account.</p>
              <p><strong className="text-white">What may be retained:</strong> records required under POPIA s14 (retention obligations), tax legislation, or to preserve audit-trail integrity for the Client company. Retained data will be anonymised or segregated from active use.</p>
              <p><strong className="text-white">Processing time:</strong> within 30 days of submission.</p>
            </div>

            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 text-xs text-cyan-300">
              <strong>Export your data first.</strong>{' '}
              <a href="/data-export" className="underline hover:text-cyan-200">Download a full copy</a>
              {' '}before submitting — erasure is irreversible.
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">Reason (optional)</label>
              <textarea
                value={erasureReason}
                onChange={(e) => setErasureReason(e.target.value)}
                rows={3}
                className="glass-input w-full px-3 py-2 rounded-lg text-white text-sm"
                placeholder="Optional — helps us improve our privacy practices"
                disabled={submittingErasure}
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={erasureAck}
                onChange={(e) => setErasureAck(e.target.checked)}
                className="mt-1 w-4 h-4"
                disabled={submittingErasure}
              />
              <span className="text-xs text-white/70">
                I understand that submitting this request will result in the erasure of my personal
                information subject to lawful retention obligations, and that this action cannot be undone.
              </span>
            </label>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setErasureModalOpen(false)}
                disabled={submittingErasure}
                className="px-4 py-2 text-white/70 hover:text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitErasure}
                disabled={!erasureAck || submittingErasure}
                className="px-4 py-2 bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {submittingErasure ? 'Submitting…' : 'Submit Erasure Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default UserProfile
