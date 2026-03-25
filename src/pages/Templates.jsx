import { useState, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import Layout from '../components/Layout'
import { TEMPLATES, TEMPLATE_CATEGORIES, CROSS_REFERENCES } from '../lib/templateData'
import { generateTemplatePDF } from '../lib/templatePDFExport'
import { fetchLiveData } from '../lib/liveDataFetcher'
import { supabase } from '../lib/supabase'

const STANDARD_LABELS = {
  ISO_9001: 'ISO 9001',
  ISO_14001: 'ISO 14001',
  ISO_45001: 'ISO 45001',
  MULTI: 'Multi-Standard',
}

const STANDARD_COLORS = {
  ISO_9001: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  ISO_14001: 'bg-green-500/20 text-green-300 border-green-500/30',
  ISO_45001: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  MULTI: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
}

const DOC_TYPE_LABELS = {
  manual: 'Manual',
  procedure: 'Procedure',
  form: 'Form',
  register: 'Register',
  policy: 'Policy',
  plan: 'Plan',
  bundle: 'Starter Pack',
}

const CATEGORY_ICONS = {
  book: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  clipboard: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  document: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  table: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  package: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
}

function formatPrice(cents) {
  if (cents === 0) return 'Free'
  return `R${(cents / 100).toLocaleString('en-ZA')}`
}

const Templates = () => {
  const { userProfile } = useAuth()
  const toast = useToast()
  const [activeCategory, setActiveCategory] = useState('all')
  const [standardFilter, setStandardFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [previewTemplate, setPreviewTemplate] = useState(null)
  const [generating, setGenerating] = useState(null)

  const isSubscriber = !!userProfile

  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter(t => {
      if (activeCategory !== 'all' && t.categoryId !== activeCategory) return false
      if (standardFilter !== 'all' && t.standard !== standardFilter && t.standard !== 'MULTI') return false
      if (searchTerm) {
        const q = searchTerm.toLowerCase()
        return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      }
      return true
    })
  }, [activeCategory, standardFilter, searchTerm])

  // Verify active subscription before allowing download
  const verifySubscription = async () => {
    if (userProfile?.role === 'super_admin') return true
    const companyId = userProfile?.company_id || userProfile?.company?.id
    if (!companyId) return false

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status, trial_ends_at')
      .eq('company_id', companyId)
      .maybeSingle()

    if (!sub) return false
    if (sub.status === 'active') return true
    if (sub.status === 'trial' && new Date(sub.trial_ends_at) > new Date()) return true
    return false
  }

  // Log template download for audit trail
  const logDownload = async (templateId) => {
    try {
      const companyId = userProfile?.company_id || userProfile?.company?.id
      await supabase.from('template_purchases').insert({
        user_id: userProfile.id,
        company_id: companyId,
        template_id: templateId,
        price_paid_zar: 0,
        payment_method: 'subscriber',
      })
    } catch (_e) { /* don't block download if logging fails */ }
  }

  // Fetch company personnel & QMS data for template auto-population
  const fetchCompanyExtras = async () => {
    try {
      const companyId = userProfile?.company_id || userProfile?.company?.id
      if (!companyId) return {}
      const { data } = await supabase
        .from('companies')
        .select('key_personnel, products_services, qms_scope, quality_policy')
        .eq('id', companyId)
        .single()
      return {
        personnel: data?.key_personnel || {},
        productsServices: data?.products_services || '',
        qmsScope: data?.qms_scope || '',
        qualityPolicy: data?.quality_policy || '',
      }
    } catch (_e) { return {} }
  }

  // Dynamically load template content (code-split for IP protection)
  const loadTemplateContent = async (templateId) => {
    const { TEMPLATE_CONTENT } = await import('../lib/templateContent.js')
    return TEMPLATE_CONTENT[templateId] || null
  }

  // Download a blank form (no live data injection)
  const handleDownloadBlank = async (template) => {
    if (!userProfile) {
      toast.warning('Please sign in to download templates.')
      return
    }

    setGenerating(template.id)
    try {
      const hasAccess = await verifySubscription()
      if (!hasAccess) {
        toast.error('An active subscription is required to download templates.')
        return
      }

      const content = await loadTemplateContent(template.id)
      if (!content) {
        toast.error('Template content unavailable. Please try again later.')
        return
      }

      const companyName = userProfile.company?.name || 'Your Company'
      const companyCode = userProfile.company?.company_code || 'XX'
      const preparedBy = userProfile.full_name || userProfile.email || 'System'
      const companyLogoUrl = userProfile.company?.logo_url || null
      const companyExtra = await fetchCompanyExtras()

      // Generate PDF WITHOUT live data — blank form for manual completion
      await generateTemplatePDF({ ...template, content }, {
        companyName,
        companyCode,
        preparedBy,
        companyLogoUrl,
        ...companyExtra,
        liveData: null,
      })

      await logDownload(template.id)
      toast.success(`${template.title} (blank) downloaded successfully`)
    } catch (err) {
      console.error('Template PDF generation failed:', err)
      toast.error('Failed to generate template. Please try again.')
    } finally {
      setGenerating(null)
    }
  }

  // Download with live data injection (auto-populated from ISOGuardian)
  const handleDownload = async (template) => {
    if (!userProfile) {
      toast.warning('Please sign in to download templates.')
      return
    }

    setGenerating(template.id)
    try {
      // 1. Verify subscription
      const hasAccess = await verifySubscription()
      if (!hasAccess) {
        toast.error('An active subscription is required to download templates.')
        return
      }

      // 2. Dynamically load content (separate JS chunk — not in main bundle)
      const content = await loadTemplateContent(template.id)
      if (!content) {
        toast.error('Template content unavailable. Please try again later.')
        return
      }

      const companyName = userProfile.company?.name || 'Your Company'
      const companyCode = userProfile.company?.company_code || 'XX'
      const preparedBy = userProfile.full_name || userProfile.email || 'System'
      const companyLogoUrl = userProfile.company?.logo_url || null
      const companyId = userProfile?.company_id || userProfile?.company?.id

      // Fetch personnel, QMS data, and live system data in parallel
      const [companyExtra, liveData] = await Promise.all([
        fetchCompanyExtras(),
        fetchLiveData(companyId),
      ])

      // 3. Generate PDF with watermark + live data (content merged at download time)
      await generateTemplatePDF({ ...template, content }, {
        companyName,
        companyCode,
        preparedBy,
        companyLogoUrl,
        ...companyExtra,
        liveData,
      })

      // 4. Log the download
      await logDownload(template.id)

      toast.success(`${template.title} downloaded successfully`)
    } catch (err) {
      console.error('Template PDF generation failed:', err)
      toast.error('Failed to generate template. Please try again.')
    } finally {
      setGenerating(null)
    }
  }

  const handleBundleDownload = async (bundle) => {
    if (!userProfile) {
      toast.warning('Please sign in to download templates.')
      return
    }
    if (!bundle.bundleTemplateIds) {
      handleDownload(bundle)
      return
    }

    setGenerating(bundle.id)
    try {
      // 1. Verify subscription
      const hasAccess = await verifySubscription()
      if (!hasAccess) {
        toast.error('An active subscription is required to download templates.')
        return
      }

      // 2. Load all template content in one dynamic import
      const { TEMPLATE_CONTENT } = await import('../lib/templateContent.js')

      const companyName = userProfile.company?.name || 'Your Company'
      const companyCode = userProfile.company?.company_code || 'XX'
      const preparedBy = userProfile.full_name || userProfile.email || 'System'
      const companyLogoUrl = userProfile.company?.logo_url || null
      const companyId = userProfile?.company_id || userProfile?.company?.id

      // Fetch personnel, QMS data, and live system data in parallel (once for entire bundle)
      const [companyExtra, liveData] = await Promise.all([
        fetchCompanyExtras(),
        fetchLiveData(companyId),
      ])
      const options = { companyName, companyCode, preparedBy, companyLogoUrl, ...companyExtra, liveData }

      // 3. Download each template in the bundle
      let downloadCount = 0
      for (const templateId of bundle.bundleTemplateIds) {
        const tmpl = TEMPLATES.find(t => t.id === templateId)
        const content = TEMPLATE_CONTENT[templateId]
        if (tmpl && content) {
          await generateTemplatePDF({ ...tmpl, content }, options)
          await logDownload(templateId)
          downloadCount++
          // Small delay between downloads so browser doesn't block them
          await new Promise(r => setTimeout(r, 500))
        }
      }

      toast.success(`${bundle.title} — ${downloadCount} templates downloaded`)
    } catch (err) {
      console.error('Bundle download failed:', err)
      toast.error('Failed to download bundle. Please try again.')
    } finally {
      setGenerating(null)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Template Marketplace</h1>
            <p className="text-white/50 mt-1">Professional ISO documentation templates — branded with your company details</p>
          </div>
          {isSubscriber && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-xl">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-300 text-sm font-medium">Subscriber — Free templates included</span>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-white text-sm"
            />
          </div>

          {/* Standard filter */}
          <select
            value={standardFilter}
            onChange={e => setStandardFilter(e.target.value)}
            className="glass-input px-4 py-2.5 rounded-xl text-white text-sm"
          >
            <option value="all">All Standards</option>
            <option value="ISO_9001">ISO 9001</option>
            <option value="ISO_14001">ISO 14001</option>
            <option value="ISO_45001">ISO 45001</option>
          </select>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === 'all'
                ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                : 'glass glass-border text-white/60 hover:text-white'
            }`}
          >
            All Templates ({TEMPLATES.length})
          </button>
          {TEMPLATE_CATEGORIES.map(cat => {
            const count = TEMPLATES.filter(t => t.categoryId === cat.id).length
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeCategory === cat.id
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                    : 'glass glass-border text-white/60 hover:text-white'
                }`}
              >
                <span className="w-5 h-5">{CATEGORY_ICONS[cat.icon]}</span>
                {cat.name} ({count})
              </button>
            )
          })}
        </div>

        {/* Template grid */}
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-white/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-white/40">No templates match your filters.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(template => {
              const isBundle = template.docType === 'bundle'
              const price = isSubscriber ? template.priceSubscriber : template.pricePublic
              const publicPrice = template.pricePublic
              const isGenerating = generating === template.id

              return (
                <div
                  key={template.id}
                  className={`glass-card rounded-2xl p-5 flex flex-col transition-all hover:border-white/20 ${
                    isBundle ? 'border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-cyan-500/5' : ''
                  } ${template.isFeatured ? 'ring-1 ring-cyan-500/30' : ''}`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full border ${STANDARD_COLORS[template.standard]}`}>
                        {STANDARD_LABELS[template.standard]}
                      </span>
                      <span className="text-xs text-white/40">
                        {DOC_TYPE_LABELS[template.docType] || template.docType}
                      </span>
                    </div>
                    {template.isFeatured && (
                      <span className="text-xs px-2 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-cyan-300 font-medium">
                        Featured
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-white font-bold text-lg mb-2 leading-tight">{template.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-3 flex-1">{template.description}</p>

                  {/* Live data badge */}
                  {isSubscriber && (
                    <div className="flex items-center gap-1.5 text-xs text-cyan-400 mb-3">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                      Auto-populated with your live system data
                    </div>
                  )}

                  {/* Clause reference */}
                  {template.clauseRef && (
                    <div className="text-xs text-white/30 mb-3">
                      Clause {template.clauseRef}
                    </div>
                  )}

                  {/* Cross-references on card */}
                  {(() => {
                    const crossRefs = CROSS_REFERENCES[template.id]
                    if (!crossRefs) return null
                    const total = crossRefs.references.length + crossRefs.referencedBy.length
                    if (total === 0) return null
                    return (
                      <div className="flex items-center gap-1.5 text-xs text-white/30 mb-3">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        {total} cross-reference{total !== 1 ? 's' : ''} to other documents
                      </div>
                    )
                  })()}

                  {/* Bundle contents */}
                  {isBundle && template.bundleTemplateIds && (
                    <div className="mb-4 p-3 bg-white/5 rounded-xl">
                      <p className="text-xs text-white/50 font-medium mb-2">Includes {template.bundleTemplateIds.length} templates:</p>
                      <div className="space-y-1">
                        {template.bundleTemplateIds.slice(0, 5).map(id => {
                          const t = TEMPLATES.find(x => x.id === id)
                          return t ? (
                            <div key={id} className="flex items-center gap-2 text-xs text-white/40">
                              <svg className="w-3 h-3 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              {t.title}
                            </div>
                          ) : null
                        })}
                        {template.bundleTemplateIds.length > 5 && (
                          <p className="text-xs text-white/30 pl-5">+{template.bundleTemplateIds.length - 5} more</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Price & Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div>
                      {isSubscriber && price === 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-green-400 font-bold text-lg">Free</span>
                          {publicPrice > 0 && (
                            <span className="text-white/30 text-sm line-through">{formatPrice(publicPrice)}</span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-lg">{formatPrice(price)}</span>
                          {isSubscriber && publicPrice > price && (
                            <span className="text-white/30 text-sm line-through">{formatPrice(publicPrice)}</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setPreviewTemplate(template)}
                        className="px-3 py-2 glass glass-border rounded-xl text-white/60 hover:text-white text-sm transition-all"
                      >
                        Preview
                      </button>
                      {/* Dual-mode for form templates: Blank + Live Data */}
                      {template.docType === 'form' && isSubscriber && (
                        <button
                          onClick={() => handleDownloadBlank(template)}
                          disabled={isGenerating}
                          className="px-3 py-2 glass glass-border rounded-xl text-white/60 hover:text-white text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Download blank form for manual completion"
                        >
                          Blank
                        </button>
                      )}
                      <button
                        onClick={() => isBundle ? handleBundleDownload(template) : handleDownload(template)}
                        disabled={isGenerating || (!isSubscriber && price > 0)}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isGenerating ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            Generating...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            {isBundle ? 'Download All' : template.docType === 'form' ? 'Live Data' : 'Download PDF'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Info bar */}
        <div className="glass-card rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-medium text-sm">How it works</h3>
            <p className="text-white/50 text-xs mt-1">
              Every template is automatically branded with your company name, logo, and document numbering convention when you download.
              Templates are generated as professional PDFs ready for use, audit, or further customisation.
              {!isSubscriber && ' Sign in to access free subscriber templates.'}
            </p>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setPreviewTemplate(null)}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-slate-900 border-b border-white/10 p-5 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-white">{previewTemplate.title}</h2>
                <p className="text-white/40 text-sm mt-1">{STANDARD_LABELS[previewTemplate.standard]} — Clause {previewTemplate.clauseRef}</p>
              </div>
              <button onClick={() => setPreviewTemplate(null)} className="text-white/40 hover:text-white p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-6">
              <p className="text-white/60 text-sm leading-relaxed">{previewTemplate.description}</p>

              {/* Template details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-white/30 text-xs mb-1">Document Type</p>
                  <p className="text-white text-sm font-medium">{DOC_TYPE_LABELS[previewTemplate.docType] || previewTemplate.docType}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-white/30 text-xs mb-1">Version</p>
                  <p className="text-white text-sm font-medium">v{previewTemplate.version}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-white/30 text-xs mb-1">Standard</p>
                  <p className="text-white text-sm font-medium">{STANDARD_LABELS[previewTemplate.standard]}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-white/30 text-xs mb-1">Clause Reference</p>
                  <p className="text-white text-sm font-medium">{previewTemplate.clauseRef}</p>
                </div>
              </div>

              {/* Bundle contents in preview */}
              {previewTemplate.docType === 'bundle' && previewTemplate.bundleTemplateIds && (
                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-white/60 font-medium text-sm mb-3">Bundle includes {previewTemplate.bundleTemplateIds.length} templates:</p>
                  <div className="space-y-2">
                    {previewTemplate.bundleTemplateIds.map(id => {
                      const t = TEMPLATES.find(x => x.id === id)
                      return t ? (
                        <div key={id} className="flex items-center gap-2 text-sm text-white/50">
                          <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {t.title}
                        </div>
                      ) : null
                    })}
                  </div>
                </div>
              )}

              {/* Cross-references */}
              {(() => {
                const crossRefs = CROSS_REFERENCES[previewTemplate.id]
                if (!crossRefs) return null
                const hasRefs = crossRefs.references.length > 0 || crossRefs.referencedBy.length > 0
                if (!hasRefs) return null
                return (
                  <div className="p-4 bg-white/5 rounded-xl space-y-3">
                    <p className="text-white/60 font-medium text-sm flex items-center gap-2">
                      <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Cross-References
                    </p>
                    {crossRefs.references.length > 0 && (
                      <div>
                        <p className="text-xs text-white/30 mb-1.5">References:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {crossRefs.references.map(ref => {
                            const t = TEMPLATES.find(x => x.id === ref)
                            return (
                              <span key={ref} className="text-xs px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-300/70">
                                {t?.title || ref}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    {crossRefs.referencedBy.length > 0 && (
                      <div>
                        <p className="text-xs text-white/30 mb-1.5">Referenced by:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {crossRefs.referencedBy.map(ref => {
                            const t = TEMPLATES.find(x => x.id === ref)
                            return (
                              <span key={ref} className="text-xs px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300/70">
                                {t?.title || ref}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Content protection notice */}
              <div className="flex items-center gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <svg className="w-6 h-6 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <p className="text-white text-sm font-medium">Full content available on download</p>
                  <p className="text-white/40 text-xs">Your branded PDF will include all sections, customised with your company details and watermarked for security.</p>
                </div>
              </div>

              {/* Download from preview */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div>
                  {isSubscriber && (previewTemplate.priceSubscriber === 0) ? (
                    <span className="text-green-400 font-bold">Free for subscribers</span>
                  ) : (
                    <span className="text-white font-bold">{formatPrice(isSubscriber ? previewTemplate.priceSubscriber : previewTemplate.pricePublic)}</span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setPreviewTemplate(null)
                    if (previewTemplate.docType === 'bundle') {
                      handleBundleDownload(previewTemplate)
                    } else {
                      handleDownload(previewTemplate)
                    }
                  }}
                  disabled={!isSubscriber}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubscriber ? 'Download Branded PDF' : 'Sign in to Download'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default Templates
