import { test, expect } from '@playwright/test';
import { signIn, screenshot } from '../helpers/isoguardian';

/**
 * Persona 4 — Karen van der Merwe (Churner).
 * Once the in-app cancellation flow (CompanySettings → Subscription tab) and the
 * POPIA s24 "Request Data Deletion" button are built, this persona should PASS.
 * Until those are built, the two blocks below are expected to fail — that failure
 * IS the verification that the feature gap is still present.
 *
 * Seeded state required (staging):
 *   - A throwaway company with an active subscription row
 *   - User karen@churn-test.example with role `admin`
 */

const KAREN_EMAIL = process.env.KAREN_EMAIL || 'karen@churn-test.example';
const KAREN_PASSWORD = process.env.KAREN_PASSWORD || '';

test.describe('Persona 4 — Karen van der Merwe (cancellation + erasure flows)', () => {
  test.skip(!KAREN_PASSWORD, 'Set KAREN_PASSWORD to run cancellation/erasure tests');

  test('Self-serve cancellation flow exists in CompanySettings → Subscription tab', async ({ page }) => {
    await signIn(page, { email: KAREN_EMAIL, password: KAREN_PASSWORD });
    await page.goto('/settings');

    // New Subscription tab added alongside Profile / Personnel / QMS
    await page.getByRole('tab', { name: /subscription/i }).click();
    await screenshot(page, 'karen', '01-subscription-tab');

    await page.getByRole('button', { name: /request cancellation|cancel subscription/i }).click();

    // Confirmation modal contents
    await expect(page.getByText(/CPA.*5.*business.*day|cooling.?off/i)).toBeVisible();
    await expect(page.getByText(/early.*termination.*fee|50%|25%/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /export.*data|POPIA/i })).toBeVisible();

    await page.getByRole('checkbox', { name: /understand|acknowledge/i }).check();
    await page.getByRole('button', { name: /confirm|submit/i }).click();

    await expect(page.getByText(/cancellation.*requested|effective/i)).toBeVisible({ timeout: 10_000 });
    await screenshot(page, 'karen', '02-cancellation-confirmation');
  });

  test('POPIA s24 Request Data Deletion flow exists in UserProfile', async ({ page }) => {
    await signIn(page, { email: KAREN_EMAIL, password: KAREN_PASSWORD });
    await page.goto('/profile');

    await page.getByRole('button', { name: /request data deletion|POPIA|erasure/i }).click();
    await expect(page.getByText(/30.?day|POPIA.*s24|lawful retention/i)).toBeVisible();

    await page.getByRole('checkbox', { name: /understand|acknowledge/i }).check();
    await page.getByRole('button', { name: /confirm|submit/i }).click();

    await expect(page.getByText(/request received|processed within 30 days/i)).toBeVisible({ timeout: 10_000 });
    await screenshot(page, 'karen', '03-erasure-confirmation');
  });

  test('POPIA right of access — /data-export works before any cancellation', async ({ page }) => {
    await signIn(page, { email: KAREN_EMAIL, password: KAREN_PASSWORD });
    await page.goto('/data-export');

    const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
    await page.getByRole('button', { name: /export|download/i }).first().click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.(json|zip|csv)$/i);
  });
});
