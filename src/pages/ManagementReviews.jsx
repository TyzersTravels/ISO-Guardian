import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const ManagementReviews = () => {
  const { userProfile } = useAuth()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedReview, setSelectedReview] = useState(null)

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('management_reviews')
        .select('*')
        .order('review_date', { ascending: false })

      if (error) throw error
      setReviews(data || [])
    } catch (err) {
      console.error('Error fetching reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  const completeReview = async (id) => {
    try {
      const { error } = await supabase
        .from('management_reviews')
        .update({ status: 'Complete', updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      fetchReviews()
      setSelectedReview(null)
      alert('Management review marked as complete')
    } catch (err) {
      console.error('Error updating review:', err)
      alert('Failed to update review')
    }
  }

  const exportReview = (review, userProfile) => {
    // Create HTML document that Word can open
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Calibri, Arial, sans-serif; margin: 2cm; }
    h1 { color: #0066cc; text-align: center; border-bottom: 3px solid #0066cc; padding-bottom: 10px; }
    h2 { color: #0066cc; margin-top: 25px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
    .header { background: #f0f0f0; padding: 15px; margin-bottom: 20px; }
    .section { margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    td { padding: 8px; border: 1px solid #ddd; }
    .label { font-weight: bold; background: #f8f8f8; }
    ul { margin: 10px 0; }
    li { margin: 5px 0; }
    .minutes { background: #fafafa; padding: 15px; border-left: 4px solid #0066cc; white-space: pre-wrap; }
    .action-item { background: #fff; border: 1px solid #ddd; padding: 10px; margin: 10px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd; font-size: 10pt; color: #666; text-align: center; }
  </style>
</head>
<body>
  <h1>MANAGEMENT REVIEW MINUTES</h1>
  
  <div class="header">
    <table>
      <tr>
        <td class="label">Review Number:</td>
        <td>${review.review_number}</td>
      </tr>
      <tr>
        <td class="label">Date:</td>
        <td>${new Date(review.review_date).toLocaleDateString()}</td>
      </tr>
      <tr>
        <td class="label">Time:</td>
        <td>${review.review_time || 'Not specified'}</td>
      </tr>
      <tr>
        <td class="label">Chairperson:</td>
        <td>${review.chairperson}</td>
      </tr>
    </table>
  </div>

  ${review.attendees && review.attendees.length > 0 ? `
  <div class="section">
    <h2>Attendees</h2>
    <ul>
      ${review.attendees.map(att => `<li>${att}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  ${review.agenda_items && review.agenda_items.length > 0 ? `
  <div class="section">
    <h2>Agenda Items</h2>
    <ol>
      ${review.agenda_items.map(item => `<li>${item}</li>`).join('')}
    </ol>
  </div>
  ` : ''}

  ${review.minutes ? `
  <div class="section">
    <h2>Meeting Minutes</h2>
    <div class="minutes">${review.minutes}</div>
  </div>
  ` : ''}

  ${review.decisions_made && review.decisions_made.length > 0 ? `
  <div class="section">
    <h2>Management Decisions</h2>
    <ul>
      ${review.decisions_made.map(dec => `<li>${dec}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  ${review.action_items && Array.isArray(review.action_items) && review.action_items.length > 0 ? `
  <div class="section">
    <h2>Action Items</h2>
    ${review.action_items.map((item, i) => `
      <div class="action-item">
        <strong>${i + 1}. ${item.action}</strong><br>
        <em>Responsible:</em> ${item.responsible}<br>
        <em>Due Date:</em> ${new Date(item.due_date).toLocaleDateString()}<br>
        <em>Status:</em> ${item.status}
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${review.resource_decisions ? `
  <div class="section">
    <h2>Resource Decisions</h2>
    <p>${review.resource_decisions}</p>
  </div>
  ` : ''}

  ${review.improvement_opportunities ? `
  <div class="section">
    <h2>Improvement Opportunities Identified</h2>
    <p>${review.improvement_opportunities}</p>
  </div>
  ` : ''}

  ${review.next_review_date ? `
  <div class="section">
    <h2>Next Review</h2>
    <p><strong>Scheduled for:</strong> ${new Date(review.next_review_date).toLocaleDateString()}</p>
  </div>
  ` : ''}

  <div class="footer">
    <p><strong>Export Information:</strong></p>
    <p>Exported by: ${userProfile.email}</p>
    <p>Export date: ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}</p>
    <p>Company: ${userProfile.company?.name || 'N/A'}</p>
    <p style="margin-top: 10px; font-style: italic;">ISOGuardian - POPIA Compliant Export</p>
  </div>
</body>
</html>
`

    const blob = new Blob([html], { type: 'application/msword' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${review.review_number}_Minutes.doc`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const scheduledReviews = reviews.filter(r => r.status === 'Scheduled')
  const completedReviews = reviews.filter(r => r.status === 'Complete')

  if (loading) {
    return (
      <Layout>
        <div className="text-white text-center py-12">Loading management reviews...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Management Reviews</h2>
            <p className="text-cyan-200 text-sm">{scheduledReviews.length} scheduled reviews</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold"
          >
            + Schedule Review
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass glass-border rounded-lg p-4">
            <div className="text-3xl font-bold text-orange-400">{scheduledReviews.length}</div>
            <div className="text-sm text-white/70">Scheduled</div>
          </div>
          <div className="glass glass-border rounded-lg p-4">
            <div className="text-3xl font-bold text-green-400">{completedReviews.length}</div>
            <div className="text-sm text-white/70">Completed</div>
          </div>
        </div>

        {/* Scheduled Reviews */}
        {scheduledReviews.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-white mb-3">Upcoming Reviews</h3>
            <div className="space-y-3">
              {scheduledReviews.map(review => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onClick={() => setSelectedReview(review)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed Reviews */}
        {completedReviews.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-white mb-3">Completed Reviews</h3>
            <div className="space-y-3">
              {completedReviews.map(review => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onClick={() => setSelectedReview(review)}
                />
              ))}
            </div>
          </div>
        )}

        {reviews.length === 0 && (
          <div className="glass glass-border rounded-lg p-8 text-center text-white/60">
            No management reviews scheduled
          </div>
        )}

        {/* Review Details Modal */}
        {selectedReview && (
          <ReviewDetailsModal
            review={selectedReview}
            onClose={() => setSelectedReview(null)}
            onComplete={completeReview}
            exportReview={exportReview}
            userProfile={userProfile}
          />
        )}

        {/* Create Review Form */}
        {showCreateForm && (
          <CreateReviewForm
            userProfile={userProfile}
            onClose={() => setShowCreateForm(false)}
            onCreated={() => {
              fetchReviews()
              setShowCreateForm(false)
            }}
          />
        )}
      </div>

      <style>{`
        .glass {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
        }
        .glass-border {
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </Layout>
  )
}

const ReviewCard = ({ review, onClick }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-ZA', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const statusColors = {
    'Scheduled': 'bg-orange-500/20 text-orange-300',
    'Complete': 'bg-green-500/20 text-green-300',
    'Cancelled': 'bg-red-500/20 text-red-300'
  }

  return (
    <div
      onClick={onClick}
      className="glass glass-border rounded-lg p-4 hover:bg-white/5 cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-cyan-400 text-sm">{review.review_number}</span>
            <span className={`text-xs px-2 py-1 rounded ${statusColors[review.status]}`}>
              {review.status}
            </span>
          </div>
          <div className="font-semibold text-white mb-1">
            Management Review - {formatDate(review.review_date)}
          </div>
          <div className="flex items-center gap-4 text-xs text-white/50">
            <span>👤 Chair: {review.chairperson}</span>
            {review.attendees && <span>👥 {review.attendees.length} attendees</span>}
            {review.next_review_date && (
              <span>📅 Next: {formatDate(review.next_review_date)}</span>
            )}
            {review.reminder_method !== 'none' && (
              <span>🔔 {review.reminder_method}</span>
            )}
          </div>
        </div>
        <button className="text-cyan-400 text-sm hover:underline">View →</button>
      </div>
    </div>
  )
}

const ReviewDetailsModal = ({ review, onClose, onComplete, exportReview, userProfile }) => {
  const [showCompleteForm, setShowCompleteForm] = useState(false)

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-slate-900 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">{review.review_number}</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">✕</button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-white/60">Review Date</label>
              <div className="text-white">{new Date(review.review_date).toLocaleDateString()}</div>
            </div>
            <div>
              <label className="text-sm text-white/60">Time</label>
              <div className="text-white">{review.review_time || 'Not set'}</div>
            </div>
          </div>

          <div>
            <label className="text-sm text-white/60">Chairperson</label>
            <div className="text-white">{review.chairperson}</div>
          </div>

          {review.attendees && review.attendees.length > 0 && (
            <div>
              <label className="text-sm text-white/60">Attendees</label>
              <div className="glass glass-border rounded-lg p-3">
                {review.attendees.map((attendee, i) => (
                  <div key={i} className="text-white/80 text-sm">• {attendee}</div>
                ))}
              </div>
            </div>
          )}

          {/* AGENDA ITEMS - For completed reviews */}
          {review.status === 'Complete' && review.agenda_items && review.agenda_items.length > 0 && (
            <div>
              <label className="text-sm text-white/60 font-semibold">Agenda Items</label>
              <div className="glass glass-border rounded-lg p-3 space-y-1">
                {review.agenda_items.map((item, i) => (
                  <div key={i} className="text-white/80 text-sm">
                    {i + 1}. {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MINUTES - For completed reviews */}
          {review.status === 'Complete' && review.minutes && (
            <div>
              <label className="text-sm text-white/60 font-semibold">Meeting Minutes</label>
              <div className="glass glass-border rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-white/80 text-sm whitespace-pre-wrap font-sans">
                  {review.minutes}
                </pre>
              </div>
            </div>
          )}

          {/* DECISIONS - For completed reviews */}
          {review.status === 'Complete' && review.decisions_made && review.decisions_made.length > 0 && (
            <div>
              <label className="text-sm text-white/60 font-semibold">Management Decisions</label>
              <div className="glass glass-border rounded-lg p-3 space-y-1">
                {review.decisions_made.map((decision, i) => (
                  <div key={i} className="text-white/80 text-sm">
                    ✓ {decision}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTION ITEMS - For completed reviews */}
          {review.status === 'Complete' && review.action_items && Array.isArray(review.action_items) && review.action_items.length > 0 && (
            <div>
              <label className="text-sm text-white/60 font-semibold">Action Items</label>
              <div className="space-y-2">
                {review.action_items.map((item, i) => (
                  <div key={i} className="glass glass-border rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-white font-medium text-sm">{item.action}</div>
                        <div className="text-white/60 text-xs mt-1">
                          Responsible: {item.responsible} • Due: {new Date(item.due_date).toLocaleDateString()}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        item.status === 'Complete' ? 'bg-green-500/20 text-green-300' :
                        item.status === 'In Progress' ? 'bg-orange-500/20 text-orange-300' :
                        'bg-blue-500/20 text-blue-300'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RESOURCE DECISIONS - For completed reviews */}
          {review.status === 'Complete' && review.resource_decisions && (
            <div>
              <label className="text-sm text-white/60 font-semibold">Resource Decisions</label>
              <div className="glass glass-border rounded-lg p-3">
                <div className="text-white/80 text-sm">{review.resource_decisions}</div>
              </div>
            </div>
          )}

          {/* IMPROVEMENT OPPORTUNITIES - For completed reviews */}
          {review.status === 'Complete' && review.improvement_opportunities && (
            <div>
              <label className="text-sm text-white/60 font-semibold">Improvement Opportunities Identified</label>
              <div className="glass glass-border rounded-lg p-3">
                <div className="text-white/80 text-sm">{review.improvement_opportunities}</div>
              </div>
            </div>
          )}

          {review.next_review_date && (
            <div>
              <label className="text-sm text-white/60">Next Review Date</label>
              <div className="text-white">{new Date(review.next_review_date).toLocaleDateString()}</div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 pt-4">
            {review.status === 'Scheduled' && !showCompleteForm && (
              <button
                onClick={() => setShowCompleteForm(true)}
                className="py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg"
              >
                Complete Review & Add Minutes
              </button>
            )}
            {review.status === 'Complete' && (
              <button
                onClick={() => exportReview(review, userProfile)}
                className="py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Minutes
              </button>
            )}
            <button
              onClick={onClose}
              className="py-3 glass glass-border text-white font-semibold rounded-lg hover:bg-white/10"
            >
              Close
            </button>
          </div>
        </div>

        {/* Complete Review Form */}
        {showCompleteForm && (
          <CompleteReviewForm
            review={review}
            onClose={() => {
              setShowCompleteForm(false)
              onClose()
            }}
          />
        )}
      </div>
    </div>
  )
}

const CreateReviewForm = ({ userProfile, onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    review_date: '',
    review_time: '',
    chairperson: '',
    attendees: '',
    next_review_date: '',
    reminder_method: 'email'
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Get count for review number
      const { count } = await supabase
        .from('management_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', userProfile.company_id)

      const year = new Date(formData.review_date).getFullYear()
      const quarter = Math.ceil((new Date(formData.review_date).getMonth() + 1) / 3)
      const reviewNumber = `MGT-${year}-Q${quarter}`

      // Parse attendees (comma-separated)
      const attendeesArray = formData.attendees
        .split(',')
        .map(a => a.trim())
        .filter(a => a.length > 0)

      const { error } = await supabase
        .from('management_reviews')
        .insert([{
          company_id: userProfile.company_id,
          review_number: reviewNumber,
          review_date: formData.review_date,
          review_time: formData.review_time || null,
          chairperson: formData.chairperson,
          attendees: attendeesArray,
          next_review_date: formData.next_review_date || null,
          status: 'Scheduled',
          reminder_method: formData.reminder_method,
          created_by: userProfile.id
        }])

      if (error) throw error

      alert('Management review scheduled successfully!')
      onCreated()
    } catch (err) {
      console.error('Error creating review:', err)
      alert('Failed to schedule review: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-slate-900 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-white mb-6">Schedule Management Review</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-white/60 block mb-2">Review Date *</label>
              <input
                type="date"
                required
                value={formData.review_date}
                onChange={(e) => setFormData({ ...formData, review_date: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800/90 border border-white/30 rounded-lg text-white placeholder-white/40"
              />
            </div>

            <div>
              <label className="text-sm text-white/60 block mb-2">Review Time</label>
              <input
                type="time"
                value={formData.review_time}
                onChange={(e) => setFormData({ ...formData, review_time: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800/90 border border-white/30 rounded-lg text-white placeholder-white/40"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-white/60 block mb-2">Chairperson *</label>
            <input
              type="text"
              required
              value={formData.chairperson}
              onChange={(e) => setFormData({ ...formData, chairperson: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800/90 border border-white/30 rounded-lg text-white placeholder-white/40"
              placeholder="e.g., Managing Director"
            />
          </div>

          <div>
            <label className="text-sm text-white/60 block mb-2">Attendees (comma-separated)</label>
            <textarea
              value={formData.attendees}
              onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800/90 border border-white/30 rounded-lg text-white placeholder-white/40"
              rows="2"
              placeholder="e.g., MD, Quality Manager, Operations Manager"
            />
          </div>

          <div>
            <label className="text-sm text-white/60 block mb-2">Next Review Date</label>
            <input
              type="date"
              value={formData.next_review_date}
              onChange={(e) => setFormData({ ...formData, next_review_date: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800/90 border border-white/30 rounded-lg text-white placeholder-white/40"
            />
          </div>

          <div>
            <label className="text-sm text-white/60 block mb-2">Reminder Method *</label>
            <select
              required
              value={formData.reminder_method}
              onChange={(e) => setFormData({ ...formData, reminder_method: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800/90 border border-white/30 rounded-lg text-white placeholder-white/40"
            >
              <option value="email" className="bg-slate-800">Email</option>
              <option value="whatsapp" className="bg-slate-800">WhatsApp</option>
              <option value="both" className="bg-slate-800">Both</option>
              <option value="none" className="bg-slate-800">No Reminder</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Scheduling...' : 'Schedule Review'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 glass glass-border text-white rounded-lg hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const CompleteReviewForm = ({ review, onClose }) => {
  const { userProfile } = useAuth()
  const [formData, setFormData] = useState({
    agenda_items: '',
    minutes: '',
    decisions_made: '',
    action_items: '',
    resource_decisions: '',
    improvement_opportunities: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Parse action items (format: action|responsible|due_date|status per line)
      const actionItemsArray = formData.action_items
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [action, responsible, due_date, status = 'Planned'] = line.split('|').map(s => s.trim())
          return { action, responsible, due_date, status }
        })

      const { error } = await supabase
        .from('management_reviews')
        .update({
          status: 'Complete',
          agenda_items: formData.agenda_items.split('\n').filter(i => i.trim()),
          minutes: formData.minutes,
          decisions_made: formData.decisions_made.split('\n').filter(d => d.trim()),
          action_items: actionItemsArray,
          resource_decisions: formData.resource_decisions,
          improvement_opportunities: formData.improvement_opportunities,
          completed_by: userProfile.id,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', review.id)

      if (error) throw error

      alert('Management review completed with minutes!')
      onClose()
      window.location.reload() // Refresh to show updated data
    } catch (err) {
      console.error('Error completing review:', err)
      alert('Failed to complete review: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-slate-900 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-white mb-6">Complete Review - Add Minutes & Evidence</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-white/60 block mb-2">Agenda Items (one per line) *</label>
            <textarea
              required
              value={formData.agenda_items}
              onChange={(e) => setFormData({ ...formData, agenda_items: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800/90 border border-white/30 rounded-lg text-white placeholder-white/40"
              rows="4"
              placeholder="Review of compliance status&#10;NCR analysis&#10;Audit findings&#10;Customer feedback"
            />
          </div>

          <div>
            <label className="text-sm text-white/60 block mb-2">Meeting Minutes * (Full details)</label>
            <textarea
              required
              value={formData.minutes}
              onChange={(e) => setFormData({ ...formData, minutes: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800/90 border border-white/30 rounded-lg text-white placeholder-white/40 font-mono text-sm"
              rows="12"
              placeholder="MANAGEMENT REVIEW MEETING MINUTES&#10;&#10;Date: [date]&#10;Time: [time]&#10;Venue: [location]&#10;&#10;ATTENDEES:&#10;- Name (Position)&#10;&#10;1. TOPIC DISCUSSED&#10;Discussion: [details]&#10;&#10;Decisions: [decisions made]&#10;Actions: [action items]"
            />
            <div className="text-xs text-white/50 mt-1">This will be your audit evidence. Be detailed.</div>
          </div>

          <div>
            <label className="text-sm text-white/60 block mb-2">Management Decisions (one per line) *</label>
            <textarea
              required
              value={formData.decisions_made}
              onChange={(e) => setFormData({ ...formData, decisions_made: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800/90 border border-white/30 rounded-lg text-white placeholder-white/40"
              rows="4"
              placeholder="Approve R25,000 training budget&#10;Implement monthly NCR reviews&#10;Upgrade document system by Q1 2025"
            />
          </div>

          <div>
            <label className="text-sm text-white/60 block mb-2">
              Action Items (one per line: action|responsible|due_date|status) *
            </label>
            <textarea
              required
              value={formData.action_items}
              onChange={(e) => setFormData({ ...formData, action_items: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800/90 border border-white/30 rounded-lg text-white placeholder-white/40 font-mono text-sm"
              rows="5"
              placeholder="Complete environmental assessment|Michael Chen|2025-02-15|In Progress&#10;Enroll in lead auditor course|Sarah Johnson|2025-03-01|Planned&#10;Evaluate document systems|Operations Manager|2025-02-20|Planned"
            />
            <div className="text-xs text-white/50 mt-1">Format: action|person|YYYY-MM-DD|status</div>
          </div>

          <div>
            <label className="text-sm text-white/60 block mb-2">Resource Decisions</label>
            <textarea
              value={formData.resource_decisions}
              onChange={(e) => setFormData({ ...formData, resource_decisions: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800/90 border border-white/30 rounded-lg text-white placeholder-white/40"
              rows="3"
              placeholder="Budget approved, staffing levels adequate, equipment needs identified..."
            />
          </div>

          <div>
            <label className="text-sm text-white/60 block mb-2">Improvement Opportunities Identified</label>
            <textarea
              value={formData.improvement_opportunities}
              onChange={(e) => setFormData({ ...formData, improvement_opportunities: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800/90 border border-white/30 rounded-lg text-white placeholder-white/40"
              rows="3"
              placeholder="Areas where system can be improved, automation opportunities, process enhancements..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Complete Review'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 glass glass-border text-white rounded-lg hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ManagementReviews
