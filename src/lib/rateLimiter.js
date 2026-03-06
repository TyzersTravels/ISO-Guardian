/**
 * Client-side rate limiter for denial-of-wallet prevention.
 * Limits rapid-fire requests to Supabase from the browser.
 */

const buckets = new Map()

/**
 * Check if an action is allowed within the rate limit window.
 * @param {string} key - Action identifier (e.g., 'login', 'assessment-submit')
 * @param {number} maxCalls - Maximum calls allowed in the window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} true if allowed, false if rate limited
 */
export function throttle(key, maxCalls = 5, windowMs = 10000) {
  const now = Date.now()
  const bucket = buckets.get(key) || []
  const filtered = bucket.filter(t => now - t < windowMs)

  if (filtered.length >= maxCalls) {
    return false
  }

  filtered.push(now)
  buckets.set(key, filtered)
  return true
}

/**
 * Login attempt tracking for account lockout.
 */
const LOGIN_ATTEMPTS_KEY = 'isoguardian_login_attempts'
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000 // 15 minutes

export function getLoginAttempts() {
  try {
    const data = JSON.parse(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '{}')
    if (data.lockedUntil && Date.now() > data.lockedUntil) {
      localStorage.removeItem(LOGIN_ATTEMPTS_KEY)
      return { count: 0, lockedUntil: null }
    }
    return { count: data.count || 0, lockedUntil: data.lockedUntil || null }
  } catch {
    return { count: 0, lockedUntil: null }
  }
}

export function recordFailedLogin() {
  const data = getLoginAttempts()
  data.count += 1
  if (data.count >= MAX_ATTEMPTS) {
    data.lockedUntil = Date.now() + LOCKOUT_MS
  }
  localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(data))
  return data
}

export function clearLoginAttempts() {
  localStorage.removeItem(LOGIN_ATTEMPTS_KEY)
}

export function getLockoutRemainingMs() {
  const data = getLoginAttempts()
  if (!data.lockedUntil) return 0
  return Math.max(0, data.lockedUntil - Date.now())
}
