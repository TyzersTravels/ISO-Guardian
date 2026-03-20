import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAACfLITd5DD70PYix'
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

const passwordRules = [
  { key: 'length', label: 'At least 12 characters', test: pw => pw.length >= 12 },
  { key: 'upper', label: 'Uppercase letter', test: pw => /[A-Z]/.test(pw) },
  { key: 'lower', label: 'Lowercase letter', test: pw => /[a-z]/.test(pw) },
  { key: 'number', label: 'Number', test: pw => /\d/.test(pw) },
  { key: 'special', label: 'Special character', test: pw => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw) },
]

const Signup = () => {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', companyName: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [captchaToken, setCaptchaToken] = useState(null)
  const [agreedTerms, setAgreedTerms] = useState(false)
  const turnstileRef = useRef(null)

  // Load Turnstile CAPTCHA
  useEffect(() => {
    if (document.getElementById('turnstile-script')) {
      // Script already loaded, re-render widget
      if (window.turnstile && turnstileRef.current) {
        window.turnstile.render(turnstileRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token) => setCaptchaToken(token),
          'expired-callback': () => setCaptchaToken(null),
          theme: 'dark',
        })
      }
      return
    }
    const script = document.createElement('script')
    script.id = 'turnstile-script'
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad'
    script.async = true
    document.head.appendChild(script)

    window.onTurnstileLoad = () => {
      if (turnstileRef.current && window.turnstile) {
        window.turnstile.render(turnstileRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token) => setCaptchaToken(token),
          'expired-callback': () => setCaptchaToken(null),
          theme: 'dark',
        })
      }
    }

    return () => { delete window.onTurnstileLoad }
  }, [])

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }))
  const allPasswordRulesMet = passwordRules.every(r => r.test(form.password))
  const passwordsMatch = form.password === form.confirmPassword && form.confirmPassword.length > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.companyName.trim()) {
      setError('Please fill in all fields.')
      return
    }
    if (!allPasswordRulesMet) {
      setError('Please meet all password requirements.')
      return
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.')
      return
    }
    if (!agreedTerms) {
      setError('Please accept the Terms of Service and Privacy Policy.')
      return
    }

    setLoading(true)
    try {
      const refCode = sessionStorage.getItem('isoguardian_ref')
      const refType = sessionStorage.getItem('isoguardian_ref_type')

      const res = await fetch(`${SUPABASE_URL}/functions/v1/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          companyName: form.companyName.trim(),
          password: form.password,
          captchaToken,
          referralCode: refCode || null,
          referralType: refType || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Signup failed')

      setSuccess(true)
      sessionStorage.removeItem('isoguardian_ref')
      sessionStorage.removeItem('isoguardian_ref_type')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      // Reset CAPTCHA on error
      if (window.turnstile && turnstileRef.current) {
        window.turnstile.reset(turnstileRef.current)
        setCaptchaToken(null)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Start Free Trial | ISOGuardian</title>
        <meta name="description" content="Create your free ISOGuardian account. 14-day trial, no credit card required. ISO 9001, 14001 & 45001 compliance management." />
      </Helmet>

      <div className="min-h-screen bg-app-gradient flex items-center justify-center px-4 py-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Logo */}
          <div className="text-center mb-6">
            <Link to="/">
              <img src="/isoguardian-logo.png" alt="ISOGuardian" className="h-12 mx-auto mb-3 drop-shadow-lg" />
            </Link>
            <h1 className="text-2xl font-bold text-white">Start Your 14-Day Free Trial</h1>
            <p className="text-white/50 text-sm mt-1">No credit card required</p>
          </div>

          {success ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Account Created!</h2>
              <p className="text-white/60 mb-6">
                We&apos;ve sent a verification email to <span className="text-cyan-400">{form.email}</span>.
                Please check your inbox and verify your email, then sign in.
              </p>
              <Link
                to="/login"
                className="inline-block w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white text-center transition-all"
              >
                Go to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 md:p-8 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm">
                  {error}
                </div>
              )}

              {/* Name fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/50 mb-1">First Name</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={e => updateField('firstName', e.target.value)}
                    className="glass-input w-full px-3 py-2.5 rounded-xl text-white text-sm"
                    placeholder="Tyreece"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={e => updateField('lastName', e.target.value)}
                    className="glass-input w-full px-3 py-2.5 rounded-xl text-white text-sm"
                    placeholder="Kruger"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs text-white/50 mb-1">Work Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => updateField('email', e.target.value)}
                  className="glass-input w-full px-3 py-2.5 rounded-xl text-white text-sm"
                  placeholder="you@company.co.za"
                  required
                />
              </div>

              {/* Company name */}
              <div>
                <label className="block text-xs text-white/50 mb-1">Company Name</label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={e => updateField('companyName', e.target.value)}
                  className="glass-input w-full px-3 py-2.5 rounded-xl text-white text-sm"
                  placeholder="Acme Construction (Pty) Ltd"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs text-white/50 mb-1">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => updateField('password', e.target.value)}
                  className="glass-input w-full px-3 py-2.5 rounded-xl text-white text-sm"
                  placeholder="Create a strong password"
                  required
                />
                {form.password.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    {passwordRules.map(r => (
                      <div key={r.key} className={`flex items-center gap-1.5 text-xs ${r.test(form.password) ? 'text-green-400' : 'text-white/30'}`}>
                        <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          {r.test(form.password)
                            ? <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            : <circle cx="10" cy="10" r="3"/>
                          }
                        </svg>
                        {r.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-xs text-white/50 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={e => updateField('confirmPassword', e.target.value)}
                  className="glass-input w-full px-3 py-2.5 rounded-xl text-white text-sm"
                  placeholder="Confirm your password"
                  required
                />
                {form.confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                )}
              </div>

              {/* POPIA consent */}
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={e => setAgreedTerms(e.target.checked)}
                  className="mt-1 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/30"
                />
                <span className="text-xs text-white/50">
                  I agree to the{' '}
                  <Link to="/terms" target="_blank" className="text-cyan-400 hover:underline">Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/popia" target="_blank" className="text-cyan-400 hover:underline">Privacy Policy</Link>
                </span>
              </label>

              {/* Turnstile CAPTCHA */}
              <div ref={turnstileRef} className="flex justify-center" />

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !allPasswordRulesMet || !passwordsMatch || !agreedTerms}
                className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Creating account...
                  </span>
                ) : 'Start Your 14-Day Free Trial'}
              </button>

              <p className="text-center text-xs text-white/40">
                Already have an account?{' '}
                <Link to="/login" className="text-cyan-400 hover:underline">Sign in</Link>
              </p>
            </form>
          )}

          {/* Security badges */}
          <div className="flex items-center justify-center gap-4 mt-6 text-white/30 text-xs">
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
              256-bit SSL
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              POPIA Compliant
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z"/></svg>
              No card required
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Signup
