import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const ActivityTrail = () => {
  const { user, userProfile } = useAuth();
  const [allActivities, setAllActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterAction, setFilterAction] = useState('all');

  useEffect(() => { fetchActivities(); }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);

      const { data: auditData, error: auditError } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      const { data: deletionData } = await supabase
        .from('deletion_audit_trail')
        .select('*')
        .order('deleted_at', { ascending: false })
        .limit(100);

      if (auditError) throw auditError;

      const combined = [
        ...(auditData || []).map(a => ({
          id: a.id,
          action: a.action,
          entity_type: a.entity_type,
          entity_id: a.entity_id,
          changes: a.changes,
          user_id: a.user_id,
          timestamp: a.created_at,
        })),
        ...(deletionData || []).map(d => {
          // Normalize table names: 'documents' -> 'document', 'ncrs' -> 'ncr', etc.
          const normalized = (d.table_name || '').replace(/s$/, '');
          return {
            id: 'del_' + d.id,
            action: 'permanently_deleted',
            entity_type: normalized,
            entity_id: d.record_id,
            changes: { reason: d.reason },
            user_id: d.deleted_by,
            timestamp: d.deleted_at,
          };
        }),
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setAllActivities(combined);
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = allActivities.filter(a => {
    if (filterType !== 'all' && a.entity_type !== filterType) return false;
    if (filterAction !== 'all' && a.action !== filterAction) return false;
    return true;
  });

  const uniqueTypes = [...new Set(allActivities.map(a => a.entity_type))].filter(Boolean).sort();
  const uniqueActions = [...new Set(allActivities.map(a => a.action))].filter(Boolean).sort();

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const actionIcons = {
    created: { icon: '＋', color: 'text-green-400', bg: 'bg-green-500/20' },
    updated: { icon: '✎', color: 'text-blue-400', bg: 'bg-blue-500/20' },
    archived: { icon: '▣', color: 'text-orange-400', bg: 'bg-orange-500/20' },
    restored: { icon: '↩', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
    deleted: { icon: '✕', color: 'text-red-400', bg: 'bg-red-500/20' },
    permanently_deleted: { icon: '⊘', color: 'text-red-500', bg: 'bg-red-500/30' },
    approved: { icon: '✓', color: 'text-green-400', bg: 'bg-green-500/20' },
    completed: { icon: '✓', color: 'text-green-400', bg: 'bg-green-500/20' },
    uploaded: { icon: '↑', color: 'text-purple-400', bg: 'bg-purple-500/20' },
    status_changed: { icon: '→', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    viewed: { icon: '◉', color: 'text-blue-300', bg: 'bg-blue-500/10' },
    downloaded: { icon: '↓', color: 'text-cyan-300', bg: 'bg-cyan-500/10' },
    rejected: { icon: '✗', color: 'text-red-300', bg: 'bg-red-500/10' },
  };

  const entityLabels = {
    document: 'Document', documents: 'Document',
    ncr: 'NCR', ncrs: 'NCR',
    audit: 'Audit', audits: 'Audit',
    management_review: 'Management Review', management_reviews: 'Management Review',
    meeting: 'Meeting', user: 'User', company: 'Company', system: 'System',
  };

  const getActionStyle = (action) => actionIcons[action] || { icon: '•', color: 'text-white/60', bg: 'bg-white/10' };

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
            <h1 className="text-3xl font-bold text-white">Activity Trail</h1>
            <p className="text-sm text-white/50 mt-1">Complete audit log — ISO 7.5 documented information control</p>
          </div>
          <button onClick={fetchActivities} className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm hover:bg-white/20">
            Refresh
          </button>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-2">
          <p className="text-xs text-purple-300">
            ISO 9001:7.5.3 • ISO 27001:A.12.4 — Traceability of changes, approvals, and deletions
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500">
            <option value="all" className="bg-slate-800">All Types</option>
            {uniqueTypes.map(t => (
              <option key={t} value={t} className="bg-slate-800">{entityLabels[t] || t}</option>
            ))}
          </select>
          <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500">
            <option value="all" className="bg-slate-800">All Actions</option>
            {uniqueActions.map(a => (
              <option key={a} value={a} className="bg-slate-800">{a.replace(/_/g, ' ')}</option>
            ))}
          </select>
          {(filterType !== 'all' || filterAction !== 'all') && (
            <button onClick={() => { setFilterType('all'); setFilterAction('all'); }}
              className="text-xs text-cyan-300 hover:text-cyan-200 underline">Clear filters</button>
          )}
          <span className="text-xs text-white/40">Showing {filtered.length} of {allActivities.length} entries</span>
        </div>

        {/* Activity List */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-12 text-center">
              <p className="text-white/70">{allActivities.length === 0 ? 'No activity recorded yet. Actions will appear here as users interact with the system.' : 'No entries match your filter.'}</p>
            </div>
          ) : (
            filtered.map((activity) => {
              const style = getActionStyle(activity.action);
              return (
                <div key={activity.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <span className={`text-sm font-bold ${style.color}`}>{style.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-semibold capitalize ${style.color}`}>
                          {activity.action?.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                          {entityLabels[activity.entity_type] || activity.entity_type}
                        </span>
                      </div>
                      {activity.changes && typeof activity.changes === 'object' && Object.keys(activity.changes).length > 0 && (
                        <div className="mt-1 text-xs text-white/40">
                          {Object.entries(activity.changes).map(([key, val]) => (
                            <span key={key} className="mr-3">
                              <span className="text-white/50">{key.replace(/_/g, ' ')}:</span>{' '}
                              <span className="text-white/70">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-white/30 mt-1">{formatDate(activity.timestamp)}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ActivityTrail;
