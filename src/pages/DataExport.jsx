import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const DataExport = () => {
  const { userProfile } = useAuth()
  const [exporting, setExporting] = useState(false)

  const exportAllData = async () => {
    if (!confirm('Export all your company data? This will download a complete copy of your compliance data.')) {
      return
    }

    setExporting(true)

    try {
      // Fetch all company data
      const [docsResult, ncrsResult, auditsResult, reviewsResult, complianceResult] = await Promise.all([
        supabase.from('documents').select('*').eq('company_id', userProfile.company_id),
        supabase.from('ncrs').select('*').eq('company_id', userProfile.company_id),
        supabase.from('audits').select('*').eq('company_id', userProfile.company_id),
        supabase.from('management_reviews').select('*').eq('company_id', userProfile.company_id),
        supabase.from('compliance_requirements').select('*').eq('company_id', userProfile.company_id)
      ])

      const exportData = {
        company: userProfile.company,
        export_date: new Date().toISOString(),
        export_by: userProfile.full_name,
        data: {
          documents: docsResult.data || [],
          ncrs: ncrsResult.data || [],
          audits: auditsResult.data || [],
          management_reviews: reviewsResult.data || [],
          compliance_requirements: complianceResult.data || []
        },
        metadata: {
          total_documents: docsResult.data?.length || 0,
          total_ncrs: ncrsResult.data?.length || 0,
          total_audits: auditsResult.data?.length || 0,
          total_reviews: reviewsResult.data?.length || 0,
          popia_notice: 'This export contains all personal and company data as per POPIA rights'
        }
      }

      // Create JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${userProfile.company.name}_ComplianceData_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert('Data exported successfully!')
    } catch (err) {
      console.error('Export error:', err)
      alert('Failed to export data: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="glass glass-border rounded-2xl p-6">
          <h1 className="text-3xl font-bold text-white mb-4">Data Export</h1>
          <p className="text-cyan-200">
            Export your compliance data as required by POPIA regulations.
          </p>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Your POPIA Rights</h2>
          <div className="text-white/80 space-y-2 text-sm mb-6">
            <p>✅ Right to access your personal information</p>
            <p>✅ Right to data portability (machine-readable format)</p>
            <p>✅ Right to request correction of information</p>
            <p>✅ Right to request deletion of data</p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-white mb-2">What's Included in Export:</h3>
            <ul className="text-white/70 text-sm space-y-1">
              <li>• All documents and metadata</li>
              <li>• All NCRs (Non-Conformance Reports)</li>
              <li>• All audit records</li>
              <li>• All management review minutes</li>
              <li>• All compliance tracking data</li>
              <li>• Company information</li>
            </ul>
          </div>

          <button
            onClick={exportAllData}
            disabled={exporting}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {exporting ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export All My Data (JSON)
              </>
            )}
          </button>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Need Help?</h2>
          <div className="text-white/80 text-sm space-y-2">
            <p><strong>Question about your data?</strong></p>
            <p>Email: privacy@compliancehub.co.za</p>
            <p>Response time: Within 30 days as required by POPIA</p>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6 bg-red-500/10">
          <h2 className="text-xl font-bold text-white mb-4">Request Data Deletion</h2>
          <div className="text-white/80 text-sm mb-4">
            <p className="mb-2">To permanently delete your data:</p>
            <p>1. Export your data first (above button)</p>
            <p>2. Email privacy@compliancehub.co.za with subject "Data Deletion Request"</p>
            <p>3. We'll process within 30 days and confirm deletion</p>
          </div>
          <p className="text-red-300 text-xs">
            ⚠️ Deletion is permanent and cannot be undone. Ensure you have exported any data you need first.
          </p>
        </div>
      </div>

      <style>{`
        .glass {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
        }
        .glass-border {
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </Layout>
  )
}

export default DataExport
