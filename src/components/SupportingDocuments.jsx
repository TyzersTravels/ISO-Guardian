import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/auditLogger'

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'png', 'jpg', 'jpeg']
const MAX_SIZE = 25 * 1024 * 1024

const FILE_ICONS = {
  pdf: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  doc: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  xls: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  img: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
}

const getFileIcon = (path) => {
  if (!path) return FILE_ICONS.doc
  const ext = path.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return FILE_ICONS.pdf
  if (['xls', 'xlsx', 'csv'].includes(ext)) return FILE_ICONS.xls
  if (['png', 'jpg', 'jpeg'].includes(ext)) return FILE_ICONS.img
  return FILE_ICONS.doc
}

const formatFileSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

/**
 * Reusable supporting documents section for register pages.
 *
 * Props:
 *   standard  — e.g. 'ISO 9001' or 'ISO 45001'
 *   clause    — e.g. '6.1.2' (matched against documents.clause)
 *   clauseNum — integer clause group, e.g. 6 (used for new uploads)
 *   clauseName — e.g. 'Clause 6: Planning' (for new uploads)
 *   entityType — e.g. 'hazard_register' (for logActivity)
 *   title     — optional override for section heading
 */
const SupportingDocuments = ({ standard, clause, clauseNum, clauseName, entityType, title }) => {
  const { userProfile, getEffectiveCompanyId } = useAuth()
  const toast = useToast()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [availableDocs, setAvailableDocs] = useState([])
  const [linkSearch, setLinkSearch] = useState('')

  useEffect(() => {
    if (userProfile) fetchLinkedDocs()
  }, [userProfile])

  const fetchLinkedDocs = async () => {
    try {
      setLoading(true)
      const companyId = getEffectiveCompanyId()
      if (!companyId) return

      // Fetch documents tagged with this clause
      const { data, error } = await supabase
        .from('documents')
        .select('id, name, standard, clause, clause_name, type, version, status, file_path, file_size, created_at, uploaded_by')
        .eq('company_id', companyId)
        .eq('clause', String(clauseNum || clause))
        .order('created_at', { ascending: false })

      if (error) throw error
      setDocs(data || [])
    } catch {
      toast.error('Failed to load supporting documents')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableDocs = async () => {
    try {
      const companyId = getEffectiveCompanyId()
      const { data, error } = await supabase
        .from('documents')
        .select('id, name, standard, clause, clause_name, type, version, status, file_path, created_at')
        .eq('company_id', companyId)
        .order('name')

      if (error) throw error

      // Exclude docs already linked to this clause
      const linkedIds = new Set(docs.map(d => d.id))
      setAvailableDocs((data || []).filter(d => !linkedIds.has(d.id)))
    } catch {
      toast.error('Failed to load documents')
    }
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(`File type .${ext} is not allowed. Accepted: ${ALLOWED_EXTENSIONS.join(', ')}`)
      return
    }
    if (file.size > MAX_SIZE) {
      toast.error('File size exceeds 25MB limit.')
      return
    }

    setUploading(true)
    try {
      const companyId = getEffectiveCompanyId()
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const filePath = `${companyId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)
      if (uploadError) throw uploadError

      const docName = file.name.replace(/\.[^.]+$/, '').replace(/_/g, ' ')

      const { error: dbError } = await supabase
        .from('documents')
        .insert([{
          company_id: companyId,
          name: docName,
          standard: standard || 'ISO 9001',
          clause: String(clauseNum || clause),
          clause_name: clauseName || null,
          type: 'Supporting Document',
          version: '1.0',
          status: 'Approved',
          date_updated: new Date().toISOString().split('T')[0],
          file_path: filePath,
          file_size: file.size,
          uploaded_by: userProfile.id,
          source_type: entityType || null,
        }])

      if (dbError) throw dbError

      await logActivity({
        companyId,
        userId: userProfile.id,
        action: 'uploaded',
        entityType: 'document',
        entityId: null,
        changes: { name: docName, standard, clause, source: entityType },
      })

      toast.success(`"${docName}" uploaded and linked to ${clause}`)
      fetchLinkedDocs()
    } catch {
      toast.error('Failed to upload document')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleLinkExisting = async (doc) => {
    try {
      const companyId = getEffectiveCompanyId()
      const { error } = await supabase
        .from('documents')
        .update({
          clause: String(clauseNum || clause),
          clause_name: clauseName || doc.clause_name,
          standard: standard || doc.standard,
        })
        .eq('id', doc.id)

      if (error) throw error

      await logActivity({
        companyId,
        userId: userProfile.id,
        action: 'linked',
        entityType: 'document',
        entityId: doc.id,
        changes: { name: doc.name, linked_to_clause: clause, source: entityType },
      })

      toast.success(`"${doc.name}" linked to clause ${clause}`)
      setShowLinkModal(false)
      fetchLinkedDocs()
    } catch {
      toast.error('Failed to link document')
    }
  }

  const handleDownload = async (doc) => {
    try {
      if (!doc.file_path) { toast.error('No file attached'); return }
      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.file_path)
      if (error) throw error

      const fileExt = doc.file_path.split('.').pop()
      const blob = new Blob([data], { type: data.type || 'application/octet-stream' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.name + (fileExt ? '.' + fileExt : '')
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      setTimeout(() => { window.URL.revokeObjectURL(url); document.body.removeChild(a) }, 100)
    } catch {
      toast.error('Failed to download document')
    }
  }

  const filteredAvailable = availableDocs.filter(d =>
    d.name.toLowerCase().includes(linkSearch.toLowerCase())
  )

  const docCount = docs.length

  return (
    <div className="glass glass-border rounded-2xl overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div>
            <h3 className="text-white font-semibold text-sm">{title || 'Supporting Documents'}</h3>
            <p className="text-white/40 text-xs">
              {docCount === 0 ? 'Upload your existing documents here' : `${docCount} document${docCount !== 1 ? 's' : ''} linked`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {docCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">{docCount}</span>
          )}
          {docCount === 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">No docs</span>
          )}
          <svg className={`w-4 h-4 text-white/30 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-white/10 p-4 space-y-3">
          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <label className={`px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg text-xs cursor-pointer transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <input type="file" className="hidden" onChange={handleUpload} accept={ALLOWED_EXTENSIONS.map(e => `.${e}`).join(',')} disabled={uploading} />
              {uploading ? 'Uploading...' : 'Upload Document'}
            </label>
            <button
              onClick={() => { fetchAvailableDocs(); setShowLinkModal(true) }}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg text-xs transition-all border border-white/10"
            >
              Link Existing Document
            </button>
          </div>

          {/* Linked documents list */}
          {loading ? (
            <p className="text-white/30 text-xs text-center py-4">Loading...</p>
          ) : docs.length === 0 ? (
            <div className="text-center py-6">
              <svg className="w-8 h-8 text-white/10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-white/30 text-xs">No documents linked yet.</p>
              <p className="text-white/20 text-[10px] mt-1">Upload your existing {entityType?.replace(/_/g, ' ') || 'documents'} to avoid recreating them.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {docs.map(doc => (
                <div key={doc.id} className="flex items-center gap-3 glass rounded-xl p-3 hover:bg-white/5 transition-colors group">
                  <svg className="w-5 h-5 text-purple-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={getFileIcon(doc.file_path)} />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-medium truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-white/30 mt-0.5">
                      {doc.standard && <span>{doc.standard}</span>}
                      {doc.version && <span>v{doc.version}</span>}
                      {doc.file_size && <span>{formatFileSize(doc.file_size)}</span>}
                      <span>{new Date(doc.created_at).toLocaleDateString('en-ZA')}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                    doc.status === 'Approved' ? 'bg-green-500/20 text-green-400' :
                    doc.status === 'Draft' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-white/10 text-white/40'
                  }`}>{doc.status}</span>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-cyan-400 transition-colors opacity-0 group-hover:opacity-100"
                    title="Download"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="text-white/15 text-[10px]">
            Accepted: PDF, Word, Excel, PowerPoint, CSV, TXT, PNG, JPG. Max 25MB.
          </p>
        </div>
      )}

      {/* Link Existing Document Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4" onClick={() => setShowLinkModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg max-h-[70vh] flex flex-col glass glass-border rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-white/10">
              <h3 className="text-white font-semibold text-sm">Link Existing Document</h3>
              <p className="text-white/40 text-xs mt-1">Select a document to link to clause {clause}</p>
              <input
                type="text"
                value={linkSearch}
                onChange={e => setLinkSearch(e.target.value)}
                placeholder="Search documents..."
                className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white mt-3"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {filteredAvailable.length === 0 ? (
                <p className="text-white/30 text-xs text-center py-8">No documents available to link.</p>
              ) : (
                filteredAvailable.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => handleLinkExisting(doc)}
                    className="w-full flex items-center gap-3 glass rounded-xl p-3 hover:bg-white/10 transition-colors text-left"
                  >
                    <svg className="w-5 h-5 text-purple-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={getFileIcon(doc.file_path)} />
                    </svg>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-white/30 mt-0.5">
                        {doc.standard && <span>{doc.standard}</span>}
                        {doc.clause && <span>Clause {doc.clause}</span>}
                        {doc.version && <span>v{doc.version}</span>}
                      </div>
                    </div>
                    <span className="text-[10px] text-cyan-400">Link</span>
                  </button>
                ))
              )}
            </div>
            <div className="p-3 border-t border-white/10">
              <button onClick={() => setShowLinkModal(false)} className="w-full px-3 py-2 text-white/40 hover:text-white/60 text-sm text-center">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SupportingDocuments
