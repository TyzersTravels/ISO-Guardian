import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const Documents = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStandard, setFilterStandard] = useState('ALL');

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) {
        console.error('Error deleting document:', error);
        alert('Failed to delete document: ' + error.message);
        return;
      }

      setDocuments(documents.filter(doc => doc.id !== documentId));
      alert('Document deleted successfully!');
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('An unexpected error occurred while deleting the document.');
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      // ✅ FIX: Use select('*') to get whatever columns exist
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      alert('Failed to load documents: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // ✅ FIX: Only include created_by if user exists
      const insertData = {
        name: file.name,
        file_url: publicUrl,
        status: 'Review'
      };

      // Add created_by only if we have a user
      if (user?.id) {
        insertData.created_by = user.id;
      }

      const { error: insertError } = await supabase
        .from('documents')
        .insert([insertData]);

      if (insertError) throw insertError;

      alert('Document uploaded successfully!');
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Document Management</h1>
        <label className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold cursor-pointer hover:scale-105 transition-transform shadow-lg">
          {uploading ? 'Uploading...' : '📤 Upload Document'}
          <input
            type="file"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files[0])}
            disabled={uploading}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="🔍 Search documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <select
          value={filterStandard}
          onChange={(e) => setFilterStandard(e.target.value)}
          className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="ALL" className="bg-slate-800">All Standards</option>
          <option value="ISO_9001" className="bg-slate-800">ISO 9001:2015</option>
          <option value="ISO_14001" className="bg-slate-800">ISO 14001:2015</option>
          <option value="ISO_45001" className="bg-slate-800">ISO 45001:2018</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-3xl font-bold text-white">{documents.length}</div>
          <div className="text-sm text-white/70">Total Documents</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-3xl font-bold text-green-400">
            {documents.filter(d => d.status === 'Approved').length}
          </div>
          <div className="text-sm text-white/70">Approved</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-3xl font-bold text-orange-400">
            {documents.filter(d => d.status === 'Review').length}
          </div>
          <div className="text-sm text-white/70">In Review</div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredDocuments.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📄</div>
            <p className="text-white/70">
              {searchTerm || filterStandard !== 'ALL' 
                ? 'No documents match your search criteria' 
                : 'No documents uploaded yet'}
            </p>
          </div>
        ) : (
          filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 hover:bg-white/[0.15] transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">
                  📄
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white">{doc.name}</span>
                    {doc.status === 'Approved' && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300">
                        ✓ Approved
                      </span>
                    )}
                    {doc.status === 'Review' && (
                      <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-300">
                        ⏳ In Review
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/60">
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
                    {doc.version && <span>Rev {doc.version}</span>}
                    {doc.created_at && (
                      <>
                        <span>•</span>
                        <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                      </>
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
                      ⬇️ Download
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-sm font-medium"
                    title="Delete document"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Documents;
