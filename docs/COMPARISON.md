# Trajector vs the Field

A blunt, honest market map.

---

## TL;DR

| If you want… | Use this |
|---|---|
| Open-source, local-first, agentic, with calibration | **Trajector** |
| Same idea, terminal-only, no calibration | [career-ops](https://github.com/santifer/career-ops) |
| Auto-submit-everywhere SaaS | LazyApply, Sonara, Simplify Copilot |
| CV tailoring + light tracker, hosted | Teal HQ |
| ATS keyword scoring | Jobscan, Rezi |
| Curated job feed, employer-side AI matching | Otta (Welcome to the Jungle), Wellfound |

---

## Detailed feature comparison

| Capability | Trajector | career-ops | Auto-appliers | Teal HQ | Jobscan | Otta |
|---|---|---|---|---|---|---|
| **Open source** | ✅ MIT | ✅ MIT | ❌ | ❌ | ❌ | ❌ |
| **Local-first (your data on your machine)** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Free to use** | ✅ + LLM cost | ✅ + LLM cost | ❌ $30–80/mo | ❌ $30/mo | ❌ $50/mo | ✅ |
| **Filters out bad fits** | ✅ 12-dim scoring | ✅ 10-dim scoring | ❌ sprays | Partial | Partial | Partial |
| **Tailored CV per job** | ✅ ATS PDF | ✅ ATS PDF | ❌ generic | ✅ | Partial | ❌ |
| **Web dashboard** | ✅ | ❌ TUI only | ✅ | ✅ | ✅ | ✅ |
| **Terminal UI** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Browser extension capture** | ✅ universal | ❌ | Partial (own portals) | ✅ | ❌ | ❌ |
| **Outcome feedback loop / calibration** | ✅ logistic re-fit | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Real salary data** | ✅ Levels/Glassdoor | ❌ LLM recall | ❌ | ✅ | ❌ | ✅ |
| **Warm-intro detection** | ✅ LinkedIn graph | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Interview prep (STAR+R)** | ✅ | ✅ | ❌ | Partial | ❌ | ❌ |
| **Negotiation scripts** | ✅ | ✅ | ❌ | Partial | ❌ | ❌ |
| **Auto-submits applications** | ❌ deliberate | ❌ deliberate | ✅ | ❌ | ❌ | ❌ |
| **Multi-CLI (Claude/Gemini/OpenCode)** | ✅ planned | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Mobile app** | 🔵 future | ❌ | Partial | ✅ | ✅ | ✅ |
| **Recruiter outreach drafts** | ✅ planned | ✅ partial | ❌ | ❌ | ❌ | ❌ |

✅ shipped/planned · 🔵 future · Partial = exists in degraded form

---

## Head-to-head: Trajector vs career-ops

career-ops is the direct ancestor. Trajector keeps everything that works and fills the gaps.

### What we keep from career-ops

- Skill-mode architecture (markdown prompts → CLI agent)
- 6-block evaluation (role, CV match, level, comp, personalization, interview)
- ATS-optimized PDF generation
- Multi-CLI integration pattern
- Local-first, MIT-licensed
- Anti-spray, human-in-the-loop philosophy
- Pipeline integrity checks
- Interview story bank

### What we add

| Addition | Why it matters |
|---|---|
| **Outcome feedback loop** | Without it, the 4.0/5 threshold is a guess. With it, your scoring weights are empirically tied to what actually gets you hired. This is the project's reason to exist. |
| **Universal browser-extension capture** | career-ops only sees pre-configured ATS portals. ~50% of openings live elsewhere. The extension closes that gap. |
| **Real salary data sources** | LLM recall on comp is unreliable and dated. Wired-in Levels.fyi / Glassdoor / repvue removes a class of evaluation errors. |
| **Warm-intro detection** | A referral beats a perfect CV. career-ops optimizes the CV path; Trajector adds the referral path. |
| **Web dashboard** | TUI is great for engineers; the broader audience (PMs, designers, ICs in non-eng roles) won't use a terminal. |
| **12-dimension scoring** (vs 10) | Adds `trajectory_delta`, `learning_curve`, `exit_optionality` — long-horizon signals career-ops underweights. |

### What we deliberately don't add

- Auto-apply (career-ops's principled refusal stays intact)
- Centralized job DB
- Paid SaaS tier

---

## Why not just use Teal HQ?

Teal is the closest commercial product. It does CV tailoring, light tracking, and Chrome-extension job saving for $30/mo.

| Dimension | Teal HQ | Trajector |
|---|---|---|
| Owns your data | Teal | You |
| Open source | ❌ | ✅ |
| Scoring transparency | Black box | Inspectable + tunable |
| Calibration to your outcomes | ❌ | ✅ |
| Skill modes / extensibility | ❌ | ✅ |
| Mobile app | ✅ | 🔵 future |
| Recurring cost | $30/mo | LLM API only (~$5–15/mo for heavy use) |
| Audience | Casual job seekers | Power users, engineers, anyone who wants control |

Teal is great for someone who wants a polished hosted product and doesn't care about owning their data. Trajector is for the candidate who wants to *understand* and *tune* their job search, and who doesn't trust a SaaS vendor with their CV and pipeline.

---

## Why not just use auto-appliers?

The pitch sounds great: "AI applies to 100 jobs a day on your behalf."

The reality:

- **Response rates are catastrophic.** Most users see <1% interview conversion vs. 5–15% for tailored applications.
- **Recruiters share blocklists.** ATS systems flag mass-applied accounts. Real recruiters notice the boilerplate.
- **You burn your reputation at the companies you actually want.** A LazyApply application to your dream company today means you can't apply seriously next quarter.
- **Quality CV ≠ tailored CV.** Auto-appliers send the same CV everywhere. ATS keyword matching is shallow.

Trajector is built on the opposite thesis: **fewer, better applications, with the AI doing the work that actually moves the needle (filtering, tailoring, intros)** — not the work that destroys your reputation (mass submission).

---

## Why not just use ChatGPT manually?

Many candidates get partway there with raw ChatGPT — paste a JD, ask for a tailored CV, paste in interview questions. It works for 5–10 applications.

It breaks down because:

- No persistent state — every conversation starts from scratch.
- No scanning — you have to find every JD yourself.
- No PDF generation — you copy-paste markdown into Word, format manually.
- No tracker — you forget what you applied to and when.
- No calibration — every conversation is naive of your past hire/no-hire data.
- No warm-intro detection — that requires your full LinkedIn graph.

Trajector is what you'd build if you ran ChatGPT-based job search for 6 months and got tired of doing the connective tissue by hand.

---

## Honest weaknesses

In the spirit of not being a marketing brochure:

| Weakness | Mitigation |
|---|---|
| Requires CLI comfort to install | One-line installer + Mac/Windows .pkg planned in Phase 4 |
| LLM costs are on the user | Realistic cost is $5–15/mo for heavy use; cheaper than any SaaS competitor |
| No big proprietary job database | We rely on user-pointed scanning + extension capture. Universal capture mitigates this. |
| Calibration needs ≥30 outcomes to be useful | Bootstraps from sensible defaults; calibration is upside, not requirement |
| Browser extension is a Phase 2 deliverable | MVP works without it; portals.yml covers the top 60% of jobs out of the box |
| LinkedIn ToS limits how aggressively we can scrape | We use the user's own session via the extension and official exports — no large-scale scraping |

---

## Bottom line

Trajector is for the candidate who:

1. **Has been on the receiving end of automated job-search tools** and watched them fail.
2. **Wants to understand and tune** their own pipeline, not trust a SaaS black box.
3. **Owns their data** as a non-negotiable.
4. **Will spend an hour configuring** to save 100 hours of bad applications later.
5. **Is comfortable with markdown, YAML, and a terminal** — or willing to learn.

If that's not you, Teal HQ is fine. If it is, Trajector is the only thing in the market that fits.
