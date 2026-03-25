import { describe, it, expect, beforeEach } from 'vitest'
import { getCookieConsent } from '../components/CookieConsent'

describe('getCookieConsent', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when no consent stored', () => {
    expect(getCookieConsent()).toBeNull()
  })

  it('returns parsed consent when stored', () => {
    const consent = {
      essential: true,
      functional: true,
      analytics: false,
      timestamp: '2026-03-24T00:00:00.000Z',
      version: '1.0',
    }
    localStorage.setItem('isoguardian_cookie_consent', JSON.stringify(consent))
    const result = getCookieConsent()
    expect(result.essential).toBe(true)
    expect(result.functional).toBe(true)
    expect(result.analytics).toBe(false)
    expect(result.version).toBe('1.0')
  })

  it('returns null on corrupted data', () => {
    localStorage.setItem('isoguardian_cookie_consent', 'not-json')
    expect(getCookieConsent()).toBeNull()
  })

  it('essential is always true when all accepted', () => {
    const consent = { essential: true, functional: true, analytics: true }
    localStorage.setItem('isoguardian_cookie_consent', JSON.stringify(consent))
    expect(getCookieConsent().essential).toBe(true)
  })
})
