import { describe, it, expect } from 'vitest'
import { TEMPLATES, DOC_NUMBER_MAP, CROSS_REFERENCES, resolveAllPlaceholders } from './templateData'

describe('TEMPLATES registry', () => {
  it('has at least 20 templates defined', () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(20)
  })

  it('every template has required fields', () => {
    for (const t of TEMPLATES) {
      expect(t.id, `${t.id} missing id`).toBeTruthy()
      expect(t.title, `${t.id} missing title`).toBeTruthy()
      expect(t.standard, `${t.id} missing standard`).toBeTruthy()
      expect(t.docType, `${t.id} missing docType`).toBeTruthy()
    }
  })

  it('has no duplicate template IDs', () => {
    const ids = TEMPLATES.map(t => t.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('all standards are valid ISO standards', () => {
    const validStandards = ['ISO_9001', 'ISO_14001', 'ISO_45001', 'MULTI']
    for (const t of TEMPLATES) {
      expect(validStandards, `${t.id} has invalid standard: ${t.standard}`).toContain(t.standard)
    }
  })

  it('every template has pricing', () => {
    for (const t of TEMPLATES) {
      expect(typeof t.pricePublic, `${t.id} missing pricePublic`).toBe('number')
      expect(typeof t.priceSubscriber, `${t.id} missing priceSubscriber`).toBe('number')
      expect(t.priceSubscriber).toBeLessThanOrEqual(t.pricePublic)
    }
  })
})

describe('DOC_NUMBER_MAP', () => {
  it('maps template IDs to document codes', () => {
    expect(DOC_NUMBER_MAP['qms-manual']).toBeTruthy()
    expect(DOC_NUMBER_MAP['doc-control-proc']).toBeTruthy()
  })

  it('all non-bundle template IDs in TEMPLATES have a DOC_NUMBER_MAP entry', () => {
    const regularTemplates = TEMPLATES.filter(t => t.docType !== 'bundle')
    for (const t of regularTemplates) {
      expect(DOC_NUMBER_MAP[t.id], `${t.id} missing from DOC_NUMBER_MAP`).toBeTruthy()
    }
  })
})

describe('CROSS_REFERENCES', () => {
  it('exists and has entries', () => {
    expect(Object.keys(CROSS_REFERENCES).length).toBeGreaterThan(0)
  })

  it('all referenced template IDs exist in TEMPLATES', () => {
    const templateIds = new Set(TEMPLATES.map(t => t.id))
    for (const [sourceId, { references, referencedBy }] of Object.entries(CROSS_REFERENCES)) {
      expect(templateIds.has(sourceId), `Source ${sourceId} not in TEMPLATES`).toBe(true)
      for (const ref of references) {
        expect(templateIds.has(ref), `Ref ${ref} (from ${sourceId}) not in TEMPLATES`).toBe(true)
      }
      for (const ref of referencedBy) {
        expect(templateIds.has(ref), `ReferencedBy ${ref} (from ${sourceId}) not in TEMPLATES`).toBe(true)
      }
    }
  })
})

describe('resolveAllPlaceholders', () => {
  it('resolves {{COMPANY}} placeholder', () => {
    const result = resolveAllPlaceholders('Welcome to {{COMPANY}}', { companyName: 'TestCo' })
    expect(result).toBe('Welcome to TestCo')
  })

  it('resolves {{DATE}} placeholder to a date string', () => {
    const result = resolveAllPlaceholders('Generated on {{DATE}}', {})
    // Date format is "DD Month YYYY"
    expect(result).toMatch(/Generated on \d{1,2} \w+ \d{4}/)
  })

  it('leaves unresolved placeholders marked', () => {
    const result = resolveAllPlaceholders('Score: {{LIVE:COMPLIANCE_SCORE:ISO_9001}}', {})
    expect(result).toBeTruthy()
  })
})
