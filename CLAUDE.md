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

**ISOGuardian** is a South African ISO compliance management SaaS (multi-tenant). Frontend: React 18 + Vite + Tailwind. Backend: Supabase (Postgres + Auth + Storage + RLS).

### Auth & Multi-Tenancy

`AuthContext.jsx` is the core context. It exposes:
- `userProfile` — the authenticated user row with nested `company` join
- `getEffectiveCompanyId()` — **always use this** for queries; returns the client's company_id when a reseller is in client-view mode, otherwise the user's own company_id
- `isReseller`, `resellerClients`, `viewingClient`, `switchClient(client)`

**Every Supabase query must be scoped to `getEffectiveCompanyId()`** — RLS enforces it at the DB level, but the frontend filter is defence-in-depth. No company can ever see another company's data.

Super admin is identified by email: `userProfile?.email === 'krugerreece@gmail.com'`

### RLS Pattern

Two types of `company_id` columns exist:
- **UUID**: `ncrs`, `audits`, `management_reviews`, `audit_log`, `compliance_requirements`, `subscriptions` → use `get_my_company_id()`
- **TEXT**: `documents`, `deletion_audit_trail`, `resellers`, `reseller_clients` → use `get_my_company_id_text()`

Helper functions available in Supabase: `get_my_company_id()`, `get_my_company_id_text()`, `is_super_admin()`, `is_reseller_for_uuid(uuid)`, `is_reseller_for_text(text)`

~21 tables have RLS enabled but **no policies** (completely locked out): `ai_operations`, `audit_logs`, `clauses`, `client_health`, `clients`, `commissions`, `compliance_reports`, `document_approvals`, `failed_login_attempts`, `iso_standards`, `meeting_attendees`, `meetings`, `payments`, `reseller_commissions`, `reseller_milestones`, `security_events`, `system_metrics`, `team_members`, `user_permissions`. Fix script: `rls_missing_tables.sql` in project root.

### UI Patterns

Glass morphism design: `className="glass glass-border"` (defined as inline `<style>` blocks in each page — no shared CSS class beyond `index.css`). Gradient bg: `bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900`.

Toasts via `useToast()` from `ToastContext.jsx`. Activity logging via `logActivity()` from `src/lib/auditLogger.js` — call after every data mutation.

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
| `super_admin` | Full platform (krugerreece@gmail.com) |
| `admin` | Company-level admin |
| `lead_auditor` | Audits + management reviews |
| `user` | Documents + NCRs |

## Known Issues

1. **~21 tables locked out** — RLS enabled with no policies. See `rls_missing_tables.sql`.
2. **`documents.company_id` is TEXT**, not UUID — mismatch with most other tables.
3. `AdminDashboard.jsx` checks old email `admin@compliancehub.co.za` instead of `krugerreece@gmail.com`.
4. UTF-8 mojibake (Windows-1252) may still exist in some JSX files — known fixed in `Audits.jsx` and `Layout.jsx`.

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
