import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import Layout from '../components/Layout'
import { sendCopilotMessage, QUICK_PROMPTS } from '../lib/aiCopilot'
import { throttle } from '../lib/rateLimiter'

const AICopilot = () => {
  const { userProfile } = useAuth()
  const toast = useToast()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [usage, setUsage] = useState({ remaining: null, limit: null })
  const [showDocAnalysis, setShowDocAnalysis] = useState(false)
  const [docText, setDocText] = useState('')
  const [docStandard, setDocStandard] = useState('ISO 9001:2015')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (content, queryType = 'chat') => {
    if (!content.trim()) return
    if (loading) return

    // Rate limit: max 5 messages per minute
    if (!throttle('ai-copilot', 5, 60000)) {
      toast.warning('Slow down — maximum 5 messages per minute')
      return
    }

    const userMessage = { role: 'user', content: content.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      // Send last 10 messages for context (keep costs down)
      const contextMessages = newMessages
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }))

      const response = await sendCopilotMessage(contextMessages, queryType)

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: response.content, model: response.model },
      ])
      setUsage({ remaining: response.remaining, limit: response.limit })
    } catch (err) {
      if (err.status === 429) {
        setMessages(prev => [
          ...prev,
          {
            role: 'system',
            content: 'Something went wrong. Please try again or contact support.',
          },
        ])
        setUsage({ remaining: err.remaining || 0, limit: err.limit })
      } else {
        toast.error('Failed to get AI response. Please try again.')
        // Remove the user message if we couldn't get a response
        setMessages(prev => prev.slice(0, -1))
      }
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleQuickPrompt = (prompt) => {
    sendMessage(prompt.prompt, prompt.queryType)
  }

  const handleDocAnalysis = () => {
    if (!docText.trim()) {
      toast.warning('Paste your document text first')
      return
    }
    const prompt = `Please analyse the following document text against ${docStandard} requirements. Identify:\n1. Which clauses this document satisfies\n2. Any gaps or missing elements\n3. Specific improvements needed\n4. An overall compliance rating (Low/Medium/High)\n\n--- DOCUMENT TEXT ---\n${docText.slice(0, 10000)}`
    setShowDocAnalysis(false)
    setDocText('')
    sendMessage(prompt, 'document_analysis')
  }

  const clearChat = () => {
    setMessages([])
    setUsage({ remaining: null, limit: null })
  }

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AI Copilot</h1>
              <p className="text-xs text-white/40">ISO compliance assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {usage.limit && (
              <span className="text-xs text-white/40 glass glass-border px-3 py-1.5 rounded-lg">
                {usage.remaining}/{usage.limit} queries left
              </span>
            )}
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="text-xs text-white/40 hover:text-white px-3 py-1.5 glass glass-border rounded-lg transition-colors"
              >
                Clear Chat
              </button>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto glass glass-border rounded-2xl p-4 mb-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white mb-1">
                Hello{userProfile?.full_name ? `, ${userProfile.full_name.split(' ')[0]}` : ''}
              </h2>
              <p className="text-white/50 text-sm mb-6 max-w-md">
                I'm your ISO compliance assistant. Ask me about clauses, audit preparation, NCR management, gap analysis, or anything ISO-related.
              </p>

              {/* Quick Prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {QUICK_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickPrompt(prompt)}
                    className="glass glass-border rounded-xl p-3 text-left hover:bg-white/10 transition-colors group"
                  >
                    <span className="text-lg mb-1 block">{prompt.icon}</span>
                    <span className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">
                      {prompt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/20'
                        : msg.role === 'system'
                        ? 'bg-amber-500/10 border border-amber-500/20'
                        : 'glass glass-border'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-md flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <span className="text-xs text-white/40">AI Copilot</span>
                        {msg.model && (
                          <span className="text-xs text-white/20">
                            {msg.model.includes('haiku') ? 'Fast' : 'Deep Analysis'}
                          </span>
                        )}
                      </div>
                    )}
                    {msg.role === 'system' && (
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span className="text-xs text-amber-400 font-medium">Usage Limit</span>
                      </div>
                    )}
                    <div className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {loading && (
                <div className="flex justify-start">
                  <div className="glass glass-border rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-md flex items-center justify-center">
                        <svg className="w-3 h-3 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Document Analysis Panel */}
        {showDocAnalysis && (
          <div className="glass glass-border rounded-xl p-4 mb-2 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Document Gap Analysis</h3>
              <button onClick={() => setShowDocAnalysis(false)} className="text-white/40 hover:text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <select
              value={docStandard}
              onChange={(e) => setDocStandard(e.target.value)}
              className="glass-input w-full px-3 py-2 rounded-lg text-white text-sm"
            >
              <option value="ISO 9001:2015">ISO 9001:2015 (Quality)</option>
              <option value="ISO 14001:2015">ISO 14001:2015 (Environmental)</option>
              <option value="ISO 45001:2018">ISO 45001:2018 (OH&S)</option>
            </select>
            <textarea
              value={docText}
              onChange={(e) => setDocText(e.target.value)}
              placeholder="Paste your document text here (e.g. quality policy, procedure, work instruction)..."
              className="glass-input w-full px-3 py-2 rounded-lg text-white text-sm h-32 resize-none"
              maxLength={10000}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/30">{docText.length}/10,000 characters</span>
              <button
                onClick={handleDocAnalysis}
                disabled={loading || !docText.trim()}
                className="btn-primary px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                Analyse Document
              </button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowDocAnalysis(!showDocAnalysis)}
            className={`px-3 py-3 rounded-xl shrink-0 transition-colors ${
              showDocAnalysis ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'glass glass-border text-white/50 hover:text-white'
            }`}
            title="Analyse a document"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about ISO clauses, audit prep, NCRs, compliance gaps..."
            className="flex-1 glass-input px-4 py-3 rounded-xl text-white text-sm"
            disabled={loading}
            maxLength={5000}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-primary px-5 py-3 rounded-xl font-semibold disabled:opacity-50 shrink-0"
          >
            {loading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>

        {/* Disclaimer */}
        <p className="text-xs text-white/25 text-center mt-2">
          AI Copilot provides guidance only — it does not guarantee ISO certification. Always verify with your certification body.
        </p>
      </div>
    </Layout>
  )
}

export default AICopilot
