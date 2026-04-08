import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/auditLogger'
import Layout from '../components/Layout'
import ConfirmModal from '../components/ConfirmModal'
import ComplianceBadge from '../components/ComplianceBadge'
import { useToast } from '../contexts/ToastContext'
import { PERSONNEL_ROLES } from '../lib/templateData'

const CompanySettings = () => {
  const { userProfile } = useAuth()
  const toast = useToast()
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [formData, setFormData] = useState({
    name: '',
    registration_number: '',
    industry: '',
    address: '',
    contact_phone: '',
    contact_email: '',
  })
  const [personnel, setPersonnel] = useState({})
  const [qmsData, setQmsData] = useState({
    products_services: '',
    qms_scope: '',
    quality_policy: '',
  })

  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin'

  useEffect(() => {
    if (userProfile?.company_id) fetchCompany()
  }, [userProfile])

  const fetchCompany = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, industry, company_code, logo_url, created_at, registration_number, address, contact_phone, contact_email, tier, status, updated_at, key_personnel, products_services, qms_scope, quality_policy')
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
      setPersonnel(data.key_personnel || {})
      setQmsData({
        products_services: data.products_services || '',
        qms_scope: data.qms_scope || '',
        quality_policy: data.quality_policy || '',
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
      toast.warning('Please upload a PNG, JPG, or WebP image.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.warning('Logo must be under 2MB.')
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

      toast.success('Logo uploaded! It will appear on all branded PDF exports.')
    } catch (err) {
      console.error('Logo upload error:', err)
      toast.error('Failed to upload logo. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveLogo = () => {
    setConfirmAction({
      title: 'Remove Company Logo',
      message: 'Remove your company logo? It will no longer appear on PDF exports.',
      variant: 'warning',
      confirmLabel: 'Remove Logo',
      onConfirm: async () => {
        setConfirmAction(null)
        try {
          setSaving(true)
          const ext = logoPreview?.split('.').pop()?.split('?')[0] || 'png'
          await supabase.storage.from('documents').remove([`logos/${userProfile.company_id}/logo.${ext}`])
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
          toast.error('Failed to remove logo. Please try again.')
        } finally {
          setSaving(false)
        }
      }
    })
  }

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      toast.warning('Company name is required.')
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
          key_personnel: personnel,
          products_services: qmsData.products_services?.trim() || null,
          qms_scope: qmsData.qms_scope?.trim() || null,
          quality_policy: qmsData.quality_policy?.trim() || null,
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

      toast.success('Company settings saved.')
    } catch (err) {
      toast.error('Failed to save settings. Please try again.')
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
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Company Settings</h1>
          <p className="text-white/60">Manage your company profile, personnel, and ISO documentation settings</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          {[
            { id: 'profile', label: 'Profile & Logo', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
            { id: 'personnel', label: 'Key Personnel', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
            { id: 'qms', label: 'QMS Content', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-500/30'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tab.icon} />
              </svg>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ═══ PROFILE & LOGO TAB ═══ */}
        {activeTab === 'profile' && <>
        {/* Logo Section */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Company Logo
          </h2>
          <p className="text-sm text-white/50 mb-4">
            Your logo appears as the hero image on all branded PDF exports (NCR reports, Audit reports, Management Review minutes). Recommended: PNG or JPG, minimum 200x200px, maximum 2MB.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Logo Preview */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5 overflow-hidden flex-shrink-0">
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
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold text-white mb-4 flex items-center gap-2">
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
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6">
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

        </>}

        {/* ═══ KEY PERSONNEL TAB ═══ */}
        {activeTab === 'personnel' && <>
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold text-white mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Key Personnel
          </h2>
          <p className="text-sm text-white/50 mb-6">
            These personnel are automatically referenced in your ISO documentation templates. When you download a template, the correct names and titles are populated throughout the document.
          </p>

          <div className="space-y-4">
            {PERSONNEL_ROLES.map(role => (
              <div key={role.key} className={`bg-white/5 border rounded-xl p-4 transition-all ${
                role.required ? 'border-cyan-500/30' : 'border-white/10'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      {role.label}
                      {role.required && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-full font-medium">Required</span>
                      )}
                    </h3>
                    <p className="text-xs text-white/40 mt-0.5">{role.description}</p>
                  </div>
                  {personnel[role.key]?.name && (
                    <span className="text-[10px] px-2 py-0.5 bg-green-500/20 text-green-300 rounded-full">Set</span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/40 block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={personnel[role.key]?.name || ''}
                      onChange={e => setPersonnel(p => ({
                        ...p,
                        [role.key]: { ...p[role.key], name: e.target.value }
                      }))}
                      placeholder="e.g. John Smith"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-white/25 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 block mb-1">Job Title</label>
                    <input
                      type="text"
                      value={personnel[role.key]?.title || ''}
                      onChange={e => setPersonnel(p => ({
                        ...p,
                        [role.key]: { ...p[role.key], title: e.target.value }
                      }))}
                      placeholder={role.label}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-white/25 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 mt-4">
            <p className="text-xs text-purple-300">
              <strong>How this works:</strong> When you download ISO templates from the Template Marketplace, these personnel names automatically populate throughout the documents. For example, your Management Representative appears in the QMS Manual, audit procedures, and management review minutes — all correctly cross-referenced.
            </p>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all"
            >
              {saving ? 'Saving...' : 'Save Personnel'}
            </button>
          </div>
        </div>

        {/* Personnel completeness indicator */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Personnel Completeness</h3>
            <span className="text-sm text-cyan-400 font-mono">
              {PERSONNEL_ROLES.filter(r => personnel[r.key]?.name).length} / {PERSONNEL_ROLES.length}
            </span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${(PERSONNEL_ROLES.filter(r => personnel[r.key]?.name).length / PERSONNEL_ROLES.length) * 100}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {PERSONNEL_ROLES.map(role => (
              <span
                key={role.key}
                className={`text-[10px] px-2 py-1 rounded-full ${
                  personnel[role.key]?.name
                    ? 'bg-green-500/20 text-green-300'
                    : role.required
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-white/10 text-white/40'
                }`}
              >
                {role.label.split(' / ')[0].split(' (')[0]}
              </span>
            ))}
          </div>
        </div>
        </>}

        {/* ═══ QMS CONTENT TAB ═══ */}
        {activeTab === 'qms' && <>
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold text-white mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            QMS Documentation Content
          </h2>
          <p className="text-sm text-white/50 mb-6">
            This content is used to auto-populate your ISO documentation templates. Complete these fields so your QMS Manual and procedures contain your company-specific information.
          </p>

          <div className="space-y-5">
            {/* Products & Services */}
            <div>
              <label className="text-sm text-white/70 block mb-2 font-medium">
                Products & Services
                <span className="text-white/40 font-normal ml-2">Used in QMS Manual Section 2</span>
              </label>
              <textarea
                value={qmsData.products_services}
                onChange={e => setQmsData(p => ({ ...p, products_services: e.target.value }))}
                placeholder="Describe your core products or services. E.g.: 'Manufacturing of precision-engineered steel components for the automotive and mining industries, including CNC machining, welding, and quality inspection services.'"
                rows={3}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder-white/25 focus:outline-none focus:border-cyan-500 resize-y"
              />
            </div>

            {/* QMS Scope */}
            <div>
              <label className="text-sm text-white/70 block mb-2 font-medium">
                QMS Scope Statement
                <span className="text-white/40 font-normal ml-2">Used in QMS Manual Section 3 (ISO 9001 Clause 4.3)</span>
              </label>
              <textarea
                value={qmsData.qms_scope}
                onChange={e => setQmsData(p => ({ ...p, qms_scope: e.target.value }))}
                placeholder="Define the scope of your QMS — what products, services, sites, and processes are covered. E.g.: 'The design, manufacture, and supply of precision-engineered steel components from the Johannesburg manufacturing facility, including CNC machining, fabrication, and quality assurance.'"
                rows={3}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder-white/25 focus:outline-none focus:border-cyan-500 resize-y"
              />
            </div>

            {/* Quality Policy */}
            <div>
              <label className="text-sm text-white/70 block mb-2 font-medium">
                Quality Policy Statement
                <span className="text-white/40 font-normal ml-2">Used in QMS Manual Section 5 (ISO 9001 Clause 5.2)</span>
              </label>
              <textarea
                value={qmsData.quality_policy}
                onChange={e => setQmsData(p => ({ ...p, quality_policy: e.target.value }))}
                placeholder="Your company's quality policy. This should be appropriate to the purpose and context of your organisation. If left blank, a generic policy statement will be used in templates."
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder-white/25 focus:outline-none focus:border-cyan-500 resize-y"
              />
              <p className="text-xs text-white/30 mt-1">
                ISO 9001:2015 Clause 5.2 requires the quality policy to include a commitment to satisfy applicable requirements and to continual improvement.
              </p>
            </div>
          </div>

          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 mt-4">
            <p className="text-xs text-cyan-300">
              <strong>Template integration:</strong> This content flows into your QMS Manual, procedures, and other ISO documents when you download them from the Template Marketplace. Leave fields blank to use generic placeholder text that you can fill in manually.
            </p>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all"
            >
              {saving ? 'Saving...' : 'Save QMS Content'}
            </button>
          </div>
        </div>

        {/* QMS Completeness */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">QMS Content Readiness</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Products & Services', filled: !!qmsData.products_services?.trim() },
              { label: 'QMS Scope', filled: !!qmsData.qms_scope?.trim() },
              { label: 'Quality Policy', filled: !!qmsData.quality_policy?.trim() },
            ].map(item => (
              <div key={item.label} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${item.filled ? 'bg-green-500/10' : 'bg-white/5'}`}>
                {item.filled ? (
                  <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-white/30 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )}
                <span className={`text-xs ${item.filled ? 'text-green-300' : 'text-white/40'}`}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Badge */}
        <ComplianceBadge />
        </>}

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
                All data is encrypted at rest (AES-256) and in transit (TLS 1.2+). For data subject requests, contact your Information Officer or email support@isoguardian.co.za.
              </p>
            </div>
          </div>
        </div>
      </div>
      {confirmAction && <ConfirmModal {...confirmAction} onCancel={() => setConfirmAction(null)} />}
    </Layout>
  )
}

export default CompanySettings
