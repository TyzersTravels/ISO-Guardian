/**
 * Google Analytics 4 — POPIA-compliant, loads only after cookie consent
 * Uses gtag.js directly (no extra npm packages needed)
 */

const GA_MEASUREMENT_ID = 'G-80X4PGCGH1'
let initialized = false

export function initGA() {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  function gtag() { window.dataLayer.push(arguments) }
  window.gtag = gtag

  gtag('js', new Date())
  gtag('config', GA_MEASUREMENT_ID, {
    anonymize_ip: true,
    cookie_flags: 'SameSite=None;Secure',
  })
}

export function trackPageView(path) {
  if (!initialized || !window.gtag) return
  window.gtag('config', GA_MEASUREMENT_ID, { page_path: path })
}

export function trackEvent(category, action, label) {
  if (!initialized || !window.gtag) return
  window.gtag('event', action, { event_category: category, event_label: label })
}

export function trackConversion(type) {
  trackEvent('conversion', type, window.location.pathname)
}
