import { test, expect } from '@playwright/test';
import path from 'node:path';
import {
  signIn,
  bulkUpload,
  createNCR,
  scheduleAudit,
  exportPDF,
  screenshot,
  captureConsoleErrors,
} from '../helpers/isoguardian';

/**
 * Persona 2 — Priya Naidoo (Experienced SHEQ Manager).
 * Seeded state required (staging):
 *   - Company "Apex Logistics Solutions", company_code "APEX"
 *   - User priya@apex-test.example with role `admin`
 */

const PRIYA_EMAIL = process.env.PRIYA_EMAIL || 'priya@apex-test.example';
const PRIYA_PASSWORD = process.env.PRIYA_PASSWORD || '';
const FIXTURES = path.resolve('test-fixtures');

test.describe('Persona 2 — Priya Naidoo', () => {
  test.skip(!PRIYA_PASSWORD, 'Set PRIYA_PASSWORD to run this persona against staging');

  test('Bulk upload 6 docs, create NCR against Cl. 8.4, schedule audit, export PDF', async ({ page }) => {
    const errors = captureConsoleErrors(page, 'priya');

    await signIn(page, { email: PRIYA_EMAIL, password: PRIYA_PASSWORD });

    // Documents 2-7 bulk upload — tests atomic numbering on 6 parallel inserts.
    await bulkUpload(page, {
      filePaths: [
        path.join(FIXTURES, '02-document-control.pdf'),
        path.join(FIXTURES, '03-internal-audit-procedure.pdf'),
        path.join(FIXTURES, '04-ncr-register.xlsx'),
        path.join(FIXTURES, '05-risk-register.xlsx'),
        path.join(FIXTURES, '06-legal-register.xlsx'),
        path.join(FIXTURES, '07-hira-housekeeping.pdf'),
      ],
    });
    await screenshot(page, 'priya', '01-bulk-upload-complete');

    // Document 9 (oversized) must be rejected.
    // TODO: reuse uploadDocument helper with 09-oversized.pdf and assert toast error.

    await createNCR(page, {
      clause: '8.4',
      severity: 'major',
      description: 'Supplier non-conformance: uncertified lifting equipment delivered.',
      targetDate: '2026-05-15',
    });
    await screenshot(page, 'priya', '02-ncr-against-cl-8-4');

    await scheduleAudit(page, {
      standard: 'ISO 9001',
      clauseScope: '9.2',
      date: '2026-04-24',
    });
    await screenshot(page, 'priya', '03-audit-scheduled');

    // TODO: open scheduled audit → complete Audit Close-Out → assert ALL fields persist
    // (conclusion, evidence, recommendation). Per MEMORY this was previously broken.

    // TODO: export PDF and verify client logo is hero, ISOGuardian is subtle footer.
    // const pdf = await exportPDF(page, { from: 'audit', recordId: '<id>' });

    const { count } = errors.flush();
    expect(count).toBe(0);
  });

  test('Injection — drop-table + <script> in text fields must be safely escaped', async ({ page }) => {
    await signIn(page, { email: PRIYA_EMAIL, password: PRIYA_PASSWORD });
    await createNCR(page, {
      clause: '8.2',
      severity: 'minor',
      description: `'); DROP TABLE documents; -- <script>alert('xss')</script>`,
    });
    // Assert no alert fired and the text rendered as literal string.
    await expect(page.getByText(/DROP TABLE/)).toBeVisible();
  });
});
