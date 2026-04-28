# Trajector v0 — Plan 5: Polish Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Push Trajector from "minimal Linear-style" to "professional SaaS product" without adding new color tokens or gradients. Polish via display typography, multi-layer shadows, SVG dot-grid backgrounds, an extra surface tone, recurring score-color motifs, custom logo, and 5 new landing sections.

**Architecture:** Strict TDD per task. New tokens added once at the start; new components added in dependency order; existing components polished after their dependencies exist. Single PR against `main` from branch `feat/v0-plan-5-polish`.

**Spec reference:** `docs/superpowers/specs/2026-04-28-trajector-v0-polish-pass-design.md`

---

## Task 1: Theme tokens

Add display typography sizes, letter-spacing scale, shadow scale, and one new surface tone to `src/theme.css`.

- [ ] **Step 1: Modify `src/theme.css`**

After the existing `--bg-surface-2: #1c1c1c;` line, add:
```css
  --bg-elevated: #242424;
```

After the existing typography sizes block, add:
```css
  /* Display typography (spec §3) */
  --font-size-display: 72px;
  --font-size-display-xl: 90px;

  /* Letter-spacing scale */
  --tracking-tight: -0.02em;
  --tracking-tighter: -0.03em;
  --tracking-display: -0.04em;
```

Before the closing `}` of `:root`, add:
```css
  /* Shadow scale (spec §3) — neutral black only */
  --shadow-sm: 0 1px 2px rgb(0 0 0 / 30%);
  --shadow-md: 0 4px 16px rgb(0 0 0 / 40%);
  --shadow-lg: 0 16px 48px rgb(0 0 0 / 50%);
  --shadow-glow: 0 0 0 1px var(--border-strong), 0 8px 32px rgb(0 0 0 / 50%);
```

- [ ] **Step 2:** Run `npm run lint` — confirm no stylelint errors. Run `npm run typecheck` and `npm test` — confirm both green.

- [ ] **Step 3: Commit**

```bash
git add src/theme.css
git commit -m "feat(theme): add display sizes, tracking scale, shadow scale, bg-elevated"
```

---

## Task 2: Logo component

Custom geometric mark + wordmark. The mark is a 20px square with rounded corners, containing a 6px score-strong dot. Pure CSS, no SVG, no images.

**Files:**
- Create: `src/components/Logo/Logo.tsx`
- Create: `src/components/Logo/Logo.module.css`
- Create: `src/components/Logo/Logo.test.tsx`

- [ ] **Step 1: Test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Logo } from './Logo';

describe('Logo', () => {
  it('renders the wordmark', () => {
    render(<Logo />);
    expect(screen.getByText('Trajector')).toBeInTheDocument();
  });

  it('has accessible label', () => {
    render(<Logo />);
    expect(screen.getByLabelText(/trajector home/i)).toBeInTheDocument();
  });

  it('respects size prop', () => {
    const { container } = render(<Logo size="sm" />);
    expect(container.querySelector('span')!.className).toMatch(/sm/);
  });
});
```

- [ ] **Step 2:** `npm test -- Logo` fails.

- [ ] **Step 3: Implement**

`src/components/Logo/Logo.tsx`:

```tsx
import styles from './Logo.module.css';

interface Props {
  size?: 'sm' | 'md';
}

export function Logo({ size = 'md' }: Props) {
  return (
    <span className={`${styles.root} ${styles[size]}`} aria-label="Trajector home">
      <span className={styles.mark} aria-hidden="true">
        <span className={styles.dot} />
      </span>
      <span className={styles.wordmark}>Trajector</span>
    </span>
  );
}
```

`src/components/Logo/Logo.module.css`:

```css
.root {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-elevated);
  border: var(--border-width) solid var(--border-strong);
  border-radius: 5px;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.dot {
  display: block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--score-strong);
}

.wordmark {
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  letter-spacing: var(--tracking-tight);
}

.sm .mark {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.sm .dot {
  width: 5px;
  height: 5px;
}

.sm .wordmark {
  font-size: var(--font-size-body);
}
```

- [ ] **Step 4:** Tests 3/3 pass + full + typecheck + lint green.

- [ ] **Step 5: Commit**

```bash
git add src/components/Logo
git commit -m "feat(components): add Logo with geometric mark and wordmark"
```

---

## Task 3: DotGrid background component

A reusable SVG-based dot-grid pattern, used as a backdrop on Hero and Confirm/Results screens. Configurable density and opacity.

**Files:**
- Create: `src/components/DotGrid/DotGrid.tsx`
- Create: `src/components/DotGrid/DotGrid.module.css`
- Create: `src/components/DotGrid/DotGrid.test.tsx`

- [ ] **Step 1: Test**

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DotGrid } from './DotGrid';

describe('DotGrid', () => {
  it('renders an SVG element', () => {
    const { container } = render(<DotGrid />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('respects spacing prop', () => {
    const { container } = render(<DotGrid spacing={48} />);
    const pattern = container.querySelector('pattern');
    expect(pattern).toHaveAttribute('width', '48');
  });
});
```

- [ ] **Step 2:** Fail.

- [ ] **Step 3: Implement**

`src/components/DotGrid/DotGrid.tsx`:

```tsx
import styles from './DotGrid.module.css';

interface Props {
  spacing?: number;
  dotSize?: number;
}

export function DotGrid({ spacing = 32, dotSize = 1 }: Props) {
  return (
    <svg className={styles.root} aria-hidden="true">
      <defs>
        <pattern id="dotgrid" width={spacing} height={spacing} patternUnits="userSpaceOnUse">
          <circle cx={spacing / 2} cy={spacing / 2} r={dotSize} fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dotgrid)" />
    </svg>
  );
}
```

`src/components/DotGrid/DotGrid.module.css`:

```css
.root {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  color: var(--text-tertiary);
  opacity: 0.12;
}
```

- [ ] **Step 4:** Tests 2/2 pass + suite green.

- [ ] **Step 5: Commit**

```bash
git add src/components/DotGrid
git commit -m "feat(components): add DotGrid SVG background pattern"
```

---

## Task 4: StatsRow

4-cell KPI strip on Landing.

**Files:** `src/components/StatsRow/{StatsRow.tsx, .module.css, .test.tsx}`

- [ ] **Step 1: Test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsRow } from './StatsRow';

describe('StatsRow', () => {
  it('renders all four KPIs', () => {
    render(<StatsRow />);
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText(/jobs scored per scan/i)).toBeInTheDocument();
    expect(screen.getByText(/~\$0\.01/)).toBeInTheDocument();
    expect(screen.getByText(/cost per scan/i)).toBeInTheDocument();
    expect(screen.getByText('8s')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText(/servers, accounts, or data/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2:** Fail.

- [ ] **Step 3: Implement**

`src/components/StatsRow/StatsRow.tsx`:

```tsx
import styles from './StatsRow.module.css';

interface Stat {
  value: string;
  label: string;
}

const STATS: Stat[] = [
  { value: '15', label: 'jobs scored per scan' },
  { value: '~$0.01', label: 'cost per scan with Sonnet' },
  { value: '8s', label: 'average scan time' },
  { value: '0', label: 'servers, accounts, or data shared' },
];

export function StatsRow() {
  return (
    <section className={styles.root}>
      <div className={styles.inner}>
        {STATS.map((s, i) => (
          <div key={i} className={styles.cell}>
            <p className={styles.value}>{s.value}</p>
            <p className={styles.label}>{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

`src/components/StatsRow/StatsRow.module.css`:

```css
.root {
  padding: var(--space-7) var(--space-5);
  border-bottom: var(--border-width) solid var(--border-subtle);
}

.inner {
  max-width: 1120px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
}

@media (width <= 880px) {
  .inner {
    grid-template-columns: repeat(2, 1fr);
  }
}

.cell {
  padding: var(--space-3) var(--space-5);
  border-right: var(--border-width) solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  text-align: left;
}

.cell:last-child {
  border-right: none;
}

@media (width <= 880px) {
  .cell {
    border-right: none;
    border-bottom: var(--border-width) solid var(--border-subtle);
  }

  .cell:nth-last-child(-n+2) {
    border-bottom: none;
  }
}

.value {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 32px;
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin: 0;
  letter-spacing: var(--tracking-tight);
  font-variant-numeric: tabular-nums;
}

.label {
  font-size: var(--font-size-caption);
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}
```

- [ ] **Step 4:** Tests pass + suite green.

- [ ] **Step 5: Commit**

```bash
git add src/components/StatsRow
git commit -m "feat(components): add StatsRow KPI strip"
```

---

## Task 5: HowItScores

Algorithm explainer with 4 weighted-factor bars.

**Files:** `src/components/HowItScores/{HowItScores.tsx, .module.css, .test.tsx}`

- [ ] **Step 1: Test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HowItScores } from './HowItScores';

describe('HowItScores', () => {
  it('renders the heading', () => {
    render(<HowItScores />);
    expect(screen.getByRole('heading', { name: /how it scores/i })).toBeInTheDocument();
  });

  it('renders all four factors', () => {
    render(<HowItScores />);
    expect(screen.getByText(/stack alignment/i)).toBeInTheDocument();
    expect(screen.getByText(/comp/i)).toBeInTheDocument();
    expect(screen.getByText(/location.*country/i)).toBeInTheDocument();
    expect(screen.getByText(/stage.*size.*equity/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2:** Fail.

- [ ] **Step 3: Implement**

`src/components/HowItScores/HowItScores.tsx`:

```tsx
import styles from './HowItScores.module.css';

interface Factor {
  label: string;
  weight: number;  // 0-1
  caption: string;
}

const FACTORS: Factor[] = [
  { label: 'Stack alignment', weight: 0.85, caption: 'How well your stack signals match the posting' },
  { label: 'Comp ≥ floor', weight: 0.7, caption: 'Compensation meets or exceeds your floor' },
  { label: 'Location / country fit', weight: 0.5, caption: 'Posting available where you can work' },
  { label: 'Stage / size / equity', weight: 0.3, caption: 'Company stage, size, and equity profile match preferences' },
];

export function HowItScores() {
  return (
    <section className={styles.root}>
      <div className={styles.inner}>
        <h2 className={styles.title}>How it scores</h2>
        <p className={styles.subtitle}>
          Every job gets a 0–100 score from your profile against four weighted factors.
        </p>
        <div className={styles.list}>
          {FACTORS.map((f) => (
            <div key={f.label} className={styles.row}>
              <div className={styles.head}>
                <span className={styles.dot} />
                <span className={styles.label}>{f.label}</span>
              </div>
              <div className={styles.bar}>
                <div className={styles.fill} style={{ width: `${f.weight * 100}%` }} />
              </div>
              <p className={styles.caption}>{f.caption}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

`src/components/HowItScores/HowItScores.module.css`:

```css
.root {
  padding: var(--space-7) var(--space-5);
}

.inner {
  max-width: 720px;
  margin: 0 auto;
}

.title {
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  letter-spacing: var(--tracking-tight);
  margin: 0 0 var(--space-2);
  text-align: center;
}

.subtitle {
  font-size: var(--font-size-body);
  color: var(--text-secondary);
  margin: 0 0 var(--space-6);
  text-align: center;
}

.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.row {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) 2fr;
  gap: var(--space-4) var(--space-5);
  align-items: center;
}

.head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--score-strong);
  flex-shrink: 0;
}

.label {
  font-size: var(--font-size-body);
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.bar {
  height: 6px;
  background: var(--bg-canvas);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: 999px;
  overflow: hidden;
}

.fill {
  height: 100%;
  background: var(--bg-surface-2);
  border-right: var(--border-width) solid var(--border-strong);
}

.caption {
  grid-column: 1 / -1;
  font-size: var(--font-size-caption);
  color: var(--text-tertiary);
  margin: 0;
  padding-left: calc(8px + var(--space-2));
}

@media (width <= 600px) {
  .row {
    grid-template-columns: 1fr;
  }

  .caption {
    padding-left: calc(8px + var(--space-2));
  }
}
```

- [ ] **Step 4:** Tests pass + suite green.

- [ ] **Step 5: Commit**

```bash
git add src/components/HowItScores
git commit -m "feat(components): add HowItScores algorithm explainer"
```

---

## Task 6: ComparisonTable

Three-column matrix vs alternatives.

**Files:** `src/components/ComparisonTable/{ComparisonTable.tsx, .module.css, .test.tsx}`

- [ ] **Step 1: Test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComparisonTable } from './ComparisonTable';

describe('ComparisonTable', () => {
  it('renders the heading', () => {
    render(<ComparisonTable />);
    expect(screen.getByRole('heading', { name: /vs the alternatives/i })).toBeInTheDocument();
  });

  it('renders all three columns', () => {
    render(<ComparisonTable />);
    expect(screen.getByText('Trajector')).toBeInTheDocument();
    expect(screen.getByText(/spreadsheet/i)).toBeInTheDocument();
    expect(screen.getByText(/job boards/i)).toBeInTheDocument();
  });

  it('renders rows for key features', () => {
    render(<ComparisonTable />);
    expect(screen.getByText(/auto-scored matches/i)).toBeInTheDocument();
    expect(screen.getByText(/honors comp floor/i)).toBeInTheDocument();
    expect(screen.getByText(/data stays in browser/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2:** Fail.

- [ ] **Step 3: Implement**

`src/components/ComparisonTable/ComparisonTable.tsx`:

```tsx
import styles from './ComparisonTable.module.css';

type Cell = { kind: 'check' } | { kind: 'cross' } | { kind: 'text'; value: string };

interface Row {
  label: string;
  trajector: Cell;
  spreadsheet: Cell;
  boards: Cell;
}

const ROWS: Row[] = [
  {
    label: 'Auto-scored matches',
    trajector: { kind: 'check' },
    spreadsheet: { kind: 'cross' },
    boards: { kind: 'cross' },
  },
  {
    label: 'Honors comp floor',
    trajector: { kind: 'check' },
    spreadsheet: { kind: 'text', value: 'manual' },
    boards: { kind: 'cross' },
  },
  {
    label: 'Honors deal-breakers',
    trajector: { kind: 'check' },
    spreadsheet: { kind: 'text', value: 'manual' },
    boards: { kind: 'cross' },
  },
  {
    label: 'Data stays in browser',
    trajector: { kind: 'check' },
    spreadsheet: { kind: 'check' },
    boards: { kind: 'cross' },
  },
  {
    label: 'Cost at zero use',
    trajector: { kind: 'text', value: '$0' },
    spreadsheet: { kind: 'text', value: '$0' },
    boards: { kind: 'text', value: 'ad-funded' },
  },
];

function CellView({ cell }: { cell: Cell }) {
  if (cell.kind === 'check') return <span className={styles.check}>✓</span>;
  if (cell.kind === 'cross') return <span className={styles.cross}>✗</span>;
  return <span className={styles.cellText}>{cell.value}</span>;
}

export function ComparisonTable() {
  return (
    <section className={styles.root}>
      <div className={styles.inner}>
        <h2 className={styles.title}>Vs the alternatives</h2>
        <p className={styles.subtitle}>
          What you get with Trajector that you don't get from the usual job-search workflow.
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th></th>
                <th className={styles.colHighlight}>Trajector</th>
                <th>Manual spreadsheet</th>
                <th>Job boards</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.label}>
                  <td className={styles.rowLabel}>{r.label}</td>
                  <td className={styles.colHighlight}><CellView cell={r.trajector} /></td>
                  <td><CellView cell={r.spreadsheet} /></td>
                  <td><CellView cell={r.boards} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
```

`src/components/ComparisonTable/ComparisonTable.module.css`:

```css
.root {
  padding: var(--space-7) var(--space-5);
  background: var(--bg-surface);
  border-top: var(--border-width) solid var(--border-subtle);
  border-bottom: var(--border-width) solid var(--border-subtle);
}

.inner {
  max-width: 880px;
  margin: 0 auto;
}

.title {
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  letter-spacing: var(--tracking-tight);
  margin: 0 0 var(--space-2);
  text-align: center;
}

.subtitle {
  font-size: var(--font-size-body);
  color: var(--text-secondary);
  margin: 0 0 var(--space-6);
  text-align: center;
}

.tableWrap {
  background: var(--bg-elevated);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th, .table td {
  padding: var(--space-3) var(--space-4);
  text-align: center;
  font-size: var(--font-size-body);
  border-bottom: var(--border-width) solid var(--border-subtle);
}

.table tbody tr:last-child th,
.table tbody tr:last-child td {
  border-bottom: none;
}

.table th {
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-medium);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: var(--bg-surface);
}

.rowLabel {
  text-align: left !important;
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.colHighlight {
  background: var(--bg-canvas);
}

.check {
  color: var(--score-strong);
  font-size: var(--font-size-h3);
}

.cross {
  color: var(--text-tertiary);
  font-size: var(--font-size-h3);
}

.cellText {
  color: var(--text-secondary);
  font-size: var(--font-size-caption);
}
```

- [ ] **Step 4:** Tests 3/3 pass + suite green.

- [ ] **Step 5: Commit**

```bash
git add src/components/ComparisonTable
git commit -m "feat(components): add ComparisonTable matrix vs alternatives"
```

---

## Task 7: UseCases

Three persona cards on Landing.

**Files:** `src/components/UseCases/{UseCases.tsx, .module.css, .test.tsx}`

- [ ] **Step 1: Test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UseCases } from './UseCases';

describe('UseCases', () => {
  it('renders the heading', () => {
    render(<UseCases />);
    expect(screen.getByRole('heading', { name: /who.*for/i })).toBeInTheDocument();
  });

  it('renders all three persona cards', () => {
    render(<UseCases />);
    expect(screen.getByText(/senior ic/i)).toBeInTheDocument();
    expect(screen.getByText(/active job seeker/i)).toBeInTheDocument();
    expect(screen.getByText(/career changer/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2:** Fail.

- [ ] **Step 3: Implement**

`src/components/UseCases/UseCases.tsx`:

```tsx
import type { ScoreTier } from '../../types';
import styles from './UseCases.module.css';

interface Persona {
  tier: ScoreTier;
  title: string;
  scenario: string;
}

const PERSONAS: Persona[] = [
  {
    tier: 'strong',
    title: 'Senior IC, mid-job-search',
    scenario:
      "I have a job. I'd take a great offer. I open Trajector once a month, scan, glance at strong matches, ignore the rest.",
  },
  {
    tier: 'decent',
    title: 'Active job seeker, picky',
    scenario:
      "I'm out. I have a list of dealBreakers. I want the LLM to filter the noise so I can spend Saturday on cover letters, not searches.",
  },
  {
    tier: 'skip',
    title: 'Career changer, exploring',
    scenario:
      "I want to test what 'senior backend' means in different stages. I run scans with different profiles and compare.",
  },
];

export function UseCases() {
  return (
    <section className={styles.root}>
      <div className={styles.inner}>
        <h2 className={styles.title}>Who it's for</h2>
        <p className={styles.subtitle}>
          Three sketches. If one of these is you, Trajector saves you Saturday.
        </p>
        <div className={styles.grid}>
          {PERSONAS.map((p) => (
            <article key={p.title} className={styles.card}>
              <span className={`${styles.avatar} ${styles[p.tier]}`} />
              <p className={styles.cardTitle}>{p.title}</p>
              <p className={styles.cardBody}>{p.scenario}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
```

`src/components/UseCases/UseCases.module.css`:

```css
.root {
  padding: var(--space-7) var(--space-5);
}

.inner {
  max-width: 1120px;
  margin: 0 auto;
}

.title {
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  letter-spacing: var(--tracking-tight);
  margin: 0 0 var(--space-2);
  text-align: center;
}

.subtitle {
  font-size: var(--font-size-body);
  color: var(--text-secondary);
  margin: 0 0 var(--space-6);
  text-align: center;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-5);
}

@media (width <= 880px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

.card {
  background: var(--bg-elevated);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius);
  padding: var(--space-5);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
}

.strong { background: var(--score-strong); }
.decent { background: var(--score-decent); }
.skip { background: var(--score-skip); }

.cardTitle {
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin: 0;
}

.cardBody {
  font-size: var(--font-size-body);
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}
```

- [ ] **Step 4:** Tests pass + suite green.

- [ ] **Step 5: Commit**

```bash
git add src/components/UseCases
git commit -m "feat(components): add UseCases persona cards"
```

---

## Task 8: LocalFirstDiagram

CSS-only data-flow diagram.

**Files:** `src/components/LocalFirstDiagram/{LocalFirstDiagram.tsx, .module.css, .test.tsx}`

- [ ] **Step 1: Test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LocalFirstDiagram } from './LocalFirstDiagram';

describe('LocalFirstDiagram', () => {
  it('renders the heading', () => {
    render(<LocalFirstDiagram />);
    expect(screen.getByRole('heading', { name: /local-first/i })).toBeInTheDocument();
  });

  it('renders both nodes', () => {
    render(<LocalFirstDiagram />);
    expect(screen.getByText('Your browser')).toBeInTheDocument();
    expect(screen.getByText(/openrouter/i)).toBeInTheDocument();
  });

  it('renders the no-server caption', () => {
    render(<LocalFirstDiagram />);
    expect(screen.getByText(/no trajector servers/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2:** Fail.

- [ ] **Step 3: Implement**

`src/components/LocalFirstDiagram/LocalFirstDiagram.tsx`:

```tsx
import styles from './LocalFirstDiagram.module.css';

const BROWSER_BULLETS = ['Resume parsing', 'Profile extraction', 'Job scoring', 'UI rendering'];
const OR_BULLETS = ['Anthropic models', 'OpenAI models', 'Gemini, Llama, …'];

export function LocalFirstDiagram() {
  return (
    <section className={styles.root}>
      <div className={styles.inner}>
        <h2 className={styles.title}>Local-first by design</h2>
        <p className={styles.subtitle}>
          Your resume and your OpenRouter key never leave your browser. Trajector itself runs no servers.
        </p>
        <div className={styles.diagram}>
          <div className={styles.node}>
            <p className={styles.nodeTitle}>Your browser</p>
            <ul className={styles.bullets}>
              {BROWSER_BULLETS.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
          <div className={styles.connector} aria-hidden="true">
            <span className={styles.line} />
            <span className={styles.connectorLabel}>HTTPS</span>
            <span className={styles.line} />
          </div>
          <div className={styles.node}>
            <p className={styles.nodeTitle}>OpenRouter (your key)</p>
            <ul className={styles.bullets}>
              {OR_BULLETS.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className={styles.caption}>No Trajector servers. Ever.</p>
      </div>
    </section>
  );
}
```

`src/components/LocalFirstDiagram/LocalFirstDiagram.module.css`:

```css
.root {
  padding: var(--space-7) var(--space-5);
}

.inner {
  max-width: 1120px;
  margin: 0 auto;
}

.title {
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  letter-spacing: var(--tracking-tight);
  margin: 0 0 var(--space-2);
  text-align: center;
}

.subtitle {
  font-size: var(--font-size-body);
  color: var(--text-secondary);
  margin: 0 0 var(--space-6);
  text-align: center;
  max-width: 640px;
  margin-left: auto;
  margin-right: auto;
}

.diagram {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: var(--space-3);
  align-items: center;
  max-width: 880px;
  margin: 0 auto;
}

@media (width <= 880px) {
  .diagram {
    grid-template-columns: 1fr;
  }
}

.node {
  background: var(--bg-elevated);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius);
  padding: var(--space-5);
  box-shadow: var(--shadow-md);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.nodeTitle {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-3);
}

.bullets {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--font-size-mono);
  color: var(--text-secondary);
}

.bullets li::before {
  content: '·  ';
  color: var(--text-tertiary);
}

.connector {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-3);
}

@media (width <= 880px) {
  .connector {
    flex-direction: column;
    padding: var(--space-3) 0;
  }
}

.line {
  flex: 1;
  min-width: 32px;
  height: 1px;
  background: var(--border-strong);
}

@media (width <= 880px) {
  .line {
    width: 1px;
    height: 32px;
    min-width: 0;
  }
}

.connectorLabel {
  font-size: var(--font-size-caption);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.caption {
  text-align: center;
  font-size: var(--font-size-caption);
  color: var(--text-tertiary);
  margin: var(--space-5) 0 0;
}
```

- [ ] **Step 4:** Tests 3/3 pass + suite green.

- [ ] **Step 5: Commit**

```bash
git add src/components/LocalFirstDiagram
git commit -m "feat(components): add LocalFirstDiagram CSS data-flow art"
```

---

## Task 9: AppBar polish (Logo + hover pills)

Replace text wordmark with `<Logo />`. Add hover pills on nav links.

- [ ] **Step 1: Modify `src/components/AppBar/AppBar.tsx`**

Replace the brand `<button>` with `<button><Logo /></button>` (import Logo from `../Logo/Logo`).

```tsx
import { Logo } from '../Logo/Logo';
// ...
        <button
          type="button"
          className={styles.brand}
          aria-label="Trajector home"
          onClick={onBrandClick}
        >
          <Logo />
        </button>
```

- [ ] **Step 2: Update `src/components/AppBar/AppBar.module.css`**

The existing `.brand` styles a text wordmark; we need to update it to host the Logo. Replace the `.brand` block:

```css
.brand {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: var(--space-1);
  border-radius: var(--radius);
  transition: background-color var(--motion-fast) var(--easing-out);
}

.brand:hover {
  background: var(--bg-surface);
}

.brand:focus-visible {
  outline: var(--border-width) solid var(--accent);
  outline-offset: 2px;
}
```

Update the `.link` block to add a hover pill effect:

```css
.link {
  font-size: var(--font-size-body);
  color: var(--text-secondary);
  text-decoration: none;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius);
  transition: color var(--motion-fast) var(--easing-out),
              background-color var(--motion-fast) var(--easing-out);
}

.link:hover {
  color: var(--text-primary);
  background: var(--bg-surface);
}
```

- [ ] **Step 3: Update `src/components/AppBar/AppBar.test.tsx`**

The existing test asserts `screen.getByText('Trajector')` — that text now lives inside the Logo span with `aria-label="Trajector home"`. The text content is still "Trajector" so the assertion should still pass. Verify by running `npm test -- AppBar`.

If the existing brand-button test (`onBrandClick`) was finding via `getByRole('button', { name: /trajector home/i })` — note that NOW both the outer button AND the Logo span have aria-label "Trajector home". This will create ambiguity. Resolve by removing aria-label from Logo's outer `span` (since it's now nested in a button with the same label). Update Logo:

In `src/components/Logo/Logo.tsx`, remove the `aria-label` attribute from the root span. The component is now silent — its parent provides the accessible name.

Also update Logo's test that asserts `getByLabelText(/trajector home/i)` — change it to assert on the wordmark text only:

```tsx
  it('exposes the wordmark text for accessibility', () => {
    render(<Logo />);
    expect(screen.getByText('Trajector')).toBeInTheDocument();
  });
```

(remove the test "has accessible label" — it's no longer accurate post-merge with AppBar.)

- [ ] **Step 4:** Run all AppBar + Logo tests + full suite + typecheck + lint. All green.

- [ ] **Step 5: Commit**

```bash
git add src/components/AppBar src/components/Logo
git commit -m "feat(components): swap AppBar wordmark for Logo, add nav hover pills"
```

---

## Task 10: Hero v2

Bigger typography, dot-grid backdrop, decorative score-color dots, entrance animation, elevated DemoPreview slot.

- [ ] **Step 1: Update `src/components/Hero/Hero.tsx`**

Replace the entire file with:

```tsx
import type { ReactNode } from 'react';
import { DotGrid } from '../DotGrid/DotGrid';
import styles from './Hero.module.css';

interface Props {
  rightSlot: ReactNode;
  onPrimaryClick: () => void;
  onSecondaryClick: () => void;
}

export function Hero({ rightSlot, onPrimaryClick, onSecondaryClick }: Props) {
  return (
    <section className={styles.root}>
      <DotGrid spacing={32} />
      <span className={`${styles.float} ${styles.floatStrong}`} aria-hidden="true" />
      <span className={`${styles.float} ${styles.floatDecent}`} aria-hidden="true" />
      <span className={`${styles.float} ${styles.floatSkip}`} aria-hidden="true" />
      <div className={styles.inner}>
        <div className={styles.left}>
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            Open-source · Local-first · Free
          </p>
          <h1 className={styles.headline}>Find the few jobs worth your time.</h1>
          <p className={styles.sub}>
            Drop your resume. We'll synthesize a candidate profile, score live postings against it, and
            rank what's actually a fit. Your resume and your API key never leave your browser.
          </p>
          <div className={styles.ctas}>
            <button type="button" className={styles.primary} onClick={onPrimaryClick}>
              Drop your resume
            </button>
            <button type="button" className={styles.secondary} onClick={onSecondaryClick}>
              See an example scan
            </button>
          </div>
        </div>
        <div className={styles.right}>{rightSlot}</div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Replace `src/components/Hero/Hero.module.css`**

```css
.root {
  position: relative;
  padding: var(--space-7) var(--space-5);
  border-bottom: var(--border-width) solid var(--border-subtle);
  overflow: hidden;
}

.inner {
  position: relative;
  z-index: 1;
  max-width: 1120px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: var(--space-7);
  align-items: center;
}

@media (width <= 880px) {
  .inner {
    grid-template-columns: 1fr;
  }
}

.left {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  animation: fade-up 0.6s var(--easing-out) both;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  margin: 0;
}

.eyebrowDot {
  display: inline-block;
  width: 6px;
  height: 6px;
  background: var(--score-strong);
  border-radius: 50%;
}

.headline {
  font-size: var(--font-size-display);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  line-height: 1;
  letter-spacing: var(--tracking-display);
  margin: 0;
}

@media (width <= 880px) {
  .headline {
    font-size: 56px;
    letter-spacing: var(--tracking-tighter);
  }
}

.sub {
  font-size: 20px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
  max-width: 540px;
}

.ctas {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-3);
}

.primary {
  background: var(--accent);
  color: var(--on-accent);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius);
  border: none;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: background-color var(--motion-fast) var(--easing-out),
              box-shadow var(--motion-fast) var(--easing-out),
              transform var(--motion-fast) var(--easing-out);
}

.primary:hover {
  background: var(--accent-hover);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.secondary {
  background: transparent;
  color: var(--text-primary);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
  padding: var(--space-3) var(--space-5);
  border: var(--border-width) solid var(--border-strong);
  border-radius: var(--radius);
  cursor: pointer;
  transition: border-color var(--motion-fast) var(--easing-out);
}

.secondary:hover {
  border-color: var(--accent);
}

.right {
  position: relative;
  min-height: 320px;
  animation: fade-up 0.7s 0.1s var(--easing-out) both;
}

.float {
  position: absolute;
  border-radius: 50%;
  box-shadow: var(--shadow-glow);
  pointer-events: none;
  z-index: 0;
}

.floatStrong {
  width: 14px;
  height: 14px;
  background: var(--score-strong);
  top: 12%;
  right: 8%;
}

.floatDecent {
  width: 8px;
  height: 8px;
  background: var(--score-decent);
  top: 38%;
  right: 22%;
}

.floatSkip {
  width: 6px;
  height: 6px;
  background: var(--score-skip);
  top: 64%;
  right: 14%;
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .left, .right {
    animation: none;
  }
  .primary {
    transition: none;
  }
}
```

- [ ] **Step 3:** Update existing Hero tests if any assertion broke. The existing tests assert eyebrow/headline/sub render — they should still pass. Run `npm test -- Hero`.

- [ ] **Step 4:** Full `npm test` + typecheck + lint green.

- [ ] **Step 5: Commit**

```bash
git add src/components/Hero
git commit -m "feat(components): polish Hero with display type, dot-grid, decorative dots"
```

---

## Task 11: FeatureGrid v2 (6 cards)

Expand from 3 features to 6, add CSS-art icons.

- [ ] **Step 1: Replace `src/components/FeatureGrid/FeatureGrid.tsx`**

```tsx
import type { ScoreTier } from '../../types';
import styles from './FeatureGrid.module.css';

interface Feature {
  tier: ScoreTier;
  title: string;
  body: string;
}

const FEATURES: Feature[] = [
  {
    tier: 'strong',
    title: 'Triage by tier',
    body:
      'Strong, decent, skip — color-coded so you skim past the noise and see only the matches that earn your time.',
  },
  {
    tier: 'decent',
    title: 'Profile that actually matters',
    body:
      'Stack, comp floor, country, sponsorship, equity tolerance — fields that actually shift the score, not vanity inputs.',
  },
  {
    tier: 'skip',
    title: 'BYO model',
    body:
      'Use your OpenRouter key with Claude, GPT, Gemini, Llama. Switch any time, pay only for what you use.',
  },
  {
    tier: 'strong',
    title: 'Country-aware scoring',
    body:
      'Only see jobs you can actually take, in your country or fully remote. The LLM filters for you.',
  },
  {
    tier: 'decent',
    title: 'Sponsorship-respectful',
    body:
      'Mark sponsorship needs once. Postings that explicitly exclude you score lower automatically.',
  },
  {
    tier: 'skip',
    title: 'Open-source, MIT',
    body:
      'Read the code, fork it, run it locally. No black box, no lock-in, no telemetry.',
  },
];

export function FeatureGrid() {
  return (
    <section className={styles.root} id="features">
      <div className={styles.inner}>
        {FEATURES.map((f, i) => (
          <article key={`${f.tier}-${i}`} className={styles.card}>
            <span className={`${styles.icon} ${styles[f.tier]}`} aria-hidden="true" />
            <h3 className={styles.title}>{f.title}</h3>
            <p className={styles.body}>{f.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Replace `src/components/FeatureGrid/FeatureGrid.module.css`**

```css
.root {
  padding: var(--space-7) var(--space-5);
}

.inner {
  max-width: 1120px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-5);
}

@media (width <= 880px) {
  .inner {
    grid-template-columns: 1fr;
  }
}

.card {
  position: relative;
  background: var(--bg-surface);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--motion-fast) var(--easing-out),
              border-color var(--motion-fast) var(--easing-out),
              transform var(--motion-fast) var(--easing-out);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--border-strong);
  transform: translateY(-2px);
}

.icon {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  margin-bottom: var(--space-2);
  box-shadow: var(--shadow-sm);
}

.strong { background: var(--score-strong); }
.decent { background: var(--score-decent); }
.skip { background: var(--score-skip); }

.title {
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  letter-spacing: var(--tracking-tight);
  margin: 0;
}

.body {
  font-size: var(--font-size-body);
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}

@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
}
```

- [ ] **Step 3:** Update `FeatureGrid.test.tsx`. The existing test only checks 3 features — extend to verify all 6:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeatureGrid } from './FeatureGrid';

describe('FeatureGrid', () => {
  it('renders six feature headings', () => {
    render(<FeatureGrid />);
    expect(screen.getByText(/triage by tier/i)).toBeInTheDocument();
    expect(screen.getByText(/profile that actually matters/i)).toBeInTheDocument();
    expect(screen.getByText(/byo model/i)).toBeInTheDocument();
    expect(screen.getByText(/country-aware/i)).toBeInTheDocument();
    expect(screen.getByText(/sponsorship-respectful/i)).toBeInTheDocument();
    expect(screen.getByText(/open-source, mit/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 4:** Tests pass + suite + typecheck + lint green.

- [ ] **Step 5: Commit**

```bash
git add src/components/FeatureGrid
git commit -m "feat(components): expand FeatureGrid to 6 features with hover lift"
```

---

## Task 12: DemoPreview + Footer polish

Both tasks are small. Combine.

- [ ] **Step 1: Polish DemoPreview**

Update `src/components/DemoPreview/DemoPreview.module.css` — replace the `.root` block:

```css
.root {
  position: relative;
  background: var(--bg-elevated);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius);
  padding: var(--space-4);
  box-shadow: var(--shadow-lg);
  transition: transform var(--motion-base) var(--easing-out);
}

.root:hover {
  transform: scale(1.005);
}

.root::before {
  content: '';
  position: absolute;
  top: 16px;
  left: 16px;
  right: -16px;
  bottom: -16px;
  background: var(--bg-elevated);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  z-index: -1;
  opacity: 0.4;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .root {
    transition: none;
  }
}
```

Update the `.eyebrow` block to add a small recording-dot:

```css
.eyebrow {
  font-size: var(--font-size-caption);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
  margin: 0 0 var(--space-1);
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.eyebrow::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--score-strong);
  animation: pulse-dot 1.8s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@media (prefers-reduced-motion: reduce) {
  .eyebrow::before {
    animation: none;
  }
}
```

- [ ] **Step 2: Polish Footer**

Replace `src/components/Footer/Footer.tsx`:

```tsx
import { Logo } from '../Logo/Logo';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.brandCol}>
          <Logo size="sm" />
          <p className={styles.tagline}>Find the few jobs worth your time.</p>
        </div>
        <div className={styles.col}>
          <p className={styles.colTitle}>Product</p>
          <ul className={styles.list}>
            <li><a href="#how" className={styles.link}>How it works</a></li>
            <li><a href="#features" className={styles.link}>Features</a></li>
            <li><a href="#faq" className={styles.link}>FAQ</a></li>
          </ul>
        </div>
        <div className={styles.col}>
          <p className={styles.colTitle}>Code</p>
          <ul className={styles.list}>
            <li>
              <a className={styles.link} href="https://github.com/ahammedejaz/trajector" target="_blank" rel="noreferrer">
                GitHub
              </a>
            </li>
            <li>
              <a className={styles.link} href="https://github.com/ahammedejaz/trajector/issues" target="_blank" rel="noreferrer">
                Issues
              </a>
            </li>
            <li>
              <a className={styles.link} href="https://github.com/ahammedejaz/trajector/blob/main/LICENSE" target="_blank" rel="noreferrer">
                MIT License
              </a>
            </li>
          </ul>
        </div>
        <div className={styles.col}>
          <p className={styles.colTitle}>About</p>
          <ul className={styles.list}>
            <li><span className={styles.muted}>Built by Syed Ejaz Ahammed</span></li>
            <li><span className={styles.muted}>v0.1 · 2026</span></li>
          </ul>
        </div>
      </div>
      <div className={styles.bottom}>
        <p className={styles.copy}>Trajector v0.1 · MIT License</p>
        <p className={styles.muted}>No accounts. No telemetry. Bring your own key.</p>
      </div>
    </footer>
  );
}
```

Replace `src/components/Footer/Footer.module.css`:

```css
.root {
  padding: var(--space-7) var(--space-5) var(--space-5);
  border-top: var(--border-width) solid var(--border-subtle);
  margin-top: var(--space-7);
}

.inner {
  max-width: 1120px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.5fr repeat(3, 1fr);
  gap: var(--space-6);
}

@media (width <= 880px) {
  .inner {
    grid-template-columns: 1fr 1fr;
  }
}

.brandCol {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.tagline {
  font-size: var(--font-size-caption);
  color: var(--text-tertiary);
  line-height: 1.5;
  margin: 0;
  max-width: 240px;
}

.col {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.colTitle {
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 var(--space-1);
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.link {
  font-size: var(--font-size-caption);
  color: var(--text-secondary);
  text-decoration: none;
  transition: color var(--motion-fast) var(--easing-out);
}

.link:hover {
  color: var(--text-primary);
}

.muted {
  font-size: var(--font-size-caption);
  color: var(--text-tertiary);
}

.bottom {
  max-width: 1120px;
  margin: var(--space-6) auto 0;
  padding-top: var(--space-4);
  border-top: var(--border-width) solid var(--border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-caption);
  color: var(--text-tertiary);
  flex-wrap: wrap;
  gap: var(--space-3);
}

.copy {
  margin: 0;
}
```

- [ ] **Step 3:** Update `Footer.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer', () => {
  it('renders the bottom strip', () => {
    render(<Footer />);
    expect(screen.getByText(/Trajector v0\.1 · MIT/i)).toBeInTheDocument();
  });

  it('renders the GitHub link', () => {
    render(<Footer />);
    const githubLinks = screen.getAllByText(/github/i);
    expect(githubLinks.length).toBeGreaterThan(0);
  });

  it('renders all four columns', () => {
    render(<Footer />);
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });
});
```

- [ ] **Step 4:** Run all tests + typecheck + lint green.

- [ ] **Step 5: Commit**

```bash
git add src/components/DemoPreview src/components/Footer
git commit -m "feat(components): polish DemoPreview ambient layer and Footer 4-col"
```

---

## Task 13: Confirm + Results polish

Add background dot-grid, decorative dots, refined separators.

- [ ] **Step 1: Add DotGrid backdrop to Confirm**

Update `src/screens/Confirm/Confirm.tsx` — wrap the root in a positioned container so DotGrid can absolute-position behind:

```tsx
import { DotGrid } from '../../components/DotGrid/DotGrid';
// ...
  return (
    <div className={styles.root}>
      <DotGrid spacing={32} />
      <div className={styles.content}>
        {/* existing header + sections + CTA row */}
      </div>
    </div>
  );
```

Wrap the existing `<header>` + `<div className={styles.sections}>` + `<div className={styles.ctaRow}>` inside a new `<div className={styles.content}>`.

Update `src/screens/Confirm/Confirm.module.css` — modify `.root`:

```css
.root {
  position: relative;
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-5);
}

.content {
  position: relative;
  z-index: 1;
}
```

Add an opacity reduction to DotGrid via theme — actually it's already at 0.12 globally. Good enough.

- [ ] **Step 2: Polish Results scan visualization with a radar sweep**

Update `src/components/SourceRow/SourceRow.module.css` — REPLACE the existing `.row` block:

```css
.row {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) 0;
  font-size: var(--font-size-caption);
  overflow: hidden;
}

.row::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: var(--bg-surface-2);
  opacity: 0;
  transform: translateX(-100%);
}
```

Then add scanning sweep keyframe — append at the end of the file:

```css
.scanningRow::before {
  opacity: 0.35;
  animation: sweep 1.6s ease-in-out infinite;
}

@keyframes sweep {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@media (prefers-reduced-motion: reduce) {
  .scanningRow::before {
    animation: none;
    opacity: 0;
  }
}
```

Update `src/components/SourceRow/SourceRow.tsx` — add the `scanningRow` class when status is scanning:

Replace the return statement:

```tsx
  return (
    <div className={`${styles.row}${status === 'scanning' ? ` ${styles.scanningRow}` : ''}`}>
      <span className={`${styles.glyph} ${styles[status]}`}>{GLYPH[status]}</span>
      <span className={styles.label}>{label}</span>
      <span className={styles.status}>{statusText(status, count)}</span>
    </div>
  );
```

The existing 4 SourceRow tests should still pass — adding a class doesn't change rendered text.

- [ ] **Step 3: Polish Results group-section headers**

Update `src/screens/Results/Results.module.css` — replace `.groupTitle` block:

```css
.groupTitle {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  letter-spacing: var(--tracking-tight);
  margin: 0 0 var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: var(--border-width) solid var(--border-subtle);
}
```

- [ ] **Step 4:** All Confirm + Results + SourceRow tests still pass. Run full suite, typecheck, lint.

- [ ] **Step 5: Commit**

```bash
git add src/screens/Confirm src/screens/Results src/components/SourceRow
git commit -m "feat(screens): polish Confirm with dot-grid, Results with radar sweep"
```

---

## Task 14: Landing assembly + e2e + verification + push PR

Compose the new section order. Update e2e. Run all checks. Push.

- [ ] **Step 1: Replace `src/screens/Landing/Landing.tsx`**

```tsx
import type { ResumeText } from '../../types';
import { Upload } from '../Upload/Upload';
import { Hero } from '../../components/Hero/Hero';
import { TrustBar } from '../../components/TrustBar/TrustBar';
import { StatsRow } from '../../components/StatsRow/StatsRow';
import { FeatureGrid } from '../../components/FeatureGrid/FeatureGrid';
import { HowItScores } from '../../components/HowItScores/HowItScores';
import { HowItWorksStrip } from '../../components/HowItWorksStrip/HowItWorksStrip';
import { ComparisonTable } from '../../components/ComparisonTable/ComparisonTable';
import { UseCases } from '../../components/UseCases/UseCases';
import { FaqAccordion } from '../../components/FaqAccordion/FaqAccordion';
import { LocalFirstDiagram } from '../../components/LocalFirstDiagram/LocalFirstDiagram';
import { Footer } from '../../components/Footer/Footer';
import { DemoPreview } from '../../components/DemoPreview/DemoPreview';
import styles from './Landing.module.css';

interface Props {
  onResumeParsed: (rt: ResumeText) => void;
  analyzeError: string | null;
}

function scrollTo(id: string) {
  const el = document.getElementById(id);
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function Landing({ onResumeParsed, analyzeError }: Props) {
  return (
    <div className={styles.root}>
      <Hero
        rightSlot={<DemoPreview />}
        onPrimaryClick={() => scrollTo('drop')}
        onSecondaryClick={() => scrollTo('features')}
      />
      <TrustBar />
      <StatsRow />
      <FeatureGrid />
      <HowItScores />
      <HowItWorksStrip />
      <ComparisonTable />
      <UseCases />
      <section id="drop" className={styles.dropSection}>
        <div className={styles.dropInner}>
          <Upload onResumeParsed={onResumeParsed} analyzeError={analyzeError} />
        </div>
      </section>
      <FaqAccordion />
      <LocalFirstDiagram />
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2:** Update `src/screens/Landing/Landing.test.tsx` — add assertions for the new sections:

```tsx
  it('renders the new sections', () => {
    render(<Landing onResumeParsed={() => {}} analyzeError={null} />);
    expect(screen.getByText(/jobs scored per scan/i)).toBeInTheDocument(); // StatsRow
    expect(screen.getByRole('heading', { name: /how it scores/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /vs the alternatives/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /who.*for/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /local-first by design/i })).toBeInTheDocument();
  });
```

- [ ] **Step 3:** Update `tests/e2e/landing.spec.ts` — add assertions:

```typescript
  test('shows new polish sections', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/jobs scored per scan/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /how it scores/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /vs the alternatives/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /who.*for/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /local-first by design/i })).toBeVisible();
  });
```

- [ ] **Step 4:** Run all checks IN SEQUENCE — must all pass before push:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

If any fails, STOP, investigate, fix.

- [ ] **Step 5: Commit + push + open PR:**

```bash
git add src/screens/Landing tests/e2e
git commit -m "feat(screens): assemble Landing with 5 new sections, polish-pass"

git push -u origin feat/v0-plan-5-polish

gh pr create --base main --title "Plan 5: Polish pass — display type, depth, 5 new landing sections" --body "$(cat <<'EOF'
## Summary
- Push the UI from "minimal Linear-style" to "professional SaaS product" without adding new color tokens or gradients
- Display typography scale (72/90px hero), letter-spacing scale, multi-layer shadow tokens, new \`--bg-elevated\` surface tone
- Custom Logo component (geometric mark + wordmark) replacing the AppBar text wordmark
- 7 new components: Logo, DotGrid, StatsRow, HowItScores, ComparisonTable, UseCases, LocalFirstDiagram
- Landing expanded from 6 sections to 12 sections — stats row, algorithm explainer, comparison table, use-case personas, local-first diagram all added
- FeatureGrid expanded from 3 to 6 features with hover lift and CSS-art icons
- Hero v2 with display type, dot-grid backdrop, decorative score-color floats, entrance animation
- Confirm gets a faint dot-grid backdrop; Results gets a radar-sweep scan animation
- Footer expanded to a 4-column site map

## Constraints honored
- ✅ No new color tokens (score colors remain only chromatic accents)
- ✅ No gradients anywhere (stylelint ban remains)
- ✅ \`prefers-reduced-motion\` honored on every animation

## Test plan
- [x] \`npm run typecheck\`
- [x] \`npm run lint\`
- [x] \`npm test\` (full suite, new components covered)
- [x] \`npm run build\`
- [x] \`npm run test:e2e\` (landing.spec adds polish-section coverage)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-Review

**Spec coverage:**
- Logo + DotGrid + StatsRow + HowItScores + ComparisonTable + UseCases + LocalFirstDiagram ✅ Tasks 2–8
- Hero v2 (typography + dot-grid + decorative dots + motion) ✅ Task 10
- FeatureGrid v2 (6 cards with icons) ✅ Task 11
- DemoPreview polish (elevated card + ambient layer + recording dot) ✅ Task 12
- Footer v2 (4-col) ✅ Task 12
- AppBar polish (Logo + hover pills) ✅ Task 9
- Confirm dot-grid + Results radar sweep ✅ Task 13
- Landing assembly with new section order ✅ Task 14

**Constraints honored:**
- No new color tokens — only `--bg-elevated` (achromatic), shadow scale (neutral black), and typography/spacing additions
- No gradients — verified by reading every CSS block; stylelint will catch any
- `prefers-reduced-motion` on every animation

**Risks:**
- DotGrid uses `currentColor` and inherits from CSS module class. Verify `color: var(--text-tertiary)` actually reaches the SVG.
- Hero animation may be too subtle to land on the user — if so, bump to 12px translateY and 0.8s duration.
- ComparisonTable on narrow viewports needs a horizontal scroll; the `overflow: hidden` on the wrapper should be `overflow-x: auto` for that case. Add if needed.
- Footer 4-col on mid-width (880px breakpoint) drops to 2-col — check this looks OK in browser.

**Cuts (none — full scope per user direction).**
