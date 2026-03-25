import { describe, it, expect } from 'vitest'
import { getCurrentRevision, getNextReviewDate, formatDocControl } from './documentNumbering'

describe('getCurrentRevision', () => {
  it('returns Rev 01 for newly created documents', () => {
    const now = new Date()
    expect(getCurrentRevision(now.toISOString())).toBe('Rev 01')
  })

  it('returns Rev 01 minimum even for edge cases', () => {
    expect(getCurrentRevision()).toMatch(/^Rev \d{2}$/)
    const rev = parseInt(getCurrentRevision().replace('Rev ', ''))
    expect(rev).toBeGreaterThanOrEqual(1)
  })

  it('pads single-digit revisions with zero', () => {
    const result = getCurrentRevision(new Date().toISOString())
    expect(result).toMatch(/^Rev \d{2}$/)
  })
})

describe('getNextReviewDate', () => {
  it('returns a date string with 31 January', () => {
    const result = getNextReviewDate()
    expect(result).toMatch(/^31 January \d{4}$/)
  })

  it('returns a future or current year', () => {
    const result = getNextReviewDate()
    const year = parseInt(result.split(' ')[2])
    expect(year).toBeGreaterThanOrEqual(new Date().getFullYear())
  })
})

describe('formatDocControl', () => {
  it('formats a complete doc control block', () => {
    const result = formatDocControl('IG-SH-DOC-001', 'Rev 01', '31 January 2027')
    expect(result.docNumber).toBe('IG-SH-DOC-001')
    expect(result.revision).toBe('Rev 01')
    expect(result.reviewDate).toBe('31 January 2027')
    expect(result.display).toContain('IG-SH-DOC-001')
    expect(result.display).toContain('Rev 01')
  })

  it('provides defaults when values are missing', () => {
    const result = formatDocControl(null, null, null)
    expect(result.docNumber).toBe('Unassigned')
    expect(result.revision).toMatch(/^Rev \d{2}$/)
    expect(result.reviewDate).toMatch(/^31 January/)
  })
})
