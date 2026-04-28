# Trajector v0 — SaaS-Grade UI + Extended Profile Design Spec

**Date:** 2026-04-28
**Scope:** Plan 4a (this spec). Plan 4b is referenced where relevant but planned separately after 4a ships.

## 1. Motivation

The current UI is a Linear-minimalist three-screen flow (Upload → Confirm → Results). Functional, but no marketing layer, no first-impression hook, and the candidate profile is sparse enough that LLM scoring is constrained. We need to (1) make Trajector look and feel like a real SaaS product on first visit, and (2) collect the profile data the scoring model actually needs to differentiate between jobs.

Two-phase delivery:
- **Plan 4a (this spec):** Marketing-grade Landing screen, an OnboardingStepper visible across post-landing screens, an extended Profile model with country-aware scoring, and a redesigned Confirm screen with progressive disclosure.
- **Plan 4b (next spec, not in scope here):** Results screen redesign with a 260px filter/profile sidebar.

## 2. Information architecture

```
/  →  Landing
       ├─ Hero (with animated demo preview)
       ├─ TrustBar
       ├─ FeatureGrid
       ├─ HowItWorksStrip
       ├─ FaqAccordion
       └─ Footer
       (drop zone is anchored mid-page; CTA scrolls to it)

/  →  (in-session, after resume upload) collapses Landing to a thin
       "Continue your scan →" banner above the existing flow

AppBar visible on every screen (Landing through Results)
OnboardingStepper visible on every post-Landing screen
  (Upload / Analyzing / Settings / Confirm / Results)

Stepper stops:  1. Resume   2. Profile   3. Scan   4. Results
```

The OnboardingStepper is a state indicator — completed stops are clickable to navigate back; the active stop is a filled white dot.

## 3. Profile data model

The new `Profile` type has 16 fields organized into three sections that map 1:1 to the redesigned Confirm screen.

```typescript
export type Level = 'junior' | 'mid' | 'senior' | 'staff' | 'principal';
export type LocationPref = 'remote' | 'hybrid' | 'onsite' | 'flexible';
export type EmploymentType = 'full-time' | 'contract' | 'part-time';
export type CompanyStage = 'seed' | 'early' | 'growth' | 'public';
export type CompanySize = 'startup' | 'mid' | 'large' | 'enterprise';
export type EquityImportance = 'dealbreaker' | 'important' | 'nice' | 'irrelevant';
export type JobSearchStatus = 'active' | 'open' | 'passive';

export interface Profile {
  // Essentials
  targetRole: string;
  level: Level;
  yearsOfExperience: number | null;
  stackSignals: string[];
  employmentTypes: EmploymentType[];

  // Logistics
  compFloor: number | null;
  locationPreference: LocationPref;
  country: string | null;
  preferredLocations: string[];
  requiresSponsorship: boolean;
  dealBreakers: string[];

  // Preferences
  companyStages: CompanyStage[];
  companySize: CompanySize | null;
  equityImportance: EquityImportance | null;
  industriesToExclude: string[];
  jobSearchStatus: JobSearchStatus | null;
}
```

**Field rationale (only the new ones):**

| Field | Why |
|---|---|
| `yearsOfExperience` | Hard filter: jobs requiring 8+ vs 2+ score radically differently |
| `employmentTypes` | Contract-only candidates score perm-only roles low and vice versa |
| `country` | Cuts jobs not available in candidate's country; LLM tunes locales |
| `preferredLocations` | Required when `locationPreference !== 'remote'`; prevents scoring NYC-hybrid roles for an Austin candidate |
| `requiresSponsorship` | Disqualifies postings that explicitly exclude sponsorship-needing candidates |
| `companyStages` | Seed-stage roles score down for someone targeting "public/growth only" |
| `companySize` | Culture proxy — startup vs enterprise |
| `equityImportance` | Separates startup-seekers from cash-comp-maximizers without free text |
| `industriesToExclude` | Filters whole verticals (gambling, defense, etc.) |
| `jobSearchStatus` | Tunes urgency weighting in the LLM prompt |

**Cut deliberately:**
- `targetRoles[]` (multi-select) — added migration cost without scoring win for v0
- Perks priorities — no job posting reliably encodes them
- Open to relocation — subsumed by `preferredLocations`
- Commute radius — meaningless for a remote-first scanner
- Bio — no scoring impact in a doc-match model

**LLM integration:**
- `extractProfile` prompt updated to fill every new field where inferable from resume; non-inferable fields default (e.g. `requiresSponsorship: false`, `companyStages: []`).
- `scanJobs` prompt updated to (a) generate jobs available in the candidate's `country` (or remote-global), (b) honor `requiresSponsorship`, (c) score-weight `companyStages`, `companySize`, `equityImportance`, `industriesToExclude`.

## 4. Landing screen

The user lands here on cold visit. Anchored sections from top to bottom:

### 4.1 AppBar (sticky)
- Brand mark (Trajector wordmark, 18px), left
- Nav: "Product" (scrolls to FeatureGrid), "How it works" (scrolls to HowItWorksStrip), "FAQ", "GitHub" (external link, opens new tab)
- Right: "Drop your resume" CTA pill (scrolls to drop zone)

### 4.2 Hero
- Eyebrow: "Open-source, local-first"
- Headline (h1, 48px): "Find the few jobs worth your time."
- Sub (body, 18px, muted): "Drop your resume. We'll synthesize a candidate profile, score live postings against it, and rank what's actually a fit. Your resume and your API key never leave your browser."
- Dual CTA: primary "Drop your resume" + secondary "See an example scan"
- Right side: animated demo preview (4.6 below)
- Layout: 2-column, 60/40 split. Stacks on narrow viewports.

### 4.3 Demo preview component (the "attract at a glance" lever)

Shows a canned scan result without the user uploading anything. Pre-rendered with the existing `JobCard` and `ScoreDot` components.

Composition:
- Mock profile mini-card on top (role: "Senior Backend Engineer · senior · US · remote")
- 3 mock JobCards rendered with the same styling as Results (one strong, two decent)
- "+ 12 more matches" subtle footer

The demo data is a constant in `src/lib/demoScan.ts`. Static rendering — no animation initially. Hover on a card opens the standard SideSheet with the mock job's description and scoreReason. This makes the demo feel like the actual product.

### 4.4 TrustBar
Single line under the Hero, full-width:
"🔒 Your resume and your OpenRouter key never leave your browser. No accounts, no servers, no telemetry."
(emoji is the only one in the entire UI; matches the privacy-first spirit and breaks visual monotony)

### 4.5 FeatureGrid
Three cards in a row, each:
- Score-color accent bar (top, 3px) — strong / decent / skip — to make the design system legible at a glance
- Headline + body
- Cards:
  1. **strong** — "Triage by tier" / "Strong, decent, skip — color-coded so you skim past the noise."
  2. **decent** — "Profile that actually matters" / "Stack, comp floor, country, sponsorship, equity tolerance — fields that actually move the score."
  3. **skip** — "BYO model" / "Use your OpenRouter key with Claude, GPT, Gemini, Llama. Switch any time."

### 4.6 HowItWorksStrip
Horizontal numbered list, 4 steps mirroring the Stepper:
1. Drop your resume (PDF/DOCX/MD)
2. Confirm your profile
3. Scan enabled sources
4. Triage matches

Each step has a small icon (CSS-only — circle with the step number) and a one-line caption.

### 4.7 FaqAccordion
5 entries:
1. Where does my data go? → "Nowhere. Resume parsing, LLM calls, and storage all happen in your browser."
2. Why do I need an OpenRouter key? → "Trajector calls an LLM to score jobs. OpenRouter is a cheap multi-model gateway — bring your own key, you control the spend."
3. Are these real job postings? → "v0 synthesizes plausible postings from your profile to demo the scoring system end-to-end. Real-source ingestion is on the roadmap."
4. What does it cost? → "Free. You pay OpenRouter directly for whatever model you pick. Sonnet 4.6 ≈ $0.01 per scan."
5. Open source? → "MIT-licensed. [Star the repo on GitHub.](https://github.com/ahammedejaz/trajector)"

### 4.8 Footer
Minimal, single row:
- Left: "Trajector v0.1 · MIT"
- Right: GitHub link, "Built by Syed Ejaz Ahammed"

### 4.9 Drop zone
The existing drop zone moves into a section anchored under the FeatureGrid (so all CTA scrolls land near it). Visual treatment unchanged from current Upload screen — same component, same parsing flow.

### 4.10 Returning-session collapse
If `localStorage` indicates a Profile was extracted in a prior session OR the in-memory state has a parsed resume, the entire Landing collapses to a thin banner: "Continue your scan →" with a button that takes the user directly to the active screen. They can dismiss the banner with × to see the full Landing.

## 5. Confirm screen redesign

The redesign keeps the existing form-driven model but reorganizes around the three-section profile structure.

### 5.1 Layout

```
┌────────────────────────────────────────┐
│ Stepper                                │
├────────────────────────────────────────┤
│ Confirm your profile                   │
│ We read this from your resume…         │
│                                        │
│ ▼ Essentials                           │
│   [target role input]                  │
│   [level segmented]                    │
│   [years exp input]                    │
│   [stack chips]                        │
│   [employment types pills]             │
│                                        │
│ ▶ Logistics  3 fields filled · 2 to go │
│                                        │
│ ▶ Preferences  optional                │
│                                        │
│ [Save profile only]  [Start scanning →]│
└────────────────────────────────────────┘
```

Each section is a `Disclosure` component (collapsible). Essentials defaults open; Logistics and Preferences default collapsed but show a status string (`{n} filled · {m} to go` or `optional` for Preferences).

### 5.2 Field controls

| Field | Control |
|---|---|
| targetRole | text input |
| level | Segmented (5 options) |
| yearsOfExperience | number input, 0–40, with placeholder "7" |
| stackSignals | TagChips (existing) |
| employmentTypes | MultiPill (3 options) |
| compFloor | number input with $ prefix |
| locationPreference | Segmented (4 options including new `flexible`) |
| country | Searchable input (CountrySelect, autocomplete from curated list of ~80 countries) |
| preferredLocations | TagChips, only renders when `locationPreference !== 'remote'` |
| requiresSponsorship | Toggle, with caption "Show jobs that explicitly accept sponsorship-needing candidates." |
| dealBreakers | TagChips |
| companyStages | MultiPill (4 options) |
| companySize | Segmented (4 options + "Any") |
| equityImportance | Segmented (4 options + "—") |
| industriesToExclude | TagChips |
| jobSearchStatus | Segmented (3 options) |

### 5.3 AI-extracted badge
Each field that the LLM populated shows a subtle "AI" pill next to its label (uppercase, 9px, `--text-tertiary`). The pill disappears once the user edits the field.

Implementation: Confirm receives the originally extracted profile via prop. It computes `inferredFields: Set<keyof Profile>` from the prop on mount (a field is "inferred" iff it has a non-default value: non-empty string, non-empty array, non-null number/boolean). It tracks `touched: Set<keyof Profile>` in `useState`, adding to it on every field's `onChange`. Render the pill iff `inferredFields.has(k) && !touched.has(k)`.

### 5.4 CTAs
- **Primary:** "Start scanning →" — disabled until `targetRole.trim()` is non-empty
- **Secondary:** "Save profile only" — persists the profile to localStorage under key `trajector_profile` (a new storage layer added alongside the existing `trajector_settings`), then a green "Saved" status appears next to the button for 2 seconds before navigating back to Landing. No toast/snackbar component.

The new `src/lib/profileStore.ts` exports `loadProfile(): Profile | null` and `saveProfile(p: Profile): void`. The Landing's "Continue your scan" banner check (§4.10) reads from this store.

### 5.5 Validation
Same as today — `targetRole` is required. All other fields can be empty/null and the scan still runs (the LLM falls back to weaker scoring without them).

## 6. OnboardingStepper

Horizontal component rendered above the screen content on every post-Landing screen (Upload, Analyzing, Settings, Confirm, Results).

```
●━━━●━━━○━━━○
1   2   3   4
Resume Profile Scan Results
```

- Filled white dot for completed/active steps; outline dot for upcoming
- Active step's label is `--text-primary`; inactive is `--text-secondary`
- Connector lines turn from `--border-subtle` to `--accent` as steps complete
- Completed steps are `<button>`s that navigate back; upcoming steps are inert spans
- Reduced-motion: no transitions, just instant state swaps

State derivation (driven by App state passed as props):
- Resume: completed when `resume !== null`
- Profile: completed when `profile !== null`
- Scan: active when `screen === 'analyzing'` OR (screen === 'results' AND scan in progress)
- Results: active when `screen === 'results'` AND scan finished AND no error

Active screen overrides "completed" when the screen maps to an earlier step (e.g. on Confirm screen, Profile is the active step even if `profile !== null`).

## 7. Component additions

| Component | File | Purpose |
|---|---|---|
| AppBar | `src/components/AppBar/` | Sticky top bar — brand + nav + CTA |
| OnboardingStepper | `src/components/OnboardingStepper/` | 4-step indicator |
| Hero | `src/components/Hero/` | Landing top section |
| TrustBar | `src/components/TrustBar/` | Single-line trust statement |
| FeatureGrid | `src/components/FeatureGrid/` + nested `FeatureCard` | 3-column feature row |
| HowItWorksStrip | `src/components/HowItWorksStrip/` | Numbered horizontal list |
| FaqAccordion | `src/components/FaqAccordion/` + nested `FaqItem` | Collapsible Q&A |
| Footer | `src/components/Footer/` | Minimal footer |
| DemoPreview | `src/components/DemoPreview/` | Static rendered sample scan |
| Segmented | `src/components/Segmented/` | Segmented control (radio group, pill style) |
| Toggle | `src/components/Toggle/` | Boolean switch |
| MultiPill | `src/components/MultiPill/` | Multi-select pill group |
| Disclosure | `src/components/Disclosure/` | Collapsible section with caret |
| CountrySelect | `src/components/CountrySelect/` | Search-autocomplete country input |

## 8. Demo data (`src/lib/demoScan.ts`)

```typescript
export const DEMO_PROFILE = {
  targetRole: 'Senior Backend Engineer',
  level: 'senior',
  yearsOfExperience: 7,
  country: 'United States',
  locationPreference: 'remote',
  // ...
};

export const DEMO_JOBS: ScoredJob[] = [
  /* 5 jobs: 1 strong (94), 2 decent (72, 65), 2 skip (45, 30) */
];
```

5 jobs is enough to show all three tiers in action and have one of each color visible on the Landing.

## 9. App routing changes

Today: `screen` state machine with `'upload' | 'analyzing' | 'settings' | 'confirm' | 'results'`.

After 4a:
- Add `'landing'` as a new initial screen.
- Default `screen = 'landing'`. The Drop zone is now part of Landing's section flow; uploading on Landing transitions to `'analyzing'` directly without a separate `'upload'` screen.
- Keep `'upload'` as an explicit fallback state for when the user navigates back from Confirm via Stepper or Switch resume.
- Add `'demo'` view? — no. Demo is rendered inline on Landing. No separate screen.

```typescript
export type Screen = 'landing' | 'upload' | 'analyzing' | 'settings' | 'confirm' | 'results';
```

The `'upload'` screen stays as today (cleaner navigation surface for "Switch resume" from ProfileMenu).

## 10. Visual / motion language

- All existing tokens reused; no new colors. Score colors remain the only chromatic accents.
- New keyframes: `fade-in`, `slide-up-fade-in` (for Disclosure expand), `pulse-dot` (Stepper active dot).
- All animations honor `prefers-reduced-motion`.
- No gradients (still). No images. Iconography is CSS-only — circles, chevrons, dots.

## 11. Accessibility

- AppBar nav links have visible focus rings.
- Stepper completed steps are buttons; current step has `aria-current="step"`.
- Disclosure uses `aria-expanded`. Caret rotates via CSS.
- CountrySelect: combobox role, `aria-autocomplete="list"`, keyboard-navigable list.
- All form fields have associated labels (existing pattern).
- FAQ uses `<details>`/`<summary>` for free a11y, OR custom buttons with `aria-controls`. Decision: `<details>` for simplicity.

## 12. Testing strategy

- **Unit/component:** Vitest + RTL for every new component (rendering, prop variants, callback firing). Existing Profile-consuming code (`extractProfile`, `scanJobs`) gets updated tests for the new fields.
- **E2E:** Playwright covers (a) cold landing → upload → confirm → results path with new fields, (b) "Save profile only" button persists to localStorage, (c) demo preview renders without LLM call, (d) returning-session banner appears when localStorage has a profile.

## 13. Out of scope

Deferred to Plan 4b:
- Results sidebar (260px) with filters
- Tier / source / min-score filtering
- ProfileSummary mini-card
- "New scan" button placement

Deferred indefinitely (cut):
- Saved searches
- Multi-target-role
- Perks priorities, relocation flag, commute radius, bio
- Real source ingestion
