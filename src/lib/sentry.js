// Sentry error tracking — consent-aware, only initializes after analytics opt-in
import * as Sentry from '@sentry/react'
import { getCookieConsent } from '../components/CookieConsent'

let initialized = false
const DSN = import.meta.env.VITE_SENTRY_DSN

export function initSentry() {
  if (initialized || !DSN) return
  const consent = getCookieConsent()
  if (consent?.analytics) {
    Sentry.init({
      dsn: DSN,
      environment: import.meta.env.MODE,
      integrations: [
        Sentry.browserTracingIntegration(),
      ],
      tracesSampleRate: 0.2,
      replaysOnErrorSampleRate: 0,
      beforeSend(event) {
        // Strip PII from error reports
        if (event.user) {
          delete event.user.email
          delete event.user.ip_address
        }
        return event
      },
    })
    initialized = true
  }
}

export function captureError(error, context) {
  if (!initialized) return
  Sentry.captureException(error, { extra: context })
}

export function setUser(id) {
  if (!initialized) return
  Sentry.setUser(id ? { id } : null)
}

export { Sentry }
