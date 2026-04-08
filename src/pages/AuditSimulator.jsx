import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { sendCopilotMessage } from '../lib/aiCopilot'
import Layout from '../components/Layout'

const STANDARDS = [
  { code: 'ISO_9001', name: 'ISO 9001:2015', color: 'from-blue-500 to-blue-600' },
  { code: 'ISO_14001', name: 'ISO 14001:2015', color: 'from-green-500 to-green-600' },
  { code: 'ISO_45001', name: 'ISO 45001:2018', color: 'from-orange-500 to-orange-600' },
]

const AUDIT_CLAUSES = {
  ISO_9001: [
    { clause: '4', name: 'Context of the Organization', questions: ['How does your organisation determine external and internal issues relevant to its purpose?', 'How do you determine the needs and expectations of interested parties?', 'How is the scope of your QMS defined and documented?'] },
    { clause: '5', name: 'Leadership', questions: ['How does top management demonstrate leadership and commitment?', 'Where is your quality policy documented and how is it communicated?', 'How are roles, responsibilities, and authorities assigned and communicated?'] },
    { clause: '6', name: 'Planning', questions: ['How do you address risks and opportunities in your QMS?', 'What quality objectives have you established and how do you plan to achieve them?'] },
    { clause: '7', name: 'Support', questions: ['How do you determine and provide the resources needed for the QMS?', 'How do you ensure personnel are competent based on education, training, or experience?', 'How is documented information controlled (creation, approval, distribution)?'] },
    { clause: '8', name: 'Operation', questions: ['How do you plan and control your operational processes?', 'How do you ensure externally provided processes, products, and services conform to requirements?', 'How do you control nonconforming outputs?'] },
    { clause: '9', name: 'Performance Evaluation', questions: ['How do you monitor and measure customer satisfaction?', 'How are internal audits planned and conducted?', 'How does management review the QMS for continuing suitability and effectiveness?'] },
    { clause: '10', name: 'Improvement', questions: ['How do you determine and select opportunities for improvement?', 'How do you handle nonconformities and take corrective action?', 'How does your organisation continually improve the QMS?'] },
  ],
  ISO_14001: [
    { clause: '4', name: 'Context of the Organization', questions: ['How do you determine environmental issues relevant to your organisation?', 'What are the needs and expectations of interested parties regarding environmental performance?'] },
    { clause: '5', name: 'Leadership', questions: ['How does top management demonstrate commitment to the EMS?', 'How is the environmental policy established and communicated?'] },
    { clause: '6', name: 'Planning', questions: ['How do you identify environmental aspects and determine significant impacts?', 'How do you identify and evaluate compliance obligations?', 'How do you plan actions to address risks, opportunities, and environmental objectives?'] },
    { clause: '7', name: 'Support', questions: ['How do you determine competence needs related to environmental performance?', 'How is environmental awareness promoted among workers?'] },
    { clause: '8', name: 'Operation', questions: ['How do you plan and control processes to meet EMS requirements?', 'How do you prepare for and respond to potential emergency situations?'] },
    { clause: '9', name: 'Performance Evaluation', questions: ['How do you monitor and measure environmental performance?', 'How do you evaluate compliance with legal requirements?'] },
    { clause: '10', name: 'Improvement', questions: ['How do you handle environmental nonconformities and corrective actions?', 'How do you continually improve the EMS?'] },
  ],
  ISO_45001: [
    { clause: '4', name: 'Context of the Organization', questions: ['How do you determine OH&S issues relevant to your organisation?', 'What are the needs and expectations of workers and other interested parties?'] },
    { clause: '5', name: 'Leadership & Worker Participation', questions: ['How does top management demonstrate leadership for OH&S?', 'How are workers consulted and how do they participate in the OH&S management system?'] },
    { clause: '6', name: 'Planning', questions: ['How do you identify hazards and assess OH&S risks and opportunities?', 'How do you determine applicable legal requirements for OH&S?'] },
    { clause: '7', name: 'Support', questions: ['How do you ensure worker competence for OH&S?', 'How is OH&S information communicated internally and externally?'] },
    { clause: '8', name: 'Operation', questions: ['How do you plan and control operations to manage OH&S risks?', 'How do you prepare for and respond to emergency situations?', 'How do you manage change that affects OH&S performance?'] },
    { clause: '9', name: 'Performance Evaluation', questions: ['How do you monitor and measure OH&S performance?', 'How do you investigate incidents and evaluate compliance?'] },
    { clause: '10', name: 'Improvement', questions: ['How do you handle OH&S incidents, nonconformities, and corrective actions?', 'How do you continually improve OH&S performance?'] },
  ],
}

const AuditSimulator = () => {
  const { userProfile, getEffectiveCompanyId } = useAuth()
  const toast = useToast()
  const [selectedStandard, setSelectedStandard] = useState(null)
  const [phase, setPhase] = useState('select') // select | running | results
  const [currentClauseIdx, setCurrentClauseIdx] = useState(0)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [aiEvaluation, setAiEvaluation] = useState(null)
  const [evaluating, setEvaluating] = useState(false)
  const [complianceData, setComplianceData] = useState(null)
  const answerRef = useRef(null)

  const clauses = selectedStandard ? AUDIT_CLAUSES[selectedStandard] || [] : []
  const currentClause = clauses[currentClauseIdx]
  const currentQuestion = currentClause?.questions?.[currentQuestionIdx]
  const totalQuestions = clauses.reduce((sum, c) => sum + c.questions.length, 0)
  const answeredCount = Object.keys(answers).length

  // Fetch compliance data for context
  useEffect(() => {
    if (selectedStandard && userProfile) fetchComplianceContext()
  }, [selectedStandard, userProfile])

  const fetchComplianceContext = async () => {
    try {
      const companyId = getEffectiveCompanyId()
      if (!companyId) return

      const [compReqs, ncrs, docs, audits] = await Promise.all([
        supabase.from('compliance_requirements').select('clause_number, clause_name, compliance_status').eq('company_id', companyId).eq('standard', selectedStandard),
        supabase.from('ncrs').select('ncr_number, severity, status, standard').eq('company_id', companyId).eq('status', 'Open').limit(10),
        supabase.from('documents').select('name, standard, status').eq('company_id', companyId).limit(20),
        supabase.from('audits').select('audit_number, status, conclusion').eq('company_id', companyId).order('audit_date', { ascending: false }).limit(5),
      ])

      setComplianceData({
        requirements: compReqs.data || [],
        openNCRs: ncrs.data || [],
        documents: docs.data || [],
        recentAudits: audits.data || [],
      })
    } catch { /* silent */ }
  }

  const handleSubmitAnswer = () => {
    if (!currentAnswer.trim()) return

    const key = `${currentClause.clause}-${currentQuestionIdx}`
    setAnswers(prev => ({ ...prev, [key]: { clause: currentClause.clause, clauseName: currentClause.name, question: currentQuestion, answer: currentAnswer.trim() } }))
    setCurrentAnswer('')

    // Move to next question
    if (currentQuestionIdx < currentClause.questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1)
    } else if (currentClauseIdx < clauses.length - 1) {
      setCurrentClauseIdx(prev => prev + 1)
      setCurrentQuestionIdx(0)
    } else {
      // All questions answered — evaluate
      evaluateAudit({ ...answers, [key]: { clause: currentClause.clause, clauseName: currentClause.name, question: currentQuestion, answer: currentAnswer.trim() } })
    }

    setTimeout(() => answerRef.current?.focus(), 100)
  }

  const evaluateAudit = async (allAnswers) => {
    setPhase('results')
    setEvaluating(true)

    try {
      const standard = STANDARDS.find(s => s.code === selectedStandard)
      const companyName = userProfile?.company?.name || 'Company'

      // Build context from compliance data
      let context = `Company: ${companyName}\nStandard: ${standard?.name}\n\n`

      if (complianceData) {
        const met = complianceData.requirements.filter(r => r.compliance_status === 'Met').length
        const total = complianceData.requirements.length
        context += `Current compliance: ${met}/${total} clauses met\n`
        context += `Open NCRs: ${complianceData.openNCRs.length}\n`
        context += `Documents on file: ${complianceData.documents.length}\n\n`
      }

      // Format answers
      let answersText = ''
      Object.values(allAnswers).forEach(a => {
        answersText += `\nClause ${a.clause} (${a.clauseName}):\nQ: ${a.question}\nA: ${a.answer}\n`
      })

      const messages = [
        {
          role: 'system',
          content: `You are an experienced ISO auditor conducting a mock surveillance audit for ${standard?.name}. You are evaluating the auditee's responses to standard audit questions.

For each clause area, evaluate the response and assign one of:
- CONFORMING: Evidence and processes adequately address the requirement
- MINOR NC: Process exists but has gaps or inconsistencies
- MAJOR NC: No evidence of process or fundamental failure to meet requirement
- OBSERVATION: Process works but could be improved

Provide your evaluation as a structured report with:
1. An overall audit score (0-100%)
2. Per-clause evaluation with finding type and brief auditor notes
3. A summary of strengths
4. Top 3 priority actions for improvement
5. An overall audit conclusion (pass/conditional pass/fail)

Be fair but thorough. A real auditor would ask follow-up questions, so be generous where the answer shows understanding even if detail is lacking. Be specific in your notes — reference actual clause numbers.

Format your response as JSON with this structure:
{
  "overallScore": 72,
  "conclusion": "conditional_pass",
  "clauses": [
    {"clause": "4", "name": "Context", "finding": "conforming", "notes": "..."},
    ...
  ],
  "strengths": ["...", "..."],
  "priorities": ["...", "...", "..."],
  "summary": "Brief overall summary paragraph"
}`
        },
        {
          role: 'user',
          content: `${context}\nHere are my responses to the mock audit questions:\n${answersText}\n\nPlease evaluate my responses and provide the audit report as JSON.`
        }
      ]

      const result = await sendCopilotMessage(messages, 'gap_analysis')

      // Parse AI response
      let parsed = null
      try {
        // Extract JSON from response (may be wrapped in markdown code blocks)
        const jsonMatch = result.content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0])
        }
      } catch {
        // If JSON parsing fails, show raw response
        parsed = { summary: result.content, overallScore: 0, conclusion: 'unknown', clauses: [], strengths: [], priorities: [] }
      }

      setAiEvaluation(parsed)
    } catch (err) {
      toast.error(err.message || 'Failed to evaluate audit. Check your AI credits.')
      setAiEvaluation({ summary: 'Evaluation failed — please check your AI credits and try again.', overallScore: 0, conclusion: 'error', clauses: [], strengths: [], priorities: [] })
    } finally {
      setEvaluating(false)
    }
  }

  const resetSimulator = () => {
    setPhase('select')
    setSelectedStandard(null)
    setCurrentClauseIdx(0)
    setCurrentQuestionIdx(0)
    setAnswers({})
    setCurrentAnswer('')
    setAiEvaluation(null)
    setComplianceData(null)
  }

  const findingColors = {
    conforming: { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/30', label: 'Conforming' },
    minor_nc: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30', label: 'Minor NC' },
    major_nc: { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30', label: 'Major NC' },
    observation: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30', label: 'Observation' },
  }

  const conclusionLabels = {
    pass: { label: 'PASS', color: 'text-green-400', bg: 'bg-green-500/20' },
    conditional_pass: { label: 'CONDITIONAL PASS', color: 'text-amber-400', bg: 'bg-amber-500/20' },
    fail: { label: 'FAIL', color: 'text-red-400', bg: 'bg-red-500/20' },
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass glass-border rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <svg className="w-7 h-7 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Audit Simulator
              </h1>
              <p className="text-white/50 text-sm mt-1">AI-powered mock surveillance audit — test your audit readiness</p>
            </div>
            {phase !== 'select' && (
              <button onClick={resetSimulator} className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm hover:bg-white/20 transition-colors">
                Start Over
              </button>
            )}
          </div>
        </div>

        {/* Phase 1: Select Standard */}
        {phase === 'select' && (
          <div className="glass glass-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Select Standard to Audit</h2>
            <div className="grid gap-3">
              {STANDARDS.map(std => (
                <button
                  key={std.code}
                  onClick={() => { setSelectedStandard(std.code); setPhase('running') }}
                  className={`p-4 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all text-left group`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-semibold group-hover:text-cyan-300 transition-colors">{std.name}</h3>
                      <p className="text-white/40 text-sm mt-0.5">{(AUDIT_CLAUSES[std.code] || []).reduce((s, c) => s + c.questions.length, 0)} questions across {(AUDIT_CLAUSES[std.code] || []).length} clause areas</p>
                    </div>
                    <svg className="w-5 h-5 text-white/20 group-hover:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3">
              <p className="text-xs text-cyan-300">
                The AI auditor will ask you real audit questions and evaluate your responses. Answer as you would in a real surveillance audit. Uses 1 AI credit per simulation.
              </p>
            </div>
          </div>
        )}

        {/* Phase 2: Running Audit */}
        {phase === 'running' && currentClause && (
          <>
            {/* Progress */}
            <div className="glass glass-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/60">
                  Clause {currentClause.clause}: {currentClause.name}
                </span>
                <span className="text-xs text-white/40">{answeredCount + 1} of {totalQuestions}</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${((answeredCount) / totalQuestions) * 100}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <div className="glass glass-border rounded-2xl p-6">
              <div className="flex items-start gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-cyan-300 font-semibold mb-1">Auditor Question — Clause {currentClause.clause}</p>
                  <p className="text-white text-lg font-medium leading-relaxed">{currentQuestion}</p>
                </div>
              </div>

              <textarea
                ref={answerRef}
                value={currentAnswer}
                onChange={e => setCurrentAnswer(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSubmitAnswer() }}
                placeholder="Describe your organisation's approach, provide evidence examples, reference documents or procedures..."
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder-white/25 focus:outline-none focus:border-cyan-500 resize-y mb-4"
                autoFocus
              />

              <div className="flex items-center justify-between">
                <p className="text-[10px] text-white/25">Ctrl+Enter to submit</p>
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!currentAnswer.trim()}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold rounded-xl transition-all disabled:opacity-30 text-sm"
                >
                  {answeredCount + 1 === totalQuestions ? 'Submit & Evaluate' : 'Next Question'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Phase 3: Results */}
        {phase === 'results' && (
          <>
            {evaluating ? (
              <div className="glass glass-border rounded-2xl p-12 text-center">
                <div className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <h3 className="text-white font-bold text-lg mb-2">Evaluating Your Responses</h3>
                <p className="text-white/50 text-sm">The AI auditor is reviewing your answers against {STANDARDS.find(s => s.code === selectedStandard)?.name} requirements...</p>
              </div>
            ) : aiEvaluation && (
              <>
                {/* Overall Score */}
                <div className="glass glass-border rounded-2xl p-6 text-center">
                  <p className="text-white/40 text-sm mb-2">Mock Audit Score</p>
                  <div className={`text-6xl font-bold mb-2 ${
                    aiEvaluation.overallScore >= 80 ? 'text-green-400' :
                    aiEvaluation.overallScore >= 60 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {aiEvaluation.overallScore}%
                  </div>
                  {aiEvaluation.conclusion && conclusionLabels[aiEvaluation.conclusion] && (
                    <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${conclusionLabels[aiEvaluation.conclusion].bg} ${conclusionLabels[aiEvaluation.conclusion].color}`}>
                      {conclusionLabels[aiEvaluation.conclusion].label}
                    </span>
                  )}
                  {aiEvaluation.summary && (
                    <p className="text-white/60 text-sm mt-4 max-w-lg mx-auto leading-relaxed">{aiEvaluation.summary}</p>
                  )}
                </div>

                {/* Clause Results */}
                {aiEvaluation.clauses?.length > 0 && (
                  <div className="glass glass-border rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Clause-by-Clause Findings</h3>
                    <div className="space-y-3">
                      {aiEvaluation.clauses.map((c, i) => {
                        const findingKey = (c.finding || '').toLowerCase().replace(/\s+/g, '_').replace('non_conformity', 'nc').replace('nonconformity', 'nc')
                        const style = findingColors[findingKey] || findingColors.observation
                        return (
                          <div key={i} className={`p-4 rounded-xl border ${style.border} ${style.bg}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-white font-semibold text-sm">Clause {c.clause}: {c.name}</span>
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${style.bg} ${style.text} border ${style.border}`}>
                                {style.label}
                              </span>
                            </div>
                            {c.notes && <p className="text-white/60 text-sm mt-1">{c.notes}</p>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Strengths & Priorities */}
                <div className="grid md:grid-cols-2 gap-4">
                  {aiEvaluation.strengths?.length > 0 && (
                    <div className="glass glass-border rounded-2xl p-5">
                      <h4 className="text-green-400 font-bold text-sm mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Strengths
                      </h4>
                      <ul className="space-y-2">
                        {aiEvaluation.strengths.map((s, i) => (
                          <li key={i} className="text-white/60 text-sm flex items-start gap-2">
                            <span className="text-green-400 mt-0.5">+</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {aiEvaluation.priorities?.length > 0 && (
                    <div className="glass glass-border rounded-2xl p-5">
                      <h4 className="text-amber-400 font-bold text-sm mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" /></svg>
                        Priority Actions
                      </h4>
                      <ol className="space-y-2">
                        {aiEvaluation.priorities.map((p, i) => (
                          <li key={i} className="text-white/60 text-sm flex items-start gap-2">
                            <span className="text-amber-400 font-bold">{i + 1}.</span> {p}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>

                {/* Disclaimer */}
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
                  <p className="text-xs text-purple-300/70">
                    This is an AI-simulated mock audit for training and preparation purposes only. It does not replace a formal ISO audit by an accredited certification body. Results are indicative and should be used to identify areas for improvement.
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

export default AuditSimulator
