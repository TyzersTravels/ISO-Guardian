import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import Layout from '../components/Layout'
import { TEMPLATES, DOC_NUMBER_MAP, resolveAllPlaceholders } from '../lib/templateData'
import { TEMPLATE_CONTENT } from '../lib/templateContent'

// ─── Debounce hook ───
function useDebounce(callback, delay) {
  const timer = useRef(null)
  const cb = useRef(callback)
  cb.current = callback
  return useCallback((...args) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => cb.current(...args), delay)
  }, [delay])
}

// ─── Convert markdown-ish template body to TipTap JSON ───
function markdownToTipTap(text) {
  if (!text) return { type: 'doc', content: [{ type: 'paragraph' }] }

  const lines = text.split('\n')
  const content = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Empty line → paragraph break
    if (!line.trim()) {
      content.push({ type: 'paragraph' })
      i++
      continue
    }

    // Table detection
    if (line.trim().startsWith('|') && i + 1 < lines.length && lines[i + 1]?.trim().startsWith('|---')) {
      const tableRows = []
      while (i < lines.length && lines[i]?.trim().startsWith('|')) {
        const row = lines[i].trim()
        if (!row.startsWith('|---')) {
          const cells = row.split('|').filter(c => c.trim() !== '').map(c => c.trim())
          tableRows.push(cells)
        }
        i++
      }
      if (tableRows.length > 0) {
        const rows = tableRows.map((cells, ri) => ({
          type: 'tableRow',
          content: cells.map(cell => ({
            type: ri === 0 ? 'tableHeader' : 'tableCell',
            content: [{ type: 'paragraph', content: cell ? [{ type: 'text', text: cell }] : [] }]
          }))
        }))
        content.push({ type: 'table', content: rows })
      }
      continue
    }

    // Bullet list
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const items = []
      while (i < lines.length && (lines[i]?.trim().startsWith('- ') || lines[i]?.trim().startsWith('* '))) {
        const itemText = lines[i].trim().replace(/^[-*]\s+/, '')
        items.push({
          type: 'listItem',
          content: [{ type: 'paragraph', content: parseInline(itemText) }]
        })
        i++
      }
      content.push({ type: 'bulletList', content: items })
      continue
    }

    // Numbered list
    if (/^\d+\.\s/.test(line.trim())) {
      const items = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i]?.trim() || '')) {
        const itemText = lines[i].trim().replace(/^\d+\.\s+/, '')
        items.push({
          type: 'listItem',
          content: [{ type: 'paragraph', content: parseInline(itemText) }]
        })
        i++
      }
      content.push({ type: 'orderedList', content: items })
      continue
    }

    // Blockquote
    if (line.trim().startsWith('> ')) {
      const quoteLines = []
      while (i < lines.length && lines[i]?.trim().startsWith('> ')) {
        quoteLines.push(lines[i].trim().replace(/^>\s*/, ''))
        i++
      }
      content.push({
        type: 'blockquote',
        content: [{ type: 'paragraph', content: parseInline(quoteLines.join(' ')) }]
      })
      continue
    }

    // Regular paragraph
    content.push({ type: 'paragraph', content: parseInline(line) })
    i++
  }

  return { type: 'doc', content: content.length > 0 ? content : [{ type: 'paragraph' }] }
}

// Parse inline formatting: **bold**, *italic*, `code`
function parseInline(text) {
  if (!text) return []
  const result = []
  let remaining = text

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*(.*)$/s)
    if (boldMatch) {
      if (boldMatch[1]) result.push({ type: 'text', text: boldMatch[1] })
      result.push({ type: 'text', marks: [{ type: 'bold' }], text: boldMatch[2] })
      remaining = boldMatch[3]
      continue
    }
    // Italic
    const italicMatch = remaining.match(/^(.*?)\*(.+?)\*(.*)$/s)
    if (italicMatch) {
      if (italicMatch[1]) result.push({ type: 'text', text: italicMatch[1] })
      result.push({ type: 'text', marks: [{ type: 'italic' }], text: italicMatch[2] })
      remaining = italicMatch[3]
      continue
    }
    // Code
    const codeMatch = remaining.match(/^(.*?)`(.+?)`(.*)$/s)
    if (codeMatch) {
      if (codeMatch[1]) result.push({ type: 'text', text: codeMatch[1] })
      result.push({ type: 'text', marks: [{ type: 'code' }], text: codeMatch[2] })
      remaining = codeMatch[3]
      continue
    }
    // Plain text
    result.push({ type: 'text', text: remaining })
    break
  }

  return result.length > 0 ? result : []
}

// ─── Section Editor component ───
function SectionEditor({ section, index, onUpdate, onToggleComplete, isActive, onActivate }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [3, 4, 5] } }),
      Placeholder.configure({ placeholder: 'Start typing or paste your content here...' }),
      Highlight,
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: section.content || { type: 'doc', content: [{ type: 'paragraph' }] },
    editable: true,
    onUpdate: ({ editor: ed }) => {
      onUpdate(index, ed.getJSON())
    },
  })

  // Sync external content changes
  useEffect(() => {
    if (editor && section.content && !editor.isFocused) {
      const current = JSON.stringify(editor.getJSON())
      const incoming = JSON.stringify(section.content)
      if (current !== incoming) {
        editor.commands.setContent(section.content)
      }
    }
  }, [editor, section.content])

  if (!editor) return null

  return (
    <div
      className={`border rounded-2xl transition-all overflow-hidden ${
        isActive
          ? 'border-cyan-500/40 bg-white/[0.04] shadow-lg shadow-cyan-900/10'
          : 'border-white/[0.08] bg-white/[0.02] hover:border-white/15'
      }`}
      onClick={onActivate}
    >
      {/* Section header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06]">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleComplete(index) }}
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
            section.completed
              ? 'bg-green-500/20 border-green-500/60 text-green-400'
              : 'border-white/20 hover:border-white/40'
          }`}
        >
          {section.completed && (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        <h3 className={`font-semibold text-sm flex-1 ${section.completed ? 'text-green-400/80' : 'text-white'}`}>
          {section.heading}
        </h3>
        <span className="text-[10px] text-white/30 font-mono">Section {index + 1}</span>
      </div>

      {/* Toolbar — only when active */}
      {isActive && (
        <div className="flex flex-wrap items-center gap-1 px-4 py-2 border-b border-white/[0.06] bg-white/[0.02]">
          <ToolbarBtn
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold"
          >B</ToolbarBtn>
          <ToolbarBtn
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic"
          ><em>I</em></ToolbarBtn>
          <ToolbarBtn
            active={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Strikethrough"
          ><s>S</s></ToolbarBtn>
          <div className="w-px h-5 bg-white/10 mx-1" />
          <ToolbarBtn
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet List"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
          </ToolbarBtn>
          <ToolbarBtn
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Numbered List"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M10 6h11M10 12h11M10 18h11M3 5v2h2V5H3zm0 6v2h2v-2H3zm0 6v2h2v-2H3z" /></svg>
          </ToolbarBtn>
          <ToolbarBtn
            active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Quote"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
          </ToolbarBtn>
          <div className="w-px h-5 bg-white/10 mx-1" />
          <ToolbarBtn
            active={editor.isActive('heading', { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Sub-heading"
          >H3</ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            title="Insert Table"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M3 10h18M3 14h18M10 3v18M14 3v18M3 3h18v18H3z" /></svg>
          </ToolbarBtn>
          <ToolbarBtn
            active={editor.isActive('taskList')}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            title="Checklist"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          </ToolbarBtn>
          <ToolbarBtn
            active={editor.isActive('highlight')}
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            title="Highlight"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </ToolbarBtn>
        </div>
      )}

      {/* Editor content */}
      <div className="px-3 sm:px-5 py-4 prose-editor overflow-x-hidden max-w-full">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

function ToolbarBtn({ children, active, onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
        active
          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
          : 'text-white/50 hover:text-white hover:bg-white/10 border border-transparent'
      }`}
    >
      {children}
    </button>
  )
}

// ─── Main TemplateEditor page ───
export default function TemplateEditor() {
  const { instanceId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, userProfile, getEffectiveCompanyId, isAdmin, isSuperAdmin } = useAuth()
  const toast = useToast()
  const canApprove = isSuperAdmin || isAdmin

  const [instance, setInstance] = useState(null)
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [activeSection, setActiveSection] = useState(0)
  const [showApprovalPanel, setShowApprovalPanel] = useState(false)
  const [approvalComment, setApprovalComment] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const templateId = searchParams.get('template')
  const companyId = getEffectiveCompanyId()

  // ─── Guard: company_id must exist ───
  useEffect(() => {
    if (userProfile && !companyId) {
      toast.error('No company found. Please contact support.')
      navigate('/dashboard')
    }
  }, [userProfile, companyId])

  // ─── Load or create instance ───
  useEffect(() => {
    if (!userProfile || !companyId) return
    if (instanceId && instanceId !== 'new') {
      loadInstance(instanceId)
    } else if (templateId) {
      createNewInstance(templateId)
    } else {
      toast.error('No template specified.')
      navigate('/templates')
    }
  }, [userProfile, instanceId, templateId])

  const loadInstance = async (id) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('template_instances')
      .select('id, template_id, title, doc_number, content, standard, revision, status, completion_percent, total_sections, completed_sections, prepared_by, reviewed_by, approved_by, prepared_at, reviewed_at, approved_at, review_comments, approval_comments, version, created_by, updated_by, created_at, updated_at, last_autosave_at')
      .eq('id', id)
      .eq('company_id', companyId)
      .maybeSingle()

    if (error || !data) {
      toast.error('Template not found.')
      navigate('/templates')
      return
    }

    setInstance(data)
    setSections(data.content?.sections || [])
    setLastSaved(data.last_autosave_at || data.updated_at)
    setLoading(false)
  }

  const createNewInstance = async (tmplId) => {
    setLoading(true)
    const templateMeta = TEMPLATES.find(t => t.id === tmplId)
    if (!templateMeta) {
      toast.error('Unknown template.')
      navigate('/templates')
      return
    }

    // Load template content (already bundled with this lazy-loaded chunk)
    const templateContent = TEMPLATE_CONTENT[tmplId] || null

    // Fetch company data for placeholder resolution
    let companyData = {
      companyName: userProfile?.company?.name || 'Your Company',
      companyCode: userProfile?.company?.company_code || 'XX',
      preparedBy: userProfile?.full_name || userProfile?.email || 'System',
      personnel: {},
    }

    try {
      const { data: co } = await supabase
        .from('companies')
        .select('name, company_code, key_personnel, products_services, qms_scope, quality_policy')
        .eq('id', companyId)
        .maybeSingle()
      if (co) {
        companyData = {
          companyName: co.name || companyData.companyName,
          companyCode: co.company_code || companyData.companyCode,
          preparedBy: companyData.preparedBy,
          personnel: co.key_personnel || {},
          productsServices: co.products_services || '',
          qmsScope: co.qms_scope || '',
          qualityPolicy: co.quality_policy || '',
        }
      }
    } catch { /* proceed with defaults */ }

    // Build sections from template content
    const rawSections = templateContent?.sections || [
      { heading: 'Section 1', body: '' },
    ]

    const editorSections = rawSections.map(s => {
      const resolvedBody = resolveAllPlaceholders(s.body || '', companyData)
      return {
        heading: resolveAllPlaceholders(s.heading || '', companyData),
        content: markdownToTipTap(resolvedBody),
        completed: false,
      }
    })

    const docNumber = DOC_NUMBER_MAP[tmplId]
      ? DOC_NUMBER_MAP[tmplId].replace(/\{\{CODE\}\}/g, companyData.companyCode)
      : null

    // Insert into DB
    const { data: newInstance, error } = await supabase
      .from('template_instances')
      .insert({
        company_id: companyId,
        template_id: tmplId,
        title: templateMeta.title,
        doc_number: docNumber,
        standard: templateMeta.standard,
        content: { sections: editorSections },
        total_sections: editorSections.length,
        completed_sections: 0,
        completion_percent: 0,
        created_by: user.id,
        updated_by: user.id,
        prepared_by: user.id,
        prepared_at: new Date().toISOString(),
      })
      .select('id, template_id, title, doc_number, content, standard, revision, status, completion_percent, total_sections, completed_sections, prepared_by, reviewed_by, approved_by, prepared_at, reviewed_at, approved_at, review_comments, approval_comments, version, created_by, updated_by, created_at, updated_at, last_autosave_at')
      .single()

    if (error) {
      console.error('Failed to create template instance:', error)
      toast.error('Failed to create template. Please try again.')
      navigate('/templates')
      return
    }

    setInstance(newInstance)
    setSections(editorSections)
    setLastSaved(newInstance.created_at)
    setLoading(false)

    // Update URL to include instance ID (so refresh works)
    navigate(`/editor/${newInstance.id}`, { replace: true })
  }

  // ─── Autosave ───
  const MAX_CONTENT_SIZE = 5 * 1024 * 1024 // 5MB sanity limit on JSONB content

  const doAutosave = useCallback(async (sectionsToSave) => {
    if (!instance?.id) return

    // Content size guard
    const contentSize = new Blob([JSON.stringify(sectionsToSave)]).size
    if (contentSize > MAX_CONTENT_SIZE) {
      toast.error('Document content too large. Please reduce content size.')
      return
    }

    setSaving(true)
    const completedCount = sectionsToSave.filter(s => s.completed).length
    const totalCount = sectionsToSave.length
    const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

    const { error } = await supabase
      .from('template_instances')
      .update({
        content: { sections: sectionsToSave },
        completed_sections: completedCount,
        completion_percent: pct,
        updated_by: user.id,
        last_autosave_at: new Date().toISOString(),
      })
      .eq('id', instance.id)

    if (!error) {
      setLastSaved(new Date().toISOString())
    }
    setSaving(false)
  }, [instance?.id, user?.id])

  const debouncedSave = useDebounce((s) => doAutosave(s), 2000)

  // ─── Section update handler ───
  const handleSectionUpdate = useCallback((index, content) => {
    setSections(prev => {
      const next = [...prev]
      next[index] = { ...next[index], content }
      debouncedSave(next)
      return next
    })
  }, [debouncedSave])

  const handleToggleComplete = useCallback((index) => {
    setSections(prev => {
      const next = [...prev]
      next[index] = { ...next[index], completed: !next[index].completed }
      debouncedSave(next)
      return next
    })
  }, [debouncedSave])

  // ─── Manual save ───
  const handleManualSave = async () => {
    await doAutosave(sections)
    toast.success('Saved successfully.')
  }

  // ─── Approval workflow ───
  const handleSubmitForReview = async () => {
    if (!instance?.id) return
    const { error } = await supabase
      .from('template_instances')
      .update({
        status: 'in_review',
        updated_by: user.id,
        content: { sections },
      })
      .eq('id', instance.id)

    if (error) {
      toast.error('Failed to submit for review.')
      return
    }
    setInstance(prev => ({ ...prev, status: 'in_review' }))
    toast.success('Submitted for review.')
  }

  const handleApprove = async () => {
    if (!instance?.id) return
    if (!canApprove) {
      toast.error('Only admins can approve documents.')
      return
    }
    // Separation of duties: preparer cannot approve their own document
    if (instance.prepared_by === user.id) {
      toast.error('You cannot approve a document you prepared. Ask another admin to review.')
      return
    }
    const { error } = await supabase
      .from('template_instances')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        approval_comments: approvalComment || null,
        updated_by: user.id,
      })
      .eq('id', instance.id)

    if (error) {
      toast.error('Failed to approve.')
      return
    }
    setInstance(prev => ({ ...prev, status: 'approved', approved_by: user.id, approved_at: new Date().toISOString() }))
    setApprovalComment('')
    setShowApprovalPanel(false)
    toast.success('Document approved.')
  }

  const handleReject = async () => {
    if (!instance?.id) return
    if (!canApprove) {
      toast.error('Only admins can review documents.')
      return
    }
    const { error } = await supabase
      .from('template_instances')
      .update({
        status: 'draft',
        review_comments: approvalComment || 'Returned for revision',
        updated_by: user.id,
      })
      .eq('id', instance.id)

    if (error) {
      toast.error('Failed to reject.')
      return
    }
    setInstance(prev => ({ ...prev, status: 'draft', review_comments: approvalComment || 'Returned for revision' }))
    setApprovalComment('')
    setShowApprovalPanel(false)
    toast.success('Returned to draft for revision.')
  }

  // ─── Export to PDF ───
  const handleExportPDF = async () => {
    toast.info('Generating PDF...')
    try {
      const { generateTemplatePDF } = await import('../lib/templatePDFExport.js')
      const templateMeta = TEMPLATES.find(t => t.id === instance.template_id)

      // Convert TipTap sections back to text sections for PDF renderer
      const pdfSections = sections.map(s => ({
        heading: s.heading,
        body: tiptapToText(s.content),
      }))

      const content = { sections: pdfSections }
      const companyCode = userProfile?.company?.company_code || 'XX'

      await generateTemplatePDF(
        { ...templateMeta, content },
        {
          companyName: userProfile?.company?.name,
          companyCode,
          preparedBy: userProfile?.full_name || userProfile?.email,
          logoUrl: userProfile?.company?.logo_url,
        }
      )
      toast.success('PDF downloaded.')
    } catch (err) {
      console.error('PDF export failed:', err)
      toast.error('PDF export failed. Please try again.')
    }
  }

  // ─── Computed values ───
  const completionPercent = useMemo(() => {
    if (sections.length === 0) return 0
    return Math.round((sections.filter(s => s.completed).length / sections.length) * 100)
  }, [sections])

  const statusColors = {
    draft: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    in_review: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    approved: 'bg-green-500/20 text-green-300 border-green-500/30',
    archived: 'bg-white/10 text-white/40 border-white/20',
    superseded: 'bg-red-500/20 text-red-300 border-red-500/30',
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/50 text-sm">Loading template editor...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {/* ─── Top bar ─── */}
      <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-xl border-b border-white/[0.06] -mx-4 md:-mx-6 px-4 md:px-6 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Back */}
          <button
            onClick={() => navigate('/templates')}
            className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all"
            title="Back to Templates"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Title + doc number */}
          <div className="flex-1 min-w-0">
            <h1 className="text-sm md:text-base font-bold text-white truncate">{instance?.title}</h1>
            <div className="flex items-center gap-2 text-xs text-white/40">
              {instance?.doc_number && <span className="font-mono">{instance.doc_number}</span>}
              <span>Rev {instance?.revision || '01'}</span>
              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${statusColors[instance?.status] || statusColors.draft}`}>
                {instance?.status?.replace('_', ' ').toUpperCase() || 'DRAFT'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Save indicator */}
            <span className="text-[10px] text-white/30 hidden sm:block">
              {saving ? 'Saving...' : lastSaved ? `Saved ${new Date(lastSaved).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}` : ''}
            </span>

            <button
              onClick={handleManualSave}
              disabled={saving}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-white/20 hover:bg-white/10 text-white/70 hover:text-white transition-all disabled:opacity-40"
            >
              Save
            </button>

            {instance?.status === 'draft' && (
              <button
                onClick={handleSubmitForReview}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 transition-all"
              >
                Submit for Review
              </button>
            )}

            {instance?.status === 'in_review' && canApprove && instance?.prepared_by !== user?.id && (
              <button
                onClick={() => setShowApprovalPanel(!showApprovalPanel)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-500/20 border border-green-500/30 text-green-300 hover:bg-green-500/30 transition-all"
              >
                Review
              </button>
            )}
            {instance?.status === 'in_review' && !canApprove && (
              <span className="text-[10px] text-amber-300/60 px-2">Awaiting admin review</span>
            )}

            <button
              onClick={handleExportPDF}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-300 hover:from-cyan-500/30 hover:to-purple-500/30 transition-all"
            >
              Export PDF
            </button>

            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all md:hidden"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Approval panel */}
        {showApprovalPanel && instance?.status === 'in_review' && canApprove && (
          <div className="mt-3 p-4 bg-white/[0.03] border border-white/10 rounded-xl">
            <h4 className="font-semibold text-sm text-white mb-2">Review Decision</h4>
            <textarea
              value={approvalComment}
              onChange={(e) => setApprovalComment(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 mb-3"
              placeholder="Comments (optional)..."
              rows={2}
            />
            <div className="flex gap-2">
              <button
                onClick={handleApprove}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-green-500/20 border border-green-500/30 text-green-300 hover:bg-green-500/30 transition-all"
              >
                Approve
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition-all"
              >
                Return for Revision
              </button>
              <button
                onClick={() => { setShowApprovalPanel(false); setApprovalComment('') }}
                className="px-4 py-2 text-xs rounded-lg border border-white/20 text-white/50 hover:text-white hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Review comments banner */}
        {instance?.status === 'draft' && instance?.review_comments && (
          <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
            <strong>Reviewer feedback:</strong> {instance.review_comments}
          </div>
        )}
      </div>

      {/* ─── Mobile: progress bar + section picker ─── */}
      <div className="md:hidden mt-4 space-y-3">
        {/* Compact progress bar */}
        <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3">
          <div className="w-10 h-10 rounded-full relative flex-shrink-0">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
              <circle
                cx="20" cy="20" r="16" fill="none"
                stroke={completionPercent === 100 ? '#22c55e' : '#06b6d4'}
                strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${completionPercent * 1.005} 100.5`}
                className="transition-all duration-500"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
              {completionPercent}%
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/60">{sections.filter(s => s.completed).length} of {sections.length} sections</p>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-white/20 text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            {sidebarOpen ? 'Hide Sections' : 'Show Sections'}
          </button>
        </div>

        {/* Expandable section picker */}
        {sidebarOpen && (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="max-h-48 overflow-y-auto">
              {sections.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveSection(i)
                    setSidebarOpen(false)
                    setTimeout(() => {
                      document.getElementById(`section-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }, 100)
                  }}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-2 text-xs transition-all border-l-2 ${
                    activeSection === i
                      ? 'border-l-cyan-500 bg-cyan-500/5 text-white'
                      : 'border-l-transparent text-white/50 hover:text-white/70 hover:bg-white/[0.03]'
                  }`}
                >
                  {s.completed ? (
                    <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-white/20 flex-shrink-0" />
                  )}
                  <span className="truncate">{s.heading}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Main content ─── */}
      <div className="flex gap-6 mt-4 md:mt-6 overflow-hidden">
        {/* Desktop sidebar — hidden on mobile */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <div className="sticky top-32 space-y-4">
            {/* Completion ring */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 text-center">
              <div className="w-20 h-20 mx-auto rounded-full relative mb-3">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                  <circle
                    cx="40" cy="40" r="34" fill="none"
                    stroke={completionPercent === 100 ? '#22c55e' : '#06b6d4'}
                    strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={`${completionPercent * 2.136} 213.6`}
                    className="transition-all duration-500"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">
                  {completionPercent}%
                </span>
              </div>
              <p className="text-xs text-white/40">
                {sections.filter(s => s.completed).length} of {sections.length} sections complete
              </p>
            </div>

            {/* Section list */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Sections</h3>
              </div>
              <div className="max-h-[50vh] overflow-y-auto">
                {sections.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setActiveSection(i)
                      document.getElementById(`section-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-2 text-xs transition-all border-l-2 ${
                      activeSection === i
                        ? 'border-l-cyan-500 bg-cyan-500/5 text-white'
                        : 'border-l-transparent text-white/50 hover:text-white/70 hover:bg-white/[0.03]'
                    }`}
                  >
                    {s.completed ? (
                      <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-white/20 flex-shrink-0" />
                    )}
                    <span className="truncate">{s.heading}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Editor area — full width on mobile */}
        <main className="flex-1 min-w-0 max-w-full space-y-4 pb-20 overflow-x-hidden">
          {sections.map((section, i) => (
            <div key={i} id={`section-${i}`}>
              <SectionEditor
                section={section}
                index={i}
                onUpdate={handleSectionUpdate}
                onToggleComplete={handleToggleComplete}
                isActive={activeSection === i}
                onActivate={() => setActiveSection(i)}
              />
            </div>
          ))}
        </main>
      </div>
    </Layout>
  )
}

// ─── Convert TipTap JSON back to plain text (for PDF export) ───
function tiptapToText(json) {
  if (!json || !json.content) return ''
  return json.content.map(node => nodeToText(node)).join('\n')
}

function nodeToText(node) {
  if (!node) return ''

  switch (node.type) {
    case 'paragraph':
      return (node.content || []).map(inlineToText).join('')
    case 'heading':
      return (node.content || []).map(inlineToText).join('')
    case 'bulletList':
      return (node.content || []).map(li => `- ${nodeToText(li)}`).join('\n')
    case 'orderedList':
      return (node.content || []).map((li, i) => `${i + 1}. ${nodeToText(li)}`).join('\n')
    case 'listItem':
      return (node.content || []).map(nodeToText).join('\n')
    case 'blockquote':
      return (node.content || []).map(n => `> ${nodeToText(n)}`).join('\n')
    case 'table':
      return tableToText(node)
    case 'taskList':
      return (node.content || []).map(ti => {
        const checked = ti.attrs?.checked ? '[x]' : '[ ]'
        const text = (ti.content || []).map(nodeToText).join('')
        return `${checked} ${text}`
      }).join('\n')
    case 'taskItem': {
      const checked = node.attrs?.checked ? '[x]' : '[ ]'
      const text = (node.content || []).map(nodeToText).join('')
      return `${checked} ${text}`
    }
    default:
      return (node.content || []).map(nodeToText).join('\n')
  }
}

function inlineToText(node) {
  if (!node) return ''
  if (node.type === 'text') {
    let text = node.text || ''
    if (node.marks) {
      for (const mark of node.marks) {
        if (mark.type === 'bold') text = `**${text}**`
        if (mark.type === 'italic') text = `*${text}*`
        if (mark.type === 'code') text = `\`${text}\``
      }
    }
    return text
  }
  return ''
}

function tableToText(table) {
  const rows = (table.content || []).map(row => {
    const cells = (row.content || []).map(cell => {
      return (cell.content || []).map(nodeToText).join(' ').trim()
    })
    return `| ${cells.join(' | ')} |`
  })
  if (rows.length > 0) {
    const cols = (table.content?.[0]?.content || []).length
    const separator = `| ${Array(cols).fill('---').join(' | ')} |`
    rows.splice(1, 0, separator)
  }
  return rows.join('\n')
}
