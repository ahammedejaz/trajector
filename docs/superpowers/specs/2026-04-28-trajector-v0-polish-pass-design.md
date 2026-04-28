# Trajector v0 — Plan 5: Polish Pass Design Spec

**Date:** 2026-04-28
**Goal:** Push the UI from "minimal Linear-style" to "professional SaaS product" while strictly preserving the existing brand discipline — no gradients, no new color tokens, score colors remain the only chromatic accents.

## 1. Constraints (locked by user)

- **No gradients.** Anywhere. The stylelint rule stays in place. Polish must come from non-gradient techniques.
- **No new accent color.** White stays the single accent on dark canvas. Score colors (strong / decent / skip) remain the only chromatic accents.
- **Build all proposed sections.** No scope cutting in this iteration.

## 2. Where polish comes from (without gradients or new color)

| Technique | What it gives us |
|---|---|
| Display typography scale (72px / 90px) | Hero gravitas; visual anchor |
| Multi-layered `box-shadow` (3-stop) | Apparent depth, floating cards |
| SVG dot-grid backgrounds | Texture, atmospheric weight |
| New `--bg-elevated` surface tone | Card hierarchy without new colors |
| Recurring score-color dots as decorative motifs | Brand consistency, visual rhythm |
| Custom geometric logo mark (CSS, no image) | Brand identity beyond a wordmark |
| Density: 5 new landing sections | Substance and credibility |
| Subtle entrance/hover motion | Liveliness without distraction |
| Stronger letter-spacing on headlines | Magazine-grade typography |

## 3. New design tokens

Add to `src/theme.css`:

```css
/* Surface depth — one new tone above bg-surface-2 */
--bg-elevated: #242424;

/* Display typography — for marketing hero */
--font-size-display: 72px;
--font-size-display-xl: 90px;

/* Letter-spacing scale */
--tracking-tight: -0.02em;
--tracking-tighter: -0.03em;
--tracking-display: -0.04em;

/* Shadow scale — three depth steps, all neutral black */
--shadow-sm: 0 1px 2px rgb(0 0 0 / 30%);
--shadow-md: 0 4px 16px rgb(0 0 0 / 40%);
--shadow-lg: 0 16px 48px rgb(0 0 0 / 50%);
--shadow-glow: 0 0 0 1px var(--border-strong), 0 8px 32px rgb(0 0 0 / 50%);
```

That's the full token addition. No gradients, no new colors. `box-shadow` uses neutral black only (existing pattern).

## 4. Brand: Logo component

Replace the AppBar's `Trajector` text-only mark with a paired logo: a 20px geometric mark (rotated square + dot, made from solid CSS) followed by the wordmark.

```
┌─┐ Trajector
│●│
└─┘
```

The mark's dot uses `--score-strong` — recurring brand motif. Mark + wordmark scale together.

## 5. Hero v2

- 72px headline, `--tracking-display` letter-spacing
- Subhead bumped to 20px from 18px
- New eyebrow style: small score-strong dot + uppercase label ("OPEN-SOURCE · LOCAL-FIRST · FREE")
- SVG dot-grid background (32px grid, 1px dots at `--text-tertiary` 10% opacity)
- 3 decorative score-color dots (strong, decent, skip) floating in the right side at varying sizes (8px, 14px, 6px) with `--shadow-glow` and absolute positioning — recurring motif
- DemoPreview reframed inside a `--bg-elevated` card with `--shadow-lg`
- Subtle entrance animation: opacity-fade + 8px translateY on scroll-in (only fires once)

## 6. New landing sections

Five new sections, ordered for narrative flow.

### 6.1 StatsRow (after TrustBar)

A horizontal strip of 4 KPIs with big numbers and short labels. Numbers use the mono font.

| Number | Label |
|---|---|
| `15` | jobs scored per scan |
| `~$0.01` | cost per scan with Sonnet |
| `8s` | average scan time |
| `0` | servers, accounts, or data shared |

Layout: 4-col grid. Each KPI: number (32px mono) + label (caption secondary). Border between cells. No icons.

### 6.2 HowItScores (after FeatureGrid)

Algorithm explainer. Shows the four weighted factors the LLM uses to score a job, visualized as horizontal bars.

```
Stack alignment           ███████████░░░░  high weight
Comp ≥ floor              ████████░░░░░░░  medium-high
Location / country fit    ██████░░░░░░░░░  medium
Stage / size / equity     ████░░░░░░░░░░░  low
```

Bars use `--bg-surface-2` for filled portion, `--bg-canvas` for empty. Score-strong dot beside each label. Single column, max-width 720px.

### 6.3 ComparisonTable (after HowItScores)

Three-column comparison: Trajector vs Spreadsheet vs Job boards. Rows like "matches scored automatically", "honors compFloor / dealBreakers", "data stays local", "free at zero scale". Cells use ✓ / ✗ glyphs (already in the system from SourceRow).

| | Trajector | Manual spreadsheet | Job boards |
|---|---|---|---|
| Auto-scored matches | ✓ | ✗ | ✗ |
| Honors comp floor | ✓ | manual | ✗ |
| Honors dealBreakers | ✓ | manual | ✗ |
| Data stays in browser | ✓ | ✓ | ✗ |
| Cost at zero use | $0 | $0 | ad-funded |

### 6.4 UseCases (after ComparisonTable)

Three persona cards in a row. Each card has a persona avatar (solid score-color circle, no image), a one-line title, a 2-3 sentence scenario.

1. **Senior IC, mid-job-search.** "I have a job. I'd take a great offer. I open Trajector once a month, scan, glance at strong matches, ignore the rest."
2. **Active job seeker, picky.** "I'm out. I have a list of dealBreakers. I want the LLM to filter the noise so I can spend Saturday on cover letters, not searches."
3. **Career changer, exploring.** "I want to test what 'senior backend' means in different stages. I run scans with different profiles and compare."

Cards use `--bg-elevated` surface, `--shadow-md`, padded.

### 6.5 LocalFirstDiagram (between FAQ and Footer)

Pure-CSS diagram showing the data flow:

```
   ┌─────────────┐                    ┌──────────────────┐
   │  Your       │   resume parsing   │                  │
   │  browser    │───── all here ─────│   OpenRouter     │
   │             │                    │   (your key)     │
   │  • parse    │   one HTTPS call   │                  │
   │  • profile  │── job scoring ────▶│  Anthropic /     │
   │  • score    │                    │  OpenAI / etc.   │
   │  • render   │                    │                  │
   └─────────────┘                    └──────────────────┘

           No Trajector servers. Ever.
```

CSS-only. Two boxes with `--bg-elevated` background, `--shadow-md`, monospace inner text. Connecting "lines" are `::before`/`::after` pseudo-elements. Caption below.

## 7. FeatureGrid v2 — 6 features

Today's 3-card grid expands to 6 (3×2 grid):

1. **Triage by tier** (existing, score-strong accent)
2. **Profile that actually matters** (existing, score-decent accent)
3. **BYO model** (existing, score-skip accent)
4. **Country-aware scoring** (NEW, score-strong accent — "Only see jobs you can actually take, in your country or fully remote.")
5. **Sponsorship-respectful** (NEW, score-decent accent — "Mark sponsorship needs once. Postings that exclude you score lower automatically.")
6. **Open-source, MIT** (NEW, score-skip accent — "Read the code, fork it, run it locally. No black box, no lock-in.")

Each card gains a small CSS-art icon at top-left (8px square or circle in score color). Card hovers lift via box-shadow swap.

## 8. AppBar polish

- Replace text wordmark with `<Logo />` component
- Hover state on nav links: subtle background pill (`--bg-surface` with 4px radius)
- "Drop your resume" CTA on Landing gets a small score-strong dot prefix

## 9. DemoPreview polish

- Wrap in `--bg-elevated` card with `--shadow-lg`
- Add subtle scale-on-hover (1.005) to the whole card
- Replace static "Live preview" eyebrow with a small recording-dot animation (pulsing score-strong dot)
- Add a faint ambient layer behind the card: 600px×400px solid `--bg-elevated` with `--shadow-lg` and 20% opacity, offset 16px down-right

## 10. Footer v2

Expand from the current single row to 3 columns:
- **Product:** How it works, FAQ, Roadmap (link disabled for v0)
- **Code:** GitHub, Issues, Contributing
- **About:** MIT License, Built by Syed Ejaz Ahammed, Inspired by ___

Keep the bottom strip with version + license.

## 11. Confirm screen polish

- Add a small dot-grid background pattern on the page (very faint, 32px grid)
- Disclosure section headers gain a tiny score-color dot when the section has any AI-extracted fields
- "Save profile only" / "Start scanning" CTA row gets a top divider

## 12. Results screen polish

- Scan progress visualization: replace the static pulse with a "radar sweep" effect — a single thin line that travels across the SourceRow row width over 1.5s and loops, faintly. (CSS-only, simple keyframe — no SVG.)
- Group section headers (`Strong matches (4)`) gain a subtle `--shadow-sm` separator
- Empty state ("No matches yet") gets a small CSS-art illustration (3 dots arranged in a downward arc, in score-skip)

## 13. Typography polish across the app

- Apply `--tracking-tight` (-0.02em) to all `--font-size-h1` / `--font-size-h2` headings
- Apply `--tracking-tighter` (-0.03em) to anything using `--font-size-display` / `--font-size-display-xl`
- Optical sizing via `font-variant-emoji: text` and `font-feature-settings: 'ss01'` where the body font supports them (browser default Inter / system stack does)

## 14. New components

| Component | Purpose |
|---|---|
| `Logo` | Geometric mark + wordmark, used in AppBar + Footer |
| `StatsRow` | 4-cell KPI strip on Landing |
| `HowItScores` | 4 weighted-factor bars, algorithm explainer |
| `ComparisonTable` | 3-col matrix vs alternatives |
| `UseCases` | 3-persona card row |
| `LocalFirstDiagram` | CSS-only data-flow diagram |
| `DotGrid` | Reusable SVG dot-grid background, configurable density |

7 new components.

## 15. Modified components

`AppBar`, `Hero`, `FeatureGrid`, `DemoPreview`, `Footer`, `Confirm`, `Results`, `SourceRow` (radar animation), `theme.css` (new tokens).

## 16. Out of scope

- No new color tokens
- No gradients of any kind
- No animated SVG illustrations (CSS-only motion)
- No font swap (keep system stack / Inter)
- No imagery beyond CSS art

## 17. Risks

- **Stylelint may flag the new shadow tokens.** Plan: verify after first commit; should be fine since they use `rgb(... / %)` syntax (existing pattern).
- **Landing length.** Adding 5 sections roughly doubles the page length. The narrative flow needs to feel intentional, not bloated. Section ordering: Hero → TrustBar → StatsRow → FeatureGrid → HowItScores → HowItWorksStrip → ComparisonTable → UseCases → DropZone → FaqAccordion → LocalFirstDiagram → Footer. 12 sections total.
- **Performance.** SVG dot grids and box-shadow heavy layout — keep grids inline-SVG (no images), use `will-change` sparingly.

## 18. Test strategy

- New components each get unit/component tests (rendering, prop variants, callbacks).
- Existing component tests stay green; modified components (AppBar, Hero, FeatureGrid, Footer, Confirm, Results, SourceRow) get test updates only if their public API changes.
- E2E adds one assertion that the new sections render (scoped to landing.spec.ts).

## 19. Tasks (preview — full plan in `docs/superpowers/plans/`)

1. Theme token additions
2. Logo component
3. DotGrid component (SVG background)
4. StatsRow component
5. HowItScores component
6. ComparisonTable component
7. UseCases component
8. LocalFirstDiagram component
9. AppBar polish (Logo + hover pills)
10. Hero v2 (typography + dot-grid + decorative dots + entrance motion)
11. FeatureGrid v2 (6 cards with icons)
12. DemoPreview polish (elevated card + ambient layer)
13. Footer v2 (3-column expansion)
14. Confirm + Results polish (dot-grid, radar sweep, separators)
15. Landing assembly (compose new section order)
16. E2E + verification + push PR

16 tasks. Single PR.
