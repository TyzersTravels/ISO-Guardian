# ISOGuardian — Playwright Persona Tests

Runs the 5 synthetic-user personas described in the testing brief at
`C:\Users\Tyreece\.claude\plans\for-my-isoguardian-project-ethereal-lantern.md`.

## Prerequisites

1. Install Playwright:
   ```bash
   npm install
   npm run test:e2e:install
   ```

2. Point the suite at a **staging** environment (never production):
   ```bash
   export ISOGUARDIAN_BASE_URL="https://staging.isoguardian.co.za"   # or your Vercel preview URL
   ```

3. Set the test Turnstile site key in `.env.local` so CAPTCHA auto-passes:
   ```
   VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
   ```
   (Revert before deploying to live.)

4. Provide credentials for each persona (staging only):
   ```bash
   export THABO_EMAIL=thabo@mokoena-test.example
   export THABO_TEMP_PASSWORD=<seeded temp pw>
   export PRIYA_EMAIL=priya@apex-test.example
   export PRIYA_PASSWORD=<seeded pw>
   export SIPHO_EMAIL=sipho@dcc-test.example
   export SIPHO_PASSWORD=<seeded pw>
   export KAREN_EMAIL=karen@churn-test.example
   export KAREN_PASSWORD=<seeded pw>
   export AUDITOR_VALID_TOKEN=<token generated via /audit-connect>
   export AUDITOR_FOREIGN_TOKEN=<a valid token from a DIFFERENT company, for tampering test>
   ```
   Any persona whose password is unset is auto-skipped (see the `test.skip(!PW, ...)` guards in each spec).

5. Put the 12 synthetic documents described in the plan under `./test-fixtures/`:
   ```
   test-fixtures/
     01-quality-manual.pdf
     02-document-control.pdf
     03-internal-audit-procedure.pdf
     04-ncr-register.xlsx
     05-risk-register.xlsx
     06-legal-register.xlsx
     07-hira-housekeeping.pdf
     08-malformed.pdf          (0 bytes)
     09-oversized.pdf          (~26 MB)
     10-afrikaans.pdf
     11-special-chars — kopieë.pdf
     12-disguised.pdf          (actually a small executable)
   ```
   The plan includes the generation prompt for a side Claude Code session.

## Run

```bash
npm run test:e2e                 # headless
npm run test:e2e:headed          # see the browser
npm run test:e2e -- tests/personas/persona-01-thabo.spec.ts     # single persona
npm run test:e2e:report          # open the HTML report after a run
```

Artifacts land in `./test-output/`:
- `screenshots/<persona>/<step>.png` — every meaningful step
- `console-errors/<persona>.log` — browser console + pageerror output
- `videos/` — full session recordings (raw material for the demo video)
- `report/` — HTML report
- `pdfs/` — any PDF exports captured via `exportPDF()`

## What's in here

- `helpers/isoguardian.ts` — sign in, bulk upload, create NCR, schedule audit, export PDF, idle simulation, screenshot helpers
- `personas/persona-01-thabo.spec.ts` — first-time SME owner (consultation-gated, no self-signup)
- `personas/persona-02-priya.spec.ts` — experienced SHEQ manager, power-user flows
- `personas/persona-03-sipho.spec.ts` — reseller, RLS cross-tenant launch-blocker tests
- `personas/persona-04-karen.spec.ts` — in-app cancellation + POPIA s24 erasure (pass after the feature lands)
- `personas/persona-05-auditor.spec.ts` — token-based external auditor workspace + tampering

## Important

- **Never run this against production.** The helpers create documents, NCRs, and audits.
- **Destructive tests on staging; read-only perf tests on live.** See the "Environment Setup" section of the plan file for the full split.
- The idle timeout test actually waits 31 minutes. Either run it standalone or stub `Date.now()` / expose a test hook in `AuthContext` to shortcut the wall-clock wait.
