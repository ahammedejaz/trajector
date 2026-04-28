# Trajector — UI Design System

The UI's job is to make a calm, premium product out of an inherently anxious task (job search).

Every visual decision is in service of one feeling: **"this is under control."**

---

## Design principles

1. **Calm, not flashy.** Job search is stressful enough. The UI never adds noise — no animations on idle, no notification dots, no red badges screaming for attention.
2. **Information density without clutter.** Power users will look at this for hours. Whitespace generous, type hierarchy strict, color used sparingly.
3. **Progressive disclosure.** Default view shows only what matters; click in for the full evaluation breakdown.
4. **Score is the hero.** Every job card is anchored on its 1–5 score and the reasoning behind it.
5. **Dark first, light second.** Defaults to dark mode (target audience is engineers/PMs/designers). Light mode is fully supported.

---

## Color palette

### Dark theme (primary)

| Token | Hex | Use |
|---|---|---|
| `bg.canvas` | `#0a0a0f` | Page background |
| `bg.surface` | `#13131a` | Card surface |
| `bg.surface-2` | `#1c1c26` | Hover / elevated |
| `bg.surface-3` | `#262631` | Active / pressed |
| `border.subtle` | `#26262e` | Card borders |
| `border.strong` | `#3a3a45` | Focused inputs |
| `text.primary` | `#f4f4f5` | Headings, primary copy |
| `text.secondary` | `#a1a1aa` | Body text, labels |
| `text.tertiary` | `#71717a` | Captions, metadata |
| `accent.primary` | `#8b5cf6` | Brand violet |
| `accent.gradient` | `linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)` | Hero CTAs |

### Light theme

| Token | Hex |
|---|---|
| `bg.canvas` | `#fafafa` |
| `bg.surface` | `#ffffff` |
| `bg.surface-2` | `#f4f4f5` |
| `border.subtle` | `#e4e4e7` |
| `text.primary` | `#09090b` |
| `text.secondary` | `#52525b` |

### Score colors

The score gradient is the most visible color decision in the product. Used on score chips, gauge fills, sort arrows.

| Score range | Color | Hex | Meaning |
|---|---|---|---|
| 4.5–5.0 | Emerald | `#10b981` | Strong recommend — apply this week |
| 4.0–4.5 | Lime | `#84cc16` | Solid match — worth tailoring |
| 3.5–4.0 | Amber | `#f59e0b` | Borderline — only if slow week |
| 3.0–3.5 | Orange | `#f97316` | Probably skip |
| < 3.0 | Rose | `#f43f5e` | Hidden by default |

---

## Typography

| Use | Font | Weight | Size | Line height |
|---|---|---|---|---|
| Display (hero) | Inter Display | 600 | 48–64 | 1.05 |
| H1 | Inter | 600 | 32 | 1.1 |
| H2 | Inter | 600 | 22 | 1.2 |
| H3 | Inter | 600 | 16 | 1.3 |
| Body | Inter | 400 | 14 | 1.55 |
| Caption | Inter | 500 | 12 | 1.4 |
| Mono (scores, IDs) | JetBrains Mono | 500 | 13 | 1.3 |

Font loading: self-hosted woff2, no Google Fonts ping. Variable font preferred.

---

## Layout grid

- 12-column grid, 24px gutters at desktop, 16px at tablet, 8px at mobile.
- Max content width: 1440px.
- Sidebar: 240px collapsed → 64px icon-only.
- Card spacing: 16px between cards, 24px between sections.

---

## Components

### Job card (the core component)

```
┌──────────────────────────────────────────────────┐
│  [Co. logo]  Senior ML Engineer                  │
│              Anthropic · Remote · $280k–$405k    │
│                                                  │
│  ┌─── 4.7 ───┐  Match: stack · level · trajectory│
│  │  ●●●●●○   │  Risk:  none flagged              │
│  └───────────┘                                   │
│                                                  │
│  3 connections at Anthropic · 1 ex-employee     │
│                                                  │
│  [ View ]  [ Generate CV ]  [ Mark applied ]    │
└──────────────────────────────────────────────────┘
```

Anatomy:
- 64×64 company logo, rounded-md, fallback to monogram chip.
- Title in `text.primary`, company / location / comp in `text.secondary`.
- Score chip: large, color-coded, 5-dot fill. The single loudest element on the card.
- Match tags: positive dimensions only (max 3).
- Risk line: red flags only — silent if none.
- Warm-intro line: only shown when count > 0.
- Actions: ghost buttons; primary action depends on pipeline stage.

### Score gauge (detail view)

A 12-spoke radial chart, one spoke per dimension. Each spoke length = dimension score, color = score range. Center shows weighted total.

Hover a spoke → tooltip with reasoning text from the LLM evaluator.

### Pipeline kanban

Five columns: `Shortlist → Tailoring → Applied → Interviewing → Closed`.

`Closed` further splits into `Offer | Rejected | Withdrew | Ghosted` via tab control.

Drag-and-drop emits an outcome event into `data/outcomes.jsonl`. **The drag is the data.**

### Calibration banner

Appears once user has 30+ outcome events:

```
┌────────────────────────────────────────────────────────┐
│  ✦ Ready to recalibrate                                │
│  We have 34 outcomes to learn from. Re-fitting your    │
│  scoring weights will take ~10s and you'll see         │
│  exactly what changed.                                 │
│  [ Recalibrate ]  [ Show what changed first ]          │
└────────────────────────────────────────────────────────┘
```

Premium violet gradient border. Non-dismissible until run or snoozed.

### Warm-intro card

Appears in the job detail view:

```
┌────────────────────────────────────────────────────────┐
│  Warm intros at Anthropic                              │
│  ────────────────────────────────────────              │
│  Jane Doe — Engineering Manager, ML                   │
│    Connected since Aug 2024 · likely team             │
│    [ Draft message ]                                   │
│                                                        │
│  Marcus Chen — ex-Senior Eng (left 4 mo ago)          │
│    Strong intel signal — they will talk               │
│    [ Draft message ]                                   │
└────────────────────────────────────────────────────────┘
```

---

## Interaction patterns

- **Keyboard-first.** `j/k` to move between jobs, `e` to evaluate, `g` then `p` for pipeline (Vim-style chords). Power-user mode.
- **Command palette** (`⌘K`). Search across jobs, companies, modes, settings. Same shortcut as Linear/Vercel/Raycast — the audience expects it.
- **Optimistic UI.** Drag-to-pipeline, mark-applied — instant feedback, sync to disk in background.
- **No modals over modals.** One layer of overlay max. Use side sheets for detail, not stacked dialogs.

---

## Empty states

Empty states are an opportunity, not a failure. Each one explains the next concrete action:

| State | Message |
|---|---|
| No jobs scanned yet | "Drop a JD URL into the search bar, or run `npm run scan`." |
| No outcomes recorded | "After you mark 30 jobs as rejected/interview/offer, we'll re-fit your scoring weights to your real signal." |
| No LinkedIn export | "Upload your LinkedIn `Connections.csv` to surface warm intros for every shortlisted role. [How to export →]" |
| No high-fit jobs | "Nothing above 4.0/5 today. That's the system working — adjust weights or expand portals if this persists." |

---

## Accessibility

- Color is never the only signal. Score chips include a numeric value and dot-fill pattern.
- All interactive elements have visible focus states (2px violet ring).
- Targets ≥ 44×44px on touch.
- WCAG AA contrast on all text. AAA on body copy in light mode.
- Full keyboard navigation. Tested with screen readers.
- Respects `prefers-reduced-motion`.

---

## Motion

- Hover: 100ms ease-out brighten.
- Card lift: 2px translate-y, 8px shadow expand, 150ms.
- Score reveal on first load: spoke draw 600ms, staggered 30ms.
- Page transitions: 120ms fade-through. Nothing slower than 200ms.

Motion exists to confirm cause-effect, not to entertain. If it slows the user down, cut it.

---

## What we explicitly avoid

- 🚫 Skeumorphic recruiter dashboards (this isn't a CRM)
- 🚫 Game-y "level up your career" gradients
- 🚫 Notification badges on idle navigation
- 🚫 Toast spam ("Applied!" "Saved!" "Generated!")
- 🚫 Marketing-style hero illustrations
- 🚫 Avatars on jobs (you're matching, not socializing)
