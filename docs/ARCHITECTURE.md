# Trajector — Architecture

## Design principles

1. **Local-first.** Every byte of user data — CV, evaluations, tracker, connections graph — lives on the user's machine. No mandatory cloud account.
2. **Agentic, not chat.** Skill modes are markdown prompts loaded by an AI CLI (Claude Code, Gemini CLI, OpenCode). Each skill is a specialist for one job.
3. **Filter, never spray.** The system refuses to auto-submit. Below-threshold roles never reach the inbox.
4. **Calibrated, not vibes-based.** Scoring weights re-fit from real outcomes the user reports.
5. **Universal capture.** A JD on any URL should reach the pipeline with one action.
6. **Composable.** CLI / TUI / web dashboard share the same on-disk data contract.

---

## High-level system

```
┌────────────────────── Capture Layer ──────────────────────┐
│  Browser ext.   Portal scanner   Saved-search ingest      │
└─────────────────────────┬─────────────────────────────────┘
                          ▼
                   data/jds/*.json   (raw JDs, normalized)
                          │
┌────────────────── Intelligence Layer ─────────────────────┐
│                                                           │
│   modes/   ┌─ scan      ┌─ deep      ┌─ pdf               │
│            ├─ tracker   ├─ comp      ├─ intro             │
│            ├─ interview ├─ followup  └─ feedback          │
│                                                           │
│   Each mode is a markdown prompt loaded by the CLI.       │
│   The CLI runs Playwright / file I/O / LLM as needed.     │
│                                                           │
└─────────────────────────┬─────────────────────────────────┘
                          ▼
                Scoring Engine (12 weighted dimensions)
                          │
                          ▼
              data/evaluations/<job-id>.json
                          │
┌────────────────── Calibration Loop ───────────────────────┐
│                                                           │
│   Every outcome event (rejected/interview/offer/hired)    │
│   appended to data/outcomes.jsonl. After ≥30 events,      │
│   weights re-fit via logistic regression on the user's    │
│   own history. Weights stored in profile.yml.             │
│                                                           │
└─────────────────────────┬─────────────────────────────────┘
                          ▼
┌────────────────── Presentation Layer ─────────────────────┐
│                                                           │
│   Web dashboard (Next.js)    TUI (Go)    CLI (Node)       │
│                                                           │
│   All three read the same data/ directory.                │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## Layer-by-layer

### 1. Capture layer

Three intake paths:

**Browser extension** (Trajector Capture)
- Manifest V3 extension, Chrome + Firefox.
- One click on any page → extracts JD via Readability + page metadata + optional LLM cleanup.
- Sends to local daemon on `http://127.0.0.1:7314/capture`.
- Works on LinkedIn, Twitter, niche boards, Notion, Substack, founder DMs.

**Portal scanner** (`scan.mjs`)
- Forked from career-ops. Playwright-driven.
- Pre-configured: Greenhouse, Ashby, Lever, Wellfound, plus 45+ company career pages.
- Scheduled via cron / GitHub Actions for users who want passive scanning.

**Saved-search ingest**
- Parses LinkedIn job-alert emails (forward to a local mailbox or paste).
- Parses Indeed RSS, Otta exports, AngelList CSV.

All paths normalize to a canonical JD record:

```json
{
  "id": "anthropic-senior-ml-eng-2026-04-28",
  "company": "Anthropic",
  "title": "Senior ML Engineer",
  "url": "https://www.anthropic.com/careers/...",
  "location": "Remote (US)",
  "comp_text": "$280k–$405k base",
  "description_md": "…",
  "captured_at": "2026-04-28T14:22:11Z",
  "source": "browser-extension"
}
```

### 2. Intelligence layer

Skill modes live in `modes/*.md`. Each is a self-contained markdown prompt the CLI loads on demand. Modes inherit from `_shared.md` (project context, CV, profile.yml).

Inherited from career-ops:
`scan`, `deep`, `pdf`, `latex`, `apply`, `tracker`, `pipeline`, `auto-pipeline`, `oferta`, `ofertas`, `followup`, `patterns`, `batch`, `interview-prep`, `contacto`, `project`, `training`.

**New modes added by Trajector:**

| Mode | Purpose |
|---|---|
| `feedback` | Records outcome events. Triggers re-calibration when threshold crossed. |
| `intro` | Cross-references shortlist against `data/connections.csv`. Returns ranked warm-intro candidates with suggested message. |
| `comp` | Pulls compensation data from Levels.fyi / Glassdoor / repvue. Replaces LLM-recall comp research. |
| `capture` | Endpoint for the browser extension. Cleans HTML → markdown JD. |
| `calibrate` | Manual trigger for weight re-fit. Reports R² and dimension importance. |

### 3. Scoring engine

Twelve weighted dimensions. Each dimension produces a 0–5 score with reasoning.

| Dimension | Default weight | What it captures |
|---|---|---|
| `role_fit` | 12 | JD responsibilities vs CV experience |
| `level_fit` | 11 | Seniority match — over/under-leveled is a fail |
| `comp_fit` | 11 | Real comp data vs user expectation |
| `stack_fit` | 9 | Tech stack overlap |
| `location_fit` | 9 | Remote / hybrid / onsite vs preference |
| `culture_signals` | 8 | Glassdoor sentiment, employee tenure, leadership stability |
| `growth_signals` | 8 | Funding, hiring velocity, market position |
| `trajectory_delta` | 8 | Does this role move you toward your stated 5-year target? |
| `learning_curve` | 7 | Right amount of stretch — too easy = stagnation, too hard = burnout |
| `red_flags` | 7 | Layoff history, founder churn, recent bad press |
| `exit_optionality` | 5 | Skills + brand value 3 years from now |
| `personalization` | 5 | Free-form fit notes from user (e.g. "I want to work with X") |

Final score = weighted average, scaled to 1–5. Anything < 4.0 hidden by default.

Weights are stored in `config/profile.yml` and **re-fit by the calibration loop** as outcomes accumulate.

### 4. Calibration loop *(Trajector's signature feature)*

Every action the user takes against an evaluated job is recorded as an outcome event:

```json
// data/outcomes.jsonl
{"job_id": "anthropic-senior-ml-eng-2026-04-28", "event": "applied",   "ts": "2026-04-28T..."}
{"job_id": "anthropic-senior-ml-eng-2026-04-28", "event": "phone_screen", "ts": "2026-05-02T..."}
{"job_id": "anthropic-senior-ml-eng-2026-04-28", "event": "rejected",  "ts": "2026-05-08T...", "reason": "level"}
```

When the user has ≥30 outcome events with a definitive label (`rejected`, `offer`, `hired`, `withdrew`), the `calibrate` mode runs:

1. For each completed job, pair the original 12-dimension scores with the label.
2. Fit a logistic regression: `P(positive_outcome | dimension scores)`.
3. Normalize coefficients → new weights.
4. Diff against current weights, show user what changed and why.
5. Persist to `profile.yml` only on user confirmation.

This is the part career-ops doesn't have. Without it, the 4.0/5 threshold is a guess. With it, the threshold is empirically tied to the user's own hire-rate.

### 5. Warm-intro layer

User uploads `Connections.csv` from LinkedIn (Settings → Get a copy of your data → Connections). The file is parsed into:

```json
// data/intro-graph.json
{
  "connections": [
    {"name": "Jane Doe", "company": "Anthropic", "title": "Engineering Manager", "connected_on": "2024-08-12"},
    ...
  ]
}
```

For every shortlisted job, the `intro` mode:
- Finds direct connections at the company.
- Detects ex-employees who left in the last 18 months (rich signal — they'll talk).
- Estimates likely hiring-manager identity from JD + company-org research.
- Drafts a tailored outreach message referencing shared context.

Output appears as a "Warm intros" tab on each job card.

### 6. Presentation layer

Three surfaces, one data contract.

| Surface | Tech | Use case |
|---|---|---|
| **Web dashboard** | Next.js 14, Tailwind, shadcn/ui | Primary experience — most users |
| **Terminal TUI** | Go, Bubble Tea | Power users, SSH workflows, keyboard-only |
| **CLI** | Node.js | Scripting, CI, scheduled scans |

All three read from the same on-disk format defined in `DATA_CONTRACT.md`. None of them holds canonical state — files on disk are the source of truth.

---

## On-disk layout

```
trajector/
├── config/
│   ├── profile.yml             # user preferences + scoring weights
│   ├── portals.yml             # which company career pages to scan
│   └── secrets.yml             # API keys (gitignored)
│
├── cv.md                       # user CV (or imported from PDF/DOCX)
│
├── data/
│   ├── jds/<job-id>.json       # raw normalized JDs
│   ├── evaluations/<job-id>.json # 12-dim scores + reasoning
│   ├── pipeline.json           # tracker state
│   ├── outcomes.jsonl          # outcome events (calibration source)
│   ├── connections.csv         # LinkedIn export (gitignored)
│   ├── intro-graph.json        # parsed connection graph
│   └── salary-cache/<company>.json # cached comp data
│
├── modes/                      # skill-mode markdown prompts
├── output/
│   ├── pdfs/<job-id>.pdf       # tailored CV PDFs
│   └── messages/<job-id>.md    # outreach drafts
│
├── dashboard/                  # Next.js web UI
├── tui/                        # Go terminal UI
└── extension/                  # browser capture extension
```

---

## Data contract (sketch)

Full spec in `DATA_CONTRACT.md` (planned). Key invariants:

- Every JD has a stable `id` derived from `company-slug + title-slug + capture-date`.
- Scores are immutable once computed; re-evaluation creates a new evaluation record with a `superseded_by` link.
- Outcome events are append-only — never edit `outcomes.jsonl` in place.
- Reports under `reports/` are reproducible from `data/` alone.

---

## Security & privacy

- No telemetry. Period.
- LLM keys live in `config/secrets.yml`, gitignored, never logged.
- LinkedIn connection export and CV stay local. Hashes only sent to LLMs as needed.
- Browser extension communicates only with `127.0.0.1` — never phones home.
- Optional E2EE backup to user-controlled S3 / Backblaze for multi-device.

---

## Why this design beats the alternatives

| Alternative | Why we don't do it |
|---|---|
| Centralized job database | Stale data, legal exposure, ops cost. Live scanning is strictly better. |
| SaaS-only | Defeats local-first. Users lose data if we shut down. |
| Auto-apply | Destroys filtering. Burns recruiter relationships. Repeats the spray-and-pray failure mode. |
| Pure chat UI | Can't compose. Skill modes are inspectable, swappable, version-controllable. |
| Closed-source weights | Calibration loop is the differentiator — has to be transparent and user-owned. |
