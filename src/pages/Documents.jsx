import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const Documents = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStandard, setFilterStandard] = useState('ALL');
  const [viewMode, setViewMode] = useState('active'); // 'active' or 'archived'
  
  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    file: null,
    name: '',
    type: 'Policy',
    standard: 'ISO_9001',
    clause: 5,
    description: '',
  });

  useEffect(() => {
    fetchDocuments();
  }, [viewMode]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('documents')
        .select('*')
        .order('date_created', { ascending: false });

      if (viewMode === 'active') {
        // Show only active documents (not deleted, not archived)
        query = query
          .or('deleted.is.null,deleted.eq.false')
          .or('archived.is.null,archived.eq.false');
      } else if (viewMode === 'archived') {
        // Show archived OR deleted documents
        query = query.or('deleted.eq.true,archived.eq.true');
      }

      const { data, error } = await query;
      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      alert('Failed to load documents: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveDocument = async (documentId) => {
    if (!window.confirm('Archive this document? (ISO 9001: Documents are retained, not permanently deleted)')) {
      return;
    }

    const reason = window.prompt('Reason for archiving (required for ISO compliance):');
    if (!reason || reason.trim() === '') {
      alert('Archiving reason is required for ISO 9001 compliance');
      return;
    }

    try {
      const { error } = await supabase
        .from('documents')
        .update({
          archived: true,
          archived_at: new Date().toISOString(),
          archived_by: user?.id,
          archive_reason: reason.trim(),
        })
        .eq('id', documentId);

      if (error) throw error;

      alert('✅ Document archived successfully! (Retained for ISO compliance & audit trail)');
      fetchDocuments();
    } catch (err) {
      console.error('Error archiving document:', err);
      alert('Failed to archive document: ' + (err.message || 'Unknown error'));
    }
  };

  const handleRestoreDocument = async (documentId) => {
    if (!window.confirm('Restore this document to active status?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('documents')
        .update({
          archived: false,
          archived_at: null,
          archived_by: null,
          archive_reason: null,
          deleted: false,
          deleted_at: null,
          deleted_by: null,
          deletion_reason: null,
        })
        .eq('id', documentId);

      if (error) throw error;

      alert('✅ Document restored successfully!');
      fetchDocuments();
    } catch (err) {
      console.error('Error restoring document:', err);
      alert('Failed to restore document: ' + err.message);
    }
  };

  const handleUploadWithMetadata = async () => {
    if (!uploadFormData.file) {
      alert('Please select a file');
      return;
    }

    try {
      setUploading(true);
      
      const file = uploadFormData.file;
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = fileName;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Build clause name
      const clauseNames = {
        4: 'Context of the Organization',
        5: 'Leadership',
        6: 'Planning',
        7: 'Support',
        8: 'Operation',
        9: 'Performance Evaluation',
        10: 'Improvement'
      };
      const clauseName = `Clause ${uploadFormData.clause}: ${clauseNames[uploadFormData.clause]}`;

      // Insert document record
      const { error: insertError } = await supabase
        .from('documents')
        .insert([{
          name: uploadFormData.name || file.name,
          file_url: publicUrl,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          
          // REQUIRED FIELDS
          company_id: user?.user_metadata?.company_id || 'default_company',
          clause_name: clauseName,
          type: uploadFormData.type,
          
          // ISO metadata
          standard: uploadFormData.standard,
          clause: uploadFormData.clause,
          description: uploadFormData.description,
          
          // User tracking
          uploaded_by: user?.email || 'unknown',
          created_by: user?.id,
          
          // Defaults
          status: 'Under Review',
          version: '1.0',
        }]);

      if (insertError) throw insertError;

      alert('✅ Document uploaded successfully!');
      setShowUploadModal(false);
      setUploadFormData({
        file: null,
        name: '',
        type: 'Policy',
        standard: 'ISO_9001',
        clause: 5,
        description: '',
      });
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStandard = filterStandard === 'ALL' || doc.standard === filterStandard;
    return matchesSearch && matchesStandard;
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Document Management</h1>
            <p className="text-sm text-white/60 mt-1">ISO 9001 Clause 7.5</p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg"
          >
            📤 Upload Document
          </button>
        </div>

        {/* Upload Modal - COMPACT VERSION */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border border-white/20 rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-900 to-purple-900 border-b border-white/10 p-4 flex items-center justify-between flex-shrink-0">
                <h2 className="text-xl font-bold text-white">Upload Document</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-white/60 hover:text-white transition-colors text-xl"
                >
                  ✕
                </button>
              </div>

              {/* Form - Scrollable */}
              <div className="overflow-y-auto flex-1 p-4 space-y-3">
                {/* File Input */}
                <div>
                  <label className="block text-xs text-white/70 mb-1">Select File *</label>
                  <input
                    type="file"
                    onChange={(e) => setUploadFormData({...uploadFormData, file: e.target.files[0]})}
                    className="w-full text-xs px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-cyan-500 file:text-white file:text-xs hover:file:bg-cyan-600"
                  />
                  {uploadFormData.file && (
                    <p className="text-xs text-cyan-400 mt-1 truncate">✓ {uploadFormData.file.name}</p>
                  )}
                </div>

                {/* Document Name */}
                <div>
                  <label className="block text-xs text-white/70 mb-1">Document Name</label>
                  <input
                    type="text"
                    value={uploadFormData.name}
                    onChange={(e) => setUploadFormData({...uploadFormData, name: e.target.value})}
                    placeholder="Leave blank to use filename"
                    className="w-full text-sm px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-xs text-white/70 mb-1">Type *</label>
                  <select
                    value={uploadFormData.type}
                    onChange={(e) => setUploadFormData({...uploadFormData, type: e.target.value})}
                    className="w-full text-sm px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="Policy" className="bg-slate-800">Policy</option>
                    <option value="Procedure" className="bg-slate-800">Procedure</option>
                    <option value="Form" className="bg-slate-800">Form</option>
                    <option value="Manual" className="bg-slate-800">Manual</option>
                    <option value="Record" className="bg-slate-800">Record</option>
                  </select>
                </div>

                {/* Standard */}
                <div>
                  <label className="block text-xs text-white/70 mb-1">ISO Standard</label>
                  <select
                    value={uploadFormData.standard}
                    onChange={(e) => setUploadFormData({...uploadFormData, standard: e.target.value})}
                    className="w-full text-sm px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="ISO_9001" className="bg-slate-800">ISO 9001:2015</option>
                    <option value="ISO_14001" className="bg-slate-800">ISO 14001:2015</option>
                    <option value="ISO_45001" className="bg-slate-800">ISO 45001:2018</option>
                  </select>
                </div>

                {/* Clause */}
                <div>
                  <label className="block text-xs text-white/70 mb-1">Clause</label>
                  <select
                    value={uploadFormData.clause}
                    onChange={(e) => setUploadFormData({...uploadFormData, clause: parseInt(e.target.value)})}
                    className="w-full text-sm px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="4" className="bg-slate-800">Clause 4: Context</option>
                    <option value="5" className="bg-slate-800">Clause 5: Leadership</option>
                    <option value="6" className="bg-slate-800">Clause 6: Planning</option>
                    <option value="7" className="bg-slate-800">Clause 7: Support</option>
                    <option value="8" className="bg-slate-800">Clause 8: Operation</option>
                    <option value="9" className="bg-slate-800">Clause 9: Performance</option>
                    <option value="10" className="bg-slate-800">Clause 10: Improvement</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs text-white/70 mb-1">Description (optional)</label>
                  <textarea
                    value={uploadFormData.description}
                    onChange={(e) => setUploadFormData({...uploadFormData, description: e.target.value})}
                    placeholder="Add optional description..."
                    rows="2"
                    className="w-full text-sm px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gradient-to-r from-slate-900 to-purple-900 border-t border-white/10 p-4 flex-shrink-0">
                <button
                  onClick={handleUploadWithMetadata}
                  disabled={uploading || !uploadFormData.file}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {uploading ? 'Uploading...' : '📤 Upload Document'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('active')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'active'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            📄 Active Documents
          </button>
          <button
            onClick={() => setViewMode('archived')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'archived'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            📦 Archived Documents
          </button>
        </div>

        {/* Search and Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="🔍 Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <select
            value={filterStandard}
            onChange={(e) => setFilterStandard(e.target.value)}
            className="px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="ALL" className="bg-slate-800">All Standards</option>
            <option value="ISO_9001" className="bg-slate-800">ISO 9001:2015</option>
            <option value="ISO_14001" className="bg-slate-800">ISO 14001:2015</option>
            <option value="ISO_45001" className="bg-slate-800">ISO 45001:2018</option>
          </select>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <div className="text-3xl font-bold text-white">{documents.length}</div>
            <div className="text-sm text-white/70">{viewMode === 'active' ? 'Active' : 'Archived'} Documents</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <div className="text-3xl font-bold text-green-400">
              {documents.filter(d => d.status === 'Approved').length}
            </div>
            <div className="text-sm text-white/70">Approved</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <div className="text-3xl font-bold text-orange-400">
              {documents.filter(d => d.status === 'Under Review').length}
            </div>
            <div className="text-sm text-white/70">In Review</div>
          </div>
        </div>

        {/* Documents List */}
        <div className="space-y-3">
          {filteredDocuments.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-12 text-center">
              <div className="text-6xl mb-4">{viewMode === 'active' ? '📄' : '📦'}</div>
              <p className="text-white/70">
                {searchTerm || filterStandard !== 'ALL' 
                  ? 'No documents match your search criteria' 
                  : viewMode === 'active' 
                    ? 'No active documents' 
                    : 'No archived documents'}
              </p>
            </div>
          ) : (
            filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 hover:bg-white/[0.15] transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl ${
                    viewMode === 'archived' ? 'bg-orange-500/20' : 'bg-blue-500/20'
                  }`}>
                    {viewMode === 'archived' ? '📦' : '📄'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">{doc.name || 'Untitled Document'}</span>
                      {doc.status === 'Approved' && (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300">
                          ✓ Approved
                        </span>
                      )}
                      {doc.status === 'Under Review' && (
                        <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-300">
                          ⏳ In Review
                        </span>
                      )}
                      {viewMode === 'archived' && (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-300">
                          🗃️ Archived
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-white/60 mb-2">
                      {doc.standard && (
                        <>
                          <span>{doc.standard.replace('_', ' ')}</span>
                          <span>•</span>
                        </>
                      )}
                      {doc.clause_name && (
                        <>
                          <span>{doc.clause_name}</span>
                          <span>•</span>
                        </>
                      )}
                      {doc.type && (
                        <>
                          <span>{doc.type}</span>
                          <span>•</span>
                        </>
                      )}
                      {doc.version && <span>Rev {doc.version}</span>}
                    </div>
                    {doc.description && (
                      <div className="text-sm text-white/50 mb-2">{doc.description}</div>
                    )}
                    {viewMode === 'archived' && doc.archive_reason && (
                      <div className="text-xs text-orange-300/70 mb-2">
                        📝 Archive reason: {doc.archive_reason}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-white/40">
                      {doc.date_created && (
                        <span>📅 {new Date(doc.date_created).toLocaleDateString()}</span>
                      )}
                      {doc.file_size && (
                        <span>📊 {(doc.file_size / 1024).toFixed(1)} KB</span>
                      )}
                      {viewMode === 'archived' && doc.archived_at && (
                        <span>🗃️ Archived: {new Date(doc.archived_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.file_url && (
                      <button
                        onClick={() => window.open(doc.file_url, '_blank')}
                        className="px-3 py-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-colors text-sm font-medium"
                        title="Download document"
                      >
                        ⬇️
                      </button>
                    )}
                    {viewMode === 'active' ? (
                      <button
                        onClick={() => handleArchiveDocument(doc.id)}
                        className="px-3 py-2 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded-lg transition-colors text-sm font-medium"
                        title="Archive document (ISO compliant)"
                      >
                        📦
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRestoreDocument(doc.id)}
                        className="px-3 py-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors text-sm font-medium"
                        title="Restore document"
                      >
                        ↩️
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Documents;
