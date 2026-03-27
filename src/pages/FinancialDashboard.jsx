import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { generateInvoicePDF, generateCommissionStatementPDF } from '../lib/invoicePDFExport'

const TABS = [
  { id: 'revenue', label: 'Revenue' },
  { id: 'payments', label: 'Payments' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'commissions', label: 'Commissions' },
  { id: 'affiliates', label: 'Affiliates' },
  { id: 'templates', label: 'Template Sales' },
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'marketing', label: 'Marketing' },
]

function formatCurrency(amountCents) {
  if (!amountCents && amountCents !== 0) return 'R 0.00'
  const rands = (amountCents / 100).toFixed(2)
  return `R ${rands.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })
}

const StatusBadge = ({ status }) => {
  const colors = {
    paid: 'bg-green-500/20 text-green-400',
    active: 'bg-green-500/20 text-green-400',
    sent: 'bg-green-500/20 text-green-400',
    approved: 'bg-cyan-500/20 text-cyan-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
    overdue: 'bg-red-500/20 text-red-400',
    failed: 'bg-red-500/20 text-red-400',
    cancelled: 'bg-gray-500/20 text-gray-400',
    unsubscribed: 'bg-gray-500/20 text-gray-400',
    trial: 'bg-purple-500/20 text-purple-400',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status?.toLowerCase()] || colors.pending}`}>
      {status || 'unknown'}
    </span>
  )
}

const KPICard = ({ label, value, sub, color = 'cyan' }) => (
  <div className="glass-card p-4 rounded-xl">
    <p className="text-xs text-gray-400 mb-1">{label}</p>
    <p className={`text-2xl font-bold ${color === 'cyan' ? 'text-cyan-400' : color === 'green' ? 'text-green-400' : color === 'purple' ? 'text-purple-400' : color === 'yellow' ? 'text-yellow-400' : 'text-white'}`}>
      {value}
    </p>
    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
  </div>
)

const FinancialDashboard = () => {
  const { userProfile } = useAuth()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('revenue')
  const [loading, setLoading] = useState(true)

  // Data states
  const [subscriptions, setSubscriptions] = useState([])
  const [payments, setPayments] = useState([])
  const [invoices, setInvoices] = useState([])
  const [commissions, setCommissions] = useState([])
  const [referrals, setReferrals] = useState([])
  const [templatePurchases, setTemplatePurchases] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [queueStats, setQueueStats] = useState({})
  const [companies, setCompanies] = useState([])
  const [assessments, setAssessments] = useState([])
  const [consultations, setConsultations] = useState([])
  const [expandedCampaign, setExpandedCampaign] = useState(null)

  // Filters
  const [dateFilter, setDateFilter] = useState('30d')
  const [searchTerm, setSearchTerm] = useState('')

  const getDateFrom = useCallback(() => {
    const now = new Date()
    if (dateFilter === '7d') return new Date(now - 7 * 86400000).toISOString()
    if (dateFilter === '30d') return new Date(now - 30 * 86400000).toISOString()
    if (dateFilter === '90d') return new Date(now - 90 * 86400000).toISOString()
    if (dateFilter === '1y') return new Date(now - 365 * 86400000).toISOString()
    return new Date(now - 30 * 86400000).toISOString()
  }, [dateFilter])

  useEffect(() => {
    if (userProfile?.role === 'super_admin') {
      fetchData()
    }
  }, [userProfile, dateFilter])

  const fetchData = async () => {
    setLoading(true)
    const from = getDateFrom()

    try {
      const results = await Promise.allSettled([
        supabase.from('subscriptions').select('id, company_id, tier, status, start_date, end_date, final_price, plan').order('created_at', { ascending: false }),
        supabase.from('payment_history').select('id, company_id, amount, status, payment_method, pf_payment_id, created_at, description').gte('created_at', from).order('created_at', { ascending: false }),
        supabase.from('invoices').select('id, company_id, invoice_number, invoice_date, due_date, total, subtotal, vat_amount, status, paid_date, payment_method, line_items, payment_reference').order('invoice_date', { ascending: false }).limit(100),
        supabase.from('commissions').select('id, reseller_id, company_id, amount, status, created_at, payment_reference, description').order('created_at', { ascending: false }).limit(200),
        supabase.from('referrals').select('id, referral_code, referred_email, status, credit_amount, created_at, converted_at').order('created_at', { ascending: false }),
        supabase.from('template_purchases').select('id, company_id, template_id, template_name, amount, created_at').gte('created_at', from).order('created_at', { ascending: false }),
        supabase.from('drip_campaigns').select('id, slug, name, is_active, trigger_type, emails, created_at'),
        supabase.from('companies').select('id, name, company_code'),
        supabase.from('iso_readiness_assessments').select('id, company_name, email, phone, standard, score, created_at').order('created_at', { ascending: false }).limit(100),
        supabase.from('consultation_requests').select('id, name, email, company, standard, preferred_date, message, status, created_at').order('created_at', { ascending: false }).limit(100),
      ])

      setSubscriptions(results[0].status === 'fulfilled' ? results[0].value.data || [] : [])
      setPayments(results[1].status === 'fulfilled' ? results[1].value.data || [] : [])
      setInvoices(results[2].status === 'fulfilled' ? results[2].value.data || [] : [])
      setCommissions(results[3].status === 'fulfilled' ? results[3].value.data || [] : [])
      setReferrals(results[4].status === 'fulfilled' ? results[4].value.data || [] : [])
      setTemplatePurchases(results[5].status === 'fulfilled' ? results[5].value.data || [] : [])
      setCampaigns(results[6].status === 'fulfilled' ? results[6].value.data || [] : [])
      setCompanies(results[7].status === 'fulfilled' ? results[7].value.data || [] : [])
      setAssessments(results[8].status === 'fulfilled' ? results[8].value.data || [] : [])
      setConsultations(results[9].status === 'fulfilled' ? results[9].value.data || [] : [])

      // Fetch queue stats per campaign
      if (results[6].status === 'fulfilled' && results[6].value.data?.length) {
        const stats = {}
        for (const campaign of results[6].value.data) {
          const [pending, sent, failed] = await Promise.all([
            supabase.from('drip_queue').select('id', { count: 'exact', head: true }).eq('campaign_id', campaign.id).eq('status', 'pending'),
            supabase.from('drip_queue').select('id', { count: 'exact', head: true }).eq('campaign_id', campaign.id).eq('status', 'sent'),
            supabase.from('drip_queue').select('id', { count: 'exact', head: true }).eq('campaign_id', campaign.id).eq('status', 'failed'),
          ])
          stats[campaign.id] = { pending: pending.count || 0, sent: sent.count || 0, failed: failed.count || 0 }
        }
        setQueueStats(stats)
      }
    } catch {
      toast.error('Failed to load financial data')
    } finally {
      setLoading(false)
    }
  }

  const getCompanyName = (companyId) => {
    const c = companies.find((co) => co.id === companyId)
    return c?.name || c?.company_code || companyId?.slice(0, 8) || '—'
  }

  // ─── Commission Actions ─────────────────────────────────────────────────

  const updateCommissionStatus = async (id, status, paymentRef = null) => {
    const updates = { status }
    if (paymentRef) updates.payment_reference = paymentRef
    const { error } = await supabase.from('commissions').update(updates).eq('id', id)
    if (error) {
      toast.error('Failed to update commission')
    } else {
      toast.success(`Commission ${status}`)
      setCommissions((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))
    }
  }

  const handleApproveCommission = (id) => updateCommissionStatus(id, 'approved')

  const handlePayCommission = async (id) => {
    const ref = prompt('Enter EFT payment reference:')
    if (ref) {
      await updateCommissionStatus(id, 'paid', ref)
    }
  }

  const handleBulkApprove = async () => {
    const pending = commissions.filter((c) => c.status === 'pending')
    if (!pending.length) return toast.info('No pending commissions to approve')
    for (const c of pending) {
      await updateCommissionStatus(c.id, 'approved')
    }
    toast.success(`${pending.length} commissions approved`)
  }

  // ─── Invoice PDF ────────────────────────────────────────────────────────

  const handleDownloadInvoice = async (invoice) => {
    try {
      const company = companies.find((c) => c.id === invoice.company_id)
      const doc = await generateInvoicePDF(invoice, company)
      doc.save(`Invoice_${invoice.invoice_number || invoice.id}.pdf`)
      toast.success('Invoice downloaded')
    } catch {
      toast.error('Failed to generate invoice PDF')
    }
  }

  // ─── Commission Statement PDF ──────────────────────────────────────────

  const handleDownloadStatement = async (resellerId) => {
    try {
      const resellerCommissions = commissions.filter((c) => c.reseller_id === resellerId)
      const reseller = { company_name: getCompanyName(resellerId) }
      const doc = await generateCommissionStatementPDF(reseller, resellerCommissions, {
        from: getDateFrom(),
        to: new Date().toISOString(),
      })
      doc.save(`Commission_Statement_${reseller.company_name}.pdf`)
      toast.success('Statement downloaded')
    } catch {
      toast.error('Failed to generate statement')
    }
  }

  // ─── Revenue Calculations ──────────────────────────────────────────────

  const activeSubs = subscriptions.filter((s) => s.status === 'active' || s.status === 'trialing')
  const mrr = activeSubs.reduce((sum, s) => sum + (s.final_price || 0), 0)
  const arr = mrr * 12
  const trialSubs = subscriptions.filter((s) => s.status === 'trialing' || s.status === 'trial')
  const totalRevenue = payments.filter((p) => p.status === 'paid' || p.status === 'complete').reduce((sum, p) => sum + (p.amount || 0), 0)
  const totalCommissionsPending = commissions.filter((c) => c.status === 'pending' || c.status === 'approved').reduce((s, c) => s + (c.amount || 0), 0)
  const totalTemplateRevenue = templatePurchases.reduce((s, t) => s + (t.amount || 0), 0)

  // ─── Tab Renderers ─────────────────────────────────────────────────────

  const renderRevenue = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="MRR" value={formatCurrency(mrr)} sub="Monthly Recurring Revenue" color="cyan" />
        <KPICard label="ARR" value={formatCurrency(arr)} sub="Annual Recurring Revenue" color="purple" />
        <KPICard label="Active Subscriptions" value={activeSubs.length} sub={`${trialSubs.length} trials`} color="green" />
        <KPICard label="Period Revenue" value={formatCurrency(totalRevenue)} sub={`Last ${dateFilter}`} />
      </div>

      {/* Revenue bar chart (CSS-based) */}
      <div className="glass-card p-6 rounded-xl">
        <h3 className="text-white font-semibold mb-4">Revenue by Subscription Tier</h3>
        <div className="space-y-3">
          {['starter', 'growth', 'enterprise'].map((tier) => {
            const tierSubs = activeSubs.filter((s) => (s.tier || s.plan || '').toLowerCase() === tier)
            const tierMRR = tierSubs.reduce((sum, s) => sum + (s.final_price || 0), 0)
            const pct = mrr > 0 ? (tierMRR / mrr) * 100 : 0
            return (
              <div key={tier}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300 capitalize">{tier} ({tierSubs.length})</span>
                  <span className="text-white font-medium">{formatCurrency(tierMRR)}</span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-700"
                    style={{ width: `${Math.max(pct, 1)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Template revenue */}
      <div className="glass-card p-6 rounded-xl">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-white font-semibold">Template Sales Revenue</h3>
          <span className="text-cyan-400 font-bold">{formatCurrency(totalTemplateRevenue)}</span>
        </div>
        <p className="text-sm text-gray-400">{templatePurchases.length} purchases in period</p>
      </div>
    </div>
  )

  const renderPayments = () => {
    const filtered = payments.filter(
      (p) =>
        !searchTerm ||
        getCompanyName(p.company_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.pf_payment_id || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input px-4 py-2 rounded-lg text-sm flex-1"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-white/10">
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Client</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3 pr-4">Method</th>
                <th className="pb-3 pr-4">Reference</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 pr-4 text-gray-300">{formatDate(p.created_at)}</td>
                  <td className="py-3 pr-4 text-white">{getCompanyName(p.company_id)}</td>
                  <td className="py-3 pr-4 text-cyan-400 font-medium">{formatCurrency(p.amount)}</td>
                  <td className="py-3 pr-4 text-gray-400">{p.payment_method || 'PayFast'}</td>
                  <td className="py-3 pr-4 text-gray-500 text-xs font-mono">{p.pf_payment_id || '—'}</td>
                  <td className="py-3"><StatusBadge status={p.status} /></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-gray-500">No payments found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderInvoices = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPICard label="Total Invoices" value={invoices.length} color="cyan" />
        <KPICard label="Paid" value={invoices.filter((i) => i.status === 'paid').length} color="green" />
        <KPICard label="Outstanding" value={invoices.filter((i) => i.status !== 'paid').length} color="yellow" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-white/10">
              <th className="pb-3 pr-4">Invoice #</th>
              <th className="pb-3 pr-4">Client</th>
              <th className="pb-3 pr-4">Date</th>
              <th className="pb-3 pr-4">Total</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-3 pr-4 text-white font-mono text-xs">{inv.invoice_number || inv.id.slice(0, 8)}</td>
                <td className="py-3 pr-4 text-gray-300">{getCompanyName(inv.company_id)}</td>
                <td className="py-3 pr-4 text-gray-400">{formatDate(inv.invoice_date)}</td>
                <td className="py-3 pr-4 text-cyan-400 font-medium">{formatCurrency(inv.total)}</td>
                <td className="py-3 pr-4"><StatusBadge status={inv.status} /></td>
                <td className="py-3">
                  <button
                    onClick={() => handleDownloadInvoice(inv)}
                    className="text-cyan-400 hover:text-cyan-300 text-xs underline"
                  >
                    PDF
                  </button>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-gray-500">No invoices found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderCommissions = () => {
    const grouped = {}
    commissions.forEach((c) => {
      const key = c.reseller_id || 'unknown'
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(c)
    })

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard label="Total Commissions" value={formatCurrency(commissions.reduce((s, c) => s + (c.amount || 0), 0))} color="cyan" />
          <KPICard label="Pending" value={formatCurrency(commissions.filter((c) => c.status === 'pending').reduce((s, c) => s + (c.amount || 0), 0))} color="yellow" />
          <KPICard label="Approved" value={formatCurrency(commissions.filter((c) => c.status === 'approved').reduce((s, c) => s + (c.amount || 0), 0))} color="purple" />
          <KPICard label="Paid Out" value={formatCurrency(commissions.filter((c) => c.status === 'paid').reduce((s, c) => s + (c.amount || 0), 0))} color="green" />
        </div>

        <div className="flex gap-2">
          <button onClick={handleBulkApprove} className="btn-primary text-xs px-4 py-2 rounded-lg">
            Bulk Approve Pending
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-white/10">
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Reseller</th>
                <th className="pb-3 pr-4">Description</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((c) => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 pr-4 text-gray-400">{formatDate(c.created_at)}</td>
                  <td className="py-3 pr-4 text-white">{getCompanyName(c.reseller_id)}</td>
                  <td className="py-3 pr-4 text-gray-300 text-xs">{c.description || 'Subscription commission'}</td>
                  <td className="py-3 pr-4 text-cyan-400 font-medium">{formatCurrency(c.amount)}</td>
                  <td className="py-3 pr-4"><StatusBadge status={c.status} /></td>
                  <td className="py-3 space-x-2">
                    {c.status === 'pending' && (
                      <button onClick={() => handleApproveCommission(c.id)} className="text-cyan-400 hover:text-cyan-300 text-xs underline">
                        Approve
                      </button>
                    )}
                    {c.status === 'approved' && (
                      <button onClick={() => handlePayCommission(c.id)} className="text-green-400 hover:text-green-300 text-xs underline">
                        Mark Paid
                      </button>
                    )}
                    {c.payment_reference && (
                      <span className="text-gray-500 text-xs">Ref: {c.payment_reference}</span>
                    )}
                  </td>
                </tr>
              ))}
              {commissions.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-gray-500">No commissions found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Reseller statements */}
        {Object.keys(grouped).length > 0 && (
          <div className="glass-card p-4 rounded-xl">
            <h3 className="text-white font-semibold mb-3">Download Statements</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(grouped).map(([resellerId, items]) => (
                <button
                  key={resellerId}
                  onClick={() => handleDownloadStatement(resellerId)}
                  className="text-xs px-3 py-1.5 rounded-lg glass-border text-cyan-400 hover:bg-white/5"
                >
                  {getCompanyName(resellerId)} ({items.length})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderAffiliates = () => {
    const converted = referrals.filter((r) => r.status === 'converted')
    const totalCredits = referrals.reduce((s, r) => s + (r.credit_amount || 0), 0)
    const conversionRate = referrals.length > 0 ? ((converted.length / referrals.length) * 100).toFixed(1) : '0'

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard label="Total Referrals" value={referrals.length} color="cyan" />
          <KPICard label="Converted" value={converted.length} color="green" />
          <KPICard label="Conversion Rate" value={`${conversionRate}%`} color="purple" />
          <KPICard label="Credits Applied" value={formatCurrency(totalCredits)} color="yellow" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-white/10">
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Referral Code</th>
                <th className="pb-3 pr-4">Referred Email</th>
                <th className="pb-3 pr-4">Credit</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 pr-4 text-gray-400">{formatDate(r.created_at)}</td>
                  <td className="py-3 pr-4 text-white font-mono text-xs">{r.referral_code}</td>
                  <td className="py-3 pr-4 text-gray-300">{r.referred_email || '—'}</td>
                  <td className="py-3 pr-4 text-cyan-400">{r.credit_amount ? formatCurrency(r.credit_amount) : '—'}</td>
                  <td className="py-3"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
              {referrals.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-gray-500">No referrals found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderTemplateSales = () => {
    // Group by template
    const byTemplate = {}
    templatePurchases.forEach((t) => {
      const key = t.template_name || t.template_id
      if (!byTemplate[key]) byTemplate[key] = { name: t.template_name, count: 0, revenue: 0 }
      byTemplate[key].count++
      byTemplate[key].revenue += t.amount || 0
    })
    const sorted = Object.values(byTemplate).sort((a, b) => b.revenue - a.revenue)

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <KPICard label="Total Sales" value={templatePurchases.length} color="cyan" />
          <KPICard label="Revenue" value={formatCurrency(totalTemplateRevenue)} color="green" />
          <KPICard label="Unique Templates" value={Object.keys(byTemplate).length} color="purple" />
        </div>

        {sorted.length > 0 && (
          <div className="glass-card p-6 rounded-xl">
            <h3 className="text-white font-semibold mb-4">Top Sellers</h3>
            <div className="space-y-3">
              {sorted.slice(0, 10).map((t, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div>
                    <span className="text-white text-sm">{t.name || 'Unknown'}</span>
                    <span className="text-gray-500 text-xs ml-2">({t.count} sold)</span>
                  </div>
                  <span className="text-cyan-400 font-medium text-sm">{formatCurrency(t.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-white/10">
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Client</th>
                <th className="pb-3 pr-4">Template</th>
                <th className="pb-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {templatePurchases.map((t) => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 pr-4 text-gray-400">{formatDate(t.created_at)}</td>
                  <td className="py-3 pr-4 text-white">{getCompanyName(t.company_id)}</td>
                  <td className="py-3 pr-4 text-gray-300">{t.template_name || t.template_id}</td>
                  <td className="py-3 text-cyan-400 font-medium">{formatCurrency(t.amount)}</td>
                </tr>
              ))}
              {templatePurchases.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-gray-500">No template sales in this period</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderCampaigns = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPICard label="Active Campaigns" value={campaigns.filter((c) => c.is_active).length} color="green" />
        <KPICard
          label="Emails Sent"
          value={Object.values(queueStats).reduce((s, q) => s + q.sent, 0)}
          color="cyan"
        />
        <KPICard
          label="Pending Queue"
          value={Object.values(queueStats).reduce((s, q) => s + q.pending, 0)}
          color="yellow"
        />
      </div>

      {campaigns.map((campaign) => {
        const stats = queueStats[campaign.id] || { pending: 0, sent: 0, failed: 0 }
        const emailCount = Array.isArray(campaign.emails) ? campaign.emails.length : 0
        const totalProcessed = stats.sent + stats.failed
        return (
          <div key={campaign.id} className="glass-card p-5 rounded-xl">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-white font-semibold">{campaign.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {campaign.trigger_type} &middot; {emailCount} emails in sequence
                </p>
              </div>
              <StatusBadge status={campaign.is_active ? 'active' : 'inactive'} />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-3">
              <div className="text-center">
                <p className="text-lg font-bold text-green-400">{stats.sent}</p>
                <p className="text-xs text-gray-500">Sent</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-yellow-400">{stats.pending}</p>
                <p className="text-xs text-gray-500">Queued</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-red-400">{stats.failed}</p>
                <p className="text-xs text-gray-500">Failed</p>
              </div>
            </div>
            {totalProcessed > 0 && (
              <div className="mt-3 h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-cyan-500 rounded-full"
                  style={{ width: `${(stats.sent / (totalProcessed)) * 100}%` }}
                />
              </div>
            )}
          </div>
        )
      })}

      {campaigns.length === 0 && (
        <div className="glass-card p-8 rounded-xl text-center">
          <p className="text-gray-400">No drip campaigns found. Run the migration and seed SQL first.</p>
        </div>
      )}
    </div>
  )

  // ─── Campaign Toggle ─────────────────────────────────────────────────

  const toggleCampaign = async (campaignId, currentlyActive) => {
    const { error } = await supabase.from('drip_campaigns').update({ is_active: !currentlyActive }).eq('id', campaignId)
    if (error) {
      toast.error('Failed to update campaign')
    } else {
      toast.success(currentlyActive ? 'Campaign paused' : 'Campaign activated')
      setCampaigns((prev) => prev.map((c) => (c.id === campaignId ? { ...c, is_active: !currentlyActive } : c)))
    }
  }

  // ─── Consultation Status Update ─────────────────────────────────────

  const updateConsultationStatus = async (id, status) => {
    const { error } = await supabase.from('consultation_requests').update({ status }).eq('id', id)
    if (error) {
      toast.error('Failed to update consultation')
    } else {
      toast.success(`Marked as ${status}`)
      setConsultations((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
    }
  }

  // ─── Marketing Tab ──────────────────────────────────────────────────

  const renderMarketing = () => {
    const totalLeads = assessments.length + consultations.length
    const recentAssessments = assessments.filter((a) => new Date(a.created_at) > new Date(Date.now() - 7 * 86400000))
    const recentConsultations = consultations.filter((c) => new Date(c.created_at) > new Date(Date.now() - 7 * 86400000))
    const avgScore = assessments.length > 0 ? Math.round(assessments.reduce((s, a) => s + (a.score || 0), 0) / assessments.length) : 0

    return (
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard label="Total Leads" value={totalLeads} sub={`${recentAssessments.length + recentConsultations.length} this week`} color="cyan" />
          <KPICard label="Assessments" value={assessments.length} sub={`${recentAssessments.length} this week`} color="purple" />
          <KPICard label="Consultations" value={consultations.length} sub={`${consultations.filter((c) => c.status === 'pending').length} pending`} color="yellow" />
          <KPICard label="Avg. Score" value={`${avgScore}%`} sub="Assessment average" color="green" />
        </div>

        {/* Lead Pipeline */}
        <div className="glass-card p-5 rounded-xl">
          <h3 className="text-white font-semibold mb-4">Lead Pipeline</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'New Leads', count: assessments.filter((a) => new Date(a.created_at) > new Date(Date.now() - 3 * 86400000)).length + consultations.filter((c) => c.status === 'pending').length, color: 'bg-cyan-500' },
              { label: 'Contacted', count: consultations.filter((c) => c.status === 'contacted').length, color: 'bg-purple-500' },
              { label: 'Consultation Done', count: consultations.filter((c) => c.status === 'completed').length, color: 'bg-green-500' },
              { label: 'Converted', count: consultations.filter((c) => c.status === 'converted').length, color: 'bg-yellow-500' },
            ].map((stage) => (
              <div key={stage.label} className="text-center p-3 rounded-lg bg-white/5">
                <div className={`w-3 h-3 rounded-full ${stage.color} mx-auto mb-2`} />
                <p className="text-2xl font-bold text-white">{stage.count}</p>
                <p className="text-xs text-gray-400">{stage.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Drip Campaign Controls */}
        <div className="glass-card p-5 rounded-xl">
          <h3 className="text-white font-semibold mb-4">Email Campaigns</h3>
          <div className="space-y-3">
            {campaigns.map((campaign) => {
              const stats = queueStats[campaign.id] || { pending: 0, sent: 0, failed: 0 }
              const emailSteps = Array.isArray(campaign.emails) ? campaign.emails : []
              const isExpanded = expandedCampaign === campaign.id

              return (
                <div key={campaign.id} className="border border-white/10 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-4 hover:bg-white/5 cursor-pointer" onClick={() => setExpandedCampaign(isExpanded ? null : campaign.id)}>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleCampaign(campaign.id, campaign.is_active) }}
                        className={`w-10 h-5 rounded-full relative transition-colors ${campaign.is_active ? 'bg-green-500' : 'bg-gray-600'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${campaign.is_active ? 'left-5' : 'left-0.5'}`} />
                      </button>
                      <div>
                        <p className="text-white text-sm font-medium">{campaign.name}</p>
                        <p className="text-xs text-gray-500">{emailSteps.length} emails &middot; {stats.sent} sent &middot; {stats.pending} queued</p>
                      </div>
                    </div>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-white/10 p-4 bg-white/[0.02]">
                      <p className="text-xs text-gray-400 mb-3">Trigger: <span className="text-gray-300">{campaign.trigger_type}</span></p>
                      <div className="space-y-2">
                        {emailSteps.map((step, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                              {step.step || i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium truncate">{step.subject}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {step.delay_days === 0 ? 'Sent immediately' : `Day ${step.delay_days}`}
                              </p>
                              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{(step.body || '').slice(0, 150)}...</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {campaigns.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">No campaigns found. Run the migration and seed SQL.</p>
            )}
          </div>
        </div>

        {/* Recent Assessment Leads */}
        <div className="glass-card p-5 rounded-xl">
          <h3 className="text-white font-semibold mb-4">Assessment Leads</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-white/10">
                  <th className="pb-3 pr-3">Date</th>
                  <th className="pb-3 pr-3">Company</th>
                  <th className="pb-3 pr-3">Email</th>
                  <th className="pb-3 pr-3">Phone</th>
                  <th className="pb-3 pr-3">Standard</th>
                  <th className="pb-3">Score</th>
                </tr>
              </thead>
              <tbody>
                {assessments.slice(0, 25).map((a) => (
                  <tr key={a.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-2.5 pr-3 text-gray-400 text-xs">{formatDate(a.created_at)}</td>
                    <td className="py-2.5 pr-3 text-white">{a.company_name}</td>
                    <td className="py-2.5 pr-3">
                      <a href={`mailto:${a.email}`} className="text-cyan-400 hover:text-cyan-300 text-xs">{a.email}</a>
                    </td>
                    <td className="py-2.5 pr-3">
                      {a.phone ? <a href={`tel:${a.phone}`} className="text-cyan-400 hover:text-cyan-300 text-xs">{a.phone}</a> : <span className="text-gray-600 text-xs">—</span>}
                    </td>
                    <td className="py-2.5 pr-3 text-gray-300 text-xs">{a.standard}</td>
                    <td className="py-2.5">
                      <span className={`font-bold text-xs ${a.score >= 70 ? 'text-green-400' : a.score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {a.score}%
                      </span>
                    </td>
                  </tr>
                ))}
                {assessments.length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center text-gray-500">No assessment leads yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Consultation Requests */}
        <div className="glass-card p-5 rounded-xl">
          <h3 className="text-white font-semibold mb-4">Consultation Requests</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-white/10">
                  <th className="pb-3 pr-3">Date</th>
                  <th className="pb-3 pr-3">Name</th>
                  <th className="pb-3 pr-3">Company</th>
                  <th className="pb-3 pr-3">Email</th>
                  <th className="pb-3 pr-3">Standard</th>
                  <th className="pb-3 pr-3">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {consultations.slice(0, 25).map((c) => (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-2.5 pr-3 text-gray-400 text-xs">{formatDate(c.created_at)}</td>
                    <td className="py-2.5 pr-3 text-white">{c.name}</td>
                    <td className="py-2.5 pr-3 text-gray-300">{c.company}</td>
                    <td className="py-2.5 pr-3">
                      <a href={`mailto:${c.email}`} className="text-cyan-400 hover:text-cyan-300 text-xs">{c.email}</a>
                    </td>
                    <td className="py-2.5 pr-3 text-gray-300 text-xs">{c.standard}</td>
                    <td className="py-2.5 pr-3"><StatusBadge status={c.status} /></td>
                    <td className="py-2.5">
                      <select
                        value={c.status || 'pending'}
                        onChange={(e) => updateConsultationStatus(c.id, e.target.value)}
                        className="glass-input text-xs px-2 py-1 rounded"
                      >
                        <option value="pending">Pending</option>
                        <option value="contacted">Contacted</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="converted">Converted</option>
                        <option value="lost">Lost</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {consultations.length === 0 && (
                  <tr><td colSpan={7} className="py-6 text-center text-gray-500">No consultation requests yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Score Distribution */}
        {assessments.length > 0 && (
          <div className="glass-card p-5 rounded-xl">
            <h3 className="text-white font-semibold mb-4">Assessment Score Distribution</h3>
            <div className="space-y-3">
              {[
                { label: 'High (70-100%)', range: [70, 100], color: 'from-green-500 to-emerald-500' },
                { label: 'Medium (40-69%)', range: [40, 69], color: 'from-yellow-500 to-orange-500' },
                { label: 'Low (0-39%)', range: [0, 39], color: 'from-red-500 to-pink-500' },
              ].map((bucket) => {
                const count = assessments.filter((a) => a.score >= bucket.range[0] && a.score <= bucket.range[1]).length
                const pct = assessments.length > 0 ? (count / assessments.length) * 100 : 0
                return (
                  <div key={bucket.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{bucket.label}</span>
                      <span className="text-white font-medium">{count} leads ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full bg-gradient-to-r ${bucket.color} transition-all duration-700`} style={{ width: `${Math.max(pct, 1)}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="glass-card p-5 rounded-xl">
          <h3 className="text-white font-semibold mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <a href="https://resend.com/emails" target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-lg glass-border text-cyan-400 hover:bg-white/5">
              Resend Dashboard
            </a>
            <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-lg glass-border text-cyan-400 hover:bg-white/5">
              Cloudflare Analytics
            </a>
            <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-lg glass-border text-cyan-400 hover:bg-white/5">
              Vercel Dashboard
            </a>
            <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-lg glass-border text-cyan-400 hover:bg-white/5">
              Supabase Dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }

  const tabRenderers = {
    revenue: renderRevenue,
    payments: renderPayments,
    invoices: renderInvoices,
    commissions: renderCommissions,
    affiliates: renderAffiliates,
    templates: renderTemplateSales,
    campaigns: renderCampaigns,
    marketing: renderMarketing,
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Financial Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">Revenue, payments, commissions & marketing campaigns</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="glass-input px-3 py-1.5 rounded-lg text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button onClick={fetchData} className="btn-primary text-xs px-3 py-1.5 rounded-lg">
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-1 mb-6 pb-1 scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          tabRenderers[activeTab]?.()
        )}
      </div>
    </Layout>
  )
}

export default FinancialDashboard
