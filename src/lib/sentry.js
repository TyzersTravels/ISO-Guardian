/**
 * Sentry error tracking — placeholder until Sentry is configured
 * Safe no-ops so CookieConsent.jsx imports don't break the build
 */

export function initSentry() {
  // No-op until VITE_SENTRY_DSN is configured
}

export function captureError(error, context) {
  // Falls back to console in dev
  if (import.meta.env.DEV) {
    console.error('[Sentry placeholder]', error, context)
  }
}

export function setUser() {
  // No-op
}
