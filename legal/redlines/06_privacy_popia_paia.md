# Privacy Policy + PAIA/POPIA Manual — minor redline

**Source PDFs:**
- `ISOGuardian legal/Privacy policy .pdf` (and `public/docs/ISOGuardian_POPIA_Privacy_Policy_v1.0.pdf`)
- `# PAIA AND POPIA MANUAL.pdf` (and `public/docs/ISOGuardian_PAIA_Manual_v1.0.pdf`)

**Effective:** April 2026
**Status:** Draft — minor changes, low attorney-review urgency

## Purpose

Contact-email migration + cross-reference the new in-app "Request Data Deletion" flow under POPIA s24 data subject rights. No other substantive changes.

## Changes

### Privacy Policy — all contact references

**BEFORE:**
> "krugerreece@gmail.com"

**AFTER:**
> "`support@isoguardian.co.za`"

**Rationale:** Platform-wide contact migration.

---

### Privacy Policy — Data Subject Rights section (under POPIA s24)

**INSERT cross-reference:**
> "Data subjects may request erasure of personal information via the in-app Account Settings → Request Data Deletion flow, or by emailing the Information Officer at `support@isoguardian.co.za`. Erasure requests are processed within 30 days, subject to lawful retention obligations (POPIA s14, tax legislation, regulatory requirements)."

**Rationale:** Matches the shipped POPIA button in `UserProfile.jsx` and the `erasure_requests` table with `sla_deadline_at`. Tells data subjects how to exercise the right, not just that the right exists.

---

### PAIA Manual — contact and Information Officer sections

**BEFORE:**
> "krugerreece@gmail.com"

**AFTER:**
> "`support@isoguardian.co.za`"

**Keep:** Tyreece Kruger named as Information Officer.

**Rationale:** Platform-wide contact migration. Information Officer identity unchanged.

---

### Footer / version block (both docs)

**BEFORE:**
> "Version 1.0 | [prior date]"

**AFTER:**
> "Version 1.1 | April 2026 | Support contact updated; POPIA s24 erasure flow cross-referenced."

**Rationale:** Minor version bump.
