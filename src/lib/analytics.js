// GA4 Analytics — consent-aware, only fires after user opts in
import ReactGA from 'react-ga4'
import { getCookieConsent } from '../components/CookieConsent'

let initialized = false
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID

export function initGA() {
  if (initialized || !MEASUREMENT_ID) return
  const consent = getCookieConsent()
  if (consent?.analytics) {
    ReactGA.initialize(MEASUREMENT_ID)
    initialized = true
  }
}

export function trackPageView(path) {
  if (!initialized) return
  ReactGA.send({ hitType: 'pageview', page: path })
}

export function trackEvent(category, action, label) {
  if (!initialized) return
  ReactGA.event({ category, action, label })
}

export function trackConversion(type) {
  trackEvent('conversion', type, window.location.pathname)
}
