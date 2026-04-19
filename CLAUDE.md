# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
**Last updated: 2026-04-18**

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # Production build
npm run preview   # Preview production build locally
```

No test runner is configured. No linter is configured.

## Architecture

**ISOGuardian** is a South African ISO compliance management SaaS (multi-tenant). Frontend: React 18 + Vite + Tailwind. Backend: Supabase (Postgres + Auth + Storage + RLS + Edge Functions). Email: Resend API (verified). Domain: https://isoguardian.co.za. Hosted on Vercel.

### Auth & Multi-Tenancy

`AuthContext.jsx` is the core context. It exposes:
- `userProfile` — the authenticated user row with nested `company` join and `standards_access` field
- `getEffectiveCompanyId()` — **always use this** for queries; returns the client's company_id when a reseller is in client-view mode, otherwise the user's own company_id
- `isSuperAdmin`, `isAdmin`, `isLeadAuditor` — role-based boolean flags (single source of truth)
- `isReseller`, `resellerClients`, `viewingClient`, `switchClient(client)`
- `signIn`, `signOut`, `user`, `loading`

**Every Supabase query must be scoped to `getEffectiveCompanyId()`** — RLS enforces it at the DB level, but the frontend filter is defence-in-depth. No company can ever see another company's data.

**Critical: all data-fetching useEffects must guard with `if (userProfile)` and include `[userProfile]` in deps** to prevent race conditions where `getEffectiveCompanyId()` returns undefined.

### Consultation-Gated Onboarding

**There is no self-serve signup.** The 14-day free trial was dropped in April 2026 — ISOGuardian is consultation-gated. Accounts are only created after a qualified consultation and countersigned Client Subscription & SLA.

- Public `/signup` route removed from `App.jsx`. `src/pages/Signup.jsx` has been deleted from the repo.
- All public CTAs ("Start Free Trial", "Sign Up") rewritten to "Book a Demo" or "See Demo" and route to `/consultation` or `ConsultationUpsell`.
- `/login` no longer links to `/signup` — it points non-clients to the consultation form.
- Account provisioning paths that remain:
  1. **super_admin manual:** `/create-company` (`CreateCompany.jsx`) — direct-signed clients, countersigned contract in hand
  2. **Reseller:** `/client-onboarding` (`ClientOnboarding.jsx`) — resellers provision their own clients
  3. **Admin invite:** `/users` (`UserManagement.jsx`) — company admins invite users to an already-provisioned company

The `trial-onboarding` drip campaign is retained for historical-context only — no new trial users are being created.

### Cancellation & POPIA s24 Erasure

**User-initiated request flows shipped April 2026.**

- **Cancellation:** `CompanySettings.jsx` → Subscription tab → Request Cancellation. Modal shows CPA s16 5-business-day cooling-off (if account age < 5 business days), Client Subscription & SLA §4.1 Initial Term fee calculator (50% months 1–6, 25% months 7–12), and a "Export your data first (POPIA s24)" link to `/data-export`. On confirm, inserts a `cancellation_requests` row (status `pending`) and fires the `notify-cancellation` Edge Function to `support@isoguardian.co.za`.
- **Erasure (POPIA s24):** `UserProfile.jsx` → Request Data Deletion button. Modal explains POPIA s24, the 30-day processing SLA, and retention exceptions under POPIA s14 / tax / regulatory. On confirm, inserts an `erasure_requests` row (status `pending`, `sla_deadline_at = now + 30d`) and fires the same Edge Function.
- **super_admin queues:**
  - `/admin/cancellations` (`AdminCancellations.jsx`) — pending/approved/completed/rejected/withdrawn filter tabs; approve with an effective date + processor notes; transitions logged via `logActivity({ action: 'cancellation_approved' })` etc.
  - `/admin/erasure-requests` (`AdminErasureRequests.jsx`) — same filter pattern; SLA countdown column (red/overdue, orange/≤7 days, emerald/>7); retention-exceptions field for POPIA s14 / tax / regulatory notes.
- **SuperAdminDashboard.jsx** surfaces live pending/overdue queue counts as quick-nav cards above the tab navigation.

### Route Protection

Two route guard components:
- `ProtectedRoute` — checks authentication only (used for standard user pages)
- `RoleProtectedRoute` — checks authentication + role (`allowedRoles` prop) or reseller status (`requireReseller` prop). Redirects unauthorized users to `/dashboard`.

Route access matrix:
| Route | Guard |
|-------|-------|
| `/dashboard`, `/documents`, `/ncrs`, `/compliance`, `/audits`, `/management-reviews`, `/data-export`, `/activity-trail`, `/notifications` | `ProtectedRoute` (any authenticated user) |
| `/admin`, `/create-company`, `/finance`, `/admin/cancellations`, `/admin/erasure-requests` | `RoleProtectedRoute allowedRoles={['super_admin']}` |
| `/analytics`, `/settings`, `/users` | `RoleProtectedRoute allowedRoles={['super_admin', 'admin']}` |
| `/reseller`, `/client-onboarding` | `RoleProtectedRoute requireReseller` |
| `/ai-copilot` | `ProtectedRoute` (any authenticated user) |
| `/audit-connect` | `RoleProtectedRoute allowedRoles={['super_admin', 'admin', 'lead_auditor']}` |
| `/auditor` | Public (token-based auth via query param) |

### Code Splitting

All pages except Login, LandingPage, and NotFound are lazy-loaded via `React.lazy()` with a `Suspense` wrapper showing a branded spinner. Main bundle: ~477KB (down from 1,222KB).

### Security Rules

- **NEVER hardcode email addresses for role checks** — use `userProfile.role` or `isSuperAdmin`/`isAdmin` from AuthContext
- **NEVER use `select('*')`** — always specify explicit columns to prevent data over-fetching
- **NEVER show raw `err.message` to users** — use generic user-friendly messages via toast
- **Production builds strip all console.log/error** via terser (configured in `vite.config.js`)
- **Password policy**: minimum 12 characters, must include uppercase, lowercase, number, and special character
- **Temp passwords** use `crypto.getRandomValues()` (not `Math.random()`)

### Security Hardening (implemented)

- **Login lockout**: 5 failed attempts → 15-minute cooldown (client-side via `src/lib/rateLimiter.js` + server-side via `rate-limit` Edge Function)
- **Server-side rate limiting**: Edge Function tracks failed attempts by IP + email in `failed_login_attempts` table
- **Rate limiting**: Client-side token bucket throttle on public forms (3 submissions/60s)
- **Honeypot fields**: Hidden input on ReadinessAssessment + ConsultationUpsell — bot submissions silently discarded
- **Cloudflare Turnstile CAPTCHA**: On Login page (site key: `0x4AAAAAACfLITd5DD70PYix`, also set as Vercel env var)
- **Security headers** (`vercel.json`): HSTS, X-Frame-Options: DENY, CSP, Permissions-Policy, X-XSS-Protection, nosniff
- **Meta security tags** (`index.html`): X-Content-Type-Options, strict-origin-when-cross-origin referrer
- **Idle session timeout**: 30 minutes of inactivity → auto sign-out (AuthContext)
- **Concurrent session detection**: Only one device per account — stamps `active_session_token` on users table, checks every 30 seconds
- **File upload validation**: Type whitelist + 25MB size limit on Documents page

### SuperAdmin: Client Onboarding

`src/pages/CreateCompany.jsx` — SuperAdmin-only page at `/create-company` for onboarding new clients after SLA + payment. Creates: company → subscription → auth user → user record. Shows temp password with copy button. **Note**: `supabase.auth.admin.createUser()` requires service role key — needs Edge Function for production.

### RLS Pattern

Two types of `company_id` columns exist:
- **UUID**: `ncrs`, `audits`, `management_reviews`, `audit_log`, `compliance_requirements`, `subscriptions` → use `get_my_company_id()`
- **TEXT**: `documents`, `deletion_audit_trail`, `resellers`, `reseller_clients` → use `get_my_company_id_text()`

Helper functions available in Supabase: `get_my_company_id()`, `get_my_company_id_text()`, `is_super_admin()`, `is_reseller_for_uuid(uuid)`, `is_reseller_for_text(text)`

All tables now have RLS policies configured.

### UI Patterns

Glass morphism design system — **all styles are global** (no inline `<style>` blocks):
- CSS classes in `src/index.css` (`@layer components`): `.glass`, `.glass-border`, `.glass-card`, `.glass-input`, `.bg-app-gradient`, `.btn-primary`, `.btn-gradient`
- All animations defined in `tailwind.config.js`: `fade-in`, `slide-up`, `slide-in`, `float`, `pulse-slow`, `beam`, `shake`, `toast-in`, `glow`, `connector` + variants
- Brand colors in Tailwind config: `brand-cyan` (#06b6d4), `brand-purple` (#8b5cf6), `brand-slate` (#0f172a)
- All pages have responsive Tailwind classes (sm/md/lg breakpoints) for mobile

Toasts via `useToast()` from `ToastContext.jsx`. Activity logging via `logActivity({ companyId, userId, action, entityType, entityId, changes })` from `src/lib/auditLogger.js` — call after every data mutation.

### Preloader

Pure HTML/CSS preloader in `index.html` — shows ISOGuardian logo with pulse animation and progress bar while React/Vite bundles load. Progress bar animated in `src/main.jsx` (random increments to 90%), then completed to 100% and faded out 1.4s after React mounts.

### Cookie Consent (POPIA)

`src/components/CookieConsent.jsx` — POPIA-compliant consent banner mounted in `App.jsx`. Three categories: Essential (always on), Functional, Analytics. Stores consent in localStorage with timestamp + version. Shows after 1.5s delay on first visit. Use `getCookieConsent()` export to check consent status elsewhere.

### Document/Entity Numbering

All numbers generated via `generateDocNumber(companyId, entityType)` in `src/lib/documentNumbering.js`. Formats:
- Documents: `IG-[CODE]-DOC-001`
- NCRs: `IG-[CODE]-NCR-001`
- Audits: `IG-[CODE]-AUD-001`
- Management Reviews: `IG-[CODE]-MR-001`

Counters are stored on the `companies` row (`doc_counter`, `ncr_counter`, `audit_counter`, `review_counter`) and incremented atomically on generation.

### PDF Export

- `src/lib/brandedPDFExport.js` — client logo as hero image (top, large). ISOGuardian branding subtle (small footer only). Signature blocks on NCR close-outs.
- `src/lib/auditReportPDF.js` — audit report PDF generation.
- `src/lib/invoicePDFExport.js` — branded tax invoices (with VAT 15%) + monthly commission statements for resellers.

### Financial Dashboard

`src/pages/FinancialDashboard.jsx` — super_admin only at `/finance`. 8-tab dashboard:
- **Revenue** — MRR/ARR KPIs, monthly breakdown
- **Payments** — payment ledger with search/filter
- **Invoices** — view, mark overdue, download PDF
- **Commissions** — approve pending, mark paid (with EFT ref), bulk approve, PDF statements
- **Affiliates** — referral conversion tracking
- **Template Sales** — revenue, top sellers
- **Campaigns** — drip campaign stats, enrollment counts, queue status
- **Marketing** — lead pipeline, GA tracking status, campaign toggles, assessment/consultation tables with clickable contact info, score distribution

### Drip Campaign Engine

Automated email sequences that nurture leads into customers — zero manual effort after setup.

**Architecture:**
- `drip_campaigns` table — campaign definitions (slug, trigger_type, emails JSONB array)
- `drip_queue` table — individual scheduled sends (recipient, step, scheduled_at, status)
- `drip_unsubscribes` table — POPIA-required opt-out tracking (email, token)

**3 active campaigns:**
- `post-assessment` — 5 emails over 14 days (score-based, triggered after readiness quiz)
- `post-consultation` — 3 emails (triggered after consultation request)
- `trial-onboarding` — retained for historical-context only; no new enrolments since consultation-gated onboarding shipped (April 2026)

**Edge Functions:**
- `process-drip-campaigns` — daily queue processor via pg_cron at 07:00 SAST
- `unsubscribe` — GET `?token=xxx`, branded HTML confirmation, cancels pending emails
- `notify-lead` — now also enrolls assessment/consultation leads into drip campaigns
- `create-user` — service role user creation for `/create-company` (super_admin) + `/client-onboarding` (reseller); no trial drip enrolment since consultation-gated onboarding shipped

**Enrollment:** `supabase/functions/_shared/drip.ts` — shared `enrollInDrip()` helper. Checks unsubscribe status, prevents duplicates, calculates scheduled_at dates.

**pg_cron auth pattern:** Anon key in `Authorization` header (passes Supabase gateway) + `x-cron-secret` header (passes function auth check). `CRON_SECRET` set as Supabase secret.

### Google Analytics

`src/lib/analytics.js` — GA4 (Measurement ID: `G-80X4PGCGH1`). Uses gtag.js directly (no npm dependency). POPIA-compliant: only loads after cookie consent. Exports: `initGA()`, `trackPageView(path)`, `trackEvent(category, action, label)`, `trackConversion(type)`. Called by `CookieConsent.jsx` on analytics consent.

### Sentry (placeholder)

`src/lib/sentry.js` — safe no-op exports (`initSentry()`, `captureError()`, `setUser()`). Ready to activate when `VITE_SENTRY_DSN` is set.

### Roles

| Role | Access |
|------|--------|
| `super_admin` | Full platform access |
| `admin` | Company-level admin |
| `lead_auditor` | Audits + management reviews |
| `user` | Documents + NCRs |

### Landing Page

14+ sections with scroll animations (stagger fade-in, hero parallax). Key components in `src/components/landing/`:
- `ReadinessAssessment.jsx` — ISO readiness quiz, saves to `iso_readiness_assessments` table (honeypot + rate limited)
- `ConsultationUpsell.jsx` — consultation request form, saves to `consultation_requests` table (honeypot + rate limited)
- `TemplateMarketplace.jsx` — template cards (coming soon, enquiry-based)
- `AffiliateProgram.jsx` — referral programme section

SEO: react-helmet-async for meta tags, JSON-LD, canonical URLs. `robots.txt` + `sitemap.xml` in public/.

### Referral Tracking

- Affiliate links: `?ref=CODE` → 1 month free per conversion
- Partner links: `?partner=CODE` → skip straight to reseller-managed onboarding
- Tracked via `useReferralTracking.js` hook → sessionStorage → stored in `referrals` table on login

### Email Notifications

**Resend domain verified. Emails are live.**

Two Edge Functions handle email:
1. `supabase/functions/notify-lead/index.ts` — **Instant** lead notifications (called by landing page forms)
   - Types: `assessment`, `consultation`, `template_enquiry`, `auditor_invite`
   - Sends to `ADMIN_NOTIFICATION_EMAIL` (or auditor for invite type)
   - Has GET test endpoint for verifying Resend config
2. `supabase/functions/send-notifications/index.ts` — **Scheduled** daily notifications via pg_cron at 07:00 SAST
   - Audit reminders (7d + 1d before)
   - Overdue NCR notifications
   - Document review reminders (7d before)
   - Weekly compliance digest (Mondays only)
   - Lead notifications (backup for any missed by notify-lead)
   - Dedup via `notification_log` table (24h window for daily, 168h for weekly)
   - Auth required: `CRON_SECRET` header or service role key

### AI Copilot

`src/pages/AICopilot.jsx` — Claude API via `supabase/functions/ai-copilot/index.ts` Edge Function.
- Auto-selects Haiku for simple queries, Sonnet for complex analysis
- Fair usage limits per subscription tier
- Document gap analysis capability
- Requires `ANTHROPIC_API_KEY` Supabase secret

### Audit Connect

- `src/pages/AuditorInvite.jsx` — Admin creates audit invite, generates token-based link
- `src/pages/AuditorWorkspace.jsx` — Public page for external auditors (no account needed)
- `supabase/functions/auditor-portal/index.ts` — Token validation, findings, checklist, evidence access
- Findings auto-create NCRs for major/minor non-conformities

### Database Tables

**Core tables** (all have RLS policies):
- `users`, `companies`, `documents`, `ncrs`, `audits`, `management_reviews`
- `audit_log`, `deletion_audit_trail`, `compliance_requirements`, `subscriptions`
- `resellers`, `reseller_clients`

**Compliance requirements** are seeded with ISO clause data for ISO 9001, 14001, and 45001.

**Landing page tables**: `iso_readiness_assessments`, `consultation_requests`, `referrals`, `notification_log`

**AI/Audit tables**: `ai_usage`, `ai_conversations`, `audit_sessions`, `audit_findings`, `audit_checklist`

**Drip campaign tables**: `drip_campaigns`, `drip_queue`, `drip_unsubscribes`

**Template marketplace**: `template_purchases`

**Security**: `failed_login_attempts` (server-side rate limiting)

**User-initiated request tables** (RLS: users insert their own; super_admin reads/updates all):
- `cancellation_requests` — subscription cancellation requests with cooling-off / Initial Term fee context
- `erasure_requests` — POPIA s24 right-to-erasure requests with 30-day SLA deadline

### Database Column Notes

- `management_reviews` does NOT have a `title` column — use `review_number` as identifier
- `audits` does NOT have a `title` column — use `audit_number` as identifier
- `documents` does NOT have `version` or `version_history` columns yet — do not query these
- `documents.company_id` is TEXT (not UUID) — mismatch with most other tables
- Reseller lookup uses `.maybeSingle()` not `.single()` (non-reseller users would crash with `.single()`)

## Edge Functions (all deployed and ACTIVE)

| Function | Purpose |
|----------|---------|
| `ai-copilot` | Claude API proxy for AI Copilot feature |
| `auditor-portal` | Token-based auditor workspace API |
| `create-user` | Service role user creation (consultation-gated; invoked by `/create-company` + `/client-onboarding`) |
| `notify-cancellation` | Instant admin email for cancellation + POPIA erasure requests |
| `notify-lead` | Instant lead notification emails + drip enrollment |
| `process-drip-campaigns` | Daily drip queue processor (pg_cron 07:00 SAST) |
| `rate-limit` | Server-side brute force protection |
| `send-notifications` | Scheduled daily notification emails |
| `unsubscribe` | POPIA-compliant drip email unsubscribe handler |

## Known Issues (as of 2026-03-27)

1. **`documents.company_id` is TEXT**, not UUID — mismatch with most other tables. Functional but inconsistent.
2. **CreateCompany + ClientOnboarding** — `supabase.auth.admin.createUser()` called from frontend anon key (will fail in production). Needs Edge Function with service role key.
3. **Document versioning columns missing** — `version` and `version_history` columns don't exist on `documents` table yet. Version upload feature in Documents.jsx will fail. Queries have been fixed to not select these columns, but the feature itself is broken.
4. **NCRs.jsx uses `select('*')`** as primary query with fallback — should use explicit columns only.
5. **www.isoguardian.co.za redirect** — needs configuring in Vercel Dashboard → Domains (not vercel.json).

## Resolved Issues

- RLS policies added to all 21 previously locked-out tables
- Resend domain verified — email notifications working
- Compliance requirements seeded with ISO 9001, 14001, 45001 clause data
- Idle session timeout — 30 minutes of inactivity → auto sign-out
- Concurrent session detection — one device per account
- Server-side rate limiting — Edge Function tracks failed logins by IP + email
- AuthContext `.single()` crash fixed → `.maybeSingle()` for reseller lookup
- AuthContext `standards_access` added to user profile select query
- Race conditions fixed in Documents, NCRs, Audits, Compliance, ManagementReviews (userProfile guard)
- Non-existent column queries fixed: `management_reviews.title`, `audits.title`, `documents.version/version_history`
- send-notifications Edge Function: `documents.title` → `documents.name`
- DataExport: fixed `audits.evidence`/`recommendation` → `evidence_reviewed`/`auditor_recommendation`
- DataExport: fixed `management_reviews.title` → `review_number`
- Code splitting — React.lazy reduced main bundle from 1,222KB to 477KB (61%)
- Mobile responsiveness — all 20+ pages have sm/md/lg Tailwind breakpoints
- Turnstile CAPTCHA site key restored (was accidentally removed)
- File upload validation — type whitelist + 25MB size limit
- Hardcoded Turnstile fallback key removed then restored (Vercel env var now set)
- All hardcoded email checks removed — replaced with role-based checks via AuthContext
- Route protection — RoleProtectedRoute enforces role-based access
- Company_id filters — all data pages filter by getEffectiveCompanyId()
- Console stripping — production builds remove all console.error/log via terser
- Password policy — 12+ chars with complexity requirements
- Toast notifications — replaced 60+ alert() calls across 9 files
- SEO — meta tags, JSON-LD, robots.txt, sitemap.xml, noindex on protected routes
- Cookie consent banner — POPIA-compliant 3-category consent
- Security headers — HSTS, CSP, X-Frame-Options via vercel.json
- Financial Dashboard — 8-tab super_admin dashboard with commission management + marketing
- Drip campaign engine — 3 automated email sequences, queue processor, POPIA unsubscribe
- Google Analytics — GA4 (G-80X4PGCGH1) with POPIA cookie consent gating
- Template marketplace tables — template_purchases with RLS + indexes
- Document numbering race condition fixed — atomic PostgreSQL functions deployed

## Legal Constraints

- **Never claim AI-powered advisory** — removed in ToS v1.1.
- **Never promise ISO certification** — ISOGuardian is a management tool only.
- SLA is 99% uptime (not 99.9%), business hours support only.
- POPIA compliance required: all personal data operations must remain scoped to company, data export available at `/data-export`.

## Environment Variables

### Vercel (Frontend)
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_TURNSTILE_SITE_KEY=0x4AAAAAACfLITd5DD70PYix
```

### Supabase Secrets (for Edge Functions)
```
RESEND_API_KEY          # Resend API key for email notifications
CRON_SECRET             # Auth secret for Edge Function invocation
ADMIN_NOTIFICATION_EMAIL  # Email for lead notifications (default: krugerreece@gmail.com)
ANTHROPIC_API_KEY       # Claude API key for AI Copilot
CRON_SECRET             # Shared secret for pg_cron → Edge Function auth (value: isoguardian-drip-cron-2026)
```

### pg_cron Jobs (active)
| Job | Schedule | Target |
|-----|----------|--------|
| `daily-notifications` | `0 5 * * *` (07:00 SAST) | `send-notifications` Edge Function |
| `process-drip-campaigns` | `0 5 * * *` (07:00 SAST) | `process-drip-campaigns` Edge Function |

## Companies Currently Set Up
- **ISOGuardian HQ**: company_code "HQ" (admin company)
- **Simathemba Holdings**: company_code "SH" (first reseller partner)

## Related Projects (SEPARATE CODEBASES)

### Simathemba Holdings Website
- **Location:** `C:\Users\Tyreece\Downloads\Simathemba\`
- **Type:** Static React marketing site (NO Supabase, NO shared code)
- **Client:** Simathemba Holdings — SHEQ consultancy, ISOGuardian reseller partner
- **Domain:** simathemba.co.za
- **Status:** Complete, audited for cross-contamination
- **IMPORTANT:** Keep these projects completely separate. No ISOGuardian platform code in Simathemba.

## Session Continuity

When approaching context limit (~85%), always update this file with current completed/outstanding status before the session ends. At the start of each new session, recall `MEMORY.md` and this file.
