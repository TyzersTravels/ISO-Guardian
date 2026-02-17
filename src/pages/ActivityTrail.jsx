import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const ActivityTrail = () => {
  const { user, userProfile } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterAction, setFilterAction] = useState('all');

  useEffect(() => { fetchActivities(); }, [filterType, filterAction]);

  const fetchActivities = async () => {
    try {
      setLoading(true);

      // Fetch from audit_log
      let query = supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (filterType !== 'all') query = query.eq('entity_type', filterType);
      if (filterAction !== 'all') query = query.eq('action', filterAction);

      const { data: auditData, error: auditError } = await query;

      // Also fetch deletion trail
      const { data: deletionData, error: delError } = await supabase
        .from('deletion_audit_trail')
        .select('*')
        .order('deleted_at', { ascending: false })
        .limit(50);

      if (auditError) throw auditError;

      // Combine and sort
      const combined = [
        ...(auditData || []).map(a => ({
          id: a.id,
          type: 'activity',
          action: a.action,
          entity_type: a.entity_type,
          entity_id: a.entity_id,
          changes: a.changes,
          user_id: a.user_id,
          timestamp: a.created_at,
        })),
        ...(deletionData || []).map(d => ({
          id: d.id,
          type: 'deletion',
          action: 'permanently_deleted',
          entity_type: d.table_name,
          entity_id: d.record_id,
          changes: { reason: d.reason },
          user_id: d.deleted_by,
          timestamp: d.deleted_at,
        })),
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setActivities(combined);
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

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
  };

  const entityLabels = {
    document: 'Document',
    ncr: 'NCR',
    audit: 'Audit',
    management_review: 'Management Review',
    management_reviews: 'Management Review',
    documents: 'Document',
    ncrs: 'NCR',
    audits: 'Audit',
  };

  const getActionStyle = (action) => actionIcons[action] || { icon: '•', color: 'text-white/60', bg: 'bg-white/10' };

  const uniqueTypes = [...new Set(activities.map(a => a.entity_type))].filter(Boolean);
  const uniqueActions = [...new Set(activities.map(a => a.action))].filter(Boolean);

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
            <p className="text-sm text-white/50 mt-1">Complete audit log of all actions — ISO 7.5 documented information control</p>
          </div>
          <button onClick={fetchActivities} className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm hover:bg-white/20">
            Refresh
          </button>
        </div>

        {/* ISO Reference */}
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-2">
          <p className="text-xs text-purple-300">
            ISO 9001:7.5.3 • ISO 27001:A.12.4 — Control of documented information requires traceability of changes, approvals, and deletions
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
              <option key={a} value={a} className="bg-slate-800">{a.replace('_', ' ')}</option>
            ))}
          </select>
          <span className="text-xs text-white/40">{activities.length} entries</span>
        </div>

        {/* Activity List */}
        <div className="space-y-2">
          {activities.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-12 text-center">
              <p className="text-white/70">No activity recorded yet. Actions will appear here as users interact with the system.</p>
            </div>
          ) : (
            activities.map((activity) => {
              const style = getActionStyle(activity.action);
              return (
                <div key={activity.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <span className={`text-sm font-bold ${style.color}`}>{style.icon}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-semibold capitalize ${style.color}`}>
                          {activity.action?.replace('_', ' ')}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                          {entityLabels[activity.entity_type] || activity.entity_type}
                        </span>
                      </div>

                      {/* Changes detail */}
                      {activity.changes && typeof activity.changes === 'object' && Object.keys(activity.changes).length > 0 && (
                        <div className="mt-1 text-xs text-white/40">
                          {Object.entries(activity.changes).map(([key, val]) => (
                            <span key={key} className="mr-3">
                              <span className="text-white/50">{key.replace('_', ' ')}:</span>{' '}
                              <span className="text-white/70">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Timestamp */}
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
