import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const ManagementReviews = () => {
  const { user, userProfile } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('active');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [isLeadAuditor, setIsLeadAuditor] = useState(false);

  useEffect(() => { checkUserRole(); fetchReviews(); }, [viewMode]);

  const checkUserRole = async () => {
    const email = userProfile?.email || user?.email || '';
    if (email === 'krugerreece@gmail.com') { setIsLeadAuditor(true); return; }
    try {
      const { data } = await supabase.from('user_roles').select('role').eq('user_id', user?.id).in('role', ['lead_auditor', 'superadmin']);
      if (data?.length > 0) setIsLeadAuditor(true);
    } catch (err) { console.error(err); }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      let query = supabase.from('management_reviews').select('*').order('created_at', { ascending: false });
      if (viewMode === 'active') query = query.or('archived.is.null,archived.eq.false');
      else if (viewMode === 'archived') query = query.eq('archived', true);
      const { data, error } = await query;
      if (error) throw error;
      setReviews(data || []);
    } catch (error) { alert('Failed to load reviews: ' + error.message); } finally { setLoading(false); }
  };

  const handleCreateReview = async (form) => {
    try {
      const { error } = await supabase.from('management_reviews').insert({
        company_id: userProfile?.company_id, review_number: form.review_number,
        review_date: form.review_date, review_time: form.review_time,
        chairperson: form.chairperson, attendees: form.attendees,
        agenda_items: form.agenda_items, minutes: form.minutes,
        decisions_made: form.decisions_made, action_items: form.action_items,
        resource_decisions: form.resource_decisions, improvement_opportunities: form.improvement_opportunities,
        next_review_date: form.next_review_date, status: 'Scheduled', created_by: user?.id,
      });
      if (error) throw error;
      alert('Review scheduled!'); setShowCreateForm(false); fetchReviews();
    } catch (err) { alert('Failed: ' + err.message); }
  };

  const handleArchive = async (id) => {
    if (!window.confirm('Archive this review?')) return;
    const reason = window.prompt('Reason for archiving (required):');
    if (!reason?.trim()) { alert('Reason required'); return; }
    try {
      const { error } = await supabase.from('management_reviews').update({ archived: true, archived_at: new Date().toISOString(), archived_by: user?.id, archive_reason: reason.trim() }).eq('id', id);
      if (error) throw error; alert('Archived!'); fetchReviews();
    } catch (err) { alert('Failed: ' + err.message); }
  };

  const handleRestore = async (id) => {
    if (!window.confirm('Restore this review?')) return;
    try {
      const { error } = await supabase.from('management_reviews').update({ archived: false, archived_at: null, archived_by: null, archive_reason: null }).eq('id', id);
      if (error) throw error; alert('Restored!'); fetchReviews();
    } catch (err) { alert('Failed: ' + err.message); }
  };

  const handlePermanentDelete = async (id) => {
    if (!isLeadAuditor) { alert('Only Lead Auditors/SuperAdmins can permanently delete'); return; }
    if (!window.confirm('PERMANENT DELETE — Cannot be undone! Continue?')) return;
    const reason = window.prompt('Deletion reason (required for audit trail):');
    if (!reason?.trim()) { alert('Reason required'); return; }
    try {
      await supabase.from('deletion_audit_trail').insert({ table_name: 'management_reviews', record_id: id, deleted_by: userProfile?.email || user?.email, reason: reason.trim(), deleted_at: new Date().toISOString() });
      const { error } = await supabase.from('management_reviews').delete().eq('id', id);
      if (error) throw error; alert('Permanently deleted'); fetchReviews();
    } catch (err) { alert('Failed: ' + err.message); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not set';

  const CreateForm = () => {
    const [f, setF] = useState({ review_number: '', review_date: new Date().toISOString().split('T')[0], review_time: '09:00', chairperson: '', attendees: '', agenda_items: '', minutes: '', decisions_made: '', action_items: '', resource_decisions: '', improvement_opportunities: '', next_review_date: '' });
    const set = (k, v) => setF({ ...f, [k]: v });
    const Field = ({ label, k, type = 'text', rows, placeholder, required }) => (
      <div>
        <label className="block text-sm text-white/70 mb-1">{label}{required && ' *'}</label>
        {rows ? <textarea value={f[k]} onChange={e => set(k, e.target.value)} rows={rows} placeholder={placeholder} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500" />
          : <input type={type} value={f[k]} onChange={e => set(k, e.target.value)} placeholder={placeholder} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500" />}
      </div>
    );
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border border-white/20 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
          <div className="flex justify-between mb-6"><h2 className="text-xl font-bold text-white">Schedule Management Review</h2><button onClick={() => setShowCreateForm(false)} className="text-white/50 hover:text-white text-2xl">&times;</button></div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4"><Field label="Review Number" k="review_number" placeholder="MR-2026-001" required /><Field label="Review Date" k="review_date" type="date" required /></div>
            <div className="grid grid-cols-2 gap-4"><Field label="Time" k="review_time" type="time" /><Field label="Chairperson" k="chairperson" placeholder="Name" required /></div>
            <Field label="Attendees" k="attendees" rows={2} placeholder="List attendees" />
            <Field label="Agenda Items" k="agenda_items" rows={3} placeholder="Meeting agenda" />
            <Field label="Decisions Made" k="decisions_made" rows={3} placeholder="Key decisions" />
            <Field label="Action Items" k="action_items" rows={3} placeholder="Actions, owners, deadlines" />
            <Field label="Improvement Opportunities (ISO 10.1)" k="improvement_opportunities" rows={2} placeholder="Continual improvement opportunities" />
            <Field label="Next Review Date" k="next_review_date" type="date" />
            <div className="flex gap-3 pt-4">
              <button onClick={() => setShowCreateForm(false)} className="flex-1 px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20">Cancel</button>
              <button onClick={() => { if (!f.review_number || !f.review_date || !f.chairperson) { alert('Fill required fields'); return; } handleCreateReview(f); }} className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold hover:scale-105 transition-transform">Schedule Review</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Detail = ({ r }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border border-white/20 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between mb-6"><h2 className="text-xl font-bold text-white">{r.review_number || 'Review Details'}</h2><button onClick={() => setSelectedReview(null)} className="text-white/50 hover:text-white text-2xl">&times;</button></div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[['Date', fmt(r.review_date)], ['Chairperson', r.chairperson || 'TBC'], ['Status', r.status || 'Scheduled'], ['Next Review', fmt(r.next_review_date)]].map(([l, v]) => (
              <div key={l} className="bg-white/5 rounded-xl p-3"><p className="text-xs text-white/50">{l}</p><p className="text-white font-medium">{v}</p></div>
            ))}
          </div>
          {[['Attendees', r.attendees], ['Agenda', r.agenda_items], ['Minutes', r.minutes], ['Decisions', r.decisions_made], ['Action Items', r.action_items], ['Improvement Opportunities', r.improvement_opportunities]].map(([l, v]) => v && (
            <div key={l} className="bg-white/5 rounded-xl p-3"><p className="text-xs text-white/50 mb-1">{l}</p><p className="text-white text-sm whitespace-pre-wrap">{v}</p></div>
          ))}
          {r.archived && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3"><p className="text-xs text-red-300">Archived: {r.archive_reason} • {fmt(r.archived_at)}</p></div>}
        </div>
      </div>
    </div>
  );

  if (loading) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div></div></Layout>;

  return (
    <Layout>
      <div className="space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Management Reviews</h1>
          <button onClick={() => setShowCreateForm(true)} className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg">Schedule Review</button>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-2">
          <p className="text-xs text-purple-300">ISO 9001:9.3 • ISO 14001:9.3 • ISO 45001:9.3 — Top management shall review the management system at planned intervals</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode('active')} className={`px-4 py-2 rounded-lg font-medium transition-all ${viewMode === 'active' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>Active ({reviews.filter(r => !r.archived).length})</button>
          <button onClick={() => setViewMode('archived')} className={`px-4 py-2 rounded-lg font-medium transition-all ${viewMode === 'archived' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>Archived ({reviews.filter(r => r.archived).length})</button>
        </div>
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-12 text-center"><p className="text-white/70">{viewMode === 'active' ? 'No active reviews. Schedule your first management review.' : 'No archived reviews'}</p></div>
          ) : reviews.map(r => (
            <div key={r.id} onClick={() => setSelectedReview(r)} className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 hover:bg-white/[0.15] transition-colors cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-white">{r.review_number || 'Untitled'}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${r.status === 'Completed' ? 'bg-green-500/20 text-green-300' : r.status === 'In Progress' ? 'bg-blue-500/20 text-blue-300' : 'bg-yellow-500/20 text-yellow-300'}`}>{r.status || 'Scheduled'}</span>
                    {r.archived && <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-300">Archived</span>}
                  </div>
                  <div className="text-sm text-white/50">{fmt(r.review_date)} • Chaired by {r.chairperson || 'TBC'}</div>
                </div>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  {viewMode === 'active' ? (
                    <button onClick={() => handleArchive(r.id)} className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-lg text-sm font-semibold">Archive</button>
                  ) : (<>
                    <button onClick={() => handleRestore(r.id)} className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-sm font-semibold">Restore</button>
                    {isLeadAuditor && <button onClick={() => handlePermanentDelete(r.id)} className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-bold">Delete</button>}
                  </>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {showCreateForm && <CreateForm />}
      {selectedReview && <Detail r={selectedReview} />}
    </Layout>
  );
};

export default ManagementReviews;
