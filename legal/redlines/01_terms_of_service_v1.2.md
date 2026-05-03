# Terms of Service — redline v1.1 → v1.2

**Source PDF:** `ISOGuardian legal/Terms of Service .pdf` (and published `public/docs/ISOGuardian_Terms_of_Service_v1.1.pdf`)
**Effective:** April 2026
**Status:** Draft — pending attorney review

## Purpose

Align the published ToS PDF with the live `TermsOfService.jsx` (which already removed AI advisory claims in v1.1), introduce the in-app cancellation flow now shipped in `CompanySettings.jsx`, document the POPIA s24 right-to-erasure flow shipped in `UserProfile.jsx`, and migrate the Information Officer contact to `support@isoguardian.co.za`.

## Changes

### Preamble (first paragraph)

**BEFORE:**
> "...AI-powered ISO compliance advisory services..."

**AFTER:**
> "...ISO compliance management tools and related features..."

**Rationale:** ISOGuardian is a management platform, not an AI advisory service. Aligns PDF with the `TermsOfService.jsx` v1.1 copy already in production.

---

### §4 — Service and AI Advisory (RENAME + REWRITE)

**BEFORE (heading):**
> §4. Service and AI Advisory

**AFTER (heading):**
> §4. Platform Capabilities and Roadmap

**BEFORE (body — parenthetical to remove):**
> "(AI outputs are informational only — not professional advice...)"

**AFTER (full replacement body):**
> "The Platform provides tools for document management, non-conformance tracking, audit scheduling, compliance scoring, management reviews, and related ISO management activities. Certain features (including AI-assisted analysis) are on the product roadmap and may not be available at general release. ISOGuardian does not guarantee ISO certification, audit success, or compliance with any standard. Compliance responsibility remains solely with the Client."

**Rationale:** Removes residual AI advisory liability. Protects ISOGuardian from claims tied to roadmap features (AI Copilot is hidden until launch per `App.jsx`). Reinforces that we are a management tool, never a substitute for the client's accountability.

---

### §10 — Termination (second sentence)

**BEFORE:**
> "You may cancel your subscription by emailing support@isoguardian.co.za with reasonable notice."

**AFTER:**
> "You may cancel your subscription via the in-app Account Settings → Subscription → Cancel Subscription flow, or by emailing support per §15. Cancellation is subject to the notice periods and early termination fees in the Client Subscription Agreement §4.1."

**Rationale:** Documents the new in-app cancellation path (`CompanySettings.jsx` Subscription tab → `cancellation_requests` table → `notify-cancellation` Edge Function). Cross-references CSA §4.1 fee schedule instead of restating it.

---

### §14 — Refund and Cancellation Policy

**BEFORE (Subscription Cancellation bullet):**
> "Subscription Cancellation: Email support@isoguardian.co.za with 60 days' written notice."

**AFTER (replacement bullet):**
> "You may cancel at any time via the in-app Account Settings → Subscription → Cancel Subscription flow, or by emailing `support@isoguardian.co.za`. Cancellation takes effect at the end of the current billing cycle, subject to the early termination provisions in the Client Subscription Agreement §4.1 if within the Initial Term."

**APPEND new bullet (POPIA s24):**
> "**Right to Erasure (POPIA s24):** You may request erasure of personal information via the in-app Account Settings → Request Data Deletion flow, or by emailing `support@isoguardian.co.za`. Erasure requests are processed within 30 days, subject to lawful retention obligations (e.g., tax, audit trail, or regulatory records)."

**Rationale:** Matches the shipped POPIA button in `UserProfile.jsx` and `/admin/erasure-requests` queue. 30-day SLA is tracked via `sla_deadline_at` in the `erasure_requests` table.

---

### §15 — Contact

**BEFORE:**
> "krugerreece@gmail.com"

**AFTER:**
> "`support@isoguardian.co.za`"

**Keep:** Tyreece Kruger named as Information Officer.

**Rationale:** Contact email migrated across the platform. Gmail address is deprecated.

---

### Footer / version block

**BEFORE:**
> "Version 1.1 — [prior date]"

**AFTER:**
> "Version 1.2 — April 2026 — updated for in-app cancellation, AI claim removal, POPIA erasure, support contact."

**Rationale:** Version bump + change summary.
