import { useState } from 'react'
import { supabase } from '../lib/supabase'

const PasswordRecovery = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error

      setMessage('Password reset link sent! Check your email.')
      setEmail('')
    } catch (err) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass glass-border rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
            <p className="text-cyan-200 text-sm">Enter your email to receive a reset link</p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cyan-100 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 glass glass-border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="your@email.com"
                required
              />
            </div>

            {message && (
              <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-300 text-sm">
                {message}
              </div>
            )}

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
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className="text-center">
              <a href="/login" className="text-cyan-400 hover:text-cyan-300 text-sm">
                ← Back to Login
              </a>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .glass { background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(20px); }
        .glass-border { border: 1px solid rgba(255, 255, 255, 0.2); }
      `}</style>
    </div>
  )
}

export default PasswordRecovery
