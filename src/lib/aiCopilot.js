/**
 * AI Copilot client library
 * Handles communication with the AI Copilot Edge Function
 */
import { supabase } from './supabase'

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-copilot`

/**
 * Send a message to the AI Copilot
 * @param {Array<{role: string, content: string}>} messages - Conversation messages
 * @param {string} queryType - Type of query: 'chat', 'document_analysis', 'gap_analysis'
 * @returns {Promise<{content: string, remaining: number, limit: number, model: string}>}
 */
export async function sendCopilotMessage(messages, queryType = 'chat') {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ messages, queryType }),
  })

  const data = await response.json()

  if (!response.ok) {
    const error = new Error(data.error || 'AI service unavailable')
    error.status = response.status
    error.remaining = data.remaining
    error.limit = data.limit
    throw error
  }

  return data
}

/**
 * Quick analysis prompts for common tasks
 */
export const QUICK_PROMPTS = [
  {
    label: 'Audit Readiness',
    icon: '🔍',
    prompt: 'Based on my current compliance data, how ready am I for an ISO surveillance audit? What are my biggest risks?',
    queryType: 'gap_analysis',
  },
  {
    label: 'NCR Advice',
    icon: '⚠️',
    prompt: 'I have open non-conformances. What should I prioritise and what are typical root causes and corrective actions for ISO NCRs?',
    queryType: 'chat',
  },
  {
    label: 'Document Review',
    icon: '📄',
    prompt: 'What mandatory documented information (procedures, records, policies) do I need for ISO 9001:2015? Help me check if I have gaps.',
    queryType: 'gap_analysis',
  },
  {
    label: 'Management Review',
    icon: '📋',
    prompt: 'What inputs and outputs are required for an ISO 9001 management review meeting according to Clause 9.3? Help me prepare an agenda.',
    queryType: 'chat',
  },
]
