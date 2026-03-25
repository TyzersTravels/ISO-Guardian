import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock react-ga4 before importing analytics
vi.mock('react-ga4', () => ({
  default: {
    initialize: vi.fn(),
    send: vi.fn(),
    event: vi.fn(),
  },
}))

// Mock CookieConsent
vi.mock('../components/CookieConsent', () => ({
  getCookieConsent: vi.fn(),
}))

describe('analytics (consent-gated)', () => {
  let initGA, trackPageView, trackEvent, trackConversion
  let getCookieConsent

  beforeEach(async () => {
    vi.resetModules()

    const cookieMock = await import('../components/CookieConsent')
    getCookieConsent = cookieMock.getCookieConsent

    // Default: no consent
    getCookieConsent.mockReturnValue(null)
  })

  it('does not initialize GA without consent', async () => {
    const ReactGA = (await import('react-ga4')).default
    getCookieConsent.mockReturnValue(null)

    const analytics = await import('./analytics')
    analytics.initGA()

    expect(ReactGA.initialize).not.toHaveBeenCalled()
  })

  it('does not initialize GA when analytics consent is false', async () => {
    const ReactGA = (await import('react-ga4')).default
    getCookieConsent.mockReturnValue({ essential: true, analytics: false })

    const analytics = await import('./analytics')
    analytics.initGA()

    expect(ReactGA.initialize).not.toHaveBeenCalled()
  })

  it('does not fire events when not initialized', async () => {
    const ReactGA = (await import('react-ga4')).default
    getCookieConsent.mockReturnValue(null)

    const analytics = await import('./analytics')
    analytics.initGA()
    analytics.trackPageView('/test')
    analytics.trackEvent('test', 'click', 'button')
    analytics.trackConversion('trial_start')

    expect(ReactGA.send).not.toHaveBeenCalled()
    expect(ReactGA.event).not.toHaveBeenCalled()
  })
})
