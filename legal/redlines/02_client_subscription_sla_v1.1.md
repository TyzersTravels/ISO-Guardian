# Client Subscription & SLA — redline v1.0 → v1.1

**Source PDF:** `ISOGuardian_Client_Subscription_SLA_v1.0.pdf` (public/docs/)
**Effective:** April 2026
**Status:** Draft — pending attorney review

## Purpose

Add the in-app cancellation path as a valid method of written notice under §4.1, introduce an explicit POPIA s24 right-to-erasure sub-clause tied to the 30-day SLA in the `erasure_requests` table, and migrate the Notices/header contact email to `support@isoguardian.co.za`.

## Changes

### §4.1 — Early Cancellation by Client

**BEFORE (opening):**
> "The Client may initiate early cancellation by providing sixty (60) days' written notice to krugerreece@gmail.com."

**AFTER (new opening sentence — sliding-scale fee schedule UNCHANGED):**
> "The Client may initiate early cancellation either via the in-app Account Settings → Subscription → Cancel Subscription flow, or by providing sixty (60) days' written notice to `support@isoguardian.co.za`. Both methods constitute written notice for purposes of this clause."

**Keep unchanged:** Existing 50% (months 1–6) / 25% (months 7–12) early termination fee schedule.

**Rationale:** Codifies the in-app flow shipped in `CompanySettings.jsx`. Preserves the 12-month Initial Term fee structure. The in-app modal already surfaces the 50%/25% fee calculator before the user confirms.

---

### §7.5 — Data Retention and Deletion (INSERT new sub-clause)

**BEFORE:**
> §7.5 Data Retention and Deletion
> [existing body on post-termination retention]

**AFTER (INSERT new sub-clause 7.5.1 beneath existing §7.5):**
> **7.5.1 Right to Erasure.** During the subscription term, the Client may request erasure of personal information via the in-app Account Settings → Request Data Deletion flow or by emailing `support@isoguardian.co.za`. ISOGuardian shall comply within 30 days, subject to lawful retention obligations under POPIA s14 (record-keeping), tax legislation, or regulatory requirements. Data required for legal retention will be anonymised or segregated from active use.

**Rationale:** Matches the POPIA button in `UserProfile.jsx`, the `erasure_requests` table with `sla_deadline_at`, the super_admin queue at `/admin/erasure-requests`, and the "retention exceptions" field used to record POPIA s14 / tax / regulatory retention reasons.

---

### Page 1 header + §14.5 Notices

**BEFORE:**
> "krugerreece@gmail.com"

**AFTER:**
> "`support@isoguardian.co.za`"

**Rationale:** Platform-wide contact migration.

---

### Footer (page 10)

**BEFORE:**
> "Version 1.0 | [prior date]"

**AFTER:**
> "Version 1.1 | April 2026 | Added in-app cancellation path, POPIA s24 erasure process, support contact update."

**Rationale:** Version bump + change summary.
