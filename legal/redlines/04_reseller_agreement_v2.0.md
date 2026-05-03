# Reseller Agreement — redline v1.2 → **v2.0** (MATERIAL CHANGE)

**Source PDF:** `ISOGuardian legal/Reseller Agreement .pdf`
**Effective:** April 2026
**Status:** Draft — **pending SA attorney review** (particularly §5.2 liability cap restatement)
**Countersignature required:** Yes — existing resellers (Simathemba Holdings) must countersign v2.0

## Purpose

Convert the Partner Admin tier to a complimentary licence for all resellers in Good Standing (replaces the separate Internal Use & Discount Addendum, which is WITHDRAWN), restate the liability cap now that resellers pay no fees to ISOGuardian, and migrate the contact email. The 25% lifetime commission on client MRR is UNCHANGED.

## Changes

### §3.2 — Reseller Internal Usage (FULL CLAUSE REPLACEMENT)

**BEFORE:**
> "3.2 Reseller Internal Usage. The Reseller may purchase a Partner Admin instance of the Software at the discounted rate set out in the Internal Use & Discount Addendum for its own internal administrative purposes..."

**AFTER (full replacement):**
> "**3.2 Reseller Internal Usage (Complimentary License).** While the Reseller remains in Good Standing under this Agreement, ISOGuardian grants the Reseller a complimentary, non-transferable, non-exclusive licence to use a Partner Admin instance of the Software for its own internal administrative and operational purposes. This licence includes: admin access, multi-client dashboard, analytics, and up to ten (10) internal Reseller users. The Reseller may not use this instance to host, manage, or store the data of external Clients; all external Clients must subscribe under the paid tiers in Schedule B and execute a Client Subscription & SLA. The complimentary licence automatically terminates on termination of this Agreement, or on a material breach by the Reseller (including IP infringement, breach of POPIA obligations under §4, or breach of the IP provisions in §2)."

**Rationale:** Resellers pay ISOGuardian nothing and earn 25% of client MRR; a separate internal-use fee was commercially incoherent. Folding the complimentary licence into the main agreement kills the Internal Use & Discount Addendum (withdrawn — see redline 05). Hard boundary: internal licence cannot be used to host external client data — that must go through paid client tiers with a signed CSA.

---

### §5.2 — Limitation of Liability (RESTATED)

**BEFORE:**
> "The Licensor's total aggregate liability shall not exceed the fees paid by the Reseller to the Licensor in the twelve (12) months preceding the claim."

**AFTER:**
> "**5.2 Limitation of Liability.** To the maximum extent permitted by South African law, the Licensor's total aggregate liability for any claim arising out of or in connection with this Agreement (whether in contract, delict, statute, or otherwise) shall not exceed ZAR 10,000 (ten thousand Rand). The Licensor shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profit, loss of commissions, loss of data, or loss of goodwill, even if advised of the possibility of such damages."

**Rationale:** The old cap ("fees paid by the Reseller to the Licensor") is broken now that resellers pay nothing — it would resolve to R0. A fixed ZAR 10,000 cap is the simplest defensible substitute. **Attorney review required** before publishing — a SA attorney should sanity-check whether ZAR 10,000 is enforceable and whether the indirect-damages exclusion survives CPA scrutiny.

---

### §3.1 — Commission Structure

**UNCHANGED.** 25% of MRR for the lifetime of the Client's subscription, provided the Reseller remains in Good Standing.

**Rationale:** Explicitly NOT changing — the commercial engine of the programme.

---

### Schedule A (Commission) + Schedule B (Subscription Tiers)

**UNCHANGED.** Starter R2,000 / Growth R3,700 / Enterprise Custom remain the Client-facing tiers.

**Rationale:** Pricing unchanged. Only internal-use tier becomes complimentary.

---

### All contact references

**BEFORE:**
> "krugerreece@gmail.com"

**AFTER:**
> "`support@isoguardian.co.za`"

**Rationale:** Platform-wide contact migration.

---

### Document Control

**BEFORE:**
> "Version 1.2 | [prior date]"

**AFTER:**
> "Version 2.0 | April 2026 | Partner Admin tier converted to complimentary; liability cap restated; contact email updated."

**Rationale:** Major version bump reflects the material change (complimentary internal licence + liability cap restated). v1.x → v2.0 triggers the countersignature requirement for existing resellers.

## Required Actions After Publication

- Send Simathemba Holdings the migration notice (see redline 05).
- Obtain countersigned v2.0 from Simathemba before treating the complimentary licence as active.
- Delete the standalone Internal Use & Discount Addendum PDF from `public/docs/` (if present).
