import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const NCRs = () => {
  const { user } = useAuth();
  const [ncrs, setNcrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('active');
  const [isLeadAuditor, setIsLeadAuditor] = useState(false);
  const [selectedNCR, setSelectedNCR] = useState(null);

  useEffect(() => {
    checkUserRole();
    fetchNCRs();
  }, [viewMode]);

  const checkUserRole = async () => {
    try {
      const { data } = await supabase
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

  const fetchNCRs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('ncrs')
        .select('*')
        .order('created_at', { ascending: false });

      if (viewMode === 'active') {
        query = query.or('archived.is.null,archived.eq.false');
        query = query.or('permanently_deleted.is.null,permanently_deleted.eq.false');
      } else if (viewMode === 'archived') {
        query = query.eq('archived', true);
        query = query.or('permanently_deleted.is.null,permanently_deleted.eq.false');
      }

      const { data, error } = await query;
      if (error) throw error;
      setNcrs(data || []);
    } catch (error) {
      console.error('Error fetching NCRs:', error);
      alert('Failed to load NCRs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveNCR = async (ncrId) => {
    if (!window.confirm('Archive this NCR?')) return;

    const reason = window.prompt('Reason for archiving (required):');
    if (!reason || reason.trim() === '') {
      alert('Archiving reason is required');
      return;
    }

    try {
      const { error } = await supabase
        .from('ncrs')
        .update({
          archived: true,
          archived_at: new Date().toISOString(),
          archived_by: user?.id,
          archive_reason: reason.trim(),
        })
        .eq('id', ncrId);

      if (error) throw error;
      alert('NCR archived!');
      fetchNCRs();
    } catch (err) {
      console.error('Error archiving:', err);
      alert('Failed to archive: ' + err.message);
    }
  };

  const handleRestoreNCR = async (ncrId) => {
    if (!window.confirm('Restore this NCR?')) return;

    try {
      const { error } = await supabase
        .from('ncrs')
        .update({
          archived: false,
          archived_at: null,
          archived_by: null,
          archive_reason: null,
        })
        .eq('id', ncrId);

      if (error) throw error;
      alert('NCR restored!');
      fetchNCRs();
    } catch (err) {
      console.error('Error restoring:', err);
      alert('Failed to restore: ' + err.message);
    }
  };

  const handlePermanentDelete = async (ncrId) => {
    if (!isLeadAuditor) {
      alert('Only Lead Auditors can permanently delete');
      return;
    }

    if (!window.confirm('PERMANENT DELETE - Cannot be undone! Continue?')) return;

    const reason = window.prompt('Deletion reason (required):');
    if (!reason || reason.trim() === '') {
      alert('Deletion reason required');
      return;
    }

    try {
      const { error } = await supabase
        .from('ncrs')
        .update({
          permanently_deleted: true,
          permanently_deleted_at: new Date().toISOString(),
          permanently_deleted_by: user?.email,
          deletion_reason: reason.trim(),
        })
        .eq('id', ncrId);

      if (error) throw error;
      alert('NCR permanently deleted');
      fetchNCRs();
    } catch (err) {
      console.error('Error deleting:', err);
      alert('Failed to delete: ' + err.message);
    }
  };

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
          <h1 className="text-3xl font-bold text-white">Non-Conformance Reports</h1>
          <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg">
            New NCR
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
            Active ({ncrs.filter(n => !n.archived).length})
          </button>
          <button
            onClick={() => setViewMode('archived')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'archived'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            Archived ({ncrs.filter(n => n.archived).length})
          </button>
        </div>

        <div className="space-y-3">
          {ncrs.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-12 text-center">
              <p className="text-white/70">
                {viewMode === 'active' ? 'No active NCRs' : 'No archived NCRs'}
              </p>
            </div>
          ) : (
            ncrs.map((ncr) => (
              <div
                key={ncr.id}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 hover:bg-white/[0.15] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-white">{ncr.title || 'Untitled NCR'}</span>
                      {viewMode === 'archived' && (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-300">Archived</span>
                      )}
                    </div>
                    <div className="text-sm text-white/50 mb-2">{ncr.description}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {viewMode === 'active' ? (
                      <button
                        onClick={() => handleArchiveNCR(ncr.id)}
                        className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-lg text-sm font-semibold transition-colors"
                      >
                        Archive
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleRestoreNCR(ncr.id)}
                          className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-sm font-semibold transition-colors"
                        >
                          Restore
                        </button>
                        {isLeadAuditor && (
                          <button
                            onClick={() => handlePermanentDelete(ncr.id)}
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

export default NCRs;
