import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'

const ComplianceBadge = () => {
  const { userProfile, getEffectiveCompanyId } = useAuth()
  const toast = useToast()
  const [scores, setScores] = useState([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (userProfile) fetchScores()
  }, [userProfile])

  const fetchScores = async () => {
    try {
      const companyId = getEffectiveCompanyId()
      if (!companyId) return
      const { data } = await supabase
        .from('compliance_requirements')
        .select('standard, compliance_status')
        .eq('company_id', companyId)

      if (!data || data.length === 0) return

      const grouped = {}
      data.forEach(row => {
        const std = row.standard || 'Unknown'
        if (!grouped[std]) grouped[std] = { total: 0, met: 0, partial: 0 }
        grouped[std].total++
        if (row.compliance_status === 'Met') grouped[std].met++
        else if (row.compliance_status === 'Partially Met') grouped[std].partial++
      })

      const result = Object.entries(grouped).map(([standard, { total, met, partial }]) => ({
        standard: standard.replace('_', ' '),
        score: total > 0 ? Math.round(((met + (partial * 0.5)) / total) * 100) : 0,
      })).filter(s => s.score >= 80)

      setScores(result)
    } catch { /* silent */ }
  }

  const companyName = userProfile?.company?.name || 'Company'
  const today = new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })

  const embedCode = `<!-- ISOGuardian Compliance Badge -->
<a href="https://isoguardian.co.za" target="_blank" rel="noopener noreferrer" style="display:inline-block;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="background:linear-gradient(135deg,#0f172a,#1e1b4b);border:1px solid rgba(139,92,246,0.3);border-radius:12px;padding:16px 20px;display:inline-flex;align-items:center;gap:12px;color:white;min-width:280px">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
    <div>
      <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-bottom:2px">Compliance managed by</div>
      <div style="font-weight:700;font-size:14px;background:linear-gradient(90deg,#06b6d4,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent">ISOGuardian</div>
      <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:2px">${scores.map(s => s.standard).join(' | ')} ${'\u2022'} Verified ${today}</div>
    </div>
  </div>
</a>`

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    toast.success('Badge code copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="glass glass-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Compliance Badge
          </h3>
          <p className="text-white/50 text-sm mt-1">Add this badge to your website to showcase your compliance status</p>
        </div>
      </div>

      {scores.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-white/40 text-sm mb-2">Badge unlocks when at least one standard reaches 80% compliance</p>
          <p className="text-white/30 text-xs">Complete your compliance scoring to earn your badge</p>
        </div>
      ) : (
        <>
          {/* Badge Preview */}
          <div className="mb-4 flex justify-center">
            <div className="bg-gradient-to-br from-slate-900 to-[#1e1b4b] border border-purple-500/30 rounded-xl p-4 inline-flex items-center gap-3 min-w-[280px]">
              <svg className="w-8 h-8 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <p className="text-white/50 text-[11px]">Compliance managed by</p>
                <p className="font-bold text-sm bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">ISOGuardian</p>
                <p className="text-white/40 text-[10px] mt-0.5">
                  {scores.map(s => s.standard).join(' | ')} {'\u2022'} Verified {today}
                </p>
              </div>
            </div>
          </div>

          {/* Embed Code */}
          <div className="relative">
            <pre className="bg-black/30 border border-white/10 rounded-xl p-4 text-xs text-white/50 overflow-x-auto max-h-32 font-mono">
              {embedCode}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg text-xs font-semibold hover:bg-cyan-500/30 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>

          <p className="text-white/30 text-xs mt-3 text-center">
            Paste this HTML into your website footer or about page
          </p>
        </>
      )}
    </div>
  )
}

export default ComplianceBadge
