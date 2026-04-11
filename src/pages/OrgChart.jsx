import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/auditLogger'
import Layout from '../components/Layout'
import ConfirmModal from '../components/ConfirmModal'

const STANDARDS = [
  { code: 'ISO_9001', label: 'ISO 9001' },
  { code: 'ISO_14001', label: 'ISO 14001' },
  { code: 'ISO_45001', label: 'ISO 45001' },
]

const STATUS_STYLES = {
  Active: 'bg-green-500/20 text-green-400 border-green-500/30',
  Vacant: 'bg-red-500/20 text-red-400 border-red-500/30',
  Acting: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
}

const OrgChart = () => {
  const { userProfile, getEffectiveCompanyId } = useAuth()
  const toast = useToast()
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('tree')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selectedPosition, setSelectedPosition] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)

  const defaultForm = {
    position_title: '', department: '', holder_name: '', holder_email: '',
    reports_to: '', position_level: 0, responsibilities: '', authorities: '',
    sheq_role: '', is_sheq_critical: false, standards: [], clause_references: ['5.3'],
    status: 'Active', effective_date: '', notes: '',
  }
  const [form, setForm] = useState(defaultForm)

  useEffect(() => {
    if (userProfile) fetchPositions()
  }, [userProfile])

  const fetchPositions = async () => {
    try {
      setLoading(true)
      const companyId = getEffectiveCompanyId()
      if (!companyId) return
      const { data, error } = await supabase
        .from('org_positions')
        .select('*')
        .eq('company_id', companyId)
        .order('position_level', { ascending: true })
      if (error) throw error
      setPositions(data || [])
    } catch (err) {
      console.error('Error fetching org positions:', err)
      toast.error('Failed to load organisation chart')
    } finally {
      setLoading(false)
    }
  }

  const toggleStandard = (code) => {
    setForm(prev => ({
      ...prev,
      standards: prev.standards.includes(code)
        ? prev.standards.filter(s => s !== code)
        : [...prev.standards, code]
    }))
  }

  const openAdd = () => {
    setEditing(null)
    setForm(defaultForm)
    setShowForm(true)
  }

  const openEdit = (pos) => {
    setEditing(pos)
    setForm({
      position_title: pos.position_title || '',
      department: pos.department || '',
      holder_name: pos.holder_name || '',
      holder_email: pos.holder_email || '',
      reports_to: pos.reports_to || '',
      position_level: pos.position_level || 0,
      responsibilities: pos.responsibilities || '',
      authorities: pos.authorities || '',
      sheq_role: pos.sheq_role || '',
      is_sheq_critical: pos.is_sheq_critical || false,
      standards: pos.standards || [],
      clause_references: pos.clause_references || ['5.3'],
      status: pos.status || 'Active',
      effective_date: pos.effective_date || '',
      notes: pos.notes || '',
    })
    setShowForm(true)
    setSelectedPosition(null)
  }

  const handleSave = async () => {
    if (!form.position_title.trim()) {
      toast.error('Position title is required')
      return
    }
    try {
      const companyId = getEffectiveCompanyId()
      const payload = {
        company_id: companyId,
        position_title: form.position_title.trim(),
        department: form.department.trim() || null,
        holder_name: form.holder_name.trim() || null,
        holder_email: form.holder_email.trim() || null,
        reports_to: form.reports_to || null,
        position_level: parseInt(form.position_level) || 0,
        responsibilities: form.responsibilities.trim() || null,
        authorities: form.authorities.trim() || null,
        sheq_role: form.sheq_role.trim() || null,
        is_sheq_critical: form.is_sheq_critical,
        standards: form.standards,
        clause_references: form.clause_references,
        status: form.status,
        effective_date: form.effective_date || null,
        notes: form.notes.trim() || null,
      }

      if (editing) {
        const { error } = await supabase
          .from('org_positions')
          .update(payload)
          .eq('id', editing.id)
        if (error) throw error
        await logActivity({ companyId, userId: userProfile.id, action: 'updated', entityType: 'org_position', entityId: editing.id, changes: { position_title: form.position_title } })
        toast.success('Position updated')
      } else {
        payload.created_by = userProfile.id
        const { data, error } = await supabase
          .from('org_positions')
          .insert(payload)
          .select('id')
          .single()
        if (error) throw error
        await logActivity({ companyId, userId: userProfile.id, action: 'created', entityType: 'org_position', entityId: data.id, changes: { position_title: form.position_title } })
        toast.success('Position created')
      }
      setShowForm(false)
      fetchPositions()
    } catch (err) {
      console.error('Error saving position:', err)
      toast.error('Failed to save position')
    }
  }

  const handleDelete = async (pos) => {
    try {
      const { error } = await supabase
        .from('org_positions')
        .delete()
        .eq('id', pos.id)
      if (error) throw error
      await logActivity({ companyId: getEffectiveCompanyId(), userId: userProfile.id, action: 'deleted', entityType: 'org_position', entityId: pos.id, changes: { position_title: pos.position_title } })
      toast.success('Position deleted')
      setSelectedPosition(null)
      fetchPositions()
    } catch (err) {
      console.error('Error deleting position:', err)
      toast.error('Failed to delete position')
    }
  }

  // Build tree from flat data
  const tree = useMemo(() => {
    const map = {}
    const roots = []
    positions.forEach(p => { map[p.id] = { ...p, children: [] } })
    positions.forEach(p => {
      if (p.reports_to && map[p.reports_to]) {
        map[p.reports_to].children.push(map[p.id])
      } else {
        roots.push(map[p.id])
      }
    })
    return roots
  }, [positions])

  // KPI calculations
  const kpis = useMemo(() => {
    const total = positions.length
    const vacant = positions.filter(p => p.status === 'Vacant').length
    const sheqCritical = positions.filter(p => p.is_sheq_critical).length
    const departments = new Set(positions.map(p => p.department).filter(Boolean)).size
    return { total, vacant, sheqCritical, departments }
  }, [positions])

  // Get position name by id
  const getPositionName = useCallback((id) => {
    const pos = positions.find(p => p.id === id)
    return pos ? pos.position_title : '-'
  }, [positions])

  // Tree node component
  const TreeNode = ({ node }) => {
    const isSheqCritical = node.is_sheq_critical
    const isVacant = node.status === 'Vacant'

    return (
      <div className="flex flex-col items-center">
        {/* Node card */}
        <button
          onClick={() => setSelectedPosition(node)}
          className={`glass-card p-3 sm:p-4 rounded-xl min-w-[160px] max-w-[220px] text-left transition-all hover:scale-105 cursor-pointer ${
            isSheqCritical ? 'border border-cyan-400/50 shadow-cyan-500/10 shadow-lg' : 'border border-white/10'
          } ${isVacant ? 'border-dashed border-red-400/50' : ''}`}
        >
          <p className="text-white font-semibold text-sm truncate">{node.position_title}</p>
          {node.holder_name && (
            <p className="text-white/60 text-xs mt-0.5 truncate">{node.holder_name}</p>
          )}
          {node.department && (
            <p className="text-white/40 text-[10px] mt-0.5 truncate">{node.department}</p>
          )}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {node.sheq_role && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/20">
                {node.sheq_role}
              </span>
            )}
            <span className={`px-1.5 py-0.5 rounded text-[10px] border ${STATUS_STYLES[node.status]}`}>
              {node.status}
            </span>
          </div>
        </button>

        {/* Children */}
        {node.children.length > 0 && (
          <div className="flex flex-col items-center mt-0">
            {/* Vertical connector down from parent */}
            <div className="w-px h-6 bg-white/20" />
            {/* Horizontal connector + children row */}
            <div className="relative flex items-start gap-2 sm:gap-4">
              {/* Horizontal line across children */}
              {node.children.length > 1 && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-white/20" style={{
                  width: `calc(100% - ${node.children.length > 1 ? '160px' : '0px'})`,
                  minWidth: node.children.length > 1 ? '80px' : '0px',
                }} />
              )}
              {node.children.map((child, idx) => (
                <div key={child.id} className="flex flex-col items-center">
                  {/* Vertical connector down to child */}
                  <div className="w-px h-6 bg-white/20" />
                  <TreeNode node={child} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Organisation Chart</h1>
            <p className="text-white/50 text-sm mt-1">ISO 5.3 — Organisational Roles, Responsibilities & Authorities</p>
          </div>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex rounded-lg overflow-hidden border border-white/10">
              <button
                onClick={() => setView('tree')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === 'tree' ? 'bg-purple-500/30 text-purple-300' : 'text-white/40 hover:text-white/60'}`}
              >
                Tree
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === 'list' ? 'bg-purple-500/30 text-purple-300' : 'text-white/40 hover:text-white/60'}`}
              >
                List
              </button>
            </div>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Position
            </button>
          </div>
        </div>

        {/* ISO Reference Card */}
        <div className="glass-card p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-white/60 text-sm">
              <span className="text-cyan-400 font-semibold">ISO 5.3</span> requires top management to assign responsibilities and authorities for relevant roles and communicate them within the organisation.
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Positions', value: kpis.total, color: 'from-purple-500/20 to-purple-500/5', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
            { label: 'Vacant', value: kpis.vacant, color: 'from-red-500/20 to-red-500/5', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
            { label: 'SHEQ-Critical', value: kpis.sheqCritical, color: 'from-cyan-500/20 to-cyan-500/5', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
            { label: 'Departments', value: kpis.departments, color: 'from-pink-500/20 to-pink-500/5', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
          ].map(kpi => (
            <div key={kpi.label} className={`glass-card p-4 rounded-xl bg-gradient-to-br ${kpi.color}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/40 text-xs">{kpi.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{kpi.value}</p>
                </div>
                <svg className="w-8 h-8 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={kpi.icon} />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : positions.length === 0 ? (
          <div className="glass-card p-12 rounded-xl text-center">
            <svg className="w-16 h-16 mx-auto text-white/10 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-white/60 font-medium mb-2">No positions defined</h3>
            <p className="text-white/30 text-sm mb-6">Start building your organisational chart by adding positions.</p>
            <button onClick={openAdd} className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium hover:opacity-90 transition-opacity">
              Add First Position
            </button>
          </div>
        ) : view === 'tree' ? (
          /* Tree View */
          <div className="glass-card p-6 rounded-xl overflow-x-auto">
            <div className="flex flex-col items-center gap-0 min-w-fit py-4">
              {tree.length === 0 ? (
                <p className="text-white/40 text-sm">All positions have a reports-to reference that could not be resolved. Check your hierarchy.</p>
              ) : (
                <div className="flex items-start gap-4 sm:gap-8">
                  {tree.map(root => (
                    <TreeNode key={root.id} node={root} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* List View */
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Position</th>
                    <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider hidden sm:table-cell">Holder</th>
                    <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider hidden md:table-cell">Department</th>
                    <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider hidden lg:table-cell">Reports To</th>
                    <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider hidden sm:table-cell">SHEQ Role</th>
                    <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {positions.map(pos => (
                    <tr key={pos.id} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setSelectedPosition(pos)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {pos.is_sheq_critical && (
                            <span className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" title="SHEQ-Critical" />
                          )}
                          <span className="text-white text-sm font-medium">{pos.position_title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white/60 text-sm hidden sm:table-cell">{pos.holder_name || '-'}</td>
                      <td className="px-4 py-3 text-white/50 text-sm hidden md:table-cell">{pos.department || '-'}</td>
                      <td className="px-4 py-3 text-white/50 text-sm hidden lg:table-cell">{pos.reports_to ? getPositionName(pos.reports_to) : '-'}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {pos.sheq_role ? (
                          <span className="px-2 py-0.5 rounded text-xs bg-cyan-500/20 text-cyan-400">{pos.sheq_role}</span>
                        ) : (
                          <span className="text-white/30 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs border ${STATUS_STYLES[pos.status]}`}>{pos.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEdit(pos) }}
                          className="text-white/30 hover:text-white/60 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Detail / View Modal */}
      {selectedPosition && !showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPosition(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg glass-card rounded-2xl p-6 border border-white/10 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedPosition.position_title}</h2>
                {selectedPosition.department && <p className="text-white/50 text-sm">{selectedPosition.department}</p>}
              </div>
              <button onClick={() => setSelectedPosition(null)} className="text-white/30 hover:text-white/60">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded text-xs border ${STATUS_STYLES[selectedPosition.status]}`}>{selectedPosition.status}</span>
                {selectedPosition.is_sheq_critical && (
                  <span className="px-2 py-0.5 rounded text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/20">SHEQ-Critical</span>
                )}
                {selectedPosition.sheq_role && (
                  <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">{selectedPosition.sheq_role}</span>
                )}
              </div>

              {selectedPosition.holder_name && (
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Holder</p>
                  <p className="text-white text-sm">{selectedPosition.holder_name}</p>
                  {selectedPosition.holder_email && <p className="text-white/50 text-xs">{selectedPosition.holder_email}</p>}
                </div>
              )}

              {selectedPosition.reports_to && (
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Reports To</p>
                  <p className="text-white text-sm">{getPositionName(selectedPosition.reports_to)}</p>
                </div>
              )}

              {selectedPosition.responsibilities && (
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Responsibilities</p>
                  <p className="text-white/70 text-sm whitespace-pre-wrap">{selectedPosition.responsibilities}</p>
                </div>
              )}

              {selectedPosition.authorities && (
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Authorities</p>
                  <p className="text-white/70 text-sm whitespace-pre-wrap">{selectedPosition.authorities}</p>
                </div>
              )}

              {selectedPosition.standards?.length > 0 && (
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Standards</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {selectedPosition.standards.map(s => (
                      <span key={s} className="px-2 py-0.5 rounded text-xs bg-white/10 text-white/60">{s.replace('_', ' ')}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedPosition.effective_date && (
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Effective Date</p>
                  <p className="text-white/70 text-sm">{new Date(selectedPosition.effective_date).toLocaleDateString()}</p>
                </div>
              )}

              {selectedPosition.notes && (
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-white/50 text-sm whitespace-pre-wrap">{selectedPosition.notes}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/10">
              <button
                onClick={() => openEdit(selectedPosition)}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Edit
              </button>
              <button
                onClick={() => setConfirmAction({ type: 'delete', item: selectedPosition })}
                className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-2xl glass-card rounded-2xl p-6 border border-white/10 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">{editing ? 'Edit Position' : 'Add Position'}</h2>
              <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white/60">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Row 1: Title + Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/50 text-xs mb-1">Position Title *</label>
                  <input
                    type="text"
                    value={form.position_title}
                    onChange={e => setForm(prev => ({ ...prev, position_title: e.target.value }))}
                    className="glass-input w-full px-3 py-2 rounded-lg text-white text-sm"
                    placeholder="e.g. Managing Director"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-xs mb-1">Department</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={e => setForm(prev => ({ ...prev, department: e.target.value }))}
                    className="glass-input w-full px-3 py-2 rounded-lg text-white text-sm"
                    placeholder="e.g. Executive"
                  />
                </div>
              </div>

              {/* Row 2: Holder Name + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/50 text-xs mb-1">Holder Name</label>
                  <input
                    type="text"
                    value={form.holder_name}
                    onChange={e => setForm(prev => ({ ...prev, holder_name: e.target.value }))}
                    className="glass-input w-full px-3 py-2 rounded-lg text-white text-sm"
                    placeholder="e.g. John Smith"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-xs mb-1">Holder Email</label>
                  <input
                    type="email"
                    value={form.holder_email}
                    onChange={e => setForm(prev => ({ ...prev, holder_email: e.target.value }))}
                    className="glass-input w-full px-3 py-2 rounded-lg text-white text-sm"
                    placeholder="e.g. john@company.co.za"
                  />
                </div>
              </div>

              {/* Row 3: Reports To + Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/50 text-xs mb-1">Reports To</label>
                  <select
                    value={form.reports_to}
                    onChange={e => setForm(prev => ({ ...prev, reports_to: e.target.value }))}
                    className="glass-input w-full px-3 py-2 rounded-lg text-white text-sm"
                  >
                    <option value="">None (Top Level)</option>
                    {positions
                      .filter(p => !editing || p.id !== editing.id)
                      .map(p => (
                        <option key={p.id} value={p.id}>{p.position_title}{p.holder_name ? ` (${p.holder_name})` : ''}</option>
                      ))
                    }
                  </select>
                </div>
                <div>
                  <label className="block text-white/50 text-xs mb-1">Position Level</label>
                  <input
                    type="number"
                    min="0"
                    value={form.position_level}
                    onChange={e => setForm(prev => ({ ...prev, position_level: e.target.value }))}
                    className="glass-input w-full px-3 py-2 rounded-lg text-white text-sm"
                  />
                </div>
              </div>

              {/* Row 4: SHEQ Role + Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/50 text-xs mb-1">SHEQ Role</label>
                  <input
                    type="text"
                    value={form.sheq_role}
                    onChange={e => setForm(prev => ({ ...prev, sheq_role: e.target.value }))}
                    className="glass-input w-full px-3 py-2 rounded-lg text-white text-sm"
                    placeholder="e.g. SHE Officer, MR, EMS Manager"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-xs mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                    className="glass-input w-full px-3 py-2 rounded-lg text-white text-sm"
                  >
                    <option value="Active">Active</option>
                    <option value="Vacant">Vacant</option>
                    <option value="Acting">Acting</option>
                  </select>
                </div>
              </div>

              {/* SHEQ Critical + Effective Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    id="sheq-critical"
                    checked={form.is_sheq_critical}
                    onChange={e => setForm(prev => ({ ...prev, is_sheq_critical: e.target.checked }))}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500"
                  />
                  <label htmlFor="sheq-critical" className="text-white/60 text-sm">SHEQ-Critical Position</label>
                </div>
                <div>
                  <label className="block text-white/50 text-xs mb-1">Effective Date</label>
                  <input
                    type="date"
                    value={form.effective_date}
                    onChange={e => setForm(prev => ({ ...prev, effective_date: e.target.value }))}
                    className="glass-input w-full px-3 py-2 rounded-lg text-white text-sm"
                  />
                </div>
              </div>

              {/* Standards */}
              <div>
                <label className="block text-white/50 text-xs mb-2">Applicable Standards</label>
                <div className="flex flex-wrap gap-2">
                  {STANDARDS.map(std => (
                    <button
                      key={std.code}
                      type="button"
                      onClick={() => toggleStandard(std.code)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        form.standards.includes(std.code)
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          : 'text-white/30 border-white/10 hover:text-white/50'
                      }`}
                    >
                      {std.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Responsibilities */}
              <div>
                <label className="block text-white/50 text-xs mb-1">Responsibilities</label>
                <textarea
                  value={form.responsibilities}
                  onChange={e => setForm(prev => ({ ...prev, responsibilities: e.target.value }))}
                  rows={3}
                  className="glass-input w-full px-3 py-2 rounded-lg text-white text-sm resize-none"
                  placeholder="Key responsibilities for this role..."
                />
              </div>

              {/* Authorities */}
              <div>
                <label className="block text-white/50 text-xs mb-1">Authorities</label>
                <textarea
                  value={form.authorities}
                  onChange={e => setForm(prev => ({ ...prev, authorities: e.target.value }))}
                  rows={3}
                  className="glass-input w-full px-3 py-2 rounded-lg text-white text-sm resize-none"
                  placeholder="Decision-making authority and scope..."
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-white/50 text-xs mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="glass-input w-full px-3 py-2 rounded-lg text-white text-sm resize-none"
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/10">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {editing ? 'Update Position' : 'Create Position'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg border border-white/10 text-white/50 text-sm hover:text-white/70 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmAction && (
        <ConfirmModal
          title="Delete Position"
          message={`Are you sure you want to delete "${confirmAction.item.position_title}"? Any positions reporting to this one will become top-level.`}
          confirmLabel="Delete"
          onConfirm={() => {
            handleDelete(confirmAction.item)
            setConfirmAction(null)
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </Layout>
  )
}

export default OrgChart
