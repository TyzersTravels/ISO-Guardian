import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ResetPassword = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { user, userProfile } = useAuth()
  const isForcedChange = !!userProfile?.must_change_password
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 12) {
      setError('Password must be at least 12 characters')
      return
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setError('Password must include uppercase, lowercase, number, and special character')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) throw error

      // Clear the must_change_password flag if set (no-op for password recovery flow)
      if (user?.id) {
        await supabase
          .from('users')
          .update({ must_change_password: false, updated_at: new Date().toISOString() })
          .eq('id', user.id)
      }

      toast.success('Password updated successfully!')

      // If user is logged in (forced first-login change), go to dashboard.
      // Otherwise (recovery via email link), go to login.
      if (user) {
        window.location.href = '/dashboard'
      } else {
        navigate('/login')
      }
    } catch (err) {
      setError('Failed to update password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass glass-border rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {isForcedChange ? 'Welcome — Set Your Password' : 'Set New Password'}
            </h1>
            <p className="text-cyan-200 text-sm">
              {isForcedChange
                ? 'For security, please replace your temporary password before continuing.'
                : 'Choose a strong password'}
            </p>
          </div>

          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-sm leading-relaxed">
            {isForcedChange && (
              <p className="mb-2">
                <strong className="text-amber-100">First-time login.</strong> Your temporary password is for <strong className="text-amber-100">one-time use only</strong>. Choose a permanent password below.
              </p>
            )}
            <p className="font-semibold text-amber-100">Password requirements:</p>
            <ul className="mt-2 ml-4 space-y-1 list-disc">
              <li><strong className="text-amber-100">At least 12 characters</strong></li>
              <li>One <strong className="text-amber-100">uppercase</strong> letter</li>
              <li>One <strong className="text-amber-100">lowercase</strong> letter</li>
              <li>One <strong className="text-amber-100">number</strong></li>
              <li>One <strong className="text-amber-100">special character</strong> (e.g. ! @ # $)</li>
            </ul>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cyan-100 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 glass glass-border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="Min 12 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-white/50"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-100 mb-2">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 glass glass-border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="Re-enter password"
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>

    </div>
  )
}

export default ResetPassword
