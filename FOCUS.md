# ISOGuardian — Focus Board

**This is the single source of truth for what I'm working on right now.**
**Rule: do not add a new feature until Current Sprint is green.**

Last updated: 2026-04-30

---

## 🔁 SESSION HANDOFF — resume here

**Sprint:** Demo 6 Polish — smoke testing the 6 client-facing features on staging before first paying client.

**Status:** 1🟠 / 2🟢 / 3🟢 / 4🟢 / 5🟢 / 6🟢. Operational 4: all 🟢. **Smoke testing COMPLETE on staging.** Next: consolidated prod migration + Phase C release. Work is uncommitted in the working tree.

**Environments:**
- Staging Supabase: `kesmzjuegmgdxiruhfdz` (linked via CLI)
- Production Supabase: `hyssdmtweecjbgtiwacz` (untouched this sprint — release at end)
- Local dev: `http://localhost:3000/` (Vite default port — port 5174 used previously, now back to 3000)

**Test accounts (staging) — all password `TestPass!2026`:**
- `priya@apex-test.example` (admin, Apex Logistics, all 3 standards) — primary happy-path persona
- `sipho@dcc-test.example` (admin, Dlamini Compliance Consulting — **reseller**, linked to Alpha/Beta/Gamma) — reseller-view persona
- `karen@churn-test.example` (admin, Churn Test Co, **iso_9001 only**) — single-standard + cross-tenant isolation persona
- `thabo@mokoena-test.example` (admin, Mokoena Fabrication)
- **No super_admin seed user on staging** — super_admin paths (retention override, /create-company, /admin/*) cannot be E2E tested until one is seeded.

**Same-browser multi-account testing:** Supabase auth shares localStorage across tabs in the same browser. Logging in as Sipho will kick Priya. Use **different browsers** (Chrome + Edge) for cross-account smoke tests.

**Migrations applied to staging (NOT yet to prod, queued for release):**
1. `supabase/migrations/20260424120000_document_retention_policy.sql` — retention columns + backfill + trigger + indexes
2. `supabase/migrations/20260429120000_documents_type_check_expand.sql` — adds Work Instruction / Register / Certificate to type CHECK
3. NCR seed cleanup (security-test garbage replaced with natural-language titles) + 1 seed NCR for CHURN (Karen) for cross-tenant test
4. Storage RLS policies (`storage_rls_policies.sql`) — were missing on staging, applied 2026-04-24

**Edge functions redeployed to staging this sprint:** `rate-limit` (added localhost:5174/5175 to CORS allowlist).

**This session shipped:**
- Feature 2 🟢: full ISO §7.5.3 retention system, auditor-grade Version History modal, orphan storage cleanup, branded PDF (retention badge, signature blocks, client-only footer), `useFormDraft` hook
- Feature 3 🟢: NCR raise (root_cause + corrective_action OPTIONAL per ISO §10.2), Edit NCR flow with diff-only audit log, signature blocks (Raised/Approved/Verification/Closed), client-only PDF footer
- Feature 4 🟢: Audits scheduling with 15-min time picker + draft persistence, signature blocks via reusable `addSignatureBlocks` helper, reseller view (Sipho sees only his clients), nav renamed Internal Audits → Audits
- **Activity Trail** now shows actor name app-wide (ISO §7.5.3 traceability)
- **AI Copilot** activated for `super_admin` only (route `/ai-copilot` + nav link in Tools group, $10/day hard ceiling already coded)
- **Reseller flow data bugs**: `reseller_company_id` typo, `created_at` column doesn't exist on reseller_clients, `'Active'` vs `'active'` case-sensitivity (7 places)
- **MRR hidden from reseller view** — commission-only, super_admin sees full MRR (policy decision logged below)
- **Nav restructure**: SHEQ Policy & Scope → `/documents?clause=5` (filtered docs); Compliance Score is its own item under Performance §9.1
- **LICENSE** file (proprietary, SA Copyright Act-aware, anti-AI-training clause)
- **Downloads/CLAUDE.md** replaced with pointer to project CLAUDE.md (was stale duplicate)
- **`useFormDraft` hook** in `src/hooks/useFormDraft.js` — applied to Documents Upload, NCR Raise, Audit Schedule. Apply to Management Review form during Feature 6.

**Up next:**
1. **Feature 5 — Compliance Score** — design decision needed:
   - **Cheap path:** keep current scoring UI + add prominent link from each clause to filtered Documents (`/documents?clause=N`) so users can see what evidence backs the score
   - **Bigger path:** rebuild as clause-detail page with inline document management + scoring (separate sprint)
   Smoke-test as Karen (iso_9001 only — verify standard tabs hide 14001/45001 for her) + Priya (all 3 standards).
2. **Feature 6 — Management Reviews** — apply `useFormDraft` to the create form (sig blocks already in shared PDF helper).
3. **Phase B7** — Operational 4 (super_admin tools): seed a super_admin first.
4. **Phase B9–B11** — audit_log immutability check, mobile viewport sweep, Audit Connect external auditor portal.
5. **Phase C** — release: pre-deploy verification (env vars, edge function parity, Turnstile server-side, GA gating), Sentry + PostHog wire-up (NON-NEGOTIABLE per 2026-04-30 silent-fail incident — see top of file), apply both migrations to prod, configure Resend SMTP on both projects, `git push` → Vercel auto-deploy, /data-export verification.

**Pending from user (Tyreece-only Dashboard tasks):**
- Configure Resend SMTP in Supabase Dashboard → Project Settings → Auth → SMTP (both staging AND prod — per-project setting). Until done, password recovery email delivery is broken.

---

---

## North Star
Get 3 paying clients saying *"it works and it's beautiful"* by [target: 2026-07-01].
Financial-freedom path depends on word-of-mouth in the SA compliance sector — polished > feature-rich.

---

## Current Sprint: Demo 6 Polish
The 6 features every client touches. Each must be flawless before launch.

| # | Feature | Status | Last verified | Notes |
|---|---------|--------|---------------|-------|
| 1 | Login + password recovery | 🟠 partial — BLOCKED on SMTP | 2026-04-24 | Login ✅, rate-limit UI ✅, CORS fixed ✅. Password recovery email delivery BLOCKED: Resend SMTP not wired into Supabase Auth. **Action: Tyreece must configure in Supabase Dashboard → Project Settings → Auth → SMTP Settings** before launch. Real clients cannot reset passwords until done. |
| 2 | Documents (upload, list, PDF) | 🟢 verified | 2026-04-29 | **All polish items shipped** + retention system end-to-end + auditor-grade Version History + draft sessionStorage + new-version toast copy + gradient Restore/Delete buttons. **DB migrations:** `20260424120000_document_retention_policy.sql` (staging applied, prod pending) + `20260429120000_documents_type_check_expand.sql` (staging applied, prod pending — adds Work Instruction/Register/Certificate to CHECK constraint). **Untested on staging:** super_admin override path (no super_admin seed user — moved to Phase B7). **Post-sprint:** "Audit Package" one-click ZIP/PDF (current + all versions + change log + activity trail). |
| 3 | NCRs (raise → close → PDF) | 🟢 verified | 2026-04-30 | **DONE ✅:** Raise NCR (root_cause + corrective_action now optional, ISO §10.2 aligned), Edit NCR flow with diff-only audit log entry (admin/lead_auditor), branded PDF with **signature blocks** (Raised By / Approved By / Verification of Effectiveness / Closed By), client-only PDF footer (no ISOGuardian text), Cancel-clears-draft, sessionStorage persistence via `useFormDraft` hook, cross-tenant RLS isolation verified (Karen sees only Churn's NCR, not Apex's). Seed NCRs cleaned (natural-language titles). **Bonus:** Activity Trail now shows actor name ("by Priya Naicker") for ISO §7.5.3 traceability — applies app-wide, not just NCRs. |
| 4 | Audits (schedule → close-out → PDF) | 🟢 verified | 2026-04-30 | **DONE ✅:** Schedule audit form with 15-min time-picker + `useFormDraft` sessionStorage persistence + Cancel-clears-draft, branded PDF with **4 signature blocks** (Lead Auditor / Auditee Rep / Approved By Quality Manager / Report Issued To) via reusable `addSignatureBlocks` helper, client-only PDF footer (no ISOGuardian text), full_name on "Prepared By", reseller view (Sipho) verified — sees only his 3 linked clients (Alpha/Beta/Gamma) via ClientSelector, NOT Apex. Nav renamed "Internal Audits" → "Audits" (single page handles all audit types via `audit_type` dropdown). **Bonus fixes:** Analytics + ResellerDashboard column-typo bugs (`reseller_company_id` removed, `created_at` → `onboarded_date`), `'Active'` vs `'active'` case-sensitivity bug class fixed across 7 places, mobile drawer z-[60] above sticky header, MRR hidden from reseller view (commission-only). |
| 5 | Compliance scoring (clause-by-clause) | 🟢 verified | 2026-04-30 | **DONE ✅:** Cheap path chosen — scoring UI retained + "View evidence documents" CTA per clause (links to `/documents?standard=X&clause=N`). Fixed 3 blockers: (a) standards_access casing mismatch (iso_9001 vs ISO_9001) in Compliance.jsx, Documents.jsx, Dashboard.jsx, (b) standard tab selector now gated by standards_access — Karen sees ISO 9001 only, Priya sees all 3, (c) `?clause=N&standard=X` query params now wired into Documents.jsx on mount. Apex seeded with 21 compliance_requirements rows. Dashboard compliance widget now filters by standards_access. Dashboard stat cards changed to 2×2 grid (reduced dead space). Dead space polish sweep parked to Ideas Parking Lot (post-Demo-6). |
| 6 | Management Reviews (create → minute → close) | 🟢 verified | 2026-04-30 | **DONE ✅:** Create form with `useFormDraft` sessionStorage persistence (create mode only) + amber restore banner + Cancel-clears-draft. PDF export: client-only footer (`[Company] \| CONFIDENTIAL`), signature blocks (Chairperson + Management Rep), "Powered by ISOGuardian" subtle header branding retained. Fixed hardcoded "31 January 2027" date → pulls from `r.review_date`. Status transitions (Scheduled → In Progress → Completed) work. Verified as Priya (Apex Logistics). |

Legend: 🟢 shipped & verified   🟡 built, needs verification   🟠 partial/blocked   🔴 broken   ⚪ not started

---

## Launch Blockers (must resolve before first paying client)

- **Supabase Auth SMTP (BOTH projects)** — configure Resend as custom SMTP in Dashboard → Project Settings → Auth → SMTP Settings. Must be done on staging AND prod separately (per-project setting). Default Supabase SMTP rate-limits at ~3/hr + poor deliverability. Blocks: password recovery, email confirmations. ETA: 5 min per project.
- **Verify storage RLS policies on PROD** — staging was missing `documents_*` policies (fixed 2026-04-24). Prod may or may not have them. Check with: `SELECT COUNT(*) FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname LIKE 'documents_%'` on prod — expect 4.

## Release Plan (staging → production)

**Do NOT deploy to prod mid-sprint.** Complete the full Demo 6 smoke test first, batch every change into one validated release candidate, then one-shot deploy.

**Release artefacts queue (to apply to prod once Demo 6 is 🟢):**
- `supabase/migrations/20260424120000_document_retention_policy.sql` — retention columns + backfill + trigger + indexes
- Frontend changes (to be committed): Documents.jsx retention UI/enforcement, Version History modal expansion, orphan storage cleanup, polish items a-e
- [more to be added as Features 3-6 are tested]

**Release checklist (to be expanded end-of-sprint):**
1. Smoke test all 6 Demo features on staging
2. Apply all queued SQL migrations to prod via SQL editor (one at a time, verify each)
3. `git push` → Vercel deploys frontend to prod
4. Verify prod SMTP config (Resend)
5. Verify prod storage RLS policies (4 expected)
6. Hand-test golden path on live prod with a real account
7. Then pitch first paying client

## Operational 4 (super_admin tools — must work, can be rough)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | /create-company | 🟢 | Schema audit + fixes: companies tier constraint migrated (basic/professional → starter/growth), subscriptions schema fixed (plan/users_count/price_per_user, removed generated total_amount), super_admin INSERT policies added, create-user Edge Function deployed with role param. Smoke tested 2026-05-01. |
| 2 | /users (admin invites) | 🟢 | InviteUserModal now calls create-user Edge Function (auth + users row atomic via service role). users.status references replaced with is_active. RLS admin_insert_users policy added. **Forced password change on first login** built (must_change_password flag → ProtectedRoute redirect → ResetPassword clears flag → /dashboard). Smoke tested 2026-05-01. |
| 3 | /admin/cancellations | 🟢 | Page renders. Schema verified. No request data to action yet — full action-flow test deferred to first real request. |
| 4 | /admin/erasure-requests | 🟢 | Page renders. Schema verified. No request data to action yet — full action-flow test deferred to first real request. |

### DB changes applied to staging during Operational 4 (queue for prod migration)
1. `companies_tier_check` constraint: now `(starter, growth, enterprise, reseller)` — old basic/professional rows migrated
2. `companies.tier` default → `'starter'`
3. `users.role` default → `'user'` (was `'viewer'`); existing `viewer` rows migrated
4. `super_admin_insert_companies` + `super_admin_update_companies` RLS policies on `companies`
5. `super_admin_insert_subscriptions` RLS policy on `subscriptions`
6. `admin_insert_users` RLS policy on `users` (super_admin OR admin-for-own-company)
7. `users_update_self` RLS policy on `users` (allows ResetPassword to clear must_change_password)
8. `users.must_change_password` boolean column (NOT NULL, default false)
9. `create-user` Edge Function v2 deployed (accepts `role` param, sets `must_change_password: true`)

---

## Hidden from clients (super_admin only) — v2+
Speculative IMS features. Built but not polished. Do NOT promote. Do NOT fix until Demo 6 is 🟢.

- Context (§4): SWOT, Stakeholders, Processes
- Planning (§6): Risks, Env Aspects, HIRA, Legal Register, Objectives
- Support (§7): Training, Communications
- Operation (§8): Suppliers
- Performance (§9): Customer Feedback
- Improvement (§10): Continual Improvement
- Tools: Templates, Audit Simulator, Clause Matrix, Audit Connect
- AI Copilot (route disabled)
- Finance Dashboard, Analytics (super_admin anyway)

---

## Ideas Parking Lot
**Rule: write it down, don't build it. Review at end of sprint.**

- 2026-04-30 **Dead space / density sweep (post-sprint)** — noticed during Feature 5 smoke test: Dashboard compliance card, and likely other pages, have excessive whitespace when a single-standard client uses the app. Full viewport audit needed: reduce padding, tighten card heights, audit all pages for sparse layouts on small data sets.
- 2026-04-20 **UI/UX polish pass (post-sprint)** — Grok-suggested: whitespace/density reduction, richer hero visuals, premium "guardian" aesthetic, micro-interactions on /demo, sticky nav on long scrolls, motion refinement. Consider running frontend-design + Impeccable + ui-skills skills as a dedicated polish session after Demo 6 ships. Parked to avoid derailing launch.
- 2026-04-20 **Legal doc audit for reseller pack** — review all agreements in `ISOGuardian legal documents and agreements/` + `compliancehub-app/legal/` folders. Confirm POPIA/CPA/ECTA coverage, verify Reseller Agreement v2.0 is countersigned-ready, check PAIA/Privacy/Terms/Upload Disclaimer versions match what's served in footer, flag gaps before sending to resellers. Dedicated session — est. 2-4 hrs.
- 2026-04-24 **Scale-readiness audit (post-Demo-6)** — projected data volume at 5 max-usage clients × 5 years: ~2.7M audit_log rows, ~22GB storage, ~20k document_versions. Current schema has strong indexes (verified 2026-04-24) but structural work needed: (a) Upgrade Supabase Free → Pro before 2nd client (R450/mo). (b) Partition `audit_log` by month at year 1 (~500k rows). (c) Migrate `documents.version_history` JSONB → `document_versions` table only at year 2 (avoid row bloat). (d) Orphan storage cleanup cron — permanent-delete + version-upload leave old files in bucket. (e) Activate Sentry (`src/lib/sentry.js` is a placeholder, needs `VITE_SENTRY_DSN`). (f) Edge function batch processing for daily-notifications when user count crosses ~500.

### Strategic items (logged 2026-04-29 — sprint discipline says don't build mid-Feature-3)

- **#1 architectural refactor — TanStack Query (post-launch)** — Replace DIY `useEffect(fetch)` pattern across all pages (Documents, NCRs, Audits, Compliance, ManagementReviews, Dashboard). ~13kb gzip, removes ~200 lines of fetch boilerplate, gives automatic refetch / dedup / optimistic mutations / stale-while-revalidate. Fixes the silent-spinner-failure bug class. Est. 4-6 hrs.
- **AI Copilot activation (super_admin only first)** — Edge Function + AICopilot.jsx fully built. Activate via 3-line uncomment in `App.jsx:39, 127` + `RoleProtectedRoute allowedRoles={['super_admin']}` + nav link gated. Use to validate output quality on 5 real NCRs/audits/docs before unhiding to clients. Per-client cost ~R0.50–R5/month at fair-usage limits, $10/day hard ceiling already coded. Activate **after Feature 3 ships 🟢**.
- **Sentry + PostHog (Phase C)** — Sentry: free 5k err/mo, sign up → set `VITE_SENTRY_DSN` on Vercel → 30 min wire-up. PostHog (EU region for POPIA): free 1M events/mo → set `VITE_POSTHOG_KEY` → session replay + funnels + feature flags + product analytics. Both before first paying client.
- **AI-enhanced NCR/Audit workflows** — once AI Copilot is live: AI-suggested root cause (5-Whys), AI-suggested corrective action, AI-generated audit checklists from clause + risk profile, AI document gap analysis on upload. Use `ai-copilot` Edge Function. Powerful demo moments. Roll out as Growth-tier exclusive (creates Starter→Growth upsell).
- **WhatsApp Business API** — currently `wa.me` link only. Upgrading to WA Business API enables push notifications for overdue NCRs / audit reminders. SA SMB owners default to WA over email. ~$0.02/msg. Massive engagement vs unread emails. Post-launch month 1.
- **POPIA Information Officer auto-template** — every SA business needs a s56 Information Officer designation letter filed with the Information Regulator. Auto-generate from `companies.key_personnel` + email as part of onboarding. Tangible client value within 5 minutes of signup. Quick build, huge perceived depth.
- **B-BBEE certificate management module** — out of scope for ISO but every SA SMB needs it. Add as a Certificates doc-type module post-launch. Massive market expansion (every SA SMB, not only ones chasing ISO).
- **Cross-feature `useFormDraft(key)` hook** — extracted to `src/hooks/useFormDraft.js` 2026-04-29. Applied to Documents Upload + NCR raise. Apply to Audit schedule/close + Management Review create during respective feature smoke-testing.
- **Founder Consulting (separate brand, post-Demo-6 launch)** — Tyreece offers consulting as a separate entity (e.g. "Kruger SHEQ Advisory") with PREMIUM positioning (R30k–R60k/mo retainer or R150k–R350k flat for full ISO implementation). **Strict rules to protect reseller channel:** (a) Brand-separated, never under ISOGuardian. (b) Inbound only — never pitch a client a reseller is engaged with. (c) Bundle discount (15% off ISOGuardian for 12 months when sold with consulting) available to ALL resellers, not exclusive. (d) Reseller Agreement v2.0 to include explicit 24-month non-compete on reseller-introduced clients. (e) Reverse-referral mechanism — resellers refer overflow to Tyreece, earn 15% finder's fee. **Do NOT launch before Demo 6 🟢 + first paying client onboarded** — split focus would delay launch.

### Strategic decisions explicitly REJECTED 2026-04-29 (don't re-suggest)
- ~~R200 deposit-to-lock-pricing~~ — friction > reward, scrapped.
- ~~Landing page "vs R150k consultants" anchoring~~ — would poison reseller acquisition. ISOGuardian is positioned as the *tool resellers love to recommend*, never as a consultant-replacement.

### Policy: Resellers do NOT see gross MRR (decided 2026-04-30)
- Resellers see only their **commission** earnings (per-client + total + projected annual).
- Underlying MRR (the rand value of each client's subscription) is **super_admin-only**.
- Reasons: (a) prevents reseller from leaking ISOGuardian's pricing to clients, weakening their own value proposition. (b) prevents inter-reseller commission comparison/renegotiation. (c) commercial pricing is between ISOGuardian ↔ end-client; the reseller earns commission on activity, not on price visibility.
- Implemented in `Analytics.jsx` + `ResellerDashboard.jsx` — gated by `isSuperAdmin`.
- **Tier name** (Starter/Growth/Enterprise) is shown to resellers because it's needed for context, but without the rand value attached.

### Polish backlog (post-Feature-4, all small)
- **User `display_name` / signature name field** — onboarding asks user to set how their name appears on documents (e.g. "P. Naicker" vs "Priya Naicker"). Affects all PDF signature blocks. Default = `full_name`. Add to UserProfile.jsx + new column on `users` table. ~30 min.
- **Mobile viewport overlap audit** — the sidebar drawer z-index has been bumped to z-[60] (above the sticky header) 2026-04-30. Sweep all other modals when we hit Phase B10.
- **Concurrent session UX banner** — when "session_replaced" or "idle_timeout" reason is in the URL, show a friendly explanatory banner on the login page (currently silent). 5 min.

### .md files to add at Phase C release week
- **SECURITY.md** — RLS conventions, vuln-disclosure email (`security@isoguardian.co.za`), threat model. GitHub auto-detects. Required for every B2B procurement security questionnaire.
- **CHANGELOG.md** — public-facing release notes, starts from v0.1.0 launch
- **DEPLOYMENT.md** — extract Phase C from FOCUS.md into its own re-runnable checklist
- **RUNBOOK.md** — incident response (Supabase down, Resend down, edge function timeout, payment webhook fail). Add post-launch once first real incident happens.
- **CLIENT_ONBOARDING.md** — internal playbook for super_admin onboarding new paying client. Document the steps once they're real (post first paying client).

---

## Definition of "Sprint Done"
1. All Demo 6 rows = 🟢
2. All Operational 4 rows = 🟢
3. One real human other than Tyreece has used the app for 30 min without help
4. One PDF export has been handed to a real ISO consultant for feedback

Only after all 4: start marketing, pitch first paying client.

---

## Anti-distraction protocol
When Tyreece says *"let's also add X"* or *"what about Y"*:
1. Claude logs it in Ideas Parking Lot above
2. Claude replies: "Parked. Current sprint is [N] of 6 Demo items green — let's finish this one first."
3. Do not implement until sprint is done.
