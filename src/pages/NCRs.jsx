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
        .eq('permanently_deleted', false)
        .order('date_raised', { ascending: false });

      if (viewMode === 'active') {
        query = query.or('archived.is.null,archived.eq.false');
      } else if (viewMode === 'archived') {
        query = query.eq('archived', true);
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
    if (!window.confirm('Archive this NCR? (ISO compliance: archived for record-keeping)')) return;

    const reason = window.prompt('Reason for archiving (required for ISO compliance):');
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
      alert('NCR archived successfully!');
      fetchNCRs();
    } catch (err) {
      console.error('Error archiving NCR:', err);
      alert('Failed to archive: ' + err.message);
    }
  };

  const handleRestoreNCR = async (ncrId) => {
    if (!window.confirm('Restore this NCR to active status?')) return;

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
      alert('NCR restored successfully!');
      fetchNCRs();
    } catch (err) {
      console.error('Error restoring NCR:', err);
      alert('Failed to restore: ' + err.message);
    }
  };

  const handlePermanentDelete = async (ncrId) => {
    if (!isLeadAuditor) {
      alert('Only Lead Auditors can permanently delete NCRs');
      return;
    }

    if (!window.confirm('PERMANENT DELETE - This cannot be undone! Continue?')) return;

    const reason = window.prompt('Reason for permanent deletion (required for audit trail):');
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
      console.error('Error deleting NCR:', err);
      alert('Failed to delete: ' + err.message);
    }
  };

  const handleCloseNCR = async (ncrId) => {
    if (!window.confirm('Close this NCR?')) return;

    try {
      const { error } = await supabase
        .from('ncrs')
        .update({
          status: 'Closed',
          date_closed: new Date().toISOString(),
        })
        .eq('id', ncrId);

      if (error) throw error;
      alert('NCR closed successfully!');
      fetchNCRs();
    } catch (err) {
      console.error('Error closing NCR:', err);
      alert('Failed to close: ' + err.message);
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
          <div>
            <h1 className="text-3xl font-bold text-white">Non-Conformance Reports</h1>
            <p className="text-sm text-white/60 mt-1">
              ISO 9001 Clause 10: Improvement
              {isLeadAuditor && <span className="ml-2 text-cyan-400">• Lead Auditor Access</span>}
            </p>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg">
            New NCR
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
            Active NCRs ({ncrs.filter(n => !n.archived).length})
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

        {/* NCRs List */}
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
                      <span className="font-mono text-cyan-400 text-sm">{ncr.ncr_number}</span>
                      <span className="font-semibold text-white">{ncr.title}</span>
                      {ncr.severity === 'Critical' && (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-300">Critical</span>
                      )}
                      {ncr.severity === 'Major' && (
                        <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-300">Major</span>
                      )}
                      {ncr.severity === 'Minor' && (
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300">Minor</span>
                      )}
                      {ncr.status === 'Open' && (
                        <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-300">Open</span>
                      )}
                      {ncr.status === 'Closed' && (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300">Closed</span>
                      )}
                      {viewMode === 'archived' && (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-300">Archived</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-white/60 mb-2 flex-wrap">
                      {ncr.standard && <span>{ncr.standard.replace('_', ' ')}</span>}
                      {ncr.clause_name && <><span>•</span><span>{ncr.clause_name}</span></>}
                      {ncr.date_raised && <><span>•</span><span>Raised: {new Date(ncr.date_raised).toLocaleDateString()}</span></>}
                    </div>
                    {ncr.description && (
                      <div className="text-sm text-white/50 mb-2">{ncr.description}</div>
                    )}
                    {viewMode === 'archived' && ncr.archive_reason && (
                      <div className="text-xs text-orange-300/70">Reason: {ncr.archive_reason}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setSelectedNCR(ncr)}
                      className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg text-sm font-semibold transition-colors"
                    >
                      View
                    </button>
                    
                    {viewMode === 'active' ? (
                      <>
                        {ncr.status === 'Open' && (
                          <button
                            onClick={() => handleCloseNCR(ncr.id)}
                            className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-sm font-semibold transition-colors"
                          >
                            Close
                          </button>
                        )}
                        <button
                          onClick={() => handleArchiveNCR(ncr.id)}
                          className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-lg text-sm font-semibold transition-colors"
                        >
                          Archive
                        </button>
                      </>
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

        {/* NCR Detail Modal */}
        {selectedNCR && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border border-white/20 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-slate-900 to-purple-900 border-b border-white/10 p-6 flex items-center justify-between sticky top-0">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedNCR.ncr_number}</h2>
                  <p className="text-sm text-white/60">{selectedNCR.title}</p>
                </div>
                <button
                  onClick={() => setSelectedNCR(null)}
                  className="text-white/60 hover:text-white transition-colors text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm text-white/60">Description</label>
                  <div className="mt-1 p-3 bg-white/10 rounded-lg text-white">{selectedNCR.description}</div>
                </div>

                {selectedNCR.root_cause && (
                  <div>
                    <label className="text-sm text-white/60">Root Cause</label>
                    <div className="mt-1 p-3 bg-white/10 rounded-lg text-white">{selectedNCR.root_cause}</div>
                  </div>
                )}

                {selectedNCR.corrective_action && (
                  <div>
                    <label className="text-sm text-white/60">Corrective Action</label>
                    <div className="mt-1 p-3 bg-white/10 rounded-lg text-white">{selectedNCR.corrective_action}</div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/60">Standard</label>
                    <div className="mt-1 text-white">{selectedNCR.standard?.replace('_', ' ')}</div>
                  </div>
                  <div>
                    <label className="text-sm text-white/60">Severity</label>
                    <div className="mt-1 text-white">{selectedNCR.severity}</div>
                  </div>
                  <div>
                    <label className="text-sm text-white/60">Status</label>
                    <div className="mt-1 text-white">{selectedNCR.status}</div>
                  </div>
                  <div>
                    <label className="text-sm text-white/60">Date Raised</label>
                    <div className="mt-1 text-white">{new Date(selectedNCR.date_raised).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NCRs;
