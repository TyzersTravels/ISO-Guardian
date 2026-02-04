import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const NCRs = () => {
  const [ncrs, setNcrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNCR, setSelectedNCR] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL'); // ✅ NEW: Filter for status

  useEffect(() => {
    fetchNCRs();
  }, []);

  const fetchNCRs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ncrs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNcrs(data || []);
    } catch (error) {
      console.error('Error fetching NCRs:', error);
      alert('Failed to load NCRs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseNCR = async (ncrId) => {
    if (!window.confirm('Are you sure you want to close this NCR? This action can be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('ncrs')
        .update({ 
          status: 'Closed',
          closed_at: new Date().toISOString()
        })
        .eq('id', ncrId);

      if (error) throw error;

      // ✅ UPDATE local state instead of removing
      setNcrs(ncrs.map(ncr => 
        ncr.id === ncrId 
          ? { ...ncr, status: 'Closed', closed_at: new Date().toISOString() }
          : ncr
      ));
      
      alert('NCR closed successfully!');
      setSelectedNCR(null);
    } catch (error) {
      console.error('Error closing NCR:', error);
      alert('Failed to close NCR: ' + error.message);
    }
  };

  const handleReopenNCR = async (ncrId) => {
    if (!window.confirm('Reopen this NCR?')) return;

    try {
      const { error } = await supabase
        .from('ncrs')
        .update({ 
          status: 'Open',
          closed_at: null
        })
        .eq('id', ncrId);

      if (error) throw error;

      setNcrs(ncrs.map(ncr => 
        ncr.id === ncrId 
          ? { ...ncr, status: 'Open', closed_at: null }
          : ncr
      ));
      
      alert('NCR reopened successfully!');
      setSelectedNCR(null);
    } catch (error) {
      console.error('Error reopening NCR:', error);
      alert('Failed to reopen NCR: ' + error.message);
    }
  };

  // ✅ FILTER NCRs based on status
  const filteredNCRs = ncrs.filter(ncr => {
    if (statusFilter === 'ALL') return true;
    return ncr.status === statusFilter;
  });

  const openCount = ncrs.filter(n => n.status === 'Open').length;
  const closedCount = ncrs.filter(n => n.status === 'Closed').length;
  const criticalCount = ncrs.filter(n => n.status === 'Open' && n.severity === 'Critical').length;

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
        <h1 className="text-3xl font-bold text-white">Non-Conformance Reports</h1>
        <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg">
          ➕ New NCR
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${
            statusFilter === 'ALL'
              ? 'bg-cyan-500 text-white'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          All ({ncrs.length})
        </button>
        <button
          onClick={() => setStatusFilter('Open')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${
            statusFilter === 'Open'
              ? 'bg-orange-500 text-white'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          Open ({openCount})
        </button>
        <button
          onClick={() => setStatusFilter('Closed')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${
            statusFilter === 'Closed'
              ? 'bg-green-500 text-white'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          Closed ({closedCount})
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-3xl font-bold text-orange-400">{openCount}</div>
          <div className="text-sm text-white/70">Open NCRs</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-3xl font-bold text-red-400">{criticalCount}</div>
          <div className="text-sm text-white/70">Critical Issues</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-3xl font-bold text-green-400">{closedCount}</div>
          <div className="text-sm text-white/70">Closed This Period</div>
        </div>
      </div>

      {/* NCRs List */}
      <div className="space-y-3">
        {filteredNCRs.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-white/70">
              {statusFilter === 'ALL' 
                ? 'No NCRs found' 
                : `No ${statusFilter.toLowerCase()} NCRs`}
            </p>
          </div>
        ) : (
          filteredNCRs.map((ncr) => (
            <div
              key={ncr.id}
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 hover:bg-white/[0.15] transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-mono text-cyan-400">{ncr.ncr_number}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      ncr.severity === 'Critical' 
                        ? 'bg-red-500/20 text-red-300' 
                        : ncr.severity === 'Major'
                        ? 'bg-orange-500/20 text-orange-300'
                        : 'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {ncr.severity}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      ncr.status === 'Open'
                        ? 'bg-orange-500/20 text-orange-300'
                        : 'bg-green-500/20 text-green-300'
                    }`}>
                      {ncr.status}
                    </span>
                    {ncr.standard && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300">
                        {ncr.standard.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-white text-lg mb-1">{ncr.title}</div>
                  {ncr.clause_name && (
                    <div className="text-sm text-white/60 mb-2">{ncr.clause_name}</div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-white/50">
                    <span>📅 Opened: {ncr.date_opened || new Date(ncr.created_at).toLocaleDateString()}</span>
                    {ncr.assigned_to && <span>👤 {ncr.assigned_to}</span>}
                    {ncr.due_date && <span>⏰ Due: {ncr.due_date}</span>}
                    {ncr.closed_at && <span>✓ Closed: {new Date(ncr.closed_at).toLocaleDateString()}</span>}
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedNCR(ncr)}
                  className="ml-4 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg text-sm font-semibold transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* NCR Details Modal */}
      {selectedNCR && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">{selectedNCR.ncr_number}</h3>
              <button 
                onClick={() => setSelectedNCR(null)} 
                className="p-2 hover:bg-white/10 rounded-xl text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/60 block mb-1">Title</label>
                <div className="text-white font-semibold">{selectedNCR.title}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60 block mb-1">Standard</label>
                  <div className="text-white">{selectedNCR.standard?.replace('_', ' ')}</div>
                </div>
                <div>
                  <label className="text-sm text-white/60 block mb-1">Clause</label>
                  <div className="text-white">{selectedNCR.clause_name}</div>
                </div>
              </div>

              {selectedNCR.description && (
                <div>
                  <label className="text-sm text-white/60 block mb-1">Description</label>
                  <div className="text-white/80 bg-white/5 rounded-xl p-3">{selectedNCR.description}</div>
                </div>
              )}

              {selectedNCR.root_cause && (
                <div>
                  <label className="text-sm text-white/60 block mb-1">Root Cause</label>
                  <div className="text-white/80 bg-white/5 rounded-xl p-3">{selectedNCR.root_cause}</div>
                </div>
              )}

              {selectedNCR.corrective_action && (
                <div>
                  <label className="text-sm text-white/60 block mb-1">Corrective Action</label>
                  <div className="text-white/80 bg-white/5 rounded-xl p-3">{selectedNCR.corrective_action}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60 block mb-1">Assigned To</label>
                  <div className="text-white">{selectedNCR.assigned_to || 'Unassigned'}</div>
                </div>
                <div>
                  <label className="text-sm text-white/60 block mb-1">Due Date</label>
                  <div className="text-white">{selectedNCR.due_date || 'Not set'}</div>
                </div>
              </div>

              {selectedNCR.status === 'Closed' && selectedNCR.closed_at && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <div className="text-green-300 font-semibold mb-1">✓ NCR Closed</div>
                  <div className="text-sm text-white/70">
                    Closed on: {new Date(selectedNCR.closed_at).toLocaleDateString()}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                {selectedNCR.status === 'Open' ? (
                  <button
                    onClick={() => handleCloseNCR(selectedNCR.id)}
                    className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all"
                  >
                    ✓ Close NCR
                  </button>
                ) : (
                  <button
                    onClick={() => handleReopenNCR(selectedNCR.id)}
                    className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all"
                  >
                    ↻ Reopen NCR
                  </button>
                )}
                <button
                  onClick={() => setSelectedNCR(null)}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NCRs;
