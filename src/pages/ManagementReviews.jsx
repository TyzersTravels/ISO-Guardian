import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const ReviewForm = ({ review, userProfile, userId, onClose, onSaved, mode = 'create' }) => {
  const [reviewNumber, setReviewNumber] = useState(review?.review_number || '');
  const [reviewDate, setReviewDate] = useState(review?.review_date || new Date().toISOString().split('T')[0]);
  const [reviewTime, setReviewTime] = useState(review?.review_time || '09:00');
  const [chairperson, setChairperson] = useState(review?.chairperson || '');
  const [attendees, setAttendees] = useState(review?.attendees || '');
  const [agendaItems, setAgendaItems] = useState(review?.agenda_items || '');
  const [minutes, setMinutes] = useState(review?.minutes || '');
  const [decisionsMade, setDecisionsMade] = useState(review?.decisions_made || '');
  const [actionItems, setActionItems] = useState(review?.action_items || '');
  const [resourceDecisions, setResourceDecisions] = useState(review?.resource_decisions || '');
  const [improvementOpportunities, setImprovementOpportunities] = useState(review?.improvement_opportunities || '');
  const [nextReviewDate, setNextReviewDate] = useState(review?.next_review_date || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reviewNumber || !reviewDate || !chairperson) { alert('Please fill in Review Number, Date, and Chairperson'); return; }
    setSubmitting(true);
    try {
      const payload = { review_number: reviewNumber, review_date: reviewDate, review_time: reviewTime, chairperson, attendees: attendees || null, agenda_items: agendaItems || null, minutes: minutes || null, decisions_made: decisionsMade || null, action_items: actionItems || null, resource_decisions: resourceDecisions || null, improvement_opportunities: improvementOpportunities || null, next_review_date: nextReviewDate || null };
      if (mode === 'edit') {
        const { error } = await supabase.from('management_reviews').update(payload).eq('id', review.id);
        if (error) throw error;
        await supabase.from('audit_log').insert({ company_id: userProfile?.company_id, user_id: userId, action: 'updated', entity_type: 'management_review', entity_id: review.id, changes: { review_number: reviewNumber } });
        alert('Review updated!');
      } else {
        payload.company_id = userProfile?.company_id; payload.status = 'Scheduled'; payload.created_by = userId;
        const { error } = await supabase.from('management_reviews').insert(payload);
        if (error) throw error;
        await supabase.from('audit_log').insert({ company_id: userProfile?.company_id, user_id: userId, action: 'created', entity_type: 'management_review', entity_id: null, changes: { review_number: reviewNumber, chairperson } });
        alert('Review scheduled!');
      }
      onSaved();
    } catch (err) { alert('Failed: ' + err.message); } finally { setSubmitting(false); }
  };

  const c = "w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500";
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border border-white/20 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{mode === 'edit' ? 'Update Management Review' : 'Schedule Management Review'}</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white text-2xl">&times;</button>
        </div>
        {mode === 'edit' && <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2 mb-4"><p className="text-xs text-blue-300">Update this review with meeting outcomes, minutes, decisions, and action items.</p></div>}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-white/70 mb-1">Review Number *</label><input type="text" value={reviewNumber} onChange={e => setReviewNumber(e.target.value)} placeholder="MR-2026-001" className={c} disabled={mode === 'edit'} /></div>
            <div><label className="block text-sm text-white/70 mb-1">Review Date *</label><input type="date" value={reviewDate} onChange={e => setReviewDate(e.target.value)} className={c} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-white/70 mb-1">Time</label><input type="time" value={reviewTime} onChange={e => setReviewTime(e.target.value)} className={c} /></div>
            <div><label className="block text-sm text-white/70 mb-1">Chairperson *</label><input type="text" value={chairperson} onChange={e => setChairperson(e.target.value)} placeholder="Name" className={c} /></div>
          </div>
          <div><label className="block text-sm text-white/70 mb-1">Attendees</label><textarea value={attendees} onChange={e => setAttendees(e.target.value)} placeholder="List attendees (one per line)" rows={2} className={c} /></div>
          <div><label className="block text-sm text-white/70 mb-1">Agenda Items</label><textarea value={agendaItems} onChange={e => setAgendaItems(e.target.value)} placeholder="Meeting agenda" rows={3} className={c} /></div>
          <div><label className="block text-sm text-white/70 mb-1">Minutes / Discussion Notes {mode === 'edit' ? '(update after meeting)' : ''}</label><textarea value={minutes} onChange={e => setMinutes(e.target.value)} placeholder="Record what was discussed..." rows={5} className={c} /></div>
          <div><label className="block text-sm text-white/70 mb-1">Decisions Made</label><textarea value={decisionsMade} onChange={e => setDecisionsMade(e.target.value)} placeholder="Key decisions" rows={3} className={c} /></div>
          <div><label className="block text-sm text-white/70 mb-1">Action Items</label><textarea value={actionItems} onChange={e => setActionItems(e.target.value)} placeholder="Actions, owners, deadlines" rows={3} className={c} /></div>
          <div><label className="block text-sm text-white/70 mb-1">Resource Decisions</label><textarea value={resourceDecisions} onChange={e => setResourceDecisions(e.target.value)} placeholder="Resource allocation" rows={2} className={c} /></div>
          <div><label className="block text-sm text-white/70 mb-1">Improvement Opportunities (ISO 10.1)</label><textarea value={improvementOpportunities} onChange={e => setImprovementOpportunities(e.target.value)} placeholder="Continual improvement" rows={2} className={c} /></div>
          <div><label className="block text-sm text-white/70 mb-1">Next Review Date</label><input type="date" value={nextReviewDate} onChange={e => setNextReviewDate(e.target.value)} className={c} /></div>
          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting} className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50">{submitting ? (mode === 'edit' ? 'Saving...' : 'Scheduling...') : (mode === 'edit' ? 'Save Changes' : 'Schedule Review')}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ManagementReviews = () => {
  const { user, userProfile } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('active');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [isLeadAuditor, setIsLeadAuditor] = useState(false);

  useEffect(() => { checkUserRole(); fetchReviews(); }, [viewMode]);

  const checkUserRole = async () => {
    const email = userProfile?.email || user?.email || '';
    if (email === 'krugerreece@gmail.com') { setIsLeadAuditor(true); return; }
    try { const { data } = await supabase.from('user_roles').select('role').eq('user_id', user?.id).in('role', ['lead_auditor', 'superadmin']); if (data?.length > 0) setIsLeadAuditor(true); } catch (err) {}
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      let query = supabase.from('management_reviews').select('*').order('created_at', { ascending: false });
      if (viewMode === 'active') query = query.or('archived.is.null,archived.eq.false');
      else query = query.eq('archived', true);
      const { data, error } = await query;
      if (error) throw error;
      setReviews(data || []);
    } catch (e) { alert('Failed: ' + e.message); } finally { setLoading(false); }
  };

  const log = async (action, id, details) => { try { await supabase.from('audit_log').insert({ company_id: userProfile?.company_id, user_id: user?.id, action, entity_type: 'management_review', entity_id: id, changes: details }); } catch(e) {} };

  const handleArchive = async (id) => {
    const reason = window.prompt('Archive reason (required):');
    if (!reason?.trim()) return;
    try { await supabase.from('management_reviews').update({ archived: true, archive_reason: reason.trim(), archived_at: new Date().toISOString() }).eq('id', id); await log('archived', id, { reason: reason.trim() }); fetchReviews(); setSelectedReview(null); } catch (e) { alert('Failed: ' + e.message); }
  };
  const handleRestore = async (id) => { try { await supabase.from('management_reviews').update({ archived: false, archive_reason: null, archived_at: null }).eq('id', id); await log('restored', id, {}); fetchReviews(); } catch (e) { alert('Failed: ' + e.message); } };
  const handleDelete = async (id) => {
    if (!confirm('PERMANENTLY DELETE? Cannot be undone.')) return;
    const reason = window.prompt('Deletion reason (required):');
    if (!reason?.trim()) return;
    try { await supabase.from('deletion_audit_trail').insert({ table_name: 'management_reviews', record_id: id, deleted_by: user?.id, reason: reason.trim(), deleted_at: new Date().toISOString() }); await log('permanently_deleted', id, { reason: reason.trim() }); await supabase.from('management_reviews').delete().eq('id', id); fetchReviews(); } catch (e) { alert('Failed: ' + e.message); }
  };
  const handleStatus = async (id, s) => { try { await supabase.from('management_reviews').update({ status: s }).eq('id', id); await log('status_changed', id, { new_status: s }); fetchReviews(); setSelectedReview(null); } catch (e) { alert('Failed: ' + e.message); } };

  const exportReview = async (r) => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF('p', 'mm', 'a4');
      const pw = doc.internal.pageSize.getWidth(); const ph = doc.internal.pageSize.getHeight(); const m = 20; const cw = pw - m * 2;
      
      // Load BOTH logos - company as hero, ISOGuardian as subtle
      let companyLogo = null;
      let igLogo = null;
      const loadImg = async (url) => { try { const resp = await fetch(url); const bl = await resp.blob(); return await new Promise(res => { const rd = new FileReader(); rd.onload = () => res(rd.result); rd.readAsDataURL(bl); }); } catch(e) { return null; } };
      
      const companyLogoUrl = userProfile?.company?.logo_url;
      if (companyLogoUrl) companyLogo = await loadImg(companyLogoUrl);
      igLogo = await loadImg('/isoguardian-logo.png');
      
      const companyCode = userProfile?.company?.company_code || 'XX';
      const companyName = userProfile?.company?.name || 'Company';

      const addHF = (pg) => {
        doc.setFillColor(124, 58, 237); doc.rect(0, 0, pw, 30, 'F');
        // Company logo = hero (left side)
        if (companyLogo) try { doc.addImage(companyLogo, 'PNG', m, 2, 26, 26); } catch(e) {}
        doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(255, 255, 255);
        doc.text(companyName, companyLogo ? m + 30 : m, 13);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(220, 220, 255);
        doc.text('Integrated Management System', companyLogo ? m + 30 : m, 19);
        // ISOGuardian logo = subtle (right side, small)
        if (igLogo) try { doc.addImage(igLogo, 'PNG', pw - m - 10, 5, 8, 8); } catch(e) {}
        doc.setFontSize(5); doc.setTextColor(200, 200, 255);
        doc.text('Powered by ISOGuardian', pw - m, 17, { align: 'right' });
        doc.text(`Page ${pg}`, pw - m, 26, { align: 'right' });
        // Footer
        doc.setDrawColor(124, 58, 237); doc.line(m, ph - 13, pw - m, ph - 13);
        doc.setFontSize(6); doc.setTextColor(107, 114, 128);
        doc.text(`${companyName} | ISOGuardian (Pty) Ltd | Reg: 2026/082362/07`, m, ph - 9);
        doc.text(`Printed: ${new Date().toLocaleDateString('en-ZA')} | CONFIDENTIAL`, pw - m, ph - 9, { align: 'right' });
      };

      addHF(1);
      // Doc control
      const dn = `IG-${companyCode}-MR-${String(r.review_number || '').replace(/\D/g, '').slice(-3).padStart(3, '0')}`;
      doc.setFillColor(249, 250, 251); doc.rect(m, 33, cw, 14, 'F'); doc.setDrawColor(200, 200, 200); doc.rect(m, 33, cw, 14, 'S');
      const cl = cw / 3;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(30, 27, 75);
      doc.text('Document No.', m + 3, 38); doc.text('Revision', m + cl + 3, 38); doc.text('Date of Review', m + cl * 2 + 3, 38);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(124, 58, 237);
      doc.text(dn, m + 3, 44); doc.text('Rev 01', m + cl + 3, 44); doc.text('31 January 2027', m + cl * 2 + 3, 44);
      doc.line(m + cl, 33, m + cl, 47); doc.line(m + cl * 2, 33, m + cl * 2, 47);

      let y = 54;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(30, 27, 75);
      doc.text('MANAGEMENT REVIEW MINUTES', m, y); y += 8;
      doc.setDrawColor(124, 58, 237); doc.setLineWidth(0.5); doc.line(m, y, pw - m, y); y += 6;

      const lbl = (l, v, yp) => { doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(107, 114, 128); doc.text(l + ':', m, yp); doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 27, 75); doc.text(String(v || 'N/A'), m + doc.getTextWidth(l + ': ') + 2, yp); return yp + 5; };
      const sc = (t, yp) => { if (yp > ph - 35) { doc.addPage(); addHF(doc.getNumberOfPages()); yp = 40; } doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(124, 58, 237); doc.text(t, m, yp); return yp + 6; };
      const bd = (t, yp) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(30, 27, 75); const ls = doc.splitTextToSize(String(t || ''), cw); if (yp + ls.length * 4 > ph - 30) { doc.addPage(); addHF(doc.getNumberOfPages()); yp = 40; } doc.text(ls, m, yp); return yp + ls.length * 4 + 3; };

      y = sc('Review Details', y);
      y = lbl('Review Number', r.review_number, y); y = lbl('Date', r.review_date ? new Date(r.review_date).toLocaleDateString('en-ZA') : 'N/A', y);
      y = lbl('Chairperson', r.chairperson, y); y = lbl('Status', r.status, y);
      y = lbl('Next Review', r.next_review_date ? new Date(r.next_review_date).toLocaleDateString('en-ZA') : 'N/A', y); y += 3;

      if (r.attendees) { y = sc('Attendees', y); y = bd(r.attendees, y); }
      if (r.agenda_items) { y = sc('Agenda', y); y = bd(r.agenda_items, y); }
      if (r.minutes) { y = sc('Meeting Minutes', y); y = bd(r.minutes, y); }
      if (r.decisions_made) { y = sc('Decisions Made', y); y = bd(r.decisions_made, y); }
      if (r.action_items) { y = sc('Action Items', y); y = bd(r.action_items, y); }
      if (r.resource_decisions) { y = sc('Resource Decisions', y); y = bd(r.resource_decisions, y); }
      if (r.improvement_opportunities) { y = sc('Improvement Opportunities', y); y = bd(r.improvement_opportunities, y); }

      // Signatures
      if (y > ph - 55) { doc.addPage(); addHF(doc.getNumberOfPages()); y = 40; }
      y += 4; y = sc('Signatures', y);
      const sw = (cw - 10) / 2;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(30, 27, 75);
      doc.text('Chairperson:', m, y); doc.line(m, y + 10, m + sw, y + 10);
      doc.setFontSize(7); doc.setTextColor(107, 114, 128);
      doc.text('Signature', m, y + 14); doc.text('Name: ' + (r.chairperson || '________'), m, y + 19); doc.text('Date: ________', m, y + 24);
      doc.setFontSize(8); doc.setTextColor(30, 27, 75);
      doc.text('Management Rep:', m + sw + 10, y); doc.line(m + sw + 10, y + 10, pw - m, y + 10);
      doc.setFontSize(7); doc.setTextColor(107, 114, 128);
      doc.text('Signature', m + sw + 10, y + 14); doc.text('Name: ________', m + sw + 10, y + 19); doc.text('Date: ________', m + sw + 10, y + 24);

      doc.save(`${r.review_number || 'MR'}_Management_Review.pdf`);
    } catch (err) { alert('Export failed: ' + err.message); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not set';

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
          {[['Attendees', r.attendees], ['Agenda', r.agenda_items], ['Minutes', r.minutes], ['Decisions', r.decisions_made], ['Action Items', r.action_items], ['Resource Decisions', r.resource_decisions], ['Improvement Opportunities', r.improvement_opportunities]].map(([l, v]) => v ? (
            <div key={l} className="bg-white/5 rounded-xl p-3"><p className="text-xs text-white/50 mb-1">{l}</p><p className="text-white text-sm whitespace-pre-wrap">{v}</p></div>
          ) : null)}
          {r.archived && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3"><p className="text-xs text-red-300">Archived: {r.archive_reason} • {fmt(r.archived_at)}</p></div>}
          {!r.archived && (
            <div className="flex gap-2 flex-wrap pt-2 border-t border-white/10">
              <button onClick={() => { setSelectedReview(null); setEditingReview(r); }} className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-sm font-semibold">Edit / Update</button>
              {r.status !== 'In Progress' && <button onClick={() => handleStatus(r.id, 'In Progress')} className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-sm font-semibold">In Progress</button>}
              {r.status !== 'Completed' && <button onClick={() => handleStatus(r.id, 'Completed')} className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-sm font-semibold">Complete</button>}
              <button onClick={() => exportReview(r)} className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg text-sm font-semibold">Export PDF</button>
              <button onClick={() => handleArchive(r.id)} className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-lg text-sm font-semibold">Archive</button>
            </div>
          )}
          {r.archived && (
            <div className="flex gap-2 flex-wrap pt-2 border-t border-white/10">
              <button onClick={() => exportReview(r)} className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg text-sm font-semibold">Export PDF</button>
            </div>
          )}
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
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-2"><p className="text-xs text-purple-300">ISO 9001:9.3 • ISO 14001:9.3 • ISO 45001:9.3 — Top management shall review the management system at planned intervals</p></div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode('active')} className={`px-4 py-2 rounded-lg font-medium transition-all ${viewMode === 'active' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>Active ({reviews.filter(r => !r.archived).length})</button>
          <button onClick={() => setViewMode('archived')} className={`px-4 py-2 rounded-lg font-medium transition-all ${viewMode === 'archived' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>Archived ({reviews.filter(r => r.archived).length})</button>
        </div>
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-12 text-center"><p className="text-white/70">{viewMode === 'active' ? 'No active reviews. Schedule your first management review.' : 'No archived reviews.'}</p></div>
          ) : reviews.map(r => (
            <div key={r.id} onClick={() => setSelectedReview(r)} className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 hover:bg-white/[0.15] transition-colors cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-white">{r.review_number || 'Untitled'}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${r.status === 'Completed' ? 'bg-green-500/20 text-green-300' : r.status === 'In Progress' ? 'bg-blue-500/20 text-blue-300' : 'bg-yellow-500/20 text-yellow-300'}`}>{r.status || 'Scheduled'}</span>
                    {r.archived && <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-300">Archived</span>}
                    {r.minutes && <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300">Minutes recorded</span>}
                  </div>
                  <div className="text-sm text-white/50">{fmt(r.review_date)} • Chaired by {r.chairperson || 'TBC'}</div>
                </div>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  {viewMode === 'active' ? (<>
                    <button onClick={() => setEditingReview(r)} className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-xs font-semibold">Edit</button>
                    {r.status === 'Scheduled' && <button onClick={() => handleStatus(r.id, 'In Progress')} className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-xs font-semibold">Start</button>}
                    {r.status === 'In Progress' && <button onClick={() => handleStatus(r.id, 'Completed')} className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-xs font-semibold">Complete</button>}
                    <button onClick={() => handleArchive(r.id)} className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-lg text-xs font-semibold">Archive</button>
                  </>) : (<>
                    <button onClick={() => handleRestore(r.id)} className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-xs font-semibold">Restore</button>
                    {isLeadAuditor && <button onClick={() => handleDelete(r.id)} className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs font-bold">Delete</button>}
                  </>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {showCreateForm && <ReviewForm userProfile={userProfile} userId={user?.id} onClose={() => setShowCreateForm(false)} onSaved={() => { setShowCreateForm(false); fetchReviews(); }} mode="create" />}
      {editingReview && <ReviewForm review={editingReview} userProfile={userProfile} userId={user?.id} onClose={() => setEditingReview(null)} onSaved={() => { setEditingReview(null); fetchReviews(); }} mode="edit" />}
      {selectedReview && <Detail r={selectedReview} />}
    </Layout>
  );
};

export default ManagementReviews;
