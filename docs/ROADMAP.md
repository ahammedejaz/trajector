# Trajector — Roadmap

Phased, ROI-ordered. Each phase ships standalone value.

Legend: 🟢 ready to start · 🟡 dependent on previous phase · 🔵 nice-to-have

---

## Phase 0 — Bootstrap *(current)*

🟢 **Goal:** Project scaffolding, design docs, mockup. No code shipped yet.

- [x] Pick name + positioning
- [x] README with feature pitch
- [x] ARCHITECTURE.md
- [x] UI_DESIGN.md
- [x] ROADMAP.md
- [x] COMPARISON.md
- [x] HTML mockup of dashboard
- [ ] Project landing page (`docs/landing/index.html`)
- [ ] Discord / GitHub Discussions setup
- [ ] First 10 design partners (recruit candidates already running career-ops)

**Exit criteria:** A first-time visitor can read the README, open the mockup, and understand exactly what Trajector does and how it differs from career-ops.

---

## Phase 1 — Core MVP *(weeks 1–6)*

🟡 **Goal:** A usable v0.1 — fork career-ops's skill modes, ship a real web dashboard, prove the data contract.

| Week | Deliverable |
|---|---|
| 1 | Repo skeleton: `package.json`, ESM modules, eslint, prettier. Fork relevant `*.mjs` from career-ops. |
| 2 | `data/` contract finalized + JSON schemas. CV import (`.pdf` / `.docx` / `.md` → internal markdown). |
| 3 | Skill modes ported: `scan`, `deep`, `pdf`, `tracker`, `pipeline`. |
| 4 | Next.js dashboard scaffold. Read-only view of `data/`. Job list + detail view. |
| 5 | Score gauge (radial), pipeline kanban with drag-to-update. |
| 6 | First end-to-end demo: paste URL → eval → PDF → tracker entry, all in the web UI. |

**Exit criteria:** A developer can clone, install, paste a JD URL, and get a tailored CV PDF + scored evaluation in the dashboard within 15 minutes of first run.

---

## Phase 2 — The Loop *(weeks 7–12)*

🟡 **Goal:** Ship the killer differentiator — outcome feedback loop + universal capture.

| Week | Deliverable |
|---|---|
| 7 | `data/outcomes.jsonl` append-only log. Pipeline drag-to-stage emits events. |
| 8 | `feedback` mode. Reasoning prompts when outcome is `rejected` (level / comp / fit / culture / no-response). |
| 9 | `calibrate` mode: logistic regression fit, diff-of-weights visualization, user-confirmation flow. |
| 10 | Browser extension scaffolding (Manifest V3, Chrome + Firefox). |
| 11 | Extension capture flow → local daemon (`POST /capture`). Test on LinkedIn, Twitter, Notion, niche boards. |
| 12 | Calibration banner UX, "show what changed" diff view. |

**Exit criteria:** User reaches 30 outcomes, runs calibration, sees a non-trivial weight shift that *intuitively makes sense* given their hire/no-hire history. Browser extension works on top 20 job sites.

---

## Phase 3 — Intelligence *(weeks 13–20)*

🟡 **Goal:** Replace LLM-recall with real data, add the relationship graph.

| Week | Deliverable |
|---|---|
| 13 | `comp` mode: Levels.fyi adapter. Salary cache. Replace LLM comp guesses. |
| 14 | Glassdoor + repvue adapters for comp + culture sentiment. |
| 15 | `intro` mode: parse `Connections.csv`, build `intro-graph.json`. |
| 16 | Hiring-manager identity inference from JD + LinkedIn search. |
| 17 | Outreach message generation per warm-intro. |
| 18 | Company intelligence cards: funding (Crunchbase API), layoffs (layoffs.fyi), recent press. |
| 19 | Risk-detector engine: founder churn, leadership departures, glass-door collapse. |
| 20 | Polish: real-data badges, source links, freshness timestamps. |

**Exit criteria:** Every job card carries verifiable comp data with a source citation, plus a count of warm intros. No hallucinated numbers.

---

## Phase 4 — Polish & Reach *(weeks 21–26)*

🟡 **Goal:** Make Trajector beautiful, fast, multi-CLI-ready, and shippable to non-technical candidates.

| Week | Deliverable |
|---|---|
| 21 | Multi-CLI integration: same skills work in Claude Code, Gemini CLI, OpenCode (mirror career-ops's `.claude/` `.gemini/` `.opencode/` setup). |
| 22 | Push notifications: Slack/email/Pushover/Telegram on new high-fit listings. |
| 23 | Application form pre-fill userscript (don't auto-submit, just pre-populate). |
| 24 | Localization: ES, PT, DE, FR, JA UI strings. CV variants per locale. |
| 25 | Performance pass: Lighthouse 95+, sub-100ms TTI on dashboard. |
| 26 | Public launch: Show HN, Twitter, Discord, Product Hunt. |

**Exit criteria:** Dashboard loads in <1s on cold cache. A non-technical user can install via a one-line installer and run their first scan without reading docs.

---

## Phase 5+ — Future *(post-launch)*

🔵 Ideas being held out of MVP intentionally:

- **Voice mock interviews** — partner with / link out to existing tools (Yoodli, Final Round) instead of rebuilding.
- **Mobile companion app** — read-only iOS/Android, view shortlist + warm intros on the go.
- **Calendar integration** — interview scheduling, prep reminders.
- **ATS keyword self-test** — submit your CV through your own ATS clone to validate parseability.
- **Multi-CV variants** — frontend-flavored vs ML-flavored, auto-selected per JD.
- **Team mode** — shared pipeline for couples/job-search partners reviewing offers together.
- **Negotiation simulator** — practice the comp conversation against an LLM playing recruiter.

---

## Explicitly out of scope

These come up regularly and the answer stays no:

| Idea | Why we won't ship it |
|---|---|
| Auto-apply | Kills the filter. Burns recruiter trust. The whole project is the anti-pattern to this. |
| Centralized job database | Stale, costly, legally exposed. Live scanning is strictly better. |
| Paid SaaS layer | Splits the community. Local-first is the moat. |
| Generic chatbot UI | Skill-mode design is the differentiator. A chat UI dilutes it. |
| Auto-scrape LinkedIn jobs at scale | ToS-violating, bans inevitable. We use official RSS, manual exports, and the user's own browser via the extension. |
| Resume "score my CV" widget | Already a commodity (Jobscan, Rezi). Not differentiated. |

---

## How to follow / contribute

- **Watch** the GitHub repo for releases.
- **Discord** for design discussions and beta testing.
- **GitHub Discussions** for feature requests + roadmap voting.
- **Issues** for bugs only.

Roadmap is opinionated but not dogmatic. ROI-ordered for now; user data will reorder it later.
