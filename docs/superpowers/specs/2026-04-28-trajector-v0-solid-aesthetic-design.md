# Trajector — v0 Solid-Aesthetic Design Spec

**Status:** Approved (brainstorming phase complete, awaiting plan)
**Date:** 2026-04-28
**Supersedes:** None — `docs/UI_DESIGN.md` is preserved as the historical alternate direction.
**Owner:** Syed Ejaz Ahammed

---

## 1. Purpose

Define a new visual system for Trajector and the v0 product slice it ships with.

The pivot away from `docs/UI_DESIGN.md` is two changes at once:

1. **Aesthetic shift.** Drop gradients, drop violet-as-brand, drop the 5-step score gradient. Land on a flat, near-monochrome dark surface where score color is the *only* color in the UI.
2. **Scope shift.** v0 ships three screens — upload, profile confirmation, results — instead of the full dashboard surface. Kanban, calibration banner, warm-intro card, score gauge, command palette, and light mode are deferred to later phases per `docs/ROADMAP.md`.

Both changes serve the same goal stated in `UI_DESIGN.md`: **"this is under control."** A loud product cannot deliver that feeling.

## 2. Relationship to existing docs

| Doc | Treatment |
|---|---|
| `docs/UI_DESIGN.md` | Preserved as historical alternate. Add a one-line header noting this spec supersedes it. |
| `docs/ARCHITECTURE.md` | No change — system architecture is intact. |
| `docs/ROADMAP.md` | No change — this spec maps onto Phase 0 → Phase 1 cleanly. |
| `docs/COMPARISON.md` | No change. |
| `README.md` | One small wording tweak in the "Beautiful Dashboard" feature: drop "with dark mode" framing (it's now dark-first by default, not a feature). |
| `ui-mockup/index.html` | Becomes the canvas for v0. Existing mockup is rebuilt against the new tokens during implementation. |

## 3. Design principles (refined)

The five principles from `UI_DESIGN.md` carry over with one substitution and one addition:

1. **Calm, not flashy.** *(unchanged)*
2. **Information density without clutter.** *(unchanged)*
3. **Progressive disclosure.** *(unchanged)*
4. **Score is the hero.** *(unchanged in spirit; expression simplified to 3-tier instead of 5-tier)*
5. **Dark-first.** *(was "dark first, light second" — now dark-first, light deferred)*
6. **Color is signal, never decoration.** *(new)* The only chromatic elements in the entire UI are the three score-tier colors. Every other surface, button, border, and text is neutral grayscale plus one stark white accent.

## 4. Visual system

### 4.1 Color tokens (dark, primary)

| Token | Hex | Use |
|---|---|---|
| `bg.canvas` | `#0a0a0a` | Page background |
| `bg.surface` | `#141414` | Cards, inputs |
| `bg.surface-2` | `#1c1c1c` | Hover, elevated rows |
| `border.subtle` | `#262626` | Card borders, dividers |
| `border.strong` | `#404040` | Focused inputs, selected rows |
| `text.primary` | `#fafafa` | Headings, primary copy |
| `text.secondary` | `#a3a3a3` | Body text, labels |
| `text.tertiary` | `#737373` | Captions, metadata, below-threshold rows |
| `accent` | `#ffffff` | Primary CTAs, focus rings, active state |
| `accent.hover` | `#e5e5e5` | Primary CTA hover |

### 4.2 Score-tier colors (the only chromatic elements)

| Tier | Hex | Threshold | Meaning |
|---|---|---|---|
| Strong | `#22c55e` | ≥ 4.5 | Apply this week |
| Decent | `#eab308` | 4.0 – 4.5 | Worth tailoring if slow week |
| Skip | `#525252` | < 4.0 | Below threshold (rendered muted, not red) |

The "skip" tier is deliberately gray rather than red. Red implies "danger / wrong"; skip just means "below your threshold today." Red is reserved for true error states.

### 4.3 Typography

| Use | Font | Weight | Size | Line height |
|---|---|---|---|---|
| H1 | Inter | 600 | 32 | 1.1 |
| H2 | Inter | 600 | 22 | 1.2 |
| H3 | Inter | 600 | 16 | 1.3 |
| Body | Inter | 400 | 14 | 1.55 |
| Caption | Inter | 500 | 12 | 1.4 |
| Mono (scores, IDs, comp) | JetBrains Mono | 500 | 13 | 1.3 |

Self-hosted woff2 only. No Google Fonts ping. The Inter Display weight from `UI_DESIGN.md` is dropped — v0 has no marketing hero that warrants display type.

### 4.4 Geometry & elevation

- **Corner radius:** 6px everywhere (buttons, cards, inputs). One value, no exceptions in v0.
- **Borders:** 1px `border.subtle` for all hierarchy. Hierarchy comes from borders + surface contrast, not from elevation.
- **Shadows:** None in v0. If a surface needs to feel elevated, raise it from `bg.canvas` to `bg.surface` to `bg.surface-2`.
- **Gradients:** Banned. CSS lint rule rejects `linear-gradient` and `radial-gradient` declarations.

### 4.5 Spacing

4 / 8 / 12 / 16 / 24 / 32 / 48 scale. 16px between cards, 24px between sections, 48px between major page regions.

### 4.6 Layout

- 12-column grid, 24px gutters at desktop, 16px at tablet, 8px at mobile.
- Max content width: 720px for v0 (the three screens are all centered single-column). The 1440px max from `UI_DESIGN.md` re-emerges when the dashboard surface ships.

## 5. The three screens

### 5.1 Screen 1 — Upload

**Purpose:** First contact. Establish the local-first thesis without any marketing language.

**Layout:** Centered single column, 480px content width.

```
┌─────────────────────────────────────────────────┐
│  Trajector                                      │
│                                                 │
│      Drop your resume to begin                  │
│      PDF, DOCX, or markdown · stays on your     │
│      machine                                    │
│                                                 │
│      ┌───────────────────────────────┐          │
│      │                               │          │
│      │         Drop here             │          │
│      │       or click to browse      │          │
│      │                               │          │
│      └───────────────────────────────┘          │
│                                                 │
│      No account. No upload to a server.         │
│      Parsed locally, evaluated locally.         │
└─────────────────────────────────────────────────┘
```

**Components:**
- App wordmark in `text.primary`, top-left, 14px Inter 600.
- H1 "Drop your resume to begin", H3 caption underneath in `text.secondary`.
- Drop zone: `bg.surface` background, 1px dashed `border.subtle`. On `dragover`, border becomes solid `border.strong` and surface lifts to `bg.surface-2`.
- Click target falls back to a hidden `<input type="file" accept=".pdf,.docx,.md">`.
- Reassurance copy below in `text.tertiary`, 12px.

**Interactions:**
- File drop or file pick → drop-zone copy is replaced by `Reading your resume…` in `text.secondary`; the dashed border softly pulses at a 1.5s ease-in-out cycle. No spinner glyph. Transition to Screen 2 on parse success.
- Parse failure: copy and border-pulse are replaced inline by the error message ("Couldn't read this file. Try DOCX or markdown."). Drop zone stays, no modal.

### 5.2 Screen 2 — Profile confirmation

**Purpose:** Show what we read, let the user correct it before any scan starts. One light gate.

**Layout:** Centered single column, 640px content width.

```
┌─────────────────────────────────────────────────┐
│  Confirm your profile                           │
│  We read this from your resume. Edit anything   │
│  that's wrong before we start scanning.         │
│                                                 │
│  Target role                                    │
│  ┌─────────────────────────────────────────┐    │
│  │ Senior Backend Engineer                 │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  Level          Comp floor       Location       │
│  ┌──────────┐  ┌──────────────┐  ┌───────────┐  │
│  │ Senior ▾ │  │ $200,000     │  │ Remote ▾  │  │
│  └──────────┘  └──────────────┘  └───────────┘  │
│                                                 │
│  Stack signals                                  │
│  [ Go ×] [ PostgreSQL ×] [ Kubernetes ×]  + Add │
│                                                 │
│  Deal-breakers                                  │
│  [ Crypto ×] [ On-site only ×]            + Add │
│                                                 │
│              [ Start scanning  →  ]             │
└─────────────────────────────────────────────────┘
```

**Components:**

| Field | Type | Notes |
|---|---|---|
| Target role | Text input | Free-form. Inferred from resume + most-recent title. |
| Level | Select | Junior / Mid / Senior / Staff / Principal. Inferred from years of experience + last title. |
| Comp floor | Number input | USD whole-thousands. Inferred from comp data lookup using current role + location. |
| Location | Select | Remote / Hybrid / Specific city. Inferred from current location on resume. |
| Stack signals | Tag chips | Top 5–8 skills extracted. User can remove with `×`, add with inline input. |
| Deal-breakers | Tag chips | Empty by default unless resume mentions specific exclusions. User-driven. |

**Visuals:**
- All inputs are `bg.surface` with 1px `border.subtle`. Focus state is 1px `accent` (white) ring.
- Tag chips: `bg.surface-2` filled, `text.primary`. The `×` is `text.tertiary`, becomes `text.primary` on hover.
- Primary CTA "Start scanning" is the only solid white button on the page. Sits centered below the form. Full width on mobile, 240px on desktop.

**Interactions:**
- Edit any field → diff is tracked locally. On `Start scanning`, the merged profile is written to `config/profile.yml` (matches existing config layout from `README.md`).
- All fields validate inline (no toast). Required fields: Target role, Level, Location.

### 5.3 Screen 3 — Results (live scan + listing)

**Purpose:** Show the work happening, then deliver the matches. Reframe "I have no idea what's out there" into "the system is scanning for you."

**Layout:** Centered single column, 720px content width.

```
┌─────────────────────────────────────────────────┐
│  Trajector                          [profile ▾] │
│                                                 │
│  Scanning the open web                          │
│  ─────────────────────────────────────────      │
│  ✓ LinkedIn          3,421 roles · 12s          │
│  ✓ Greenhouse        1,209 roles · 8s           │
│  ◐ Lever             scanning...                │
│  ○ Workable          queued                     │
│  ○ Y Combinator      queued                     │
│                                                 │
│  ─────────────────────────────────────────      │
│  Strong matches so far · 3                      │
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │ ●  Senior Backend Engineer        4.7    │   │
│  │    Anthropic · Remote · $280k–$405k      │   │
│  │    stack · level · trajectory            │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │ ●  Staff Engineer, Infra          4.5    │   │
│  │    Linear · Remote · $260k–$340k         │   │
│  │    stack · trajectory · growth signal    │   │
│  └──────────────────────────────────────────┘   │
│                                                 │
│  ─────────────────────────────────────────      │
│  Show 12 below threshold ↓                      │
└─────────────────────────────────────────────────┘
```

**Live scan section:**
- Each source is a row: status glyph (`✓` complete, `◐` scanning, `○` queued, `✗` failed), source name, count + duration once complete.
- Status glyphs are pure character + `text.secondary` color. No spinners, no progress bars.
- Once all sources complete, the section collapses to a single one-liner: `Scanned 5 sources · 47 matches · 38s` with a `Show details` link to re-expand.
- A failed source shows in muted `text.tertiary` with `✗ Lever — timed out`. Below the source list, a quiet `Retry failed` link appears if any failed.

**Job card anatomy (kept pristine — no inline reasoning):**

| Element | Spec |
|---|---|
| Score-tier dot | 8px circle, color from §4.2. Leading element on the row. |
| Title | 16px Inter 600, `text.primary`. |
| Company · Location · Comp range | 14px Inter 400, `text.secondary`, `·` separators. |
| Match tags | 12px Inter 500, `text.tertiary`, `·` separators. Max 3 tags. |
| Score | Right-aligned, JetBrains Mono 500 13px, `text.primary`. |
| Card background | `bg.surface` with 1px `border.subtle`. Hover: `bg.surface-2`. |

**Below-threshold rows:**
- Hidden behind `Show 12 below threshold ↓` link in `text.tertiary`.
- When expanded, rows render in `text.tertiary` with the gray skip-tier dot.
- Sort order: score descending across both sections.

**Click on any row → side sheet:**
- Right-anchored, 480px wide, slides in from the right.
- Body shows: full evaluation reasoning per dimension, original posting link, `Generate tailored CV` action.
- Side sheet is the *only* overlay layer. No modals, no nested dialogs (matches existing UI_DESIGN.md interaction rule).
- `Esc` closes the sheet. Body scroll is locked while open.

**Profile dropdown (top-right):**
- Shows the user's name (parsed from resume), `Edit profile` (returns to Screen 2), `Switch resume` (returns to Screen 1), `Settings` (opens Screen 4).

### 5.4 Screen 4 — Settings (minimal)

**Purpose:** Hold the OpenRouter API key, model selection, and source toggles. Functionally required for v0 (the key has to live somewhere) but kept deliberately small.

**LLM gateway: OpenRouter.** v0 routes all model calls through OpenRouter (`https://openrouter.ai/api/v1`). This collapses provider sprawl into a single key + a model dropdown. Changing models is one click — no provider switch, no separate billing, no SDK swap. Direct Anthropic / OpenAI keys are deferred to a later phase if real demand surfaces.

**Layout:** Centered single column, 640px content width, same chrome as Screen 2.

```
┌─────────────────────────────────────────────────┐
│  Settings                              [ Done ] │
│                                                 │
│  OpenRouter API key                             │
│  ┌─────────────────────────────────────────┐    │
│  │ sk-or-v1-••••••••••••••••••••••••••     │    │
│  └─────────────────────────────────────────┘    │
│  Stored locally in config/secrets.yml.          │
│  Get a key at openrouter.ai                     │
│                                                 │
│  Model                                          │
│  ┌─────────────────────────────────────────┐    │
│  │ anthropic/claude-sonnet-4-6           ▾ │    │
│  └─────────────────────────────────────────┘    │
│  Used for resume parsing + job scoring.         │
│  Sonnet 4.6 is the recommended default.         │
│                                                 │
│  Sources                                        │
│  [✓] LinkedIn                                   │
│  [✓] Greenhouse                                 │
│  [✓] Lever                                      │
│  [✓] Workable                                   │
│  [✓] Y Combinator                               │
│                                                 │
│  Trajector v0.1.0 · open the project on GitHub  │
└─────────────────────────────────────────────────┘
```

- API key input is masked. `Show` toggle reveals it.
- Model dropdown is populated from OpenRouter's `/api/v1/models` endpoint at first load, cached locally for 24h. Default selection is `anthropic/claude-sonnet-4-6`.
- Curated short list shown by default (top ~8 models by quality/cost ratio); a `Show all 200+` toggle reveals the full catalog.
- Each model row shows: name, context window, $/1M input, $/1M output. Right-aligned, mono.
- Source toggles are checkbox rows. Disabled sources are skipped on the next scan.
- No save button — changes persist on blur.
- `Done` closes settings and returns to whichever screen the user came from.

## 6. Data flow

```
File picked
   │
   ▼
WASM parser (in-browser)
   │
   ▼
OpenRouter call (user's key, selected model)
   │  → returns { resume.json, profile_inference }
   ▼
Screen 2 (user edits profile_inference)
   │
   ▼
config/profile.yml ← merged profile
data/resume.json
data/cv.<ext>     ← original file copy
   │
   ▼
Scan orchestrator
   │  ├─ source 1 (parallel)
   │  ├─ source 2 (parallel)
   │  ├─ source N (parallel)
   │  ▼
   │  Per-source events stream over local SSE/websocket
   ▼
Screen 3 (renders progress + matches as they arrive)
```

**Key properties:**
- **Local-first.** Nothing leaves the machine except the OpenRouter call (which proxies to whichever provider hosts the selected model — Trajector itself runs no servers).
- **Single LLM gateway.** All model calls go through OpenRouter. No multi-provider SDK matrix in v0. Switching from Sonnet to GPT-4o to Gemini is one dropdown change.
- **No backend.** Source scrapes are direct outbound from the user's machine.
- **Skill modes own the scan.** Each source is an existing or new agent skill (per `docs/ARCHITECTURE.md` skill-mode pattern). The UI is a thin layer over the orchestrator.

## 7. Error & empty states

| Situation | Treatment |
|---|---|
| Parse failure | Inline error in drop zone: "Couldn't read this file. Try DOCX or markdown." Drop zone stays. |
| OpenRouter API key missing/invalid | Single-screen prompt before upload: "Add your OpenRouter API key to continue." Inline link to openrouter.ai. Shown once per session. |
| Required profile field empty | Inline 12px caption in `text.tertiary` below field: "Required." `Start scanning` button stays disabled until valid. |
| Single source fails | `✗ <source> — timed out` row in `text.tertiary`. Other sources continue. `Retry failed` link below the list. |
| All sources fail | Banner above the (empty) results area: "Couldn't reach any sources. Check your connection and retry." `Retry all` button. |
| Zero matches above threshold | Empty state: "Nothing above 4.0/5 today. That's the system working — adjust weights or expand portals if this persists." Plus `Show all <N> below threshold` link. |
| Network drops mid-scan | Completed sources stay; in-flight sources show `✗ — connection lost`. Banner: "Connection lost. Resuming…" with auto-retry on reconnect. |

**Universal rules:**
- Errors live where they happen. No global toast layer in v0.
- No notification dots, no badges, no error count chips.
- Disabled states use `text.tertiary` and reduced surface contrast — never opacity tricks.

## 8. Accessibility

- WCAG AA contrast on all text against both `bg.canvas` and `bg.surface`.
- Score-tier dots are paired with the numeric score *and* match-tag text. Color is never the only signal.
- All interactive elements have a visible focus state (1px `accent` ring with 2px outer offset for spacing).
- Touch targets ≥ 44×44px.
- Full keyboard navigation in v0:
  - `Tab` cycles all interactive elements.
  - `Enter` activates focused element.
  - `Esc` closes side sheet.
  - `↑/↓` moves focus between job rows.
  - `⌘K` is reserved for Phase 1 command palette — not bound in v0.
- Respects `prefers-reduced-motion`: drop-zone hover lift becomes instant.

## 9. Motion

Motion in v0 is minimal and confirmatory:

- Hover state transitions: 100ms ease-out brighten on cards (surface contrast change, no shadow change).
- Side-sheet slide-in: 180ms ease-out from the right.
- Scan-row state changes (`○` → `◐` → `✓`): instant. No spinning glyph.
- Drop-zone parsing pulse: 1.5s ease-in-out cycle on the dashed border opacity (only animation in v0 that loops).
- Page transitions between Screen 1 → 2 → 3: 120ms cross-fade.

Motion exists to confirm cause-effect. If it slows the user down, cut it. `prefers-reduced-motion` collapses every transition above to instant.

## 10. What v0 ships, what's deferred

**v0 ships:**
- Screen 1: Upload
- Screen 2: Profile confirmation
- Screen 3: Results (with live scan + side-sheet detail)
- Screen 4: Settings (minimal — API key, source toggles, version)

**Deferred to later phases (already in `docs/ROADMAP.md`):**

| Surface | Phase | Inheritance notes |
|---|---|---|
| Pipeline kanban (5-column) | Phase 1 | Re-rendered with new tokens, 3-tier scoring |
| Score gauge (12-spoke radial) | Phase 1 | Reduced to 3 colors, line-only spokes (no fills) |
| Calibration banner | Phase 2 | Gradient border replaced with 1px `border.strong` |
| Warm-intro card | Phase 3 | Inherits new tokens directly |
| Command palette (`⌘K`) | Phase 1 | Inherits new tokens |
| Vim-style keyboard chords | Phase 1 | v0 supports basic keyboard nav only |
| Light theme | Phase 2 | Already token-mapped — flipping `bg.canvas` and `accent` is the entire theme |
| Browser extension capture | Phase 2 | Reuses confirm screen for in-extension preview |

**Explicitly out of scope (forever):**
- Auto-submit / one-click apply (`README.md`: "It never auto-submits. That stays sacred.")
- Avatars on jobs ("you're matching, not socializing" — preserved from `UI_DESIGN.md`)
- Marketing hero illustrations
- Onboarding tour, tooltip carousel, empty-state mascot
- Notification badges on idle navigation
- Toast notifications

## 11. Non-functional requirements

- **CSS lint rule:** ban `linear-gradient` and `radial-gradient` declarations. Catches regressions.
- **Color count audit:** any change introducing a 4th hue beyond white / black / green / amber / gray needs explicit review and an entry in this spec.
- **Self-hosted fonts only:** no Google Fonts ping, no CDN font loading.
- **Bundle budget for v0:** target < 200KB gzipped JS, < 50KB CSS. Re-evaluate when WASM parser is added (likely +500KB binary loaded lazily on first upload).

## 12. Open questions for the implementation plan

These are *not* unresolved design questions — they're handoffs to the writing-plans phase:

1. Which WASM resume parser? (`pdf.js` + a DOCX library, vs. a unified `unstructured.io`-style WASM build)
2. Which framework? (`README.md` mentions Next.js for the dashboard — does v0 piggyback on that, or ship as a static SPA?)
3. Source scraper inventory for v0 — minimum viable set: LinkedIn, Greenhouse, Lever, Workable, YC. Later: Ashby, Wellfound, Otta, niche boards.
4. SSE vs. websocket for scan progress events? (SSE is simpler, sufficient for one-way progress updates.)
5. Token-naming strategy: CSS variables (`--bg-canvas`) or a CSS-in-JS theme object? (Existing repo has no preference set yet.)

These are decided in the implementation plan, not here.

---

**Approval:** This spec is approved by the maintainer (Syed Ejaz Ahammed) on 2026-04-28 following the brainstorming session that produced it. Next step: invoke `superpowers:writing-plans` to convert this into an executable implementation plan.
