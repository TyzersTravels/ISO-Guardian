import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const CLAUSE_NAMES = {
  4: 'Context of the Organization',
  5: 'Leadership',
  6: 'Planning',
  7: 'Support',
  8: 'Operation',
  9: 'Performance Evaluation',
  10: 'Improvement'
}

const Documents = () => {
  const { userProfile, canCreate } = useAuth()
  const toast = useToast()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [standardFilter, setStandardFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => { fetchDocuments() }, [])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error

      // Client-side filter by standards access
      const filtered = (data || []).filter(doc =>
        userProfile?.standards_access?.includes(doc.standard)
      )
      setDocuments(filtered)
    } catch (err) {
      console.error('Error fetching documents:', err)
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  // Apply filters
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStandard = standardFilter === 'all' || doc.standard === standardFilter
    const matchesType = typeFilter === 'all' || doc.type === typeFilter
    return matchesSearch && matchesStandard && matchesType
  })

  // Group by standard
  const groupedDocs = filteredDocs.reduce((acc, doc) => {
    const key = doc.standard || 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(doc)
    return acc
  }, {})

  const docTypes = [...new Set(documents.map(d => d.type).filter(Boolean))]

  return (
    <Layout>
      <div className="space-y-4 md:ml-16">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Document Management</h2>
            <p className="text-white/40 text-sm">{filteredDocs.length} of {documents.length} documents</p>
          </div>
          {canCreate() && (
            <button
              onClick={() => setShowUploadForm(true)}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 w-48"
          />
          <select
            value={standardFilter}
            onChange={e => setStandardFilter(e.target.value)}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          >
            <option value="all" className="bg-slate-800">All Standards</option>
            {userProfile?.standards_access?.map(std => (
              <option key={std} value={std} className="bg-slate-800">{std.replace('_', ' ')}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          >
            <option value="all" className="bg-slate-800">All Types</option>
            {docTypes.map(t => (
              <option key={t} value={t} className="bg-slate-800">{t}</option>
            ))}
          </select>
        </div>

        {/* Document List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse"></div>)}
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center">
            <p className="text-white/40 text-sm">No documents found</p>
          </div>
        ) : (
          Object.entries(groupedDocs).map(([standard, docs]) => (
            <div key={standard} className="space-y-2">
              <h3 className="text-xs font-semibold text-white/50 tracking-wider uppercase mt-4 mb-2">
                {standard.replace('_', ' ')} <span className="text-white/30">({docs.length})</span>
              </h3>
              {docs.map(doc => (
                <div key={doc.id} className="glass rounded-xl p-4 hover:bg-white/5 transition-colors group">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-white/90 truncate">{doc.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 flex-shrink-0">
                          {doc.status || 'Approved'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-white/40">
                        <span>{doc.type}</span>
                        <span>•</span>
                        <span>v{doc.version}</span>
                        <span>•</span>
                        <span>Clause {doc.clause}</span>
                        <span>•</span>
                        <span>{new Date(doc.updated_at).toLocaleDateString('en-ZA')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}

        {/* Upload Form Modal */}
        {showUploadForm && (
          <UploadDocumentForm
            userProfile={userProfile}
            onClose={() => setShowUploadForm(false)}
            onUploaded={() => { fetchDocuments(); setShowUploadForm(false) }}
          />
        )}
      </div>
    </Layout>
  )
}

const UploadDocumentForm = ({ userProfile, onClose, onUploaded }) => {
  const toast = useToast()
  const [formData, setFormData] = useState({
    name: '',
    standard: userProfile.standards_access?.[0] || 'ISO_9001',
    clause: 5,
    type: 'Policy',
    owner: userProfile.full_name || ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('documents')
        .insert([{
          company_id: userProfile.company_id,
          name: formData.name,
          standard: formData.standard,
          clause: formData.clause,
          clause_name: `Clause ${formData.clause}: ${CLAUSE_NAMES[formData.clause]}`,
          type: formData.type,
          version: '1.0',
          owner: formData.owner,
          status: 'Draft',
          created_by: userProfile.id
        }])

      if (error) throw error
      toast.success('Document uploaded successfully')
      onUploaded()
    } catch (err) {
      toast.error('Upload failed: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="glass rounded-2xl p-6 max-w-md w-full animate-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-white">Upload Document</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-white/40">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] text-white/50 uppercase tracking-wider block mb-1.5">Document Name <span className="text-cyan-400">*</span></label>
            <input type="text" required value={formData.name} onChange={e => update('name', e.target.value)}
              className="form-input" placeholder="e.g., Quality Policy" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-white/50 uppercase tracking-wider block mb-1.5">Standard</label>
              <select value={formData.standard} onChange={e => update('standard', e.target.value)} className="form-input">
                {userProfile.standards_access?.map(std => (
                  <option key={std} value={std} className="bg-slate-800">{std.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-white/50 uppercase tracking-wider block mb-1.5">Clause</label>
              <select value={formData.clause} onChange={e => update('clause', parseInt(e.target.value))} className="form-input">
                {Object.entries(CLAUSE_NAMES).map(([n, name]) => (
                  <option key={n} value={n} className="bg-slate-800">Clause {n}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-white/50 uppercase tracking-wider block mb-1.5">Document Type</label>
            <select value={formData.type} onChange={e => update('type', e.target.value)} className="form-input">
              {['Policy', 'Procedure', 'Form', 'Manual', 'Record', 'Work Instruction'].map(t => (
                <option key={t} value={t} className="bg-slate-800">{t}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting}
              className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl text-sm disabled:opacity-50">
              {submitting ? 'Uploading...' : 'Upload Document'}
            </button>
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 bg-white/5 text-white/50 rounded-xl hover:bg-white/10 text-sm">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Documents
