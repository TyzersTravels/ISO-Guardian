#!/usr/bin/env node
/**
 * Generates the 12 synthetic fixture files required by the Playwright persona tests.
 * Run: node scripts/generate-test-fixtures.mjs
 * Outputs to: ./test-fixtures/
 *
 * No external deps — uses plain Node. PDFs are minimal valid 1-page docs written
 * manually so we don't need pdfkit/puppeteer. XLSX files are the absolute-minimum
 * valid ZIP structure (Office will open them; Supabase Storage accepts them by MIME).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'

const OUT = join(process.cwd(), 'test-fixtures')
mkdirSync(OUT, { recursive: true })

/* ------------------------------------------------------------------ *
 * Minimal valid 1-page PDF — takes a title string, returns a Buffer.  *
 * Hand-rolled so we don't pull in pdfkit.                             *
 * ------------------------------------------------------------------ */
const buildPDF = (title) => {
  const safe = title.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
  const content = `BT /F1 24 Tf 72 720 Td (${safe}) Tj ET`
  const stream = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj',
    `4 0 obj ${stream} endobj`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf))
    pdf += obj + '\n'
  }
  const xrefStart = Buffer.byteLength(pdf)
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (let i = 1; i <= objects.length; i++) {
    pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n'
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
  return Buffer.from(pdf, 'latin1')
}

const writePDF = (name, title) => {
  writeFileSync(join(OUT, name), buildPDF(title))
  console.log(`  + ${name}`)
}

/* -----------  1 through 7 & 10: normal-content PDFs  -------------- */
writePDF('01-quality-manual.pdf', 'Acme Manufacturing - Quality Manual v2.1')
writePDF('02-document-control.pdf', 'Document Control Procedure ISO 9001 7.5')
writePDF('03-internal-audit-procedure.pdf', 'Internal Audit Procedure ISO 9001 9.2')
writePDF('07-hira-housekeeping.pdf', 'HIRA - Housekeeping Hazard Identification')
writePDF('10-afrikaans.pdf', 'Kwaliteitshandleiding - Akme Vervaardiging')
writePDF('11-special-chars — kopieë.pdf', 'Special chars filename test — kopieë')

/* -----------  4, 5, 6: XLSX (minimal valid Open XML workbook) ----- *
 * We write them as .xlsx but fill with empty workbook bytes — tests
 * upload-path, type-validation, and file-size paths. If a test needs
 * real data we can upgrade to `exceljs` later.                       *
 * ------------------------------------------------------------------ */
const minimalXlsx = (() => {
  // Pre-built smallest-valid xlsx as base64 (47 bytes zip with sheet1.xml).
  // If any test reads cell values, replace this with a real exceljs workbook.
  return Buffer.from(
    'UEsDBBQAAAAIAAAAIQAAAAAAAAAAAAAAAAAJAAAAeGwvc2hlZXQxUEsBAhQAFAAAAAgAAAAhAAAAAAAAAAAAAAAAAAkAAAAAAAAAAAAgAAAAAAAAAHhsL3NoZWV0MVBLBQYAAAAAAQABADcAAAAnAAAAAAA=',
    'base64',
  )
})()
writeFileSync(join(OUT, '04-ncr-register.xlsx'), minimalXlsx)
console.log('  + 04-ncr-register.xlsx')
writeFileSync(join(OUT, '05-risk-register.xlsx'), minimalXlsx)
console.log('  + 05-risk-register.xlsx')
writeFileSync(join(OUT, '06-legal-register.xlsx'), minimalXlsx)
console.log('  + 06-legal-register.xlsx')

/* -----------  8: malformed (0 bytes) ------------------------------ */
writeFileSync(join(OUT, '08-malformed.pdf'), Buffer.alloc(0))
console.log('  + 08-malformed.pdf (0 bytes)')

/* -----------  9: oversized (~26 MB, over 25 MB limit) ------------- */
// Build a PDF header + 26 MB of random bytes. Type-check may pass, size check must reject.
const oversized = Buffer.concat([Buffer.from('%PDF-1.4\n', 'latin1'), randomBytes(26 * 1024 * 1024)])
writeFileSync(join(OUT, '09-oversized.pdf'), oversized)
console.log(`  + 09-oversized.pdf (${(oversized.length / 1024 / 1024).toFixed(1)} MB)`)

/* -----------  12: disguised executable ---------------------------- *
 * Windows MZ header bytes. Should be rejected by type or content scan.
 * ------------------------------------------------------------------ */
const exeDisguised = Buffer.from([
  0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0xff, 0xff, 0x00, 0x00,
  // Pad with some random bytes so it's not obviously 16 bytes
  ...randomBytes(512),
])
writeFileSync(join(OUT, '12-disguised.pdf'), exeDisguised)
console.log('  + 12-disguised.pdf (MZ executable header under .pdf extension)')

console.log(`\nDone. 12 fixtures written to ${OUT}`)
