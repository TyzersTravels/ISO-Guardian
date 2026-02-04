import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const NCRs = () => {
  const { user, userProfile } = useAuth();
  const [ncrs, setNcrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedNCR, setSelectedNCR] = useState(null);
  const [showNewNCRModal, setShowNewNCRModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [newNCR, setNewNCR] = useState({
    title: '',
    description: '',
    standard: 'ISO_9001',
    clause: 10,
    severity: 'Major',
    assigned_to: '',
    due_date: '',
    root_cause: '',
    corrective_action: '',
    preventive_action: ''
  });

  useEffect(() => {
    fetchNCRs();
  }, []);

  const fetchNCRs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ncrs')
        .select('*')
        .order('date_opened', { ascending: false });

      if (error) throw error;
      setNcrs(data || []);
    } catch (error) {
      console.error('Error fetching NCRs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClauseName = (standard, clause) => {
    const clauseNames = {
      ISO_9001: {
        4: 'Context of the Organization',
        5: 'Leadership',
        6: 'Planning',
        7: 'Support',
        8: 'Operation',
        9: 'Performance Evaluation',
        10: 'Improvement'
      },
      ISO_14001: {
        4: 'Context of the Organization',
        5: 'Leadership',
        6: 'Planning',
        7: 'Support',
        8: 'Operation',
        9: 'Performance Evaluation',
        10: 'Improvement'
      },
      ISO_45001: {
        4: 'Context of the Organization',
        5: 'Leadership and Worker Participation',
        6: 'Planning',
        7: 'Support',
        8: 'Operation',
        9: 'Performance Evaluation',
        10: 'Improvement'
      }
    };
    return clauseNames[standard]?.[clause] || 'Unknown';
  };

  const createNCR = async (e) => {
    e.preventDefault();
    
    if (!newNCR.title || !newNCR.description || !newNCR.assigned_to || !newNCR.due_date) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const year = new Date().getFullYear();
      const count = ncrs.length + 1;
      const ncrNumber = `NCR-${year}-${String(count).padStart(3, '0')}`;

      const insertData = {
        ncr_number: ncrNumber,
        title: newNCR.title,
        description: newNCR.description,
        standard: newNCR.standard,
        clause: parseInt(newNCR.clause),
        clause_name: `Clause ${newNCR.clause}: ${getClauseName(newNCR.standard, parseInt(newNCR.clause))}`,
        severity: newNCR.severity,
        status: 'Open',
        assigned_to: newNCR.assigned_to,
        due_date: newNCR.due_date,
        date_opened: new Date().toISOString(),
        root_cause: newNCR.root_cause || null,
        corrective_action: newNCR.corrective_action || null,
        preventive_action: newNCR.preventive_action || null,
        company_id: userProfile?.company_id || user?.user_metadata?.company_id,
        created_by: user?.id,
        assigned_by: user?.id
      };

      console.log('Inserting NCR:', insertData);

      const { data, error } = await supabase
        .from('ncrs')
        .insert([insertData])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('NCR created successfully:', data);

      alert(`✅ NCR created successfully!\nNCR Number: ${ncrNumber}`);
      
      setShowNewNCRModal(false);
      setNewNCR({
        title: '',
        description: '',
        standard: 'ISO_9001',
        clause: 10,
        severity: 'Major',
        assigned_to: '',
        due_date: '',
        root_cause: '',
        corrective_action: '',
        preventive_action: ''
      });
      
      fetchNCRs();
    } catch (error) {
      console.error('Error creating NCR:', error);
      alert('Failed to create NCR: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const closeNCR = async (id) => {
    if (!window.confirm('Close this NCR? (ISO 9001 requires documented evidence)')) return;

    try {
      const { error } = await supabase
        .from('ncrs')
        .update({
          status: 'Closed',
          date_closed: new Date().toISOString(),
          closed_by: user?.id
        })
        .eq('id', id);

      if (error) throw error;

      setNcrs(ncrs.map(ncr => 
        ncr.id === id 
          ? { ...ncr, status: 'Closed', date_closed: new Date().toISOString() }
          : ncr
      ));

      alert('✅ NCR closed successfully!');
      setSelectedNCR(null);
    } catch (error) {
      console.error('Error closing NCR:', error);
      alert('Failed to close NCR: ' + error.message);
    }
  };

  const reopenNCR = async (id) => {
    if (!window.confirm('Reopen this NCR?')) return;

    try {
      const { error } = await supabase
        .from('ncrs')
        .update({
          status: 'Open',
          date_closed: null,
          closed_by: null
        })
        .eq('id', id);

      if (error) throw error;

      setNcrs(ncrs.map(ncr => 
        ncr.id === id 
          ? { ...ncr, status: 'Open', date_closed: null }
          : ncr
      ));

      alert('NCR reopened successfully!');
    } catch (error) {
      console.error('Error reopening NCR:', error);
      alert('Failed to reopen NCR: ' + error.message);
    }
  };

  const filteredNCRs = ncrs.filter(ncr => {
    if (filterStatus === 'ALL') return true;
    return ncr.status === filterStatus;
  });

  const openNCRs = ncrs.filter(n => n.status === 'Open').length;
  const criticalNCRs = ncrs.filter(n => n.status === 'Open' && n.severity === 'Critical').length;
  const closedNCRs = ncrs.filter(n => n.status === 'Closed').length;

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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Non-Conformance Reports</h1>
            <p className="text-sm text-white/60 mt-1">ISO 9001 Clause 10.2</p>
          </div>
          <button
            onClick={() => setShowNewNCRModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg"
          >
            ➕ New NCR
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${
              filterStatus === 'ALL'
                ? 'bg-cyan-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            All ({ncrs.length})
          </button>
          <button
            onClick={() => setFilterStatus('Open')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${
              filterStatus === 'Open'
                ? 'bg-orange-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Open ({openNCRs})
          </button>
          <button
            onClick={() => setFilterStatus('Closed')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${
              filterStatus === 'Closed'
                ? 'bg-green-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Closed ({closedNCRs})
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-orange-500/10 backdrop-blur-lg border border-orange-500/20 rounded-xl p-6">
            <div className="text-3xl font-bold text-orange-400">{openNCRs}</div>
            <div className="text-sm text-white/70">Open NCRs</div>
          </div>
          <div className="bg-red-500/10 backdrop-blur-lg border border-red-500/20 rounded-xl p-6">
            <div className="text-3xl font-bold text-red-400">{criticalNCRs}</div>
            <div className="text-sm text-white/70">Critical</div>
          </div>
          <div className="bg-green-500/10 backdrop-blur-lg border border-green-500/20 rounded-xl p-6">
            <div className="text-3xl font-bold text-green-400">{closedNCRs}</div>
            <div className="text-sm text-white/70">Closed</div>
          </div>
        </div>

        <div className="space-y-3">
          {filteredNCRs.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-white/70">
                {filterStatus === 'ALL' ? 'No NCRs found' : `No ${filterStatus} NCRs`}
              </p>
            </div>
          ) : (
            filteredNCRs.map((ncr) => (
              <div
                key={ncr.id}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 hover:bg-white/[0.15] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-mono text-cyan-400">{ncr.ncr_number}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        ncr.severity === 'Critical' 
                          ? 'bg-red-500/20 text-red-300' 
                          : 'bg-orange-500/20 text-orange-300'
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
                      {ncr.date_opened && (
                        <span>📅 {new Date(ncr.date_opened).toLocaleDateString()}</span>
                      )}
                      {ncr.assigned_to && <span>👤 {ncr.assigned_to}</span>}
                      {ncr.due_date && <span>⏰ {new Date(ncr.due_date).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedNCR(ncr)}
                    className="ml-4 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg text-sm font-semibold"
                  >
                    View
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* New NCR Modal - FITS SCREEN */}
        {showNewNCRModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-lg border border-white/20 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 p-4 border-b border-white/20 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Create NCR</h3>
                  <p className="text-xs text-white/60 mt-1">ISO 9001 Clause 10.2</p>
                </div>
                <button
                  onClick={() => setShowNewNCRModal(false)}
                  className="p-2 hover:bg-white/10 rounded-xl text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={createNCR} className="p-4 space-y-3">
                <div>
                  <label className="text-sm text-white/80 block mb-1">Title *</label>
                  <input
                    type="text"
                    value={newNCR.title}
                    onChange={(e) => setNewNCR({...newNCR, title: e.target.value})}
                    required
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white text-sm placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Brief description"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/80 block mb-1">Description *</label>
                  <textarea
                    value={newNCR.description}
                    onChange={(e) => setNewNCR({...newNCR, description: e.target.value})}
                    required
                    rows={2}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white text-sm placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Details..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-white/80 block mb-1">Standard *</label>
                    <select
                      value={newNCR.standard}
                      onChange={(e) => setNewNCR({...newNCR, standard: e.target.value})}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="ISO_9001" className="bg-slate-800">ISO 9001</option>
                      <option value="ISO_14001" className="bg-slate-800">ISO 14001</option>
                      <option value="ISO_45001" className="bg-slate-800">ISO 45001</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-white/80 block mb-1">Clause *</label>
                    <select
                      value={newNCR.clause}
                      onChange={(e) => setNewNCR({...newNCR, clause: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {[4, 5, 6, 7, 8, 9, 10].map(num => (
                        <option key={num} value={num} className="bg-slate-800">
                          Clause {num}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-white/80 block mb-1">Severity *</label>
                    <select
                      value={newNCR.severity}
                      onChange={(e) => setNewNCR({...newNCR, severity: e.target.value})}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="Critical" className="bg-slate-800">Critical</option>
                      <option value="Major" className="bg-slate-800">Major</option>
                      <option value="Minor" className="bg-slate-800">Minor</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-white/80 block mb-1">Due Date *</label>
                    <input
                      type="date"
                      value={newNCR.due_date}
                      onChange={(e) => setNewNCR({...newNCR, due_date: e.target.value})}
                      required
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/80 block mb-1">Assigned To *</label>
                  <input
                    type="text"
                    value={newNCR.assigned_to}
                    onChange={(e) => setNewNCR({...newNCR, assigned_to: e.target.value})}
                    required
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white text-sm placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Person/Department"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/80 block mb-1">Root Cause</label>
                  <textarea
                    value={newNCR.root_cause}
                    onChange={(e) => setNewNCR({...newNCR, root_cause: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white text-sm placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Why did this occur?"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/80 block mb-1">Corrective Action</label>
                  <textarea
                    value={newNCR.corrective_action}
                    onChange={(e) => setNewNCR({...newNCR, corrective_action: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white text-sm placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Immediate fix..."
                  />
                </div>

                <div>
                  <label className="text-sm text-white/80 block mb-1">Preventive Action</label>
                  <textarea
                    value={newNCR.preventive_action}
                    onChange={(e) => setNewNCR({...newNCR, preventive_action: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white text-sm placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Prevent recurrence..."
                  />
                </div>

                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3">
                  <p className="text-xs text-cyan-300">
                    <strong>ISO 9001 Clause 10.2:</strong> Full audit trail maintained
                  </p>
                </div>

                <div className="flex gap-3 pt-2 sticky bottom-0 bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 pb-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all"
                  >
                    {submitting ? 'Creating...' : '✓ Create NCR'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewNCRModal(false)}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View NCR Modal */}
        {selectedNCR && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-lg border border-white/20 rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto">
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
                    <div className="text-white/80 bg-white/5 border border-white/10 rounded-xl p-3">
                      {selectedNCR.description}
                    </div>
                  </div>
                )}

                {selectedNCR.root_cause && (
                  <div>
                    <label className="text-sm text-white/60 block mb-1">Root Cause</label>
                    <div className="text-white/80 bg-white/5 border border-white/10 rounded-xl p-3">
                      {selectedNCR.root_cause}
                    </div>
                  </div>
                )}

                {selectedNCR.corrective_action && (
                  <div>
                    <label className="text-sm text-white/60 block mb-1">Corrective Action</label>
                    <div className="text-white/80 bg-white/5 border border-white/10 rounded-xl p-3">
                      {selectedNCR.corrective_action}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/60 block mb-1">Assigned To</label>
                    <div className="text-white">{selectedNCR.assigned_to}</div>
                  </div>
                  <div>
                    <label className="text-sm text-white/60 block mb-1">Due Date</label>
                    <div className="text-white">
                      {selectedNCR.due_date ? new Date(selectedNCR.due_date).toLocaleDateString() : 'Not set'}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  {selectedNCR.status === 'Open' ? (
                    <button
                      onClick={() => closeNCR(selectedNCR.id)}
                      className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl"
                    >
                      ✓ Close NCR
                    </button>
                  ) : (
                    <button
                      onClick={() => reopenNCR(selectedNCR.id)}
                      className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl"
                    >
                      🔄 Reopen
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedNCR(null)}
                    className="px-6 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-xl"
                  >
                    Close
                  </button>
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
