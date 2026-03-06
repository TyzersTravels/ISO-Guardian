import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const defaultPrefs = {
  audit_reminders: true,
  overdue_ncrs: true,
  document_reviews: true,
  weekly_digest: true,
}

const NotificationPreferences = () => {
  const { userProfile } = useAuth()
  const toast = useToast()
  const [prefs, setPrefs] = useState(defaultPrefs)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userProfile) loadPrefs()
  }, [userProfile])

  const loadPrefs = async () => {
    try {
      const { data } = await supabase
        .from('users')
        .select('notification_preferences')
        .eq('id', userProfile.id)
        .single()

      if (data?.notification_preferences) {
        setPrefs({ ...defaultPrefs, ...data.notification_preferences })
      }
    } catch (err) {
      // Column may not exist yet — use defaults
    } finally {
      setLoading(false)
    }
  }

  const savePrefs = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ notification_preferences: prefs })
        .eq('id', userProfile.id)

      if (error) throw error
      toast.success('Notification preferences saved!')
    } catch (err) {
      console.error('Error saving preferences:', err)
      toast.error('Failed to save preferences. The notification_preferences column may need to be added to the users table.')
    } finally {
      setSaving(false)
    }
  }

  const toggle = (key) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const notifications = [
    {
      key: 'audit_reminders',
      title: 'Audit Reminders',
      description: 'Get notified 7 days and 1 day before scheduled audits',
      icon: (
        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      key: 'overdue_ncrs',
      title: 'Overdue NCR Alerts',
      description: 'Get alerted when NCRs pass their target close date',
      icon: (
        <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      key: 'document_reviews',
      title: 'Document Review Reminders',
      description: 'Get notified when documents are due for review within 7 days',
      icon: (
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      key: 'weekly_digest',
      title: 'Weekly Digest',
      description: 'Monday summary of open NCRs, upcoming audits, and documents due',
      icon: (
        <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
  ]

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="glass glass-border rounded-2xl p-6">
          <h1 className="text-2xl font-bold text-white mb-1">Notification Preferences</h1>
          <p className="text-white/50 text-sm">
            Choose which email notifications you receive. Changes apply to future notifications.
          </p>
        </div>

        <div className="glass glass-border rounded-2xl p-6 space-y-4">
          {notifications.map(({ key, title, description, icon }) => (
            <div
              key={key}
              className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                  {icon}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">{title}</h3>
                  <p className="text-white/40 text-xs mt-0.5">{description}</p>
                </div>
              </div>
              <button
                onClick={() => toggle(key)}
                className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${
                  prefs[key] ? 'bg-cyan-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                    prefs[key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={savePrefs}
          disabled={saving}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>

        <div className="glass glass-border rounded-2xl p-4 bg-blue-500/5">
          <p className="text-white/40 text-xs">
            Emails are sent via our notification system at 07:00 SAST. Weekly digests are sent on Mondays.
            To unsubscribe from all notifications, toggle all options off and save.
          </p>
        </div>
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

export default NotificationPreferences
