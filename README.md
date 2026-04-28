# Trajector

> **Your career, on a smarter trajectory.**
> AI-powered job intelligence for serious candidates. Find the few roles worth your time. Skip the rest.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-design--phase-orange.svg)](docs/ROADMAP.md)
[![Built with Claude Code](https://img.shields.io/badge/Built_with-Claude_Code-000?logo=anthropic&logoColor=white)](https://claude.com/claude-code)

---

## What Trajector Is

Trajector is an open-source job intelligence platform for candidates who refuse to spray-and-pray.

It scans the open web for roles matching your real preferences, scores each one against your CV with explainable reasoning, drafts tailored materials, surfaces warm intros, and **learns from your hire/no-hire outcomes** so the next batch is sharper than the last.

It is built on the agentic-skills pattern pioneered by [`santifer/career-ops`](https://github.com/santifer/career-ops), and extends it with the five highest-leverage gaps that project deliberately leaves open:

| Gap in career-ops | Trajector's answer |
|---|---|
| Scoring is unsupervised — you never tell it what worked | **Outcome feedback loop** — every rejection / interview / offer recalibrates the model |
| Only scans pre-configured ATS portals | **Universal capture** — browser extension grabs JDs from any URL, including LinkedIn |
| Comp research relies on LLM recall | **Real salary data** wired from Levels.fyi, Glassdoor, repvue |
| Optimizes the application path, ignores the referral path | **Warm-intro detection** — cross-references your LinkedIn graph against every shortlist |
| Terminal-only UI excludes most candidates | **Beautiful web dashboard** — same data, accessible to anyone |

Trajector keeps everything career-ops gets right: local-first, MIT-licensed, agentic, anti-spray, human-in-the-loop. **It never auto-submits.** That stays sacred.

---

## Why "Trajector"

A *trajector* is the moving entity in a trajectory. You're the trajector. The system models your path — past roles, current skills, target trajectory — and finds the roles that bend the curve in your favor.

Career-ops asks *"is this job a fit?"*
Trajector asks *"will this job move you in the right direction?"*

---

## Demo

> The screenshot below is the live mockup at [`ui-mockup/index.html`](ui-mockup/index.html). Open it in a browser to interact.

![Trajector dashboard preview](assets/dashboard-preview.png)

---

## Core Features

### 🎯 Intelligent Filtering
A–F scoring across 12 weighted dimensions: role fit, level, comp, location, stack, growth signals, culture, red flags, trajectory delta, comp delta, learning curve, and exit risk. **Below 4.0/5 never reaches your inbox.**

### 🔁 Outcome Feedback Loop *(new)*
Every job you mark as `applied → rejected | interview | offer | hired` becomes calibration data. After ~30 outcomes, weights re-fit to your real signal. The 4.0/5 threshold stops being a vibe and starts being predictive.

### 🌐 Universal Job Capture *(new)*
Browser extension captures JDs from any site — LinkedIn, Twitter, niche boards, founder DMs, Notion pages. Single click → full evaluation in your dashboard.

### 💰 Real Compensation Intelligence *(new)*
Wired into Levels.fyi, Glassdoor, and repvue. Comp ranges come from data, not LLM hallucination. Detects geographic-discount attempts and pay-band games.

### 🤝 Warm-Intro Detection *(new)*
Upload your LinkedIn connections export once. For every shortlisted role, Trajector tells you exactly who you know there, who left recently, and who the hiring manager probably reports to.

### ✨ Tailored Materials
ATS-optimized PDF CV per job. Cover letter draft. Recruiter outreach script. STAR+R interview stories that compound across applications.

### 📊 Beautiful Dashboard *(new)*
Modern web UI with dark mode, kanban pipeline, score visualizations, and one-click filtering. CLI/TUI mode still ships for terminal lovers.

### 🔒 Local-First & Open Source
Your CV, your evaluations, your tracker — all on your machine. MIT licensed. Bring your own LLM key.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     Trajector System                             │
└──────────────────────────────────────────────────────────────────┘

  Capture Layer
  ├─ Browser extension  ──┐
  ├─ Portal scanner      ─┼──►  Raw JD store  (data/jds/)
  └─ Saved-search ingest ─┘

  Intelligence Layer
  ┌────────────────────────────────────────────┐
  │  Skill modes (markdown agent prompts)       │
  │  ├─ scan      ├─ deep      ├─ pdf          │
  │  ├─ tracker   ├─ comp      ├─ intro        │
  │  ├─ interview ├─ followup  └─ feedback     │
  └────────────────────────────────────────────┘
           │
           ▼
  Scoring Engine (12-dimension, weights tunable per user)
           │
           ▼
  Calibration Loop  ◄─── outcomes feed back
  (re-fits weights every 30+ outcome events)
           │
           ▼
  Presentation Layer
  ├─ Web dashboard  (Next.js)
  ├─ Terminal TUI   (Go / Bubble Tea)
  └─ CLI            (Node.js)
```

Full design in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Quick Start *(planned)*

```bash
# 1. Clone
git clone https://github.com/syed-ejaz-ahammed/trajector.git
cd trajector && npm install

# 2. Configure
cp config/profile.example.yml config/profile.yml
# edit profile.yml with your preferences, target roles, deal-breakers

# 3. Add your CV
# drop cv.pdf, cv.docx, or cv.md in the project root
# Trajector auto-converts to its internal format

# 4. (Optional) Add your LinkedIn export for warm-intro detection
# Settings → Privacy → Get a copy of your data → Connections.csv
mv Connections.csv data/connections.csv

# 5. Run a scan
npm run scan

# 6. Open the dashboard
npm run dashboard         # opens http://localhost:3000
# or
npm run tui               # terminal UI for keyboard-only flow
```

---

## What This Is *Not*

- ❌ **Not an auto-applier.** Trajector never hits Submit. Spray-and-pray destroys recruiter relationships and your time. The system is a filter, not a firehose.
- ❌ **Not a recruiter tool.** Candidate-side only. Employers/recruiters: this is the wrong product for you.
- ❌ **Not a job database.** Trajector scans live and stores nothing centrally. No stale listings, no DB drift, no legal exposure.
- ❌ **Not a chatbot.** Skill-mode design, not a conversational UI.

---

## Roadmap

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the full phased plan. Short version:

- **Phase 0** — Project bootstrap, design docs, UI mockup *(current)*
- **Phase 1** — Core scoring + dashboard MVP, fork career-ops skill modes
- **Phase 2** — Outcome feedback loop + universal capture extension
- **Phase 3** — Salary intelligence + warm-intro detection
- **Phase 4** — Multi-CLI integration (Claude Code, Gemini CLI, OpenCode), polish

---

## Comparison

| | Career-ops | Trajector | Auto-appliers (LazyApply, Sonara) | Teal HQ |
|---|---|---|---|---|
| Open source | ✅ | ✅ | ❌ | ❌ |
| Local-first | ✅ | ✅ | ❌ | ❌ |
| Filters out bad fits | ✅ | ✅ | ❌ | Partial |
| Web UI | ❌ | ✅ | ✅ | ✅ |
| Outcome feedback loop | ❌ | ✅ | ❌ | ❌ |
| Universal job capture | ❌ | ✅ | Partial | Partial |
| Real salary data | ❌ | ✅ | ❌ | ✅ |
| Warm-intro detection | ❌ | ✅ | ❌ | ❌ |
| Auto-submits applications | ❌ | ❌ | ✅ | ❌ |
| Cost | Free + LLM | Free + LLM | $30-80/mo | $30/mo |

Full breakdown in [`docs/COMPARISON.md`](docs/COMPARISON.md).

---

## Credits

- Inspired by [`santifer/career-ops`](https://github.com/santifer/career-ops) — the agentic-skills approach to job search.
- Built on [Claude Code](https://claude.com/claude-code) and the broader AI coding CLI ecosystem.

---

## License

MIT — see [LICENSE](LICENSE).

## Contact

Maintainer: **Syed Ejaz Ahammed** · syedejaz8470@gmail.com
