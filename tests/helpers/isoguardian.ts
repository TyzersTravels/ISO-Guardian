import { Page, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const SCREENSHOT_ROOT = path.resolve('test-output/screenshots');
const ERROR_LOG_ROOT = path.resolve('test-output/console-errors');

export type SignInOptions = {
  email: string;
  password: string;
  expectRedirect?: string;
};

export type UploadDocumentOptions = {
  filePath: string;
  title: string;
  category?: string;
  clauseRef?: string;
  standard?: 'iso_9001' | 'iso_14001' | 'iso_45001';
};

export type BulkUploadOptions = {
  filePaths: string[];
};

export type CreateNCROptions = {
  clause: string;
  severity: 'minor' | 'major' | 'critical';
  description: string;
  assignee?: string;
  targetDate?: string;
};

export type ScheduleAuditOptions = {
  standard: 'ISO 9001' | 'ISO 14001' | 'ISO 45001';
  clauseScope: string;
  auditor?: string;
  date: string;
};

export type ExportPDFOptions = {
  from: 'document' | 'audit' | 'compliance';
  recordId: string;
};

/**
 * Goes to /login, enters credentials, handles Turnstile (test site key auto-passes).
 * Expects a redirect to /dashboard by default; pass expectRedirect to override.
 */
export async function signIn(page: Page, { email, password, expectRedirect = '/dashboard' }: SignInOptions) {
  // Pre-dismiss cookie banner so it can't intercept clicks during the run.
  await page.context().addInitScript(() => {
    try {
      window.localStorage.setItem('isoguardian_cookie_consent', JSON.stringify({
        essential: true, functional: true, analytics: true, timestamp: new Date().toISOString(), version: '1.0',
      }));
    } catch {}
  });
  await page.goto('/login');
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);

  // Turnstile test site key (1x00000000000000000000AA) auto-passes — wait briefly for it to resolve.
  await page.waitForTimeout(1500);

  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await page.waitForURL(new RegExp(expectRedirect.replace(/\//g, '\\/')), { timeout: 30_000 });
}

/**
 * Catches the two auth redirect reasons the AuthContext uses and asserts on them.
 * Call this directly after an action expected to kick the user out.
 */
export async function expectAuthRedirect(page: Page, reason: 'session_replaced' | 'idle_timeout') {
  await page.waitForURL(new RegExp(`/login\\?reason=${reason}`), { timeout: 60_000 });
  await expect(page).toHaveURL(new RegExp(`reason=${reason}`));
}

/**
 * Goes to /documents and uploads a single file via the Upload modal.
 * Selectors use accessible names — update these if Documents.jsx labels change.
 */
export async function uploadDocument(page: Page, opts: UploadDocumentOptions) {
  await page.goto('/documents');
  await page.getByRole('button', { name: /upload document|new document|upload/i }).first().click();

  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(opts.filePath);

  await page.getByLabel(/title|name/i).first().fill(opts.title);

  if (opts.category) {
    await page.getByLabel(/category/i).selectOption({ label: opts.category }).catch(() => {});
  }
  if (opts.clauseRef) {
    await page.getByLabel(/clause/i).fill(opts.clauseRef).catch(() => {});
  }
  if (opts.standard) {
    await page.getByLabel(/standard/i).selectOption(opts.standard).catch(() => {});
  }

  await page.getByRole('button', { name: /upload|save|submit/i }).last().click();
  await expect(page.getByText(opts.title)).toBeVisible({ timeout: 30_000 });
}

/**
 * Drives the BulkUploadForm in Documents.jsx (uses webkitdirectory).
 * Pass an array of absolute file paths — Playwright handles the input.files assignment.
 */
export async function bulkUpload(page: Page, { filePaths }: BulkUploadOptions) {
  await page.goto('/documents');
  await page.getByRole('button', { name: /bulk upload/i }).click();

  const fileInput = page.locator('input[type="file"][webkitdirectory], input[type="file"][multiple]').first();
  await fileInput.setInputFiles(filePaths);

  await page.getByRole('button', { name: /upload|start|submit/i }).last().click();

  // Wait for each file to appear — uses filename basenames
  for (const fp of filePaths) {
    const basename = path.basename(fp);
    await expect(page.getByText(basename, { exact: false })).toBeVisible({ timeout: 60_000 });
  }
}

export async function createNCR(page: Page, opts: CreateNCROptions) {
  await page.goto('/ncrs');
  await page.getByRole('button', { name: /new ncr|create ncr|raise ncr|add ncr/i }).first().click();

  // Title is required — derive from description
  await page.locator('#ncr-title').fill(opts.description.slice(0, 80));
  await page.locator('#ncr-description').fill(opts.description);

  // Clause is a select with values 4-10. Accept "8.4" or "8" — take the leading integer.
  const clauseNum = String(parseInt(String(opts.clause), 10));
  await page.locator('#ncr-clause').selectOption(clauseNum).catch(() => {});

  // Severity in UI is capitalized (Critical/Major/Minor); map from lowercase opts.severity
  const severityMap: Record<string, string> = { critical: 'Critical', major: 'Major', minor: 'Minor' };
  await page.locator('#ncr-severity').selectOption(severityMap[opts.severity] ?? 'Minor').catch(() => {});

  // Due date required — default to 30 days out if caller didn't supply
  const due = opts.targetDate ?? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  await page.locator('#ncr-due-date').fill(due);

  // Root cause + corrective action required
  await page.locator('#ncr-root-cause').fill('To be determined during investigation.');
  await page.locator('#ncr-corrective-action').fill('To be assigned post-investigation.');

  await page.getByRole('button', { name: /create ncr|save|submit/i }).last().click();
  await expect(page.getByText(/NCR-|IG-.*-NCR-/)).toBeVisible({ timeout: 15_000 });
}

export async function scheduleAudit(page: Page, opts: ScheduleAuditOptions) {
  await page.goto('/audits');
  await page.getByRole('button', { name: /schedule audit|new audit|create audit/i }).first().click();

  await page.getByLabel(/standard/i).selectOption({ label: opts.standard }).catch(() => {});
  await page.getByLabel(/clause|scope/i).fill(opts.clauseScope).catch(() => {});
  if (opts.auditor) await page.getByLabel(/auditor/i).fill(opts.auditor).catch(() => {});
  await page.getByLabel(/date/i).fill(opts.date);

  await page.getByRole('button', { name: /save|schedule|create/i }).last().click();
  await expect(page.getByText(/AUD-/)).toBeVisible({ timeout: 15_000 });
}

export async function exportPDF(page: Page, opts: ExportPDFOptions) {
  const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
  await page.getByRole('button', { name: /export pdf|download pdf|pdf/i }).first().click();
  const download = await downloadPromise;
  const outDir = path.resolve('test-output/pdfs');
  fs.mkdirSync(outDir, { recursive: true });
  const saved = path.join(outDir, `${opts.from}-${opts.recordId}.pdf`);
  await download.saveAs(saved);
  return saved;
}

/**
 * Consultation-gated flow helper: navigates the public funnel (landing → assessment → consultation).
 * There is NO self-serve signup — see project_no_trial_consultation_gated.md.
 */
export async function bookDemoFromLanding(page: Page, lead: { name: string; email: string; company: string; phone: string; message?: string }) {
  await page.goto('/');
  await page.getByRole('button', { name: /book a demo|request consultation|book demo/i }).first().click();

  await page.getByLabel(/name/i).first().fill(lead.name);
  await page.getByLabel(/email/i).first().fill(lead.email);
  await page.getByLabel(/company/i).first().fill(lead.company);
  await page.getByLabel(/phone|mobile/i).first().fill(lead.phone).catch(() => {});
  if (lead.message) await page.getByLabel(/message|note/i).fill(lead.message).catch(() => {});

  await page.getByRole('button', { name: /submit|send|request/i }).last().click();
  await expect(page.getByText(/thank you|we.*ll be in touch|received/i)).toBeVisible({ timeout: 15_000 });
}

export async function openInteractiveDemo(page: Page) {
  await page.goto('/demo');
  await expect(page).toHaveURL(/\/demo$/);
}

/**
 * Screenshots into test-output/screenshots/<persona>/<step>.png
 * Call with a sensible step name: await screenshot(page, 'thabo', '03-uploads-manual');
 */
export async function screenshot(page: Page, persona: string, step: string) {
  const dir = path.join(SCREENSHOT_ROOT, persona);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${step}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

/**
 * Attaches console + pageerror listeners and writes everything to test-output/console-errors/<persona>.log
 * Returns a function to flush the collected entries — call at end of the persona run.
 */
export function captureConsoleErrors(page: Page, persona: string) {
  fs.mkdirSync(ERROR_LOG_ROOT, { recursive: true });
  const logFile = path.join(ERROR_LOG_ROOT, `${persona}.log`);
  const entries: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      entries.push(`[${msg.type()}] ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => {
    entries.push(`[pageerror] ${err.message}\n${err.stack ?? ''}`);
  });

  return {
    flush() {
      fs.writeFileSync(logFile, entries.join('\n'), 'utf8');
      return { logFile, count: entries.length };
    },
  };
}

/**
 * Simulates the 30-min idle timeout (AuthContext signs out after 30 mins of inactivity on protected routes).
 * In a test run you'll usually want to stub the timer rather than actually wait 30 minutes — see README note.
 */
export async function idleSimulate(page: Page, minutes: number) {
  const ms = minutes * 60_000;
  await page.waitForTimeout(ms);
}
