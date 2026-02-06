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
  const [filterType, setFilterType] = useState('ALL');
  const [filterClause, setFilterClause] = useState('ALL');
  const [viewMode, setViewMode] = useState('active');
  const [isLeadAuditor, setIsLeadAuditor] = useState(false);
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
    checkUserRole();
    fetchDocuments();
  }, [viewMode]);

  const checkUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .in('role', ['lead_auditor', 'superadmin']);
      
      if (data && data.length > 0) {
        setIsLeadAuditor(true);
      }
    } catch (err) {
      console.error('Error checking role:', err);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('documents')
        .select('*')
        .eq('permanently_deleted', false)
        .order('date_created', { ascending: false });

      if (viewMode === 'active') {
        query = query.or('archived.is.null,archived.eq.false');
      } else if (viewMode === 'archived') {
        query = query.eq('archived', true);
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

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

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

      // Insert document metadata
      const { error: insertError } = await supabase
        .from('documents')
        .insert([{
          name: uploadFormData.name || file.name,
          file_url: publicUrl,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          company_id: user?.user_metadata?.company_id || 'isoguardian',
          clause_name: clauseName,
          type: uploadFormData.type,
          standard: uploadFormData.standard,
          clause: uploadFormData.clause,
          description: uploadFormData.description,
          uploaded_by: user?.email || 'unknown',
          created_by: user?.id,
          status: 'Pending Approval',
          approval_status: 'Pending',
          version: '1.0',
        }]);

      if (insertError) throw insertError;

      alert('Document uploaded successfully! Awaiting approval.');
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
      console.error('Error uploading:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleArchiveDocument = async (documentId) => {
    if (!window.confirm('Archive this document?')) return;

    const reason = window.prompt('Reason for archiving (required for ISO compliance):');
    if (!reason || reason.trim() === '') {
      alert('Archiving reason is required');
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
      alert('Document archived!');
      fetchDocuments();
    } catch (err) {
      console.error('Error archiving:', err);
      alert('Failed to archive: ' + err.message);
    }
  };

  const handleRestoreDocument = async (documentId) => {
    if (!window.confirm('Restore this document?')) return;

    try {
      const { error } = await supabase
        .from('documents')
        .update({
          archived: false,
          archived_at: null,
          archived_by: null,
          archive_reason: null,
        })
        .eq('id', documentId);

      if (error) throw error;
      alert('Document restored!');
      fetchDocuments();
    } catch (err) {
      console.error('Error restoring:', err);
      alert('Failed to restore: ' + err.message);
    }
  };

  const handlePermanentDelete = async (documentId) => {
    if (!isLeadAuditor) {
      alert('Only Lead Auditors can permanently delete documents');
      return;
    }

    if (!window.confirm('PERMANENT DELETE - Cannot be undone! Continue?')) return;

    const reason = window.prompt('Reason for permanent deletion (required):');
    if (!reason || reason.trim() === '') {
      alert('Deletion reason required');
      return;
    }

    try {
      const { error } = await supabase
        .from('documents')
        .update({
          permanently_deleted: true,
          permanently_deleted_at: new Date().toISOString(),
          permanently_deleted_by: user?.email,
          deletion_reason: reason.trim(),
        })
        .eq('id', documentId);

      if (error) throw error;
      alert('Document permanently deleted');
      fetchDocuments();
    } catch (err) {
      console.error('Error deleting:', err);
      alert('Failed to delete: ' + err.message);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStandard = filterStandard === 'ALL' || doc.standard === filterStandard;
    const matchesType = filterType === 'ALL' || doc.type === filterType;
    const matchesClause = filterClause === 'ALL' || doc.clause === parseInt(filterClause);
    return matchesSearch && matchesStandard && matchesType && matchesClause;
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Document Management</h1>
            <p className="text-sm text-white/60 mt-1">
              All ISO Documents, NCRs, Reviews & Audits
              {isLeadAuditor && <span className="ml-2 text-cyan-400">• Lead Auditor Access</span>}
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg"
          >
            Upload Document
          </button>
        </div>

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
            Active Documents
          </button>
          <button
            onClick={() => setViewMode('archived')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'archived'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            Archived
          </button>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search by name or description..."
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
            <option value="ISO_9001" className="bg-slate-800">ISO 9001</option>
            <option value="ISO_14001" className="bg-slate-800">ISO 14001</option>
            <option value="ISO_45001" className="bg-slate-800">ISO 45001</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="ALL" className="bg-slate-800">All Types</option>
            <option value="Policy" className="bg-slate-800">Policy</option>
            <option value="Procedure" className="bg-slate-800">Procedure</option>
            <option value="Form" className="bg-slate-800">Form</option>
            <option value="Manual" className="bg-slate-800">Manual</option>
            <option value="Record" className="bg-slate-800">Record</option>
            <option value="NCR" className="bg-slate-800">NCR</option>
            <option value="Audit" className="bg-slate-800">Audit</option>
            <option value="Review" className="bg-slate-800">Review</option>
          </select>

          <select
            value={filterClause}
            onChange={(e) => setFilterClause(e.target.value)}
            className="px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="ALL" className="bg-slate-800">All Clauses</option>
            <option value="4" className="bg-slate-800">Clause 4</option>
            <option value="5" className="bg-slate-800">Clause 5</option>
            <option value="6" className="bg-slate-800">Clause 6</option>
            <option value="7" className="bg-slate-800">Clause 7</option>
            <option value="8" className="bg-slate-800">Clause 8</option>
            <option value="9" className="bg-slate-800">Clause 9</option>
            <option value="10" className="bg-slate-800">Clause 10</option>
          </select>
        </div>

        {/* Results Count */}
        <div className="text-white/60 text-sm">
          Showing {filteredDocuments.length} of {documents.length} documents
        </div>

        {/* Documents List */}
        <div className="space-y-3">
          {filteredDocuments.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-12 text-center">
              <p className="text-white/70">
                {searchTerm || filterStandard !== 'ALL' || filterType !== 'ALL' || filterClause !== 'ALL'
                  ? 'No documents match your filters'
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
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-white">{doc.name || 'Untitled'}</span>
                      {doc.approval_status === 'Pending' && (
                        <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-300">Pending</span>
                      )}
                      {doc.approval_status === 'Approved' && (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300">Approved</span>
                      )}
                      {viewMode === 'archived' && (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-300">Archived</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-white/60 mb-2 flex-wrap">
                      {doc.standard && <span>{doc.standard.replace('_', ' ')}</span>}
                      {doc.clause_name && <><span>•</span><span>{doc.clause_name}</span></>}
                      {doc.type && <><span>•</span><span>{doc.type}</span></>}
                      {doc.version && <><span>•</span><span>v{doc.version}</span></>}
                    </div>
                    {doc.description && (
                      <div className="text-sm text-white/50 mb-2">{doc.description}</div>
                    )}
                    {viewMode === 'archived' && doc.archive_reason && (
                      <div className="text-xs text-orange-300/70">Reason: {doc.archive_reason}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {doc.file_url && (
                      <button
                        onClick={() => window.open(doc.file_url, '_blank')}
                        className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg text-sm font-semibold transition-colors"
                      >
                        Download
                      </button>
                    )}
                    
                    {viewMode === 'active' ? (
                      <button
                        onClick={() => handleArchiveDocument(doc.id)}
                        className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-lg text-sm font-semibold transition-colors"
                      >
                        Archive
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleRestoreDocument(doc.id)}
                          className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-sm font-semibold transition-colors"
                        >
                          Restore
                        </button>
                        {isLeadAuditor && (
                          <button
                            onClick={() => handlePermanentDelete(doc.id)}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-bold transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border border-white/20 rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
              <div className="bg-gradient-to-r from-slate-900 to-purple-900 border-b border-white/10 p-4 flex items-center justify-between flex-shrink-0">
                <h2 className="text-xl font-bold text-white">Upload Document</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-white/60 hover:text-white transition-colors text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-4 space-y-3">
                <div>
                  <label className="block text-xs text-white/70 mb-1">Select File *</label>
                  <input
                    type="file"
                    onChange={(e) => setUploadFormData({...uploadFormData, file: e.target.files[0]})}
                    className="w-full text-xs px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-cyan-500 file:text-white file:text-xs hover:file:bg-cyan-600"
                    required
                  />
                  {uploadFormData.file && (
                    <p className="text-xs text-cyan-400 mt-1 truncate">{uploadFormData.file.name}</p>
                  )}
                </div>

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

                <div>
                  <label className="block text-xs text-white/70 mb-1">Type *</label>
                  <select
                    value={uploadFormData.type}
                    onChange={(e) => setUploadFormData({...uploadFormData, type: e.target.value})}
                    className="w-full text-sm px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  >
                    <option value="Policy" className="bg-slate-800">Policy</option>
                    <option value="Procedure" className="bg-slate-800">Procedure</option>
                    <option value="Form" className="bg-slate-800">Form</option>
                    <option value="Manual" className="bg-slate-800">Manual</option>
                    <option value="Record" className="bg-slate-800">Record</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-white/70 mb-1">ISO Standard *</label>
                  <select
                    value={uploadFormData.standard}
                    onChange={(e) => setUploadFormData({...uploadFormData, standard: e.target.value})}
                    className="w-full text-sm px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  >
                    <option value="ISO_9001" className="bg-slate-800">ISO 9001:2015</option>
                    <option value="ISO_14001" className="bg-slate-800">ISO 14001:2015</option>
                    <option value="ISO_45001" className="bg-slate-800">ISO 45001:2018</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-white/70 mb-1">Clause *</label>
                  <select
                    value={uploadFormData.clause}
                    onChange={(e) => setUploadFormData({...uploadFormData, clause: parseInt(e.target.value)})}
                    className="w-full text-sm px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
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

              <div className="bg-gradient-to-r from-slate-900 to-purple-900 border-t border-white/10 p-4 flex-shrink-0">
                <button
                  onClick={handleUploadWithMetadata}
                  disabled={uploading || !uploadFormData.file}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Documents;
