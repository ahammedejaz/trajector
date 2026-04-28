# Trajector

> **Find the few jobs worth your time.**
> Open-source AI job-search tool. Drop your resume, get scored matches across Greenhouse, Ashby, and Lever — bring your own LLM key, runs entirely in your browser.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with Claude Code](https://img.shields.io/badge/Built_with-Claude_Code-000?logo=anthropic&logoColor=white)](https://claude.com/claude-code)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## What it does

1. You drop a resume (PDF, DOCX, or Markdown) — parsed locally in your browser.
2. The LLM (your OpenRouter key) extracts a 16-field candidate profile: target role, level, years of experience, stack, country, sponsorship, comp floor, deal-breakers, equity tolerance, etc.
3. You confirm or edit any field on the Confirm screen.
4. Trajector fetches **real, current job postings** from Greenhouse, Ashby, and Lever public APIs across 28 curated companies (Stripe, Anthropic, OpenAI, Linear, Notion, Spotify, etc.).
5. A title + location pre-filter drops obvious mismatches.
6. The LLM scores the top 20 candidates 0–100 against your profile.
7. You see grouped Strong / Decent / Skip matches with full job details and a working **Apply** link to the original posting.

Nothing leaves your browser except the OpenRouter API call and the public ATS API calls. No accounts. No backend. No telemetry.

## Live demo

→ **[trajector.vercel.app](https://trajector.vercel.app/)**

You'll need an [OpenRouter](https://openrouter.ai/) API key (~$0.01 per scan with Claude Sonnet 4.6).

## Honest scope

**What it covers:**
- ~28 curated companies on Greenhouse / Ashby / Lever (mostly AI, dev-tools, fintech, productivity SaaS)
- US, EU, India, and other locations supported via `profile.country` + city map (~25 countries with major dev hubs)
- Real apply URLs that work

**What it does NOT cover:**
- LinkedIn, Indeed, Naukri, Monster, NaukriGulf — these have no public APIs and don't allow scraping. We do not violate their ToS.
- Companies not on Greenhouse/Ashby/Lever (most large enterprises, most regional sites)
- Authenticated job feeds

**Why the limit:** Browser-only SPAs can fetch APIs that expose `Access-Control-Allow-Origin: *`. Greenhouse, Ashby, and Lever do. The big aggregator boards don't, and reverse-engineering their private APIs would violate their ToS, get user accounts banned, and require a maintenance treadmill we don't have. We accept the coverage trade-off in exchange for honesty and sustainability.

## Architecture

Pure client-side. No backend.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Browser (your machine)                      │
│                                                                 │
│   PDF/DOCX/MD parser  ──►  LLM extract profile (OpenRouter)    │
│                                          │                      │
│                                          ▼                      │
│                          16-field Profile  (localStorage)       │
│                                          │                      │
│   Greenhouse/Ashby/Lever public APIs  ◄──┤                      │
│      (parallel fetch, ~28 companies)     │                      │
│                                          ▼                      │
│   Title + location pre-filter (top 20 candidates)               │
│                                          │                      │
│                                          ▼                      │
│   LLM batch score (OpenRouter)  ──►  ScoredJob[]                │
│                                          │                      │
│                                          ▼                      │
│   Results UI: grouped by tier + sidebar filters + Apply link    │
└─────────────────────────────────────────────────────────────────┘
```

Every request originates from the user's browser. The OpenRouter key is in `localStorage`. No Trajector server exists.

## Tech stack

- **Vite 6** + **React 19** + **TypeScript 5.9**
- **CSS Modules** with design tokens (no Tailwind, no CSS-in-JS)
- **Vitest** + **@testing-library/react** for unit/component tests
- **Playwright** for end-to-end tests (Chromium-only)
- Resume parsing: **pdfjs-dist** (PDF) + **mammoth** (DOCX)
- Hosted on **Vercel** (free tier)

## Project structure

```
src/
├── components/         # Reusable UI: Hero, JobCard, ScoreDot, Sidebar, …
├── screens/            # Page-level: Landing, Confirm, Results, Settings, Upload
├── lib/
│   ├── ats/            # Greenhouse, Ashby, Lever fetchers + aggregator + filter
│   ├── companies.ts    # Curated company list (28 companies, 3 ATSes)
│   ├── extractProfile  # LLM resume → Profile
│   ├── scanJobs        # Fetch real jobs → pre-filter → LLM score
│   ├── locationMatch   # Country + city filter
│   ├── parseResume     # PDF/DOCX/MD parsing
│   └── …
├── hooks/              # Custom hooks (useScrollReveal, etc.)
├── types.ts            # Shared TypeScript types
└── theme.css           # Design tokens

tests/e2e/              # Playwright tests (mocks ATS + OpenRouter)
public/                 # robots.txt, sitemap.xml, favicons, OG image, web manifest
docs/superpowers/       # Implementation plans for each shipped phase
scripts/                # One-shot tooling (e.g. OG image generator)
.github/workflows/      # CI: typecheck, lint, test, build, e2e
```

## Run locally

```bash
git clone https://github.com/ahammedejaz/trajector.git
cd trajector
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and drop a resume.

## All scripts

| Command | Effect |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run Vitest unit/component tests |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Run Playwright e2e tests |
| `npm run lint` | ESLint + Stylelint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run og` | Regenerate `public/og-image.png` and favicons |

## Deployment

The repo deploys to Vercel out of the box. `vercel.json` configures:
- SPA fallback rewrite (all routes serve `index.html`)
- Security headers: CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy, HSTS
- Long cache for hashed assets, no-cache for `index.html`

To deploy your own copy:
1. Fork the repo.
2. Connect it to Vercel.
3. Set the production branch to `main`.
4. No environment variables required — users supply their own OpenRouter key in Settings.

## Adding companies

Companies are declared in `src/lib/companies.ts`. To add one:
1. Find the careers page. If hosted at `boards.greenhouse.io/{slug}`, ATS is `greenhouse`. `jobs.ashbyhq.com/{slug}` → `ashby`. `jobs.lever.co/{slug}` → `lever`.
2. Verify the slug returns jobs:
   ```bash
   # Greenhouse
   curl -s "https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=false" | head
   # Ashby
   curl -s "https://api.ashbyhq.com/posting-api/job-board/{slug}" | head
   # Lever
   curl -s "https://api.lever.co/v0/postings/{slug}" | head
   ```
3. Add an entry to the `COMPANIES` array.

## Adding countries / cities

Country aliases and city-to-country mappings live in `src/lib/locationMatch.ts`. Add to `COUNTRY_ALIASES` for new country names/abbreviations, or to `CITIES_BY_COUNTRY` to map cities to a country.

## Privacy

- Your **resume** is parsed in your browser (pdfjs-dist / mammoth). It never reaches our infrastructure.
- Your **OpenRouter API key** is stored in `localStorage` on your device. It's sent only in `Authorization` headers to `openrouter.ai`.
- **Job scanning** hits the public Greenhouse/Ashby/Lever APIs directly from your browser. The companies listed in `src/lib/companies.ts` are public information.
- Trajector runs **no servers**. Nothing about you is logged, analyzed, or stored anywhere we control.

If you fork and self-host, the same is true — Vercel just serves the static bundle.

## Inspiration

The architecture pattern (browser-side fetch from public ATS APIs + LLM scoring of real jobs) is inspired by [`santifer/career-ops`](https://github.com/santifer/career-ops), a CLI-based job search system. Trajector adapts the pattern for browser-only TypeScript with a friendly UI.

`career-ops` uses Claude Code's agentic skills for richer features (PDF generation, interview-prep modes, batch processing). Trajector intentionally stays simpler — just the scoring + triage loop, accessible without installing anything.

## Contributing

Issues and pull requests welcome.

The implementation history is in [`docs/superpowers/plans/`](docs/superpowers/plans/) — each shipped phase has a plan document describing what was built. New work usually starts with a brainstorming session, then a spec in `docs/superpowers/specs/`, then a plan, then subagent-driven execution. Tests-first.

## License

MIT — see [LICENSE](LICENSE).

## Maintainer

**Syed Ejaz Ahammed** — [github.com/ahammedejaz](https://github.com/ahammedejaz)
