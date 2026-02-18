import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/auditLogger'
import Layout from '../components/Layout'

const Documents = () => {
  const { userProfile } = useAuth()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [previewDoc, setPreviewDoc] = useState(null)
  const [showArchived, setShowArchived] = useState(false)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [standardFilter, setStandardFilter] = useState('all')
  const [clauseFilter, setClauseFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('documents')
        .select('*')

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      // Filter by user's standards access
      const filteredDocs = data.filter(doc => 
        (userProfile?.standards_access || []).includes(doc.standard)
      )

      setDocuments(filteredDocs)
      setError(null)
    } catch (err) {
      console.error('Error fetching documents:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteDocument = async (docId, permanent = false) => {
    const doc = documents.find(d => d.id === docId)
    const confirmMsg = permanent 
      ? '⚠️ PERMANENTLY DELETE this document and its file? This cannot be undone.'
      : 'Archive this document? It can be restored later.'
    
    if (!confirm(confirmMsg)) return

    try {
      if (permanent) {
        const reason = window.prompt('Deletion reason (required for audit trail):')
        if (!reason?.trim()) { alert('Deletion reason is required'); return; }
        
        // Log to audit trail
        await supabase.from('deletion_audit_trail').insert([{
          company_id: userProfile.company_id,
          table_name: 'documents',
          record_id: docId,
          deleted_by: userProfile.id,
          deleted_at: new Date().toISOString(),
          reason: reason.trim()
        }])
        
        // Delete file from storage
        if (doc?.file_path) {
          await supabase.storage.from('documents').remove([doc.file_path])
        }
        
        const { error } = await supabase.from('documents').delete().eq('id', docId)
        if (error) throw error
        await logActivity({ companyId: userProfile.company_id, userId: userProfile.id, action: 'permanently_deleted', entityType: 'document', entityId: docId, changes: { name: doc?.name } })
        alert('Document permanently deleted.')
      } else {
        const archiveReason = window.prompt('Reason for archiving (required):')
        if (!archiveReason?.trim()) { alert('Archive reason is required'); return; }
        const { error } = await supabase.from('documents').update({ archived: true }).eq('id', docId)
        if (error) throw error
        await logActivity({ companyId: userProfile.company_id, userId: userProfile.id, action: 'archived', entityType: 'document', entityId: docId, changes: { name: doc?.name, reason: archiveReason.trim() } })
        alert('Document archived successfully.')
      }

      fetchDocuments()
      setPreviewDoc(null)
    } catch (err) {
      console.error('Error deleting document:', err)
      alert('Failed to delete document: ' + err.message)
    }
  }

  const restoreDocument = async (docId) => {
    try {
      const { error } = await supabase.from('documents').update({ archived: false }).eq('id', docId)
      if (error) throw error
      await logActivity({ companyId: userProfile.company_id, userId: userProfile.id, action: 'restored', entityType: 'document', entityId: docId, changes: {} })
      alert('Document restored.')
      fetchDocuments()
    } catch (err) {
      console.error('Error restoring document:', err)
      alert('Failed to restore document: ' + err.message)
    }
  }

  const handleDownload = async (doc) => {
    try {
      if (doc.file_path) {
        const { data, error } = await supabase.storage
          .from('documents')
          .download(doc.file_path)

        if (error) throw error

        const fileExt = doc.file_path.split('.').pop()
        const fileName = doc.name + (fileExt ? '.' + fileExt : '')

        const blob = new Blob([data], { 
          type: data.type || 'application/octet-stream' 
        })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        a.style.display = 'none'
        
        document.body.appendChild(a)
        a.click()
        
        setTimeout(() => {
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }, 100)
      } else {
        alert('This document does not have an uploaded file')
      }
    } catch (err) {
      console.error('Error downloading document:', err)
      alert('Failed to download document: ' + err.message)
    }
  }

  const handleView = async (doc) => {
    try {
      if (doc.file_path) {
        const { data, error } = await supabase.storage
          .from('documents')
          .download(doc.file_path)

        if (error) throw error

        const fileExt = doc.file_path.split('.').pop().toLowerCase()
        
        if (fileExt === 'html' || fileExt === 'htm') {
          const text = await data.text()
          const blob = new Blob([text], { type: 'text/html' })
          const url = URL.createObjectURL(blob)
          setPreviewDoc({ ...doc, previewUrl: url, fileType: 'html' })
        } 
        else if (fileExt === 'pdf') {
          const url = URL.createObjectURL(data)
          setPreviewDoc({ ...doc, previewUrl: url, fileType: 'pdf' })
        }
        else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
          const url = URL.createObjectURL(data)
          setPreviewDoc({ ...doc, previewUrl: url, fileType: 'image' })
        }
        else if (['txt', 'csv', 'log', 'md'].includes(fileExt)) {
          const text = await data.text()
          setPreviewDoc({ ...doc, previewContent: text, fileType: 'text' })
        }
        else {
          await handleDownload(doc)
        }
      } else {
        alert('This document does not have an uploaded file')
      }
    } catch (err) {
      console.error('Error viewing document:', err)
      alert('Failed to view document: ' + err.message)
    }
  }

  const exportDocumentAsWord = async (doc) => {
    try {
      if (!doc.file_path) {
        alert('This document does not have an uploaded file')
        return
      }

      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.file_path)

      if (error) throw error

      const fileExt = doc.file_path.split('.').pop().toLowerCase()

      if (fileExt === 'html' || fileExt === 'htm') {
        const htmlContent = await data.text()
        
        const wordHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Calibri, Arial, sans-serif; margin: 2cm; }
    h1 { color: #0066cc; border-bottom: 3px solid #0066cc; padding-bottom: 10px; }
    h2 { color: #0066cc; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    td, th { padding: 8px; border: 1px solid #ddd; }
    .header { background: #f0f0f0; padding: 15px; margin-bottom: 20px; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #ddd; font-size: 10pt; color: #666; }
  </style>
</head>
<body>
${htmlContent}

<div class="footer" style="page-break-before: always;">
  <p><strong>Document Download Information:</strong></p>
  <p>Downloaded by: ${userProfile.email}</p>
  <p>Download date: ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}</p>
  <p>Company: ${userProfile.company?.name || 'N/A'}</p>
  <p style="margin-top: 10px; font-style: italic;">ISOGuardian - POPIA Compliant Export</p>
  <p style="font-size: 9pt; color: #999;">This document was downloaded from ISOGuardian. For audit trail purposes, the download information above has been appended.</p>
</div>
</body>
</html>
`
        const blob = new Blob([wordHtml], { type: 'application/msword' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${doc.name}.doc`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } 
      else {
        const url = window.URL.createObjectURL(data)
        const a = document.createElement('a')
        a.href = url
        a.download = doc.name + '.' + fileExt
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        setTimeout(() => {
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }, 100)
      }
    } catch (err) {
      console.error('Error exporting document:', err)
      alert('Failed to export document: ' + err.message)
    }
  }

  // Apply filters - now with archived support
  const filteredDocuments = documents.filter(doc => {
    // Archive filter
    if (showArchived) return doc.archived === true
    if (doc.archived) return false

    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStandard = standardFilter === 'all' || doc.standard === standardFilter
    const matchesClause = clauseFilter === 'all' || doc.clause === parseInt(clauseFilter)
    const matchesType = typeFilter === 'all' || doc.type === typeFilter

    return matchesSearch && matchesStandard && matchesClause && matchesType
  })

  // Group documents by standard and clause
  const groupedDocs = filteredDocuments.reduce((acc, doc) => {
    if (!acc[doc.standard]) acc[doc.standard] = {}
    if (!acc[doc.standard][doc.clause]) acc[doc.standard][doc.clause] = []
    acc[doc.standard][doc.clause].push(doc)
    return acc
  }, {})

  const archivedCount = documents.filter(d => d.archived).length

  const clearFilters = () => {
    setSearchTerm('')
    setStandardFilter('all')
    setClauseFilter('all')
    setTypeFilter('all')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          Loading documents...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="glass glass-border rounded-2xl p-6 max-w-md">
          <p className="text-red-300">Error: {error}</p>
          <button onClick={fetchDocuments} className="mt-4 px-4 py-2 bg-cyan-500 rounded-xl text-white">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Document Management</h2>
          <p className="text-cyan-200 text-sm">
            {showArchived 
              ? `${archivedCount} archived documents` 
              : `${filteredDocuments.length} of ${documents.filter(d => !d.archived).length} documents`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${
              showArchived 
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' 
                : 'glass glass-border text-white/70 hover:bg-white/10'
            }`}
          >
            {showArchived ? `📦 Archived (${archivedCount})` : `📦 Archive${archivedCount > 0 ? ` (${archivedCount})` : ''}`}
          </button>
          <button
            onClick={() => setShowUploadForm(true)}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl flex items-center gap-2 hover:scale-105 transition-transform shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Document
          </button>
          <button
            onClick={() => setShowBulkUpload(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl flex items-center gap-2 hover:scale-105 transition-transform shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Bulk Upload
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      {!showArchived && (
        <div className="glass glass-border rounded-2xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 glass glass-border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />

            <select
              value={standardFilter}
              onChange={(e) => setStandardFilter(e.target.value)}
              className="px-4 py-2 glass glass-border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-transparent"
            >
              <option value="all" className="bg-slate-800">All Standards</option>
              {(userProfile?.standards_access || []).map(std => (
                <option key={std} value={std} className="bg-slate-800">
                  {std.replace('_', ' ')}
                </option>
              ))}
            </select>

            <select
              value={clauseFilter}
              onChange={(e) => setClauseFilter(e.target.value)}
              className="px-4 py-2 glass glass-border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-transparent"
            >
              <option value="all" className="bg-slate-800">All Clauses</option>
              {[4, 5, 6, 7, 8, 9, 10].map(n => (
                <option key={n} value={n} className="bg-slate-800">Clause {n}</option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 glass glass-border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-transparent"
            >
              <option value="all" className="bg-slate-800">All Types</option>
              <option value="Policy" className="bg-slate-800">Policy</option>
              <option value="Procedure" className="bg-slate-800">Procedure</option>
              <option value="Form" className="bg-slate-800">Form</option>
              <option value="Manual" className="bg-slate-800">Manual</option>
              <option value="Record" className="bg-slate-800">Record</option>
            </select>

            <button
              onClick={clearFilters}
              className="px-4 py-2 glass glass-border rounded-xl text-white hover:bg-white/10 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Documents by Standard & Clause */}
      {Object.keys(groupedDocs).length === 0 ? (
        <div className="glass glass-border rounded-2xl p-8 text-center">
          <p className="text-white/60">
            {showArchived ? 'No archived documents.' : 'No documents found matching your filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedDocs).map(([standard, clauses]) => (
            <div key={standard} className="glass glass-border rounded-2xl p-4">
              <h3 className="text-xl font-bold text-white mb-4">
                {standard.replace('_', ' ')}
              </h3>
              
              {Object.entries(clauses).map(([clause, docs]) => (
                <div key={clause} className="mb-4 last:mb-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-semibold text-cyan-300">
                      Clause {clause}: {docs[0].clause_name?.split(':')[1] || ''}
                    </h4>
                    <span className="text-sm text-white/60">
                      {docs.length} document{docs.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {docs.map(doc => (
                      <div
                        key={doc.id}
                        className={`glass glass-border rounded-xl p-4 hover:bg-white/5 transition-colors ${doc.archived ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-white">{doc.name}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                doc.archived ? 'bg-gray-500/20 text-gray-300' : 'bg-green-500/20 text-green-300'
                              }`}>
                                {doc.archived ? 'Archived' : doc.status}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-3 text-sm text-white/60 mb-2">
                              <span>{doc.type}</span>
                              <span>•</span>
                              <span>Version {doc.version}</span>
                              <span>•</span>
                              <span>Updated {new Date(doc.updated_at).toLocaleDateString()}</span>
                            </div>
                            
                            {doc.next_review_date && (
                              <div className="text-xs text-white/50">
                                Next review: {new Date(doc.next_review_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2 flex-wrap">
                            {!doc.archived && (
                              <>
                                <button 
                                  onClick={() => handleView(doc)}
                                  className="px-3 py-2 glass glass-border text-white rounded-lg hover:bg-blue-500/20 transition-colors text-sm flex items-center gap-1"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  View
                                </button>
                                <button 
                                  onClick={() => exportDocumentAsWord(doc)}
                                  className="px-3 py-2 glass glass-border text-white rounded-lg hover:bg-cyan-500/20 transition-colors text-sm flex items-center gap-1"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                  Download
                                </button>
                                <button 
                                  onClick={() => deleteDocument(doc.id)}
                                  className="px-3 py-2 bg-orange-500/20 text-orange-300 rounded-lg hover:bg-orange-500/30 transition-colors text-sm"
                                >
                                  Archive
                                </button>
                              </>
                            )}
                            {doc.archived && (
                              <button 
                                onClick={() => restoreDocument(doc.id)}
                                className="px-3 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                              >
                                ↩ Restore
                              </button>
                            )}
                            {['superadmin', 'admin', 'lead_auditor'].includes(userProfile.role) && (
                              <button 
                                onClick={() => deleteDocument(doc.id, true)}
                                className="px-3 py-2 bg-red-600/20 text-red-300 rounded-lg hover:bg-red-600/30 transition-colors text-sm"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Role-based notice */}
      {userProfile.role === 'quality_manager' && (
        <div className="glass glass-border rounded-2xl p-4 bg-orange-500/10">
          <p className="text-orange-200 text-sm">
            ℹ️ As a Quality Manager, you only see ISO 9001 documents. Contact an Admin for access to other standards.
          </p>
        </div>
      )}

      {/* Upload Form Modal */}
      {showUploadForm && (
        <UploadDocumentForm
          userProfile={userProfile}
          onClose={() => setShowUploadForm(false)}
          onUploaded={() => {
            fetchDocuments()
            setShowUploadForm(false)
          }}
        />
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <BulkUploadForm
          userProfile={userProfile}
          onClose={() => setShowBulkUpload(false)}
          onUploaded={() => {
            fetchDocuments()
            setShowBulkUpload(false)
          }}
        />
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div className="glass glass-border rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-white/20">
              <div>
                <h3 className="text-xl font-bold text-white">{previewDoc.name}</h3>
                <p className="text-sm text-white/60">
                  {previewDoc.standard.replace('_', ' ')} | {previewDoc.clause_name} | Rev {previewDoc.version}
                </p>
              </div>
              <div className="flex gap-2">
                {previewDoc.archived ? (
                  <button
                    onClick={() => restoreDocument(previewDoc.id)}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm"
                  >
                    ↩ Restore
                  </button>
                ) : (
                  <button
                    onClick={() => deleteDocument(previewDoc.id)}
                    className="px-4 py-2 bg-orange-500/80 hover:bg-orange-600 text-white rounded-lg text-sm"
                  >
                    Archive
                  </button>
                )}
                {['superadmin', 'admin', 'lead_auditor'].includes(userProfile.role) && (
                  <button
                    onClick={() => deleteDocument(previewDoc.id, true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                  >
                    Delete Forever
                  </button>
                )}
                <button
                  onClick={() => {
                    if (previewDoc.previewUrl) window.URL.revokeObjectURL(previewDoc.previewUrl)
                    setPreviewDoc(null)
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-white">
              {previewDoc.fileType === 'html' && (
                <iframe
                  src={previewDoc.previewUrl}
                  className="w-full h-full"
                  title="Document Preview"
                  sandbox="allow-same-origin"
                />
              )}
              {previewDoc.fileType === 'pdf' && (
                <iframe
                  src={previewDoc.previewUrl}
                  className="w-full h-full"
                  title="Document Preview"
                />
              )}
              {previewDoc.fileType === 'image' && (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img 
                    src={previewDoc.previewUrl} 
                    alt={previewDoc.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
              {previewDoc.fileType === 'text' && (
                <div className="w-full h-full overflow-auto p-6">
                  <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap">
                    {previewDoc.previewContent}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>

      <style>{`
        .glass {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .glass-border {
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </Layout>
  )
}

const UploadDocumentForm = ({ userProfile, onClose, onUploaded }) => {
  const [formData, setFormData] = useState({
    name: '',
    standard: (userProfile?.standards_access || ['ISO_9001'])[0] || 'ISO_9001',
    clause: 5,
    type: 'Policy',
    version: '1.0'
  })
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      alert('Please select a file to upload')
      return
    }

    setUploading(true)

    try {
      const clauseNames = {
        4: 'Clause 4: Context of the Organization',
        5: 'Clause 5: Leadership',
        6: 'Clause 6: Planning',
        7: 'Clause 7: Support',
        8: 'Clause 8: Operation',
        9: 'Clause 9: Performance Evaluation',
        10: 'Clause 10: Improvement'
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const filePath = `${userProfile.company_id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { error: dbError } = await supabase
        .from('documents')
        .insert([{
          company_id: userProfile.company_id,
          name: formData.name,
          standard: formData.standard,
          clause: formData.clause,
          clause_name: clauseNames[formData.clause],
          type: formData.type,
          version: formData.version,
          status: 'Approved',
          date_updated: new Date().toISOString().split('T')[0],
          file_path: filePath,
          file_size: file.size,
          uploaded_by: userProfile.id
        }])

      if (dbError) throw dbError

      await logActivity({ companyId: userProfile.company_id, userId: userProfile.id, action: 'uploaded', entityType: 'document', entityId: null, changes: { name: formData.name, standard: formData.standard, clause: formData.clause } })
      alert('Document uploaded successfully!')
      onUploaded()
    } catch (err) {
      console.error('Error uploading document:', err)
      alert('Failed to upload document: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="glass glass-border rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-white mb-6">Upload Document</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-white/60 block mb-2">Document Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
              placeholder="e.g., Quality Management Policy"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-white/60 block mb-2">ISO Standard *</label>
              <select
                required
                value={formData.standard}
                onChange={(e) => setFormData({ ...formData, standard: e.target.value })}
                className="w-full px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
              >
                {(userProfile?.standards_access || []).map(std => (
                  <option key={std} value={std} className="bg-slate-800">
                    {std.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-white/60 block mb-2">Clause *</label>
              <select
                required
                value={formData.clause}
                onChange={(e) => setFormData({ ...formData, clause: parseInt(e.target.value) })}
                className="w-full px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
              >
                {[4, 5, 6, 7, 8, 9, 10].map(n => (
                  <option key={n} value={n} className="bg-slate-800">Clause {n}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-white/60 block mb-2">Document Type *</label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
              >
                <option value="Policy" className="bg-slate-800">Policy</option>
                <option value="Procedure" className="bg-slate-800">Procedure</option>
                <option value="Form" className="bg-slate-800">Form</option>
                <option value="Manual" className="bg-slate-800">Manual</option>
                <option value="Record" className="bg-slate-800">Record</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-white/60 block mb-2">Version *</label>
              <input
                type="text"
                required
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="w-full px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
                placeholder="e.g., 1.0"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-white/60 block mb-2">Upload File * (PDF, Word, Excel, Images)</label>
            <input
              type="file"
              required
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.csv,.txt"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full px-4 py-2 glass glass-border rounded-lg text-white bg-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-500 file:text-white file:cursor-pointer"
            />
            {file && (
              <div className="text-sm text-white/60 mt-2">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </div>
            )}
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <p className="text-blue-200 text-sm">
              🔒 <strong>POPIA Compliance:</strong> Files are encrypted and stored securely. Only your company can access them.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 glass glass-border text-white rounded-lg hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const BulkUploadForm = ({ userProfile, onClose, onUploaded }) => {
  const [files, setFiles] = useState([])
  const [standard, setStandard] = useState((userProfile?.standards_access || ['ISO_9001'])[0] || 'ISO_9001')
  const [clause, setClause] = useState(7)
  const [type, setType] = useState('Record')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, currentFile: '' })

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files)
    setFiles(prev => [...prev, ...selected])
  }

  const handleFolderSelect = (e) => {
    const selected = Array.from(e.target.files)
    setFiles(prev => [...prev, ...selected])
  }

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const handleBulkUpload = async () => {
    if (files.length === 0) { alert('Please select files to upload'); return; }
    setUploading(true)
    setProgress({ current: 0, total: files.length, currentFile: '' })

    const clauseNames = {
      4: 'Clause 4: Context of the Organization', 5: 'Clause 5: Leadership',
      6: 'Clause 6: Planning', 7: 'Clause 7: Support', 8: 'Clause 8: Operation',
      9: 'Clause 9: Performance Evaluation', 10: 'Clause 10: Improvement'
    }

    let successCount = 0
    let failCount = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setProgress({ current: i + 1, total: files.length, currentFile: file.name })

      try {
        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const filePath = `${userProfile.company_id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const docName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')

        const { error: dbError } = await supabase
          .from('documents')
          .insert([{
            company_id: userProfile.company_id,
            name: docName,
            standard: standard,
            clause: clause,
            clause_name: clauseNames[clause],
            type: type,
            version: '1.0',
            status: 'Approved',
            date_updated: new Date().toISOString().split('T')[0],
            file_path: filePath,
            file_size: file.size,
            uploaded_by: userProfile.id
          }])

        if (dbError) throw dbError

        await logActivity({ companyId: userProfile.company_id, userId: userProfile.id, action: 'uploaded', entityType: 'document', entityId: null, changes: { name: docName, bulk: true } })
        successCount++
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err)
        failCount++
      }
    }

    setUploading(false)
    alert(`Upload complete: ${successCount} successful, ${failCount} failed`)
    if (successCount > 0) onUploaded()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="glass glass-border rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Bulk Upload Documents</h3>
          <button onClick={onClose} className="text-white/50 hover:text-white text-2xl">&times;</button>
        </div>

        <div className="space-y-4">
          {/* Shared settings for all files */}
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
            <p className="text-xs text-purple-300 mb-2">These settings apply to all uploaded files. You can edit individual documents later.</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-white/60 block mb-1">Standard</label>
              <select value={standard} onChange={e => setStandard(e.target.value)}
                className="w-full px-3 py-2 glass glass-border rounded-lg text-white bg-transparent text-sm">
                {(userProfile?.standards_access || ['ISO_9001']).map(std => (
                  <option key={std} value={std} className="bg-slate-800">{std.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-white/60 block mb-1">Clause</label>
              <select value={clause} onChange={e => setClause(parseInt(e.target.value))}
                className="w-full px-3 py-2 glass glass-border rounded-lg text-white bg-transparent text-sm">
                {[4, 5, 6, 7, 8, 9, 10].map(n => (
                  <option key={n} value={n} className="bg-slate-800">Clause {n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-white/60 block mb-1">Type</label>
              <select value={type} onChange={e => setType(e.target.value)}
                className="w-full px-3 py-2 glass glass-border rounded-lg text-white bg-transparent text-sm">
                {['Policy', 'Procedure', 'Form', 'Manual', 'Record'].map(t => (
                  <option key={t} value={t} className="bg-slate-800">{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* File selection */}
          <div className="flex gap-3">
            <label className="flex-1 cursor-pointer">
              <div className="px-4 py-3 glass glass-border rounded-xl text-center hover:bg-white/10 transition-colors">
                <span className="text-cyan-300 text-sm font-semibold">Select Files</span>
                <p className="text-xs text-white/40 mt-1">PDF, Word, Excel, Images</p>
              </div>
              <input type="file" multiple className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.csv,.txt"
                onChange={handleFileSelect} />
            </label>
            <label className="flex-1 cursor-pointer">
              <div className="px-4 py-3 glass glass-border rounded-xl text-center hover:bg-white/10 transition-colors">
                <span className="text-purple-300 text-sm font-semibold">Select Folder</span>
                <p className="text-xs text-white/40 mt-1">Upload entire folder</p>
              </div>
              <input type="file" multiple className="hidden"
                webkitdirectory="true" directory="true"
                onChange={handleFolderSelect} />
            </label>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/70">{files.length} files selected ({formatSize(files.reduce((s, f) => s + f.size, 0))} total)</span>
                <button onClick={() => setFiles([])} className="text-xs text-red-300 hover:text-red-200">Clear all</button>
              </div>
              {files.map((file, i) => (
                <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{file.name}</p>
                    <p className="text-xs text-white/40">{formatSize(file.size)}</p>
                  </div>
                  <button onClick={() => removeFile(i)} className="text-red-400 hover:text-red-300 ml-2 text-sm">✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Uploading {progress.current}/{progress.total}</span>
                <span className="text-cyan-300 truncate ml-2">{progress.currentFile}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} disabled={uploading}
              className="flex-1 py-3 glass glass-border text-white rounded-lg hover:bg-white/10 disabled:opacity-50">Cancel</button>
            <button onClick={handleBulkUpload} disabled={uploading || files.length === 0}
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg disabled:opacity-50 hover:scale-105 transition-transform">
              {uploading ? `Uploading ${progress.current}/${progress.total}...` : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Documents
