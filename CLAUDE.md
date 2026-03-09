# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # Production build
npm run preview   # Preview production build locally
```

No test runner is configured. No linter is configured.

## Architecture

**ISOGuardian** is a South African ISO compliance management SaaS (multi-tenant). Frontend: React 18 + Vite + Tailwind. Backend: Supabase (Postgres + Auth + Storage + RLS + Edge Functions). Email: Resend API. Domain: https://isoguardian.co.za

### Auth & Multi-Tenancy

`AuthContext.jsx` is the core context. It exposes:
- `userProfile` — the authenticated user row with nested `company` join (explicit column select, not `*`)
- `getEffectiveCompanyId()` — **always use this** for queries; returns the client's company_id when a reseller is in client-view mode, otherwise the user's own company_id
- `isSuperAdmin`, `isAdmin`, `isLeadAuditor` — role-based boolean flags (single source of truth)
- `isReseller`, `resellerClients`, `viewingClient`, `switchClient(client)`

**Every Supabase query must be scoped to `getEffectiveCompanyId()`** — RLS enforces it at the DB level, but the frontend filter is defence-in-depth. No company can ever see another company's data.

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

Layout nav items are conditional: core items visible to all users, admin-only items (Analytics, Settings, Users) shown only to `admin`/`super_admin`, super_admin-only items (New Company) shown only to `super_admin`.

### Security Rules

- **NEVER hardcode email addresses for role checks** — use `userProfile.role` or `isSuperAdmin`/`isAdmin` from AuthContext
- **NEVER use `select('*')`** — always specify explicit columns to prevent data over-fetching
- **NEVER show raw `err.message` to users** — use generic user-friendly messages via toast
- **Production builds strip all console.log/error** via terser (configured in `vite.config.js`)
- **Password policy**: minimum 12 characters, must include uppercase, lowercase, number, and special character
- **Temp passwords** use `crypto.getRandomValues()` (not `Math.random()`)

### Security Hardening (implemented)

- **Login lockout**: 5 failed attempts → 15-minute cooldown (`src/lib/rateLimiter.js` + `Login.jsx`)
- **Rate limiting**: Client-side token bucket throttle on public forms (3 submissions/60s)
- **Honeypot fields**: Hidden input on ReadinessAssessment + ConsultationUpsell — bot submissions silently discarded
- **Cloudflare Turnstile CAPTCHA**: On Login page
- **Security headers** (`vercel.json`): HSTS, X-Frame-Options: DENY, CSP, Permissions-Policy, X-XSS-Protection, nosniff
- **Meta security tags** (`index.html`): X-Content-Type-Options, strict-origin-when-cross-origin referrer

### SuperAdmin: Client Onboarding

`src/pages/CreateCompany.jsx` — SuperAdmin-only page at `/create-company` for onboarding new clients after SLA + payment. Creates: company → subscription → auth user → user record. Shows temp password with copy button. **Note**: `supabase.auth.admin.createUser()` requires service role key — needs Edge Function for production.

### RLS Pattern

Two types of `company_id` columns exist:
- **UUID**: `ncrs`, `audits`, `management_reviews`, `audit_log`, `compliance_requirements`, `subscriptions` → use `get_my_company_id()`
- **TEXT**: `documents`, `deletion_audit_trail`, `resellers`, `reseller_clients` → use `get_my_company_id_text()`

Helper functions available in Supabase: `get_my_company_id()`, `get_my_company_id_text()`, `is_super_admin()`, `is_reseller_for_uuid(uuid)`, `is_reseller_for_text(text)`

~21 tables have RLS enabled but **no policies** (completely locked out): `ai_operations`, `audit_logs`, `clauses`, `client_health`, `clients`, `commissions`, `compliance_reports`, `document_approvals`, `failed_login_attempts`, `iso_standards`, `meeting_attendees`, `meetings`, `payments`, `reseller_commissions`, `reseller_milestones`, `security_events`, `system_metrics`, `team_members`, `user_permissions`.

### UI Patterns

Glass morphism design system — **all styles are global** (no inline `<style>` blocks):
- CSS classes in `src/index.css` (`@layer components`): `.glass`, `.glass-border`, `.glass-card`, `.glass-input`, `.bg-app-gradient`, `.btn-primary`, `.btn-gradient`
- All animations defined in `tailwind.config.js`: `fade-in`, `slide-up`, `slide-in`, `float`, `pulse-slow`, `beam`, `shake`, `toast-in`, `glow`, `connector` + variants
- Brand colors in Tailwind config: `brand-cyan` (#06b6d4), `brand-purple` (#8b5cf6), `brand-slate` (#0f172a)

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

`src/lib/brandedPDFExport.js` — client logo is the hero image (top, large). ISOGuardian branding is subtle (small footer only). Include signature blocks on NCR close-outs and audit reports.

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

Supabase Edge Function: `supabase/functions/send-notifications/index.ts`
- Uses Resend API, runs daily at 07:00 SAST via pg_cron
- Notification types: audit reminders (7d + 1d), overdue NCRs, document review reminders, weekly digest (Monday), **lead notifications** (new assessments + consultations)
- Auth required: `CRON_SECRET` header or service role key
- Dedup via `notification_log` table
- HTML escaping on all dynamic content (XSS prevention)

### Database Tables

**New tables** (created via `scripts/landing_page_tables.sql`):
- `iso_readiness_assessments` — lead capture from landing page
- `consultation_requests` — consultation booking requests
- `referrals` — affiliate + partner referral tracking
- `notification_log` — email notification dedup

**Added columns to `users`**: `referral_code`, `referred_by`

## Known Issues

1. **~21 tables locked out** — RLS enabled with no policies. Features depending on them are broken.
2. **`documents.company_id` is TEXT**, not UUID — mismatch with most other tables.
3. **Document numbering race condition** — read-then-write pattern can generate duplicates under concurrent use. Needs atomic PostgreSQL function.
4. **CreateCompany + ClientOnboarding** — `supabase.auth.admin.createUser()` called from frontend anon key (will fail). Needs Edge Function with service role key.
5. **No idle session timeout** — sessions persist indefinitely while browser is open.
6. **Resend domain verification pending** — email notifications won't work until DNS records are verified.
7. **Document version_history** — JSONB column needs to be created in Supabase `documents` table for versioning to work.

## Resolved Issues

- All hardcoded email checks removed — replaced with role-based checks via AuthContext
- Route protection — RoleProtectedRoute enforces role-based access on admin/reseller routes
- Company_id filters — all data pages now filter by getEffectiveCompanyId() as defence-in-depth
- Console stripping — production builds remove all console.error/log via terser
- Password policy strengthened — 12+ chars with complexity requirements
- Temp passwords — crypto.getRandomValues() replaces Math.random()
- Assessment form — error handling added (no more silent failures)
- DataExport email — updated to Support@isoguardian.co.za
- Dashboard compliance score — matches Compliance page formula (weighted partial credit)
- Toast notifications — replaced 60+ alert() calls across 9 files
- SEO foundation — meta tags, JSON-LD, robots.txt, sitemap.xml
- Global CSS consolidation — removed inline `<style>` blocks from 19 files, centralized in index.css + tailwind.config.js
- Logo preloader — professional loading screen with progress bar (index.html + main.jsx)
- Cookie consent banner — POPIA-compliant 3-category consent (CookieConsent.jsx)
- Security hardening — login lockout, rate limiting, honeypot fields, CSP headers, vercel.json headers
- Nav routing fix — Activity Trail/Notifications accessible to all users (were incorrectly admin-only)
- Dashboard admin stats — fixed NaN crash (wrong column names: price_per_user → final_price)
- ClientOnboarding Layout — added missing Layout wrapper
- Compliance toast errors — wired useToast() into catch blocks
- Pagination — Documents + NCRs pages with page size controls
- Document versioning — version history tracking on document updates
- Notification preferences page — per-user email notification toggles
- SuperAdmin company creation — CreateCompany.jsx at /create-company

## Legal Constraints

- **Never claim AI-powered advisory** — removed in ToS v1.1.
- **Never promise ISO certification** — ISOGuardian is a management tool only.
- SLA is 99% uptime (not 99.9%), business hours support only.
- POPIA compliance required: all personal data operations must remain scoped to company, data export available at `/data-export`.

## Environment Variables

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_TURNSTILE_SITE_KEY
```

### Supabase Secrets (for Edge Functions)

```
RESEND_API_KEY          # Resend API key for email notifications
CRON_SECRET             # Auth secret for Edge Function invocation
ADMIN_NOTIFICATION_EMAIL  # Email for lead notifications (default: krugerreece@gmail.com)
```

## Related Projects (SEPARATE CODEBASES)

### Simathemba Holdings Website
- **Location:** `C:\Users\Tyreece\Downloads\Simathemba\`
- **Type:** Static React marketing site (NO Supabase, NO shared code)
- **Client:** Simathemba Holdings — SHEQ consultancy, ISOGuardian reseller partner
- **Domain:** simathemba.co.za
- **Status:** Complete, audited for cross-contamination
- **IMPORTANT:** Keep these projects completely separate. No ISOGuardian platform code in Simathemba. ISOGuardian appears only as technology partner in marketing content.
