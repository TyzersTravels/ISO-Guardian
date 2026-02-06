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
      alert('Document archived successfully!');
      fetchDocuments();
    } catch (err) {
      console.error('Error archiving:', err);
      alert('Failed to archive: ' + err.message);
    }
  };

  const handleRestoreDocument = async (documentId) => {
    if (!window.confirm('Restore this document to active status?')) return;

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
      alert('Document restored successfully!');
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

    if (!window.confirm('PERMANENT DELETE - This cannot be undone! Are you absolutely sure?')) return;

    const reason = window.prompt('Reason for permanent deletion (required for audit trail):');
    if (!reason || reason.trim() === '') {
      alert('Deletion reason is required');
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Document Management</h1>
            <p className="text-sm text-white/60 mt-1">
              ISO 9001 Clause 7.5
              {isLeadAuditor && <span className="ml-2 text-cyan-400">Lead Auditor Access</span>}
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg"
          >
            Upload Document
          </button>
        </div>

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
            Archived Documents
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Search documents..."
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

        <div className="space-y-3">
          {filteredDocuments.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-12 text-center">
              <p className="text-white/70">
                {viewMode === 'active' ? 'No active documents' : 'No archived documents'}
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
                      <span className="font-semibold text-white">{doc.name || 'Untitled Document'}</span>
                      {doc.approval_status === 'Pending' && (
                        <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-300">
                          Pending
                        </span>
                      )}
                      {doc.approval_status === 'Approved' && (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300">
                          Approved
                        </span>
                      )}
                      {viewMode === 'archived' && (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-300">
                          Archived
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-white/60 mb-2 flex-wrap">
                      {doc.standard && <span>{doc.standard.replace('_', ' ')}</span>}
                      {doc.clause_name && <><span>•</span><span>{doc.clause_name}</span></>}
                      {doc.type && <><span>•</span><span>{doc.type}</span></>}
                    </div>
                    {viewMode === 'archived' && doc.archive_reason && (
                      <div className="text-xs text-orange-300/70 mb-2">
                        Reason: {doc.archive_reason}
                      </div>
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
      </div>
    </Layout>
  );
};

export default Documents;
