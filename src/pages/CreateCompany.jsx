import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { logActivity } from '../lib/auditLogger'
import Layout from '../components/Layout'

const CreateCompany = () => {
  const { user, userProfile } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [createdCredentials, setCreatedCredentials] = useState(null)
  const [formData, setFormData] = useState({
    company_name: '',
    company_code: '',
    registration_number: '',
    industry: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    tier: 'starter',
    standards: {
      ISO_9001: true,
      ISO_14001: false,
      ISO_45001: false,
    },
  })

  const tiers = [
    { value: 'starter', label: 'Starter', users: '1-10 users', price: 2000 },
    { value: 'growth', label: 'Growth', users: '11-20 users', price: 3700 },
    { value: 'enterprise', label: 'Enterprise', users: '21+ users', price: 0 },
  ]

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, standards: { ...prev.standards, [name]: checked } }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  // Auto-generate company code from name
  const handleNameChange = (e) => {
    const name = e.target.value
    setFormData(prev => ({
      ...prev,
      company_name: name,
      company_code: prev.company_code || name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setCreatedCredentials(null)

    try {
      const selectedStandards = Object.entries(formData.standards).filter(([, v]) => v).map(([k]) => k)
      if (selectedStandards.length === 0) {
        toast.error('Please select at least one ISO standard.')
        setLoading(false)
        return
      }

      // 1. Create the company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert([{
          name: formData.company_name,
          company_code: formData.company_code.toUpperCase(),
          registration_number: formData.registration_number || null,
          industry: formData.industry || null,
          standards: formData.standards,
          tier: formData.tier,
          status: 'active',
          created_by: user.id,
        }])
        .select()
        .single()

      if (companyError) throw companyError

      // 2. Create subscription
      const tierPrices = { starter: 2000, growth: 3700, enterprise: 0 }
      const tierUsers = { starter: 10, growth: 20, enterprise: 50 }
      const price = tierPrices[formData.tier]

      const { error: subError } = await supabase
        .from('subscriptions')
        .insert([{
          company_id: companyData.id,
          tier: formData.tier,
          base_price: price,
          discount_percent: 0,
          final_price: price,
          user_count: tierUsers[formData.tier],
          status: 'active',
          billing_cycle: 'monthly',
          next_billing_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          created_by: user.id,
        }])

      if (subError) throw subError

      // 3. Generate temp password
      const array = new Uint8Array(16)
      crypto.getRandomValues(array)
      const tempPassword = `C!${Array.from(array, b => b.toString(36)).join('').substring(0, 14)}`

      // 4. Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.contact_email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: formData.contact_name,
          company_id: companyData.id,
        },
      })

      if (authError) throw authError

      // 5. Create user record
      const { error: userError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email: formData.contact_email,
          full_name: formData.contact_name,
          role: 'admin',
          company_id: companyData.id,
          is_active: true,
          standards_access: selectedStandards,
        }])

      if (userError) throw userError

      // 6. Log activity
      try {
        await logActivity({
          action: 'created',
          entityType: 'company',
          entityId: companyData.id,
          changes: { company_name: formData.company_name, tier: formData.tier, admin_email: formData.contact_email },
          userId: user.id,
          companyId: userProfile?.company_id,
        })
      } catch { /* non-blocking */ }

      // Show credentials
      setCreatedCredentials({
        company: formData.company_name,
        code: formData.company_code.toUpperCase(),
        email: formData.contact_email,
        password: tempPassword,
        name: formData.contact_name,
      })

      toast.success(`${formData.company_name} created successfully!`)

      // Reset form
      setFormData({
        company_name: '', company_code: '', registration_number: '', industry: '',
        contact_name: '', contact_email: '', contact_phone: '', tier: 'starter',
        standards: { ISO_9001: true, ISO_14001: false, ISO_45001: false },
      })
    } catch (err) {
      console.error('Error creating company:', err)
      toast.error('Failed to create company: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyCredentials = () => {
    if (!createdCredentials) return
    const text = `ISOGuardian Login Credentials\n\nCompany: ${createdCredentials.company}\nName: ${createdCredentials.name}\nEmail: ${createdCredentials.email}\nTemporary Password: ${createdCredentials.password}\n\nLogin at: https://isoguardian.co.za/login\nPlease change your password after first login.`
    navigator.clipboard.writeText(text)
    toast.success('Credentials copied to clipboard!')
  }

  const selectedStandards = Object.entries(formData.standards).filter(([, v]) => v).map(([k]) => k)

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <div className="glass glass-border rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Create New Company</h1>
              <p className="text-white/50 text-sm">Add a new client after SLA signing and payment confirmation</p>
            </div>
          </div>
        </div>

        {/* Success: Show Credentials */}
        {createdCredentials && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-lg font-bold text-green-300">Company Created Successfully</h2>
            </div>

            <div className="bg-black/30 rounded-xl p-4 font-mono text-sm space-y-2">
              <div><span className="text-white/50">Company:</span> <span className="text-white">{createdCredentials.company}</span></div>
              <div><span className="text-white/50">Code:</span> <span className="text-cyan-300">{createdCredentials.code}</span></div>
              <div><span className="text-white/50">Admin:</span> <span className="text-white">{createdCredentials.name}</span></div>
              <div><span className="text-white/50">Email:</span> <span className="text-white">{createdCredentials.email}</span></div>
              <div><span className="text-white/50">Temp Password:</span> <span className="text-yellow-300 font-bold">{createdCredentials.password}</span></div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={copyCredentials}
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all"
              >
                Copy Credentials
              </button>
              <p className="text-xs text-white/40">Send these credentials to the client via a secure channel (WhatsApp or phone call).</p>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
              <p className="text-xs text-orange-300">
                <strong>Important:</strong> The temporary password is shown once. Copy it now. The client should change their password after first login.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass glass-border rounded-2xl p-6 space-y-6">

          {/* Company Info */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2">Company Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">Company Name *</label>
                <input
                  type="text" name="company_name" value={formData.company_name} onChange={handleNameChange} required
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="e.g., Acme Construction (Pty) Ltd"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Company Code *</label>
                <input
                  type="text" name="company_code" value={formData.company_code} onChange={handleChange} required maxLength={6}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-cyan-500 transition-colors uppercase"
                  placeholder="e.g., AC"
                />
                <p className="text-xs text-white/30 mt-1">Used in document numbering: IG-{formData.company_code.toUpperCase() || 'XX'}-DOC-001</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">Registration Number</label>
                <input
                  type="text" name="registration_number" value={formData.registration_number} onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="2020/123456/07"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Industry</label>
                <select name="industry" value={formData.industry} onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors">
                  <option value="" className="bg-slate-800">Select Industry</option>
                  <option value="Manufacturing" className="bg-slate-800">Manufacturing</option>
                  <option value="Construction" className="bg-slate-800">Construction</option>
                  <option value="Healthcare" className="bg-slate-800">Healthcare</option>
                  <option value="Mining" className="bg-slate-800">Mining</option>
                  <option value="IT Services" className="bg-slate-800">IT Services</option>
                  <option value="Professional Services" className="bg-slate-800">Professional Services</option>
                  <option value="Logistics" className="bg-slate-800">Logistics & Transport</option>
                  <option value="Energy" className="bg-slate-800">Energy</option>
                  <option value="Retail" className="bg-slate-800">Retail</option>
                  <option value="Other" className="bg-slate-800">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Primary Contact */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2">Primary Contact (Client Admin)</h2>

            <div>
              <label className="block text-sm text-white/70 mb-1">Full Name *</label>
              <input
                type="text" name="contact_name" value={formData.contact_name} onChange={handleChange} required
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="John Smith"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">Email Address *</label>
                <input
                  type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} required
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="john@company.co.za"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Phone Number</label>
                <input
                  type="tel" name="contact_phone" value={formData.contact_phone} onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="+27 71 234 5678"
                />
              </div>
            </div>
          </div>

          {/* Subscription */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2">Subscription Tier</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tiers.map(tier => (
                <label
                  key={tier.value}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all text-center ${
                    formData.tier === tier.value
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-white/20 bg-white/5 hover:border-white/40'
                  }`}
                >
                  <input type="radio" name="tier" value={tier.value} checked={formData.tier === tier.value} onChange={handleChange} className="sr-only" />
                  <div className="text-white font-semibold">{tier.label}</div>
                  <div className="text-xs text-white/50 mb-2">{tier.users}</div>
                  <div className="text-xl font-bold text-cyan-400">
                    {tier.price > 0 ? `R${tier.price.toLocaleString()}` : 'Custom'}
                  </div>
                  <div className="text-xs text-white/40">/month</div>
                </label>
              ))}
            </div>
          </div>

          {/* ISO Standards */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2">ISO Standards</h2>
            <div className="space-y-3">
              {[
                { key: 'ISO_9001', label: 'ISO 9001:2015', desc: 'Quality Management System' },
                { key: 'ISO_14001', label: 'ISO 14001:2015', desc: 'Environmental Management System' },
                { key: 'ISO_45001', label: 'ISO 45001:2018', desc: 'Occupational Health & Safety' },
              ].map(({ key, label, desc }) => (
                <label key={key} className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                  <input
                    type="checkbox" name={key} checked={formData.standards[key]} onChange={handleChange}
                    className="w-5 h-5 rounded border-white/20 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 bg-white/10"
                  />
                  <div>
                    <div className="text-white font-medium">{label}</div>
                    <div className="text-xs text-white/50">{desc}</div>
                  </div>
                </label>
              ))}
            </div>
            {selectedStandards.length === 0 && (
              <p className="text-sm text-orange-300 bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-2">Please select at least one ISO standard.</p>
            )}
          </div>

          {/* Summary */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-2 text-sm">
            <h3 className="font-bold text-white mb-3">Summary</h3>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
              <div><span className="text-white/50">Company:</span> <span className="text-white ml-1">{formData.company_name || '-'}</span></div>
              <div><span className="text-white/50">Code:</span> <span className="text-cyan-300 ml-1">{formData.company_code.toUpperCase() || '-'}</span></div>
              <div><span className="text-white/50">Admin:</span> <span className="text-white ml-1">{formData.contact_name || '-'}</span></div>
              <div><span className="text-white/50">Email:</span> <span className="text-white ml-1">{formData.contact_email || '-'}</span></div>
              <div><span className="text-white/50">Tier:</span> <span className="text-white ml-1 capitalize">{formData.tier}</span></div>
              <div><span className="text-white/50">Standards:</span> <span className="text-white ml-1">{selectedStandards.map(s => s.replace('_', ' ')).join(', ') || '-'}</span></div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || selectedStandards.length === 0 || !formData.company_name || !formData.contact_name || !formData.contact_email || !formData.company_code}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-xl transition-all disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Company...' : 'Create Company & Admin User'}
          </button>
        </form>

        <div className="glass glass-border rounded-2xl p-4 bg-blue-500/5">
          <p className="text-white/40 text-xs">
            This creates a company, subscription, and admin user account. The admin user will receive a temporary
            password that must be changed on first login. Use the Supabase Dashboard to create the auth user if
            the admin API call fails (requires service role key).
          </p>
        </div>
      </div>
    </Layout>
  )
}

export default CreateCompany
