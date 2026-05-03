# Marketing Motion Animations — Landing Page

**Date:** 2026-05-03
**Status:** Design — pending implementation plan
**Author:** Brainstormed with Claude
**Owner:** Tyreece Kruger

## Goal

Lift conversion on `https://isoguardian.co.za` by replacing static marketing copy with three scroll-triggered animated UI demos that show the product in motion. Target audience: SHEQ reps, quality managers, and operations directors at South African manufacturing/engineering companies who are skeptical of compliance software promises.

The animations follow a "narrative-led product demo" psychology: lead with recognisable pain, pivot to product as the relief, end with confidence. Trust is built by showing the product being used confidently in realistic scenarios — not by showing security badges.

## Non-Goals

- Producing an actual MP4 hero video (deferred to Phase 2 — separate spec when ready).
- Replacing the entire landing page. Existing sections (Readiness Assessment, Consultation Upsell, hero copy, pricing) stay intact.
- Building any animation that requires audio.
- Changing brand identity, palette, or component primitives.

## Architecture

Three new React components, each fully self-contained, lazy-imported into `LandingPage.jsx` at specified scroll positions. Each component owns its own animation state, scroll-trigger logic, and assets.

```
src/components/landing/motion/
  ├── HeroChaosToCompliance.jsx     // Section 1: pain → product transition
  ├── DocumentBecomesAuditReady.jsx // Section 2: document lifecycle loop
  └── NCRRaisedToClosed.jsx         // Section 3: NCR status flow loop
```

**Tech choices:**
- **Framer Motion** — primary animation library. ~12KB gzipped. Already battle-tested with React 18.
- **Tailwind classes** — all visual styling, no new CSS files.
- **IntersectionObserver** — trigger animations when scrolled into view (already used elsewhere on the page — see `useFadeIn`, `AnimatedCounter`).
- **No Lottie** — adds runtime overhead; pure Framer Motion + SVG/CSS is sufficient for these three scenes.
- **No video files** — all motion is code-rendered.

**Performance budget:**
- Total added bundle weight: < 35KB gzipped (Framer Motion + three components).
- Animations pause when `prefers-reduced-motion` is set (accessibility).
- Each component uses `whileInView` with `viewport={{ once: false, amount: 0.4 }}` for replay on re-entry.
- Mobile: simplified animations or static fallback if `window.innerWidth < 640` (per-component decision).

## Components

### Section 1 — `HeroChaosToCompliance`

**Placement:** Below the existing hero, above the Readiness Assessment.
**Heading:** "From spreadsheet chaos to audit-ready, in one place."
**Duration:** ~6 seconds, plays once per scroll-into-view.

**Visual story (left → right transformation):**
1. **0–2s:** Left side fills with chaos — animated stack of paper documents falling, a faded Excel grid in the background, three red "OVERDUE" stamps thudding onto a calendar.
2. **2–3s:** A glowing line sweeps left-to-right (uses existing `beam` animation from `tailwind.config.js`).
3. **3–6s:** Right side resolves into a clean ISOGuardian dashboard mockup: compliance score counter climbing 47% → 89%, three glass cards appearing with NCR/Audit/Document totals, a green "Audit Ready" badge fading in.

**Implementation notes:**
- Reuse existing `glass`, `glass-card`, `glass-border`, `bg-app-gradient` classes.
- Compliance score counter uses the existing `AnimatedCounter` component (already in `LandingPage.jsx`) — extract to its own file at `src/components/AnimatedCounter.jsx` so all three motion components can import it.
- "OVERDUE" stamps and document icons: inline SVG, no asset files.
- Background uses `bg-app-gradient` for continuity with rest of page.

### Section 2 — `DocumentBecomesAuditReady`

**Placement:** Inside or directly below the existing "Features" section, near where Documents is mentioned.
**Heading:** "Every document, audit-ready the moment you upload it."
**Duration:** 8-second loop, replays continuously while in view.

**Visual story:**
1. A blank document icon flies in from the bottom.
2. A filename `Quality_Manual_v3.pdf` types into a name field above it.
3. A document number `IG-DEMO-DOC-001` auto-stamps onto the document.
4. A retention policy badge slides in: `Retention: 5 years (Manual)`.
5. An audit trail timestamp ticks in below: `Uploaded by Sarah K. · 2026-05-03 14:22 SAST`.
6. A green check + "Audit Ready" badge flips into place.
7. Pause 1.5s, fade out, restart.

**Implementation notes:**
- Use a fictional company code `DEMO` to avoid impersonating a real client.
- Document number format matches the real `generateDocNumber` output.
- Retention policy text matches real enum values from `src/lib/retentionPolicy.js`.
- All text rendered via Framer Motion `motion.div` with staggered children.

### Section 3 — `NCRRaisedToClosed`

**Placement:** Inside or directly below the "How it works" section.
**Heading:** "From non-conformance to closed, with full traceability."
**Duration:** 10-second loop, replays continuously while in view.

**Visual story:**
A horizontal pipeline of four status pills: `Open → Investigation → Root Cause → Closed`. An NCR card slides through them:
1. NCR card appears at "Open": `NCR-DEMO-001 · Calibration overdue on torque wrench #4`.
2. Card animates rightward to "Investigation". A small avatar circle joins: "Assigned to: Themba M."
3. Card moves to "Root Cause". A text block fades in below: "Root cause: Calibration schedule not synced with maintenance log."
4. Card moves to "Closed". A signature block flips in below: "Closed by: Sarah K. · 2026-05-03 — Verified by: Themba M."
5. Pause 1.5s, reset to start.

**Implementation notes:**
- NCR number format `NCR-DEMO-001` matches `generateDocNumber` output for NCR entity type.
- Status colours match the actual NCR pages (defer to existing Tailwind tokens used in `NCRs.jsx`).
- Use real ISO 9001-style language for the example NCR (calibration is a classic ISO finding in manufacturing).

## Visual Fidelity Requirement (HARD RULE)

To prevent false advertising under CPA s41 and to protect ISOGuardian's credibility, the animations **must not be bespoke recreations of the UI**. Instead:

- Animations compose the *real* app's component primitives (`.glass`, `.glass-card`, `.glass-border`, real Tailwind brand tokens, real status pill components from `NCRs.jsx`, real number badges).
- Where a reusable component exists in the codebase, the animation imports it directly and feeds it mock prop data.
- Where no reusable component exists yet, refactor the smallest necessary piece out of the page (e.g. extract a `<NCRStatusPill />` from `NCRs.jsx`) and import it into both places. The animation and the real app then share one source of truth — drift is impossible.
- All copy must reflect real ISOGuardian behaviour:
  - Document number format from `generateDocNumber`
  - Retention text from real enum in `src/lib/retentionPolicy.js`
  - NCR status names matching `NCRs.jsx`
  - Date formatting matching the real app (SAST timezone, ISO date format)

**Verification gate before merge:** for each animation, take a screenshot of the equivalent real screen in the live app (or staging), place side-by-side with a screenshot of the animation's final state. If they're not visually indistinguishable, the animation gets revised — no exceptions.

## Reference Targets & Libraries

**Visual reference (study before building):**
- **linear.app** — scroll-triggered motion gold standard for B2B SaaS
- **vercel.com** — feature reveal pacing and rhythm
- **resend.com** — closest aesthetic match to ISOGuardian's glass-morphism palette
- **cal.com** ([github.com/calcom/cal.com](https://github.com/calcom/cal.com)) — fully open-source landing page; we can read their Framer Motion patterns directly
- **anthropic.com** — minimal, professional, credibility-first tone
- **stripe.com** — masterclass in dense product demos done gracefully

**Open-source primitive sources (MIT-licensed, copy patterns from):**
- **MagicUI** ([magicui.design](https://magicui.design)) — has Animated Beam, Number Ticker, Animated List, Border Beam, Marquee — likely covers half of what we need
- **Aceternity UI** ([ui.aceternity.com](https://ui.aceternity.com)) — animation-heavy components used by serious SaaS landings
- **Motion-Primitives** — composable Framer Motion patterns

We are not adding these as npm dependencies — we lift specific snippets and adapt them to fit our existing component architecture. Each lifted pattern gets a comment crediting the source.

## Prototype Gate (per component)

Before any animation is committed to the codebase:

1. **Standalone prototype** — I build a working version of the animation as a Claude Artifact (or `v0.dev` prototype) in isolation, viewable in a browser tab.
2. **Tyreece reviews visually** — sign-off required before integration begins.
3. **Real-component swap** — once visual is approved, I refactor the prototype to use the real app's components (per Visual Fidelity Requirement above) and integrate into `LandingPage.jsx`.
4. **Side-by-side fidelity check** — screenshots compared before PR merge.

This gate exists to protect against wasted integration work on an animation that turns out to look wrong, *and* to ensure visual quality is independent of "well, it works".

## Data Flow

No data flow. All three components are presentational, hardcoded mock content fed into real component primitives, no Supabase queries, no props from parent. They are scroll-triggered and self-contained.

## Error Handling

- If `framer-motion` fails to load (offline / CDN issue), components must degrade to static visible state — no broken half-rendered scenes. Use Framer Motion's `initial={false}` fallback pattern and ensure the final visual state is the default.
- If `IntersectionObserver` is not supported (very old browsers), animations play once on mount.
- If `prefers-reduced-motion: reduce` is set, components render in their final visual state immediately with no animation.

## Testing

No automated tests (the project has no test runner configured per `CLAUDE.md`). Manual verification:

1. Each component renders correctly at desktop (1440px), tablet (768px), and mobile (375px) widths.
2. Animations trigger on scroll, replay on re-entry where specified, loop where specified.
3. `prefers-reduced-motion` honoured (test via DevTools rendering panel).
4. No layout shift (CLS) caused by animations — measure via Lighthouse.
5. Page-load weight increase verified < 35KB gzipped via `npm run build` bundle analysis.
6. Smoke test on `https://isoguardian.co.za` after deploy: scroll the landing page on mobile + desktop, watch each animation, confirm no jank or console errors.

## Accessibility

- All three components use `aria-hidden="true"` on the animated visuals (purely decorative).
- A short prose summary precedes each animated block for screen readers (e.g., *"ISOGuardian replaces spreadsheet chaos with a compliance dashboard that climbs your audit score."*).
- `prefers-reduced-motion: reduce` halts all animation per WCAG 2.3.3.

## Phase 2 — Hero MP4 Video (separate spec, deferred)

Captured here so it isn't lost. To be specced separately when Phase 1 is shipped and conversion impact measured.

- **Format:** 60-second hero video, autoplay-muted-on-loop with manual unmute, lazy-loaded.
- **Production path:** Claude writes script + storyboard → Tyreece records app screen with OBS or Loom (~30 min) → CapCut for assembly with built-in AI voice + free music library (~30 min) → MP4 dropped in `/public/`, embedded by Claude.
- **Estimated cost:** R0 (CapCut + Pixabay music + Claude-generated script).
- **Trigger to start:** After Phase 1 has been live for at least 2 weeks and we have GA data on whether motion sections shifted conversion.

## Open Questions

None blocking. Spec is ready for implementation planning.

## Success Criteria

1. All three motion components render correctly on production at `https://isoguardian.co.za`.
2. Bundle size increase < 35KB gzipped.
3. No new console errors or Lighthouse regressions on the landing page.
4. Reduced-motion preference fully honoured.
5. **Prototype gate passed** for each component — Tyreece visually approved standalone prototype before integration.
6. **Visual Fidelity Requirement met** — animations use real app components, side-by-side screenshot check passed.
7. Tyreece signs off on the integrated build before merge to main.

## Out of Scope

- A/B testing infrastructure to measure conversion lift (would be useful but adds significant complexity — defer).
- Animations on any page other than `LandingPage.jsx`.
- Lottie animations or video assets.
- Sound design.
- Localisation (English only).
