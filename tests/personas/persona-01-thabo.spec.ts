import { test, expect } from '@playwright/test';
import {
  signIn,
  bookDemoFromLanding,
  openInteractiveDemo,
  uploadDocument,
  createNCR,
  screenshot,
  captureConsoleErrors,
} from '../helpers/isoguardian';

/**
 * Persona 1 — Thabo Mokoena (First-Time SME Owner).
 * Consultation-gated flow: Thabo never self-signs up. A super_admin provisions
 * his account after the consultation + signed contract. His first UI interaction
 * as an authenticated user is the /login page with temp credentials.
 *
 * Seeded state required (staging):
 *   - Company "Mokoena Fabrication (Pty) Ltd", company_code "MF"
 *   - User thabo@mokoena-test.example (role: admin) — invited via /create-company
 *   - Temp password known via THABO_TEMP_PASSWORD env var
 */

const THABO_EMAIL = process.env.THABO_EMAIL || 'thabo@mokoena-test.example';
const THABO_PASSWORD = process.env.THABO_TEMP_PASSWORD || '';

test.describe('Persona 1 — Thabo Mokoena', () => {
  test.skip(!THABO_PASSWORD, 'Set THABO_TEMP_PASSWORD to run this persona against staging');

  test('Journey A — landing funnel → Book a Demo → Interactive Demo', async ({ page }) => {
    const errors = captureConsoleErrors(page, 'thabo');

    await page.goto('/');
    await screenshot(page, 'thabo', '01-landing-hero');

    // Lead funnel: readiness assessment (TODO wire up 10 questions) → consultation request
    await bookDemoFromLanding(page, {
      name: 'Thabo Mokoena',
      email: THABO_EMAIL,
      company: 'Mokoena Fabrication (Pty) Ltd',
      phone: '+27 82 000 0000',
      message: 'Steel fabrication, 18 staff, need ISO 9001 within 6 months.',
    });
    await screenshot(page, 'thabo', '02-consultation-submitted');

    await openInteractiveDemo(page);
    await screenshot(page, 'thabo', '03-interactive-demo');

    // Launch-blocker guard: /demo must NOT have a "Start Free Trial" CTA.
    await expect(page.getByRole('button', { name: /start.*free.*trial/i })).toHaveCount(0);

    const { count } = errors.flush();
    expect(count, 'console errors on public journey').toBe(0);
  });

  test('Journey B — first login post-provisioning → upload Document 1 → log first NCR', async ({ page }) => {
    const errors = captureConsoleErrors(page, 'thabo');

    await signIn(page, { email: THABO_EMAIL, password: THABO_PASSWORD });
    await screenshot(page, 'thabo', '04-dashboard-first-login');

    // TODO: verify OnboardingWelcome actually onboards (tells him the next 3 actions),
    // not just a greeting. Capture a screenshot of the tutorial and score qualitatively.

    await uploadDocument(page, {
      filePath: './test-fixtures/01-quality-manual.pdf',
      title: 'Quality Manual v1.0',
      standard: 'iso_9001',
      clauseRef: '4-10',
    });
    await screenshot(page, 'thabo', '05-first-document-uploaded');

    await createNCR(page, {
      clause: '8.2',
      severity: 'minor',
      description: 'Customer complaint — delayed delivery on order #2026-0041.',
    });
    await screenshot(page, 'thabo', '06-first-ncr-logged');

    const { count } = errors.flush();
    expect(count).toBe(0);
  });

  test('Guard — /signup route must not be reachable from public nav', async ({ page }) => {
    await page.goto('/');
    // No "Sign up" or "Start Trial" links should exist anywhere on the public surface.
    const signupLinks = page.getByRole('link', { name: /sign.?up|start.*trial|free.*trial/i });
    await expect(signupLinks).toHaveCount(0);
  });
});
