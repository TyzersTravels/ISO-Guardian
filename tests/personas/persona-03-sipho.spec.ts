import { test, expect } from '@playwright/test';
import { signIn, expectAuthRedirect, screenshot, captureConsoleErrors } from '../helpers/isoguardian';

/**
 * Persona 3 — Sipho Dlamini (Reseller Partner) — SECURITY-CRITICAL.
 * Seeded state required (staging):
 *   - Reseller company "Dlamini Compliance Consulting CC" (company_code DCC)
 *   - User sipho@dcc-test.example with role `admin`
 *   - 3 linked clients in `resellers` + `reseller_clients`: Client-Alpha, Client-Beta, Client-Gamma
 */

const SIPHO_EMAIL = process.env.SIPHO_EMAIL || 'sipho@dcc-test.example';
const SIPHO_PASSWORD = process.env.SIPHO_PASSWORD || '';

test.describe('Persona 3 — Sipho Dlamini (RLS launch-blocker tests)', () => {
  test.skip(!SIPHO_PASSWORD, 'Set SIPHO_PASSWORD to run reseller/RLS tests');

  test('ClientSelector renders and switches context', async ({ page }) => {
    const errors = captureConsoleErrors(page, 'sipho');
    await signIn(page, { email: SIPHO_EMAIL, password: SIPHO_PASSWORD });

    await expect(page.getByText(/Client.?Alpha/i)).toBeVisible();
    await expect(page.getByText(/Client.?Beta/i)).toBeVisible();
    await expect(page.getByText(/Client.?Gamma/i)).toBeVisible();

    await page.getByRole('button', { name: /Client.?Alpha/i }).click();
    await screenshot(page, 'sipho', '01-switched-to-alpha');

    errors.flush();
  });

  test('Cross-tenant URL tampering — Alpha document must NOT leak into Beta context', async ({ page }) => {
    await signIn(page, { email: SIPHO_EMAIL, password: SIPHO_PASSWORD });

    // TODO:
    //   1. Switch to Alpha, upload a document "ALPHA-CONFIDENTIAL-ONLY", capture its UUID
    //   2. Switch to Beta
    //   3. Navigate to /documents/<alpha-uuid>
    //   4. Assert the document is NOT displayed (RLS blocks, UI shows empty/404 state)
    //   5. Assert no response body leaks Alpha's title/filename
    //
    // This test is the launch-blocker. ANY cross-tenant leak = DO NOT LAUNCH.
  });

  test('Raw Supabase query with Beta JWT targeting Alpha company_id must be rejected by RLS', async ({ page }) => {
    await signIn(page, { email: SIPHO_EMAIL, password: SIPHO_PASSWORD });

    // TODO: switch to Beta, read session token from localStorage, fire a fetch() at
    // Supabase rest endpoint with Alpha's company_id in the filter. Expect 403 or empty array.
  });

  test('Concurrent session — second login kicks first out with session_replaced', async ({ browser }) => {
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await signIn(pageA, { email: SIPHO_EMAIL, password: SIPHO_PASSWORD });

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await signIn(pageB, { email: SIPHO_EMAIL, password: SIPHO_PASSWORD });

    // Within 30s the first session should detect the stamp change and redirect.
    await expectAuthRedirect(pageA, 'session_replaced');

    await ctxA.close();
    await ctxB.close();
  });

  test('Idle timeout — 30 min inactivity on /dashboard redirects to /login?reason=idle_timeout', async ({ page }) => {
    test.setTimeout(35 * 60 * 1000);
    await signIn(page, { email: SIPHO_EMAIL, password: SIPHO_PASSWORD });
    // NOTE: real-time waiting is costly. Consider stubbing Date.now or exposing a test hook
    // in AuthContext rather than actually waiting 31 minutes.
    await page.waitForTimeout(31 * 60 * 1000);
    await expectAuthRedirect(page, 'idle_timeout');
  });
});
