import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/auditLogger'
import Layout from '../components/Layout'

const CompanySettings = () => {
  const { userProfile } = useAuth()
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    registration_number: '',
    industry: '',
    address: '',
    contact_phone: '',
    contact_email: '',
  })

  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin' || userProfile?.email === 'krugerreece@gmail.com'

  useEffect(() => {
    if (userProfile?.company_id) fetchCompany()
  }, [userProfile])

  const fetchCompany = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', userProfile.company_id)
        .single()

      if (error) throw error
      setCompany(data)
      setFormData({
        name: data.name || '',
        registration_number: data.registration_number || '',
        industry: data.industry || '',
        address: data.address || '',
        contact_phone: data.contact_phone || '',
        contact_email: data.contact_email || '',
      })
      if (data.logo_url) setLogoPreview(data.logo_url)
    } catch (err) {
      console.error('Error fetching company:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PNG, JPG, or WebP image.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo must be under 2MB.')
      return
    }

    setUploading(true)
    try {
      // Create a safe filename using company_id
      const ext = file.name.split('.').pop().toLowerCase()
      const filePath = `logos/${userProfile.company_id}/logo.${ext}`

      // Delete old logo if exists
      await supabase.storage.from('documents').remove([filePath])

      // Upload new logo
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      const logoUrl = urlData.publicUrl

      // Update company record
      const { error: updateError } = await supabase
        .from('companies')
        .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
        .eq('id', userProfile.company_id)

      if (updateError) throw updateError

      setLogoPreview(logoUrl)
      setCompany(prev => ({ ...prev, logo_url: logoUrl }))

      await logActivity({
        companyId: userProfile.company_id,
        userId: userProfile.id,
        action: 'updated',
        entityType: 'company_settings',
        entityId: userProfile.company_id,
        changes: { field: 'logo', status: 'uploaded' }
      })

      alert('Logo uploaded successfully! It will appear on all your branded PDF exports.')
    } catch (err) {
      console.error('Logo upload error:', err)
      alert('Failed to upload logo: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveLogo = async () => {
    if (!confirm('Remove your company logo? It will no longer appear on PDF exports.')) return

    try {
      setSaving(true)
      // Remove from storage
      const ext = logoPreview?.split('.').pop()?.split('?')[0] || 'png'
      await supabase.storage.from('documents').remove([`logos/${userProfile.company_id}/logo.${ext}`])

      // Clear URL in company record
      await supabase.from('companies')
        .update({ logo_url: null, updated_at: new Date().toISOString() })
        .eq('id', userProfile.company_id)

      setLogoPreview(null)
      setCompany(prev => ({ ...prev, logo_url: null }))

      await logActivity({
        companyId: userProfile.company_id,
        userId: userProfile.id,
        action: 'updated',
        entityType: 'company_settings',
        entityId: userProfile.company_id,
        changes: { field: 'logo', status: 'removed' }
      })
    } catch (err) {
      alert('Failed to remove logo: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      alert('Company name is required.')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: formData.name.trim(),
          registration_number: formData.registration_number?.trim() || null,
          industry: formData.industry?.trim() || null,
          address: formData.address?.trim() || null,
          contact_phone: formData.contact_phone?.trim() || null,
          contact_email: formData.contact_email?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userProfile.company_id)

      if (error) throw error

      await logActivity({
        companyId: userProfile.company_id,
        userId: userProfile.id,
        action: 'updated',
        entityType: 'company_settings',
        entityId: userProfile.company_id,
        changes: { fields: Object.keys(formData) }
      })

      alert('Company settings saved.')
    } catch (err) {
      alert('Failed to save: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="text-center text-white p-8">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-white/60">Only administrators can access company settings.</p>
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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Company Settings</h1>
          <p className="text-white/60">Manage your company profile, logo, and branding for exports</p>
        </div>

        {/* Logo Section */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Company Logo
          </h2>
          <p className="text-sm text-white/50 mb-4">
            Your logo appears as the hero image on all branded PDF exports (NCR reports, Audit reports, Management Review minutes). Recommended: PNG or JPG, minimum 200x200px, maximum 2MB.
          </p>

          <div className="flex items-start gap-6">
            {/* Logo Preview */}
            <div className="w-32 h-32 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5 overflow-hidden flex-shrink-0">
              {logoPreview ? (
                <img src={logoPreview} alt="Company logo" className="w-full h-full object-contain p-2" />
              ) : (
                <div className="text-center">
                  <svg className="w-10 h-10 text-white/30 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs text-white/30">No logo</span>
                </div>
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1 space-y-3">
              <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-all ${uploading ? 'bg-gray-500 cursor-wait' : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'} text-white font-semibold text-sm`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {uploading ? 'Uploading...' : logoPreview ? 'Replace Logo' : 'Upload Logo'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>

              {logoPreview && (
                <button
                  onClick={handleRemoveLogo}
                  disabled={saving}
                  className="block text-sm text-red-400 hover:text-red-300 underline"
                >
                  Remove logo
                </button>
              )}

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 mt-2">
                <p className="text-xs text-purple-300">
                  <strong>How it works:</strong> Your logo is displayed as the hero image at the top of every branded PDF export. ISOGuardian branding appears subtly at the bottom. This ensures your documents look professional and client-branded for auditors.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Company Details Section */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Company Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-white/60 block mb-1">Company Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-sm text-white/60 block mb-1">Registration Number</label>
              <input
                type="text"
                value={formData.registration_number}
                onChange={e => setFormData(p => ({ ...p, registration_number: e.target.value }))}
                placeholder="e.g. 2026/082362/07"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-sm text-white/60 block mb-1">Industry</label>
              <select
                value={formData.industry}
                onChange={e => setFormData(p => ({ ...p, industry: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="" className="bg-slate-800">Select industry</option>
                <option value="Manufacturing" className="bg-slate-800">Manufacturing</option>
                <option value="Construction" className="bg-slate-800">Construction</option>
                <option value="Mining" className="bg-slate-800">Mining</option>
                <option value="Engineering" className="bg-slate-800">Engineering</option>
                <option value="Healthcare" className="bg-slate-800">Healthcare</option>
                <option value="Logistics" className="bg-slate-800">Logistics</option>
                <option value="Professional Services" className="bg-slate-800">Professional Services</option>
                <option value="Information Technology" className="bg-slate-800">Information Technology</option>
                <option value="Other" className="bg-slate-800">Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-white/60 block mb-1">Contact Email</label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={e => setFormData(p => ({ ...p, contact_email: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-sm text-white/60 block mb-1">Contact Phone</label>
              <input
                type="tel"
                value={formData.contact_phone}
                onChange={e => setFormData(p => ({ ...p, contact_phone: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-white/60 block mb-1">Physical Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Company Code Info */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Platform Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-white/50">Company Code:</span>
              <span className="text-cyan-400 font-mono ml-2">{company?.company_code || 'N/A'}</span>
            </div>
            <div>
              <span className="text-white/50">Tier:</span>
              <span className="text-white ml-2 capitalize">{company?.tier || 'N/A'}</span>
            </div>
            <div>
              <span className="text-white/50">Status:</span>
              <span className={`ml-2 ${company?.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>{company?.status || 'N/A'}</span>
            </div>
            <div>
              <span className="text-white/50">Document Format:</span>
              <span className="text-white font-mono ml-2">IG-{company?.company_code || 'XXX'}-DOC-001</span>
            </div>
            <div>
              <span className="text-white/50">Created:</span>
              <span className="text-white ml-2">{company?.created_at ? new Date(company.created_at).toLocaleDateString('en-ZA') : 'N/A'}</span>
            </div>
            <div>
              <span className="text-white/50">Data Isolation:</span>
              <span className="text-green-400 ml-2">Active (RLS Enforced)</span>
            </div>
          </div>
        </div>

        {/* POPIA Notice */}
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <p className="text-sm text-purple-300 font-semibold">POPIA Compliance Notice</p>
              <p className="text-xs text-purple-300/70 mt-1">
                Your company data is isolated using Row Level Security (RLS). No other company on this platform can access your documents, NCRs, audits, or reviews. 
                All data is encrypted at rest (AES-256) and in transit (TLS 1.2+). For data subject requests, contact your Information Officer or email krugerreece@gmail.com.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default CompanySettings
