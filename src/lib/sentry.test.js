import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @sentry/react
vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  setUser: vi.fn(),
  browserTracingIntegration: vi.fn(() => ({})),
}))

// Mock CookieConsent
vi.mock('../components/CookieConsent', () => ({
  getCookieConsent: vi.fn(),
}))

describe('sentry (consent-gated)', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('does not initialize Sentry without consent', async () => {
    const Sentry = await import('@sentry/react')
    const { getCookieConsent } = await import('../components/CookieConsent')
    getCookieConsent.mockReturnValue(null)

    const sentry = await import('./sentry')
    sentry.initSentry()

    expect(Sentry.init).not.toHaveBeenCalled()
  })

  it('does not initialize Sentry when analytics consent is false', async () => {
    const Sentry = await import('@sentry/react')
    const { getCookieConsent } = await import('../components/CookieConsent')
    getCookieConsent.mockReturnValue({ essential: true, analytics: false })

    const sentry = await import('./sentry')
    sentry.initSentry()

    expect(Sentry.init).not.toHaveBeenCalled()
  })

  it('does not capture errors when not initialized', async () => {
    const Sentry = await import('@sentry/react')
    const { getCookieConsent } = await import('../components/CookieConsent')
    getCookieConsent.mockReturnValue(null)

    const sentry = await import('./sentry')
    sentry.initSentry()
    sentry.captureError(new Error('test'), { context: 'test' })

    expect(Sentry.captureException).not.toHaveBeenCalled()
  })

  it('does not set user when not initialized', async () => {
    const Sentry = await import('@sentry/react')
    const { getCookieConsent } = await import('../components/CookieConsent')
    getCookieConsent.mockReturnValue(null)

    const sentry = await import('./sentry')
    sentry.initSentry()
    sentry.setUser('user-123')

    expect(Sentry.setUser).not.toHaveBeenCalled()
  })
})
