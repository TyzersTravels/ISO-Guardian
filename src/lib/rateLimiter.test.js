import { describe, it, expect, beforeEach } from 'vitest'
import { throttle, getLoginAttempts, recordFailedLogin, clearLoginAttempts, getLockoutRemainingMs } from './rateLimiter'

describe('throttle', () => {
  it('allows calls within the rate limit', () => {
    expect(throttle('test-action', 3, 10000)).toBe(true)
    expect(throttle('test-action', 3, 10000)).toBe(true)
    expect(throttle('test-action', 3, 10000)).toBe(true)
  })

  it('blocks calls exceeding the rate limit', () => {
    for (let i = 0; i < 5; i++) throttle('blocked-action', 5, 10000)
    expect(throttle('blocked-action', 5, 10000)).toBe(false)
  })

  it('uses separate buckets per key', () => {
    for (let i = 0; i < 3; i++) throttle('bucket-a', 3, 10000)
    expect(throttle('bucket-a', 3, 10000)).toBe(false)
    expect(throttle('bucket-b', 3, 10000)).toBe(true)
  })
})

describe('login attempt tracking', () => {
  beforeEach(() => {
    clearLoginAttempts()
  })

  it('starts with zero attempts', () => {
    const data = getLoginAttempts()
    expect(data.count).toBe(0)
    expect(data.lockedUntil).toBeNull()
  })

  it('increments failed attempts', () => {
    recordFailedLogin()
    recordFailedLogin()
    const data = getLoginAttempts()
    expect(data.count).toBe(2)
    expect(data.lockedUntil).toBeNull()
  })

  it('locks out after 5 failed attempts', () => {
    for (let i = 0; i < 5; i++) recordFailedLogin()
    const data = getLoginAttempts()
    expect(data.count).toBe(5)
    expect(data.lockedUntil).not.toBeNull()
    expect(data.lockedUntil).toBeGreaterThan(Date.now())
  })

  it('reports remaining lockout time', () => {
    for (let i = 0; i < 5; i++) recordFailedLogin()
    const remaining = getLockoutRemainingMs()
    // Should be close to 15 minutes (900000ms)
    expect(remaining).toBeGreaterThan(890000)
    expect(remaining).toBeLessThanOrEqual(900000)
  })

  it('clears attempts on clearLoginAttempts', () => {
    for (let i = 0; i < 3; i++) recordFailedLogin()
    clearLoginAttempts()
    expect(getLoginAttempts().count).toBe(0)
  })

  it('auto-clears expired lockouts', () => {
    // Simulate an expired lockout
    const expired = { count: 5, lockedUntil: Date.now() - 1000 }
    localStorage.setItem('isoguardian_login_attempts', JSON.stringify(expired))
    const data = getLoginAttempts()
    expect(data.count).toBe(0)
    expect(data.lockedUntil).toBeNull()
  })
})
