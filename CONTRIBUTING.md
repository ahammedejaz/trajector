# Contributing to Trajector

Thanks for considering a contribution. Trajector is in **Phase 0 (design)** — we're building the project out in the open.

## How to help right now

| You are | Best way to help |
|---|---|
| A candidate using career-ops or similar tools | Drop your wishlist in [Discussions](https://github.com/syed-ejaz-ahammed/trajector/discussions). What gap hurts most? |
| An engineer | Read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and weigh in on the data contract before we ship Phase 1 |
| A designer | Open the mockup ([`ui-mockup/index.html`](ui-mockup/index.html)) and propose improvements |
| A recruiter or HR person | Tell us what you wish candidates had on the receiving end. Negative space is welcome. |

## Principles we won't compromise on

- **Local-first.** No mandatory cloud, no telemetry, no SaaS lock-in.
- **No auto-submit.** Trajector is a filter, not a firehose. PRs that add auto-application logic will be closed.
- **Human-in-the-loop.** The system never decides; the candidate decides.
- **Calibration is the moat.** Anything that weakens the outcome feedback loop will be pushed back on.

## Code style (when code lands)

- Node 20+, ES modules, no CommonJS in new code.
- Prefer functional composition over classes.
- No comments that explain *what* the code does — only *why*, and only when non-obvious.
- Tests live alongside the file they test (`feature.mjs` + `feature.test.mjs`).

## PR process

1. Open an issue first for anything beyond a typo / docs nit.
2. Branch from `main`, name it `feat/...` / `fix/...` / `docs/...`.
3. PR description should explain *why*, not *what*.
4. CI must be green; `prettier` + `eslint` must pass.
5. Review by a maintainer — Phase 0 means small team, expect quick iterations.

## Code of conduct

Be kind. Disagree on substance, never on people. Mocking competing tools is fine; mocking users is not.

## License

By contributing, you agree your code ships under the MIT license.
