# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
**Last updated: 2026-03-15**

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

### Route Protection

Two route guard components:
- `ProtectedRoute` — checks authentication only (used for standard user pages)
- `RoleProtectedRoute` — checks authentication + role (`allowedRoles` prop) or reseller status (`requireReseller` prop). Redirects unauthorized users to `/dashboard`.

Route access matrix:
| Route | Guard |
|-------|-------|
| `/dashboard`, `/documents`, `/ncrs`, `/compliance`, `/audits`, `/management-reviews`, `/data-export`, `/activity-trail`, `/notifications` | `ProtectedRoute` (any authenticated user) |
| `/admin`, `/create-company` | `RoleProtectedRoute allowedRoles={['super_admin']}` |
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
- Partner links: `?partner=CODE` → reseller onboarding (skip trial)
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

**Security**: `failed_login_attempts` (server-side rate limiting)

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
| `notify-lead` | Instant lead notification emails |
| `rate-limit` | Server-side brute force protection |
| `send-notifications` | Scheduled daily notification emails |

## Known Issues (as of 2026-03-15)

1. **`documents.company_id` is TEXT**, not UUID — mismatch with most other tables. Functional but inconsistent.
2. **Document numbering race condition** — read-then-write pattern can generate duplicates under concurrent use. Needs atomic PostgreSQL function.
3. **CreateCompany + ClientOnboarding** — `supabase.auth.admin.createUser()` called from frontend anon key (will fail in production). Needs Edge Function with service role key.
4. **Document versioning columns missing** — `version` and `version_history` columns don't exist on `documents` table yet. Version upload feature in Documents.jsx will fail. Queries have been fixed to not select these columns, but the feature itself is broken.
5. **NCRs.jsx uses `select('*')`** as primary query with fallback — should use explicit columns only.

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
```

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
