# ISOGuardian — Focus Board

**This is the single source of truth for what I'm working on right now.**
**Rule: do not add a new feature until Current Sprint is green.**

Last updated: 2026-04-20

---

## North Star
Get 3 paying clients saying *"it works and it's beautiful"* by [target: 2026-07-01].
Financial-freedom path depends on word-of-mouth in the SA compliance sector — polished > feature-rich.

---

## Current Sprint: Demo 6 Polish
The 6 features every client touches. Each must be flawless before launch.

| # | Feature | Status | Last verified | Notes |
|---|---------|--------|---------------|-------|
| 1 | Login + password recovery | 🟡 needs user walk-through | — | Turnstile live, rate limiting live |
| 2 | Documents (upload, list, PDF) | 🟡 needs user walk-through | — | Storage RLS shipped 2026-04-20 |
| 3 | NCRs (raise → close → PDF) | 🟡 needs user walk-through | — | getEffectiveCompanyId bug fixed 2026-04-19 |
| 4 | Audits (schedule → close-out → PDF) | 🟡 needs user walk-through | — | Same bug fix applied |
| 5 | Compliance scoring (clause-by-clause) | 🟡 needs user walk-through | — | — |
| 6 | Management Reviews (create → minute → close) | 🟡 needs user walk-through | — | — |

Legend: 🟢 shipped & verified   🟡 built, needs verification   🔴 broken   ⚪ not started

## Operational 4 (super_admin tools — must work, can be rough)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | /create-company | 🟡 | Needs Edge Function (service role) before production use |
| 2 | /users (admin invites) | 🟡 | Needs walk-through |
| 3 | /admin/cancellations | 🟡 | Legal obligation (CPA s16) — must work |
| 4 | /admin/erasure-requests | 🟡 | Legal obligation (POPIA s24) — must work |

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

- [date] Idea — one-line summary

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
