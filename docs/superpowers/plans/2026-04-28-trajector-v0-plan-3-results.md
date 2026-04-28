# Trajector v0 — Plan 3: Results Screen + LLM-Powered Scan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the StubScan placeholder with a real Results screen that ranks plausible job listings against the user's profile using a single batched OpenRouter call, surfacing scored matches in a Linear-style dark UI.

**Architecture:** A browser SPA can't scrape LinkedIn/Greenhouse/etc. (CORS, auth, ToS), so the "scan" is one batched LLM call that synthesizes 15 realistic, profile-tuned listings — each with a 0–100 score — distributed across the user's enabled sources. The Results screen drives the scan in a `useEffect`, shows theatrical per-source progress while the call is in flight, then groups matches by score tier (Strong ≥ 80, Decent 50–79, Skip < 50) into a clickable list. A right-anchored SideSheet renders the full description on click; a top-right ProfileMenu wires Edit profile / Switch resume / Settings shortcuts back to existing screens.

**Tech Stack:** React 19 + TypeScript 5.9 + CSS Modules + Vitest + Playwright. Reuses `src/lib/openrouter.ts` (Plan 2) for the API call. No new dependencies.

---

## File Structure

**New files:**
- `src/lib/scoreTier.ts` — pure helper, `score → 'strong' | 'decent' | 'skip'`
- `src/lib/scoreTier.test.ts`
- `src/lib/scanJobs.ts` — calls OpenRouter, parses + coerces job array
- `src/lib/scanJobs.test.ts`
- `src/components/ScoreDot/ScoreDot.tsx` — 8px colored circle keyed off tier
- `src/components/ScoreDot/ScoreDot.module.css`
- `src/components/ScoreDot/ScoreDot.test.tsx`
- `src/components/JobCard/JobCard.tsx` — clickable row (dot + title/company + meta + tags)
- `src/components/JobCard/JobCard.module.css`
- `src/components/JobCard/JobCard.test.tsx`
- `src/components/SourceRow/SourceRow.tsx` — progress glyph (○/◐/✓/✗) + name + status
- `src/components/SourceRow/SourceRow.module.css`
- `src/components/SourceRow/SourceRow.test.tsx`
- `src/components/SideSheet/SideSheet.tsx` — right-anchored 480px slide panel + backdrop
- `src/components/SideSheet/SideSheet.module.css`
- `src/components/SideSheet/SideSheet.test.tsx`
- `src/components/ProfileMenu/ProfileMenu.tsx` — top-right avatar dropdown
- `src/components/ProfileMenu/ProfileMenu.module.css`
- `src/components/ProfileMenu/ProfileMenu.test.tsx`
- `src/screens/Results/Results.tsx` — assembles everything, owns scan state
- `src/screens/Results/Results.module.css`
- `src/screens/Results/Results.test.tsx`
- `tests/e2e/results.spec.ts` — Playwright tests for the results flow

**Modified files:**
- `src/types.ts` — add `ScoreTier`, `ScoredJob`, `SourceState`, `SourceStatus`, `ScanProgress`; change `Screen` from `'stubScan'` to `'results'`
- `src/App.tsx` — replace `stubScan` branch with `results`; wire ProfileMenu callbacks (`onEditProfile` → confirm, `onSwitchResume` → reset, `onOpenSettings` → settings); remove StubScan import
- `tests/e2e/upload.spec.ts` — update assertions that referenced "Scanning the open web" / "Start over" to match new Results screen

**Deleted files:**
- `src/screens/StubScan/StubScan.tsx`
- `src/screens/StubScan/StubScan.module.css`

---

## Task 1: Extend Types and Switch Screen Discriminator

**Files:**
- Modify: `src/types.ts`
- Modify: `src/App.tsx` (only the import + screen literal — don't wire new behavior yet; this task is a typed contract change)

- [ ] **Step 1: Extend types**

Replace the contents of `src/types.ts` with:

```typescript
export type ResumeFileKind = 'pdf' | 'docx' | 'md';
export interface ResumeText {
  kind: ResumeFileKind;
  filename: string;
  text: string;
  byteSize: number;
}
export type Level = 'junior' | 'mid' | 'senior' | 'staff' | 'principal';
export type LocationPref = 'remote' | 'hybrid' | 'onsite';
export interface Profile {
  targetRole: string;
  level: Level;
  compFloor: number | null;
  location: LocationPref;
  stackSignals: string[];
  dealBreakers: string[];
}
export interface AppSettings {
  openRouterKey: string;
  model: string;
  sources: {
    linkedin: boolean;
    greenhouse: boolean;
    lever: boolean;
    workable: boolean;
    yc: boolean;
  };
}
export type SourceKey = keyof AppSettings['sources'];
export type ScoreTier = 'strong' | 'decent' | 'skip';
export interface ScoredJob {
  id: string;
  source: SourceKey;
  company: string;
  title: string;
  location: string;
  compRange: string | null;
  description: string;
  tags: string[];
  score: number;
  scoreReason: string;
}
export type SourceStatus = 'queued' | 'scanning' | 'done' | 'error';
export interface SourceState {
  key: SourceKey;
  label: string;
  status: SourceStatus;
}
export interface ScanProgress {
  sources: SourceState[];
  jobs: ScoredJob[];
  error: string | null;
  finished: boolean;
}
export type Screen = 'upload' | 'analyzing' | 'settings' | 'confirm' | 'results';
```

- [ ] **Step 2: Update App.tsx import + screen literal so the project still typechecks**

In `src/App.tsx`:

1. Change the import from `import { StubScan } from './screens/StubScan/StubScan';` to `import { Results } from './screens/Results/Results';`. The `Results` file does not exist yet — TS will error on this import. That is expected; we will fix it in Task 9.

   **Workaround for this task:** temporarily keep the StubScan import but rename the screen literal so we can typecheck:
   - Leave `import { StubScan } from './screens/StubScan/StubScan';` in place (we delete it in Task 10).
   - In `handleConfirm`, change `setScreen('stubScan')` to `setScreen('results')`.
   - In the `if (screen === 'stubScan' && profile)` block, change to `if (screen === 'results' && profile)`. Inside, keep `<StubScan ... />` for now (still works because StubScan accepts the same props). We replace this wholesale in Task 10.

   This keeps the app green between tasks.

- [ ] **Step 3: Verify typecheck passes**

Run: `npm run typecheck`
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/types.ts src/App.tsx
git commit -m "feat(types): add ScoredJob/SourceState/ScanProgress and switch screen to results"
```

---

## Task 2: scoreTier Helper

**Files:**
- Create: `src/lib/scoreTier.ts`
- Create: `src/lib/scoreTier.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/scoreTier.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { scoreTier } from './scoreTier';

describe('scoreTier', () => {
  it('returns "strong" for scores >= 80', () => {
    expect(scoreTier(80)).toBe('strong');
    expect(scoreTier(95)).toBe('strong');
    expect(scoreTier(100)).toBe('strong');
  });

  it('returns "decent" for scores 50-79', () => {
    expect(scoreTier(50)).toBe('decent');
    expect(scoreTier(65)).toBe('decent');
    expect(scoreTier(79)).toBe('decent');
  });

  it('returns "skip" for scores < 50', () => {
    expect(scoreTier(0)).toBe('skip');
    expect(scoreTier(25)).toBe('skip');
    expect(scoreTier(49)).toBe('skip');
  });

  it('clamps out-of-range scores', () => {
    expect(scoreTier(-10)).toBe('skip');
    expect(scoreTier(150)).toBe('strong');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- scoreTier`
Expected: FAIL with `Cannot find module './scoreTier'`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/scoreTier.ts`:

```typescript
import type { ScoreTier } from '../types';

export function scoreTier(score: number): ScoreTier {
  if (score >= 80) return 'strong';
  if (score >= 50) return 'decent';
  return 'skip';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- scoreTier`
Expected: PASS, 4/4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scoreTier.ts src/lib/scoreTier.test.ts
git commit -m "feat(lib): add scoreTier helper to bucket scores into tiers"
```

---

## Task 3: scanJobs — Single Batched LLM Call

**Files:**
- Create: `src/lib/scanJobs.ts`
- Create: `src/lib/scanJobs.test.ts`

The function takes a `Profile` and the enabled `SourceKey[]`, calls OpenRouter, parses the JSON array, and coerces it into `ScoredJob[]`. Coercion: drop records missing `id`/`title`/`company`/`description`, clamp score to 0–100, default missing fields, dedupe by id, force `source` to one of the enabled keys (rotating through enabled if model returns an unknown one).

- [ ] **Step 1: Write the failing test**

Create `src/lib/scanJobs.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scanJobs } from './scanJobs';
import type { Profile, SourceKey } from '../types';

const PROFILE: Profile = {
  targetRole: 'Senior Backend Engineer',
  level: 'senior',
  compFloor: 200000,
  location: 'remote',
  stackSignals: ['Go', 'PostgreSQL'],
  dealBreakers: [],
};

const SOURCES: SourceKey[] = ['linkedin', 'greenhouse', 'lever'];

function mockOR(content: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ choices: [{ message: { content: JSON.stringify(content) } }] }),
  });
}

describe('scanJobs', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockOR([]));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('returns parsed jobs from the model', async () => {
    const payload = [
      {
        id: 'j1',
        source: 'linkedin',
        company: 'Acme',
        title: 'Senior Backend Engineer',
        location: 'Remote',
        compRange: '$220k-$260k',
        description: 'Build scalable Go services.',
        tags: ['Go', 'Postgres'],
        score: 92,
        scoreReason: 'Stack and seniority match.',
      },
    ];
    vi.stubGlobal('fetch', mockOR(payload));
    const jobs = await scanJobs(PROFILE, SOURCES, 'sk-or-test', 'anthropic/claude-sonnet-4-6');
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({ id: 'j1', score: 92, source: 'linkedin' });
  });

  it('clamps scores to 0-100', async () => {
    const payload = [
      { id: 'a', source: 'linkedin', company: 'A', title: 'T', location: 'Remote', description: 'd', tags: [], score: 150, scoreReason: 'r' },
      { id: 'b', source: 'linkedin', company: 'B', title: 'T', location: 'Remote', description: 'd', tags: [], score: -10, scoreReason: 'r' },
    ];
    vi.stubGlobal('fetch', mockOR(payload));
    const jobs = await scanJobs(PROFILE, SOURCES, 'k', 'm');
    expect(jobs[0].score).toBe(100);
    expect(jobs[1].score).toBe(0);
  });

  it('drops records missing required fields', async () => {
    const payload = [
      { id: 'good', source: 'linkedin', company: 'A', title: 'T', location: 'Remote', description: 'd', tags: [], score: 80, scoreReason: 'r' },
      { id: 'bad-no-title', source: 'linkedin', company: 'A', location: 'Remote', description: 'd', tags: [], score: 80, scoreReason: 'r' },
      { source: 'linkedin', company: 'A', title: 'T', location: 'Remote', description: 'd', tags: [], score: 80, scoreReason: 'r' },
    ];
    vi.stubGlobal('fetch', mockOR(payload));
    const jobs = await scanJobs(PROFILE, SOURCES, 'k', 'm');
    expect(jobs).toHaveLength(1);
    expect(jobs[0].id).toBe('good');
  });

  it('dedupes by id', async () => {
    const payload = [
      { id: 'x', source: 'linkedin', company: 'A', title: 'T', location: 'Remote', description: 'd', tags: [], score: 80, scoreReason: 'r' },
      { id: 'x', source: 'linkedin', company: 'B', title: 'T', location: 'Remote', description: 'd', tags: [], score: 70, scoreReason: 'r' },
    ];
    vi.stubGlobal('fetch', mockOR(payload));
    const jobs = await scanJobs(PROFILE, SOURCES, 'k', 'm');
    expect(jobs).toHaveLength(1);
    expect(jobs[0].company).toBe('A');
  });

  it('rewrites unknown source to first enabled source', async () => {
    const payload = [
      { id: 'a', source: 'wellfound', company: 'A', title: 'T', location: 'Remote', description: 'd', tags: [], score: 80, scoreReason: 'r' },
    ];
    vi.stubGlobal('fetch', mockOR(payload));
    const jobs = await scanJobs(PROFILE, SOURCES, 'k', 'm');
    expect(jobs[0].source).toBe('linkedin');
  });

  it('throws if model returns invalid JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'not json' } }] }),
    }));
    await expect(scanJobs(PROFILE, SOURCES, 'k', 'm')).rejects.toThrow('Model returned invalid JSON');
  });

  it('throws if model returns a non-array', async () => {
    vi.stubGlobal('fetch', mockOR({ jobs: [] }));
    await expect(scanJobs(PROFILE, SOURCES, 'k', 'm')).rejects.toThrow('Expected an array of jobs');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- scanJobs`
Expected: FAIL with `Cannot find module './scanJobs'`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/scanJobs.ts`:

```typescript
import { fetchCompletion } from './openrouter';
import type { Profile, ScoredJob, SourceKey } from '../types';

const SOURCE_LABELS: Record<SourceKey, string> = {
  linkedin: 'LinkedIn',
  greenhouse: 'Greenhouse',
  lever: 'Lever',
  workable: 'Workable',
  yc: 'Y Combinator',
};

function buildSystemPrompt(enabledSources: SourceKey[]): string {
  const sourceList = enabledSources.map((s) => `"${s}"`).join(', ');
  return `You are a job-search assistant. Generate exactly 15 realistic job postings tuned to the candidate's profile. Return ONLY a JSON array — no markdown fences, no commentary.

Each item:
{
  "id": string (unique short slug),
  "source": one of [${sourceList}],
  "company": string,
  "title": string,
  "location": string (e.g. "Remote (US)", "San Francisco, CA"),
  "compRange": string | null (e.g. "$200k-$240k" or null),
  "description": string (4-6 sentences, plausible posting prose),
  "tags": string[] (3-5 tech / domain tags),
  "score": number 0-100 (how well this matches the candidate),
  "scoreReason": string (one sentence justifying the score)
}

Rules:
- Distribute postings across the enabled sources (don't put them all on one)
- Mix tiers: ~4 strong (>=80), ~6 decent (50-79), ~5 skip (<50). Skips help calibrate.
- Honor compFloor: postings below it score lower
- Honor dealBreakers: postings violating them score lower
- Vary companies; no duplicates`;
}

function coerceJob(raw: unknown, enabledSources: SourceKey[]): ScoredJob | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || typeof r.title !== 'string' || typeof r.company !== 'string' || typeof r.description !== 'string') {
    return null;
  }
  const sourceCandidate = typeof r.source === 'string' ? r.source : '';
  const source: SourceKey = enabledSources.includes(sourceCandidate as SourceKey)
    ? (sourceCandidate as SourceKey)
    : enabledSources[0];
  const rawScore = typeof r.score === 'number' ? r.score : 0;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));
  return {
    id: r.id,
    source,
    company: r.company,
    title: r.title,
    location: typeof r.location === 'string' ? r.location : 'Remote',
    compRange: typeof r.compRange === 'string' ? r.compRange : null,
    description: r.description,
    tags: Array.isArray(r.tags) ? r.tags.filter((t): t is string => typeof t === 'string').slice(0, 5) : [],
    score,
    scoreReason: typeof r.scoreReason === 'string' ? r.scoreReason : '',
  };
}

export async function scanJobs(
  profile: Profile,
  enabledSources: SourceKey[],
  apiKey: string,
  model: string,
): Promise<ScoredJob[]> {
  if (enabledSources.length === 0) return [];
  const system = buildSystemPrompt(enabledSources);
  const user = JSON.stringify(profile, null, 2);

  const raw = await fetchCompletion(apiKey, model, [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Model returned invalid JSON');
  }
  if (!Array.isArray(parsed)) throw new Error('Expected an array of jobs');

  const seen = new Set<string>();
  const jobs: ScoredJob[] = [];
  for (const item of parsed) {
    const job = coerceJob(item, enabledSources);
    if (!job) continue;
    if (seen.has(job.id)) continue;
    seen.add(job.id);
    jobs.push(job);
  }
  return jobs;
}

export { SOURCE_LABELS };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- scanJobs`
Expected: PASS, 7/7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scanJobs.ts src/lib/scanJobs.test.ts
git commit -m "feat(lib): add scanJobs to synthesize scored listings via OpenRouter"
```

---

## Task 4: ScoreDot Component

A 8px solid circle whose color is keyed off the `ScoreTier`. Used in JobCard, the section headers, and (later) elsewhere.

**Files:**
- Create: `src/components/ScoreDot/ScoreDot.tsx`
- Create: `src/components/ScoreDot/ScoreDot.module.css`
- Create: `src/components/ScoreDot/ScoreDot.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/ScoreDot/ScoreDot.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ScoreDot } from './ScoreDot';

describe('ScoreDot', () => {
  it('renders a strong tier dot', () => {
    const { container } = render(<ScoreDot tier="strong" />);
    const dot = container.querySelector('span');
    expect(dot).not.toBeNull();
    expect(dot!.className).toMatch(/strong/);
  });

  it('renders a decent tier dot', () => {
    const { container } = render(<ScoreDot tier="decent" />);
    expect(container.querySelector('span')!.className).toMatch(/decent/);
  });

  it('renders a skip tier dot', () => {
    const { container } = render(<ScoreDot tier="skip" />);
    expect(container.querySelector('span')!.className).toMatch(/skip/);
  });

  it('forwards aria-label when provided', () => {
    const { container } = render(<ScoreDot tier="strong" ariaLabel="Strong match" />);
    expect(container.querySelector('span')!.getAttribute('aria-label')).toBe('Strong match');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ScoreDot`
Expected: FAIL with `Cannot find module './ScoreDot'`.

- [ ] **Step 3: Write the implementation**

Create `src/components/ScoreDot/ScoreDot.tsx`:

```tsx
import type { ScoreTier } from '../../types';
import styles from './ScoreDot.module.css';

interface Props {
  tier: ScoreTier;
  ariaLabel?: string;
}

export function ScoreDot({ tier, ariaLabel }: Props) {
  return (
    <span
      className={`${styles.dot} ${styles[tier]}`}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
    />
  );
}
```

Create `src/components/ScoreDot/ScoreDot.module.css`:

```css
.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.strong {
  background: var(--score-strong);
}

.decent {
  background: var(--score-decent);
}

.skip {
  background: var(--score-skip);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ScoreDot`
Expected: PASS, 4/4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/ScoreDot
git commit -m "feat(components): add ScoreDot for tier-colored indicator"
```

---

## Task 5: JobCard Component

A clickable row showing dot + title + company/location/comp + tags. Score number is rendered subtly on the right.

**Files:**
- Create: `src/components/JobCard/JobCard.tsx`
- Create: `src/components/JobCard/JobCard.module.css`
- Create: `src/components/JobCard/JobCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/JobCard/JobCard.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JobCard } from './JobCard';
import type { ScoredJob } from '../../types';

const JOB: ScoredJob = {
  id: 'j1',
  source: 'linkedin',
  company: 'Acme Corp',
  title: 'Senior Backend Engineer',
  location: 'Remote (US)',
  compRange: '$220k-$260k',
  description: 'Build scalable Go services.',
  tags: ['Go', 'Postgres', 'Kubernetes'],
  score: 92,
  scoreReason: 'Stack matches.',
};

describe('JobCard', () => {
  it('renders title, company, location, comp, and tags', () => {
    render(<JobCard job={JOB} onClick={() => {}} />);
    expect(screen.getByText('Senior Backend Engineer')).toBeInTheDocument();
    expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
    expect(screen.getByText(/Remote \(US\)/)).toBeInTheDocument();
    expect(screen.getByText(/\$220k-\$260k/)).toBeInTheDocument();
    expect(screen.getByText('Go')).toBeInTheDocument();
    expect(screen.getByText('Postgres')).toBeInTheDocument();
  });

  it('renders the score', () => {
    render(<JobCard job={JOB} onClick={() => {}} />);
    expect(screen.getByText('92')).toBeInTheDocument();
  });

  it('omits comp when null', () => {
    render(<JobCard job={{ ...JOB, compRange: null }} onClick={() => {}} />);
    expect(screen.queryByText(/\$220k/)).not.toBeInTheDocument();
  });

  it('calls onClick when activated', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<JobCard job={JOB} onClick={onClick} />);
    await user.click(screen.getByRole('button', { name: /Senior Backend Engineer/i }));
    expect(onClick).toHaveBeenCalledWith(JOB);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- JobCard`
Expected: FAIL with `Cannot find module './JobCard'`.

- [ ] **Step 3: Write the implementation**

Create `src/components/JobCard/JobCard.tsx`:

```tsx
import type { ScoredJob } from '../../types';
import { ScoreDot } from '../ScoreDot/ScoreDot';
import { scoreTier } from '../../lib/scoreTier';
import styles from './JobCard.module.css';

interface Props {
  job: ScoredJob;
  onClick: (job: ScoredJob) => void;
}

export function JobCard({ job, onClick }: Props) {
  const tier = scoreTier(job.score);
  const meta = [job.company, job.location, job.compRange].filter(Boolean).join(' · ');
  return (
    <button
      type="button"
      className={styles.root}
      onClick={() => onClick(job)}
      aria-label={`${job.title} at ${job.company}`}
    >
      <ScoreDot tier={tier} />
      <div className={styles.body}>
        <p className={styles.title}>{job.title}</p>
        <p className={styles.meta}>{meta}</p>
        {job.tags.length > 0 && (
          <div className={styles.tags}>
            {job.tags.map((t) => (
              <span key={t} className={styles.tag}>{t}</span>
            ))}
          </div>
        )}
      </div>
      <span className={styles.score}>{job.score}</span>
    </button>
  );
}
```

Create `src/components/JobCard/JobCard.module.css`:

```css
.root {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-4) var(--space-3);
  background: transparent;
  border: none;
  border-bottom: var(--border-width) solid var(--border-subtle);
  text-align: left;
  cursor: pointer;
  transition: background-color var(--motion-fast) var(--easing-out);
}

.root:hover {
  background: var(--bg-surface);
}

.root:focus-visible {
  outline: var(--border-width) solid var(--accent);
  outline-offset: -1px;
}

.body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.title {
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin: 0;
}

.meta {
  font-size: var(--font-size-caption);
  color: var(--text-secondary);
  margin: 0;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-2);
  margin-top: var(--space-1);
}

.tag {
  font-size: var(--font-size-caption);
  color: var(--text-tertiary);
  padding: 2px var(--space-2);
  background: var(--bg-surface-2);
  border-radius: var(--radius);
}

.score {
  font-size: var(--font-size-mono);
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
  align-self: center;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- JobCard`
Expected: PASS, 4/4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/JobCard
git commit -m "feat(components): add JobCard clickable row with tier dot and score"
```

---

## Task 6: SourceRow Component

A row in the scan-progress list: glyph + label + status text. Glyphs: `○` queued, `◐` scanning, `✓` done, `✗` error.

**Files:**
- Create: `src/components/SourceRow/SourceRow.tsx`
- Create: `src/components/SourceRow/SourceRow.module.css`
- Create: `src/components/SourceRow/SourceRow.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/SourceRow/SourceRow.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SourceRow } from './SourceRow';

describe('SourceRow', () => {
  it('renders queued state', () => {
    render(<SourceRow label="LinkedIn" status="queued" />);
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('○')).toBeInTheDocument();
    expect(screen.getByText(/queued/i)).toBeInTheDocument();
  });

  it('renders scanning state', () => {
    render(<SourceRow label="LinkedIn" status="scanning" />);
    expect(screen.getByText('◐')).toBeInTheDocument();
    expect(screen.getByText(/scanning/i)).toBeInTheDocument();
  });

  it('renders done state with count', () => {
    render(<SourceRow label="LinkedIn" status="done" count={4} />);
    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(screen.getByText(/4 found/i)).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(<SourceRow label="LinkedIn" status="error" />);
    expect(screen.getByText('✗')).toBeInTheDocument();
    expect(screen.getByText(/failed/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- SourceRow`
Expected: FAIL with `Cannot find module './SourceRow'`.

- [ ] **Step 3: Write the implementation**

Create `src/components/SourceRow/SourceRow.tsx`:

```tsx
import type { SourceStatus } from '../../types';
import styles from './SourceRow.module.css';

interface Props {
  label: string;
  status: SourceStatus;
  count?: number;
}

const GLYPH: Record<SourceStatus, string> = {
  queued: '○',
  scanning: '◐',
  done: '✓',
  error: '✗',
};

function statusText(status: SourceStatus, count?: number): string {
  if (status === 'queued') return 'Queued';
  if (status === 'scanning') return 'Scanning…';
  if (status === 'done') return typeof count === 'number' ? `${count} found` : 'Done';
  return 'Failed';
}

export function SourceRow({ label, status, count }: Props) {
  return (
    <div className={styles.row}>
      <span className={`${styles.glyph} ${styles[status]}`}>{GLYPH[status]}</span>
      <span className={styles.label}>{label}</span>
      <span className={styles.status}>{statusText(status, count)}</span>
    </div>
  );
}
```

Create `src/components/SourceRow/SourceRow.module.css`:

```css
.row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) 0;
  font-size: var(--font-size-caption);
}

.glyph {
  width: 16px;
  text-align: center;
  font-size: var(--font-size-body);
  color: var(--text-tertiary);
}

.glyph.scanning {
  color: var(--text-primary);
  animation: pulse var(--motion-pulse) ease-in-out infinite;
}

.glyph.done {
  color: var(--score-strong);
}

.glyph.error {
  color: var(--error);
}

.label {
  flex: 1;
  color: var(--text-secondary);
}

.status {
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@media (prefers-reduced-motion: reduce) {
  .glyph.scanning {
    animation: none;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- SourceRow`
Expected: PASS, 4/4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/SourceRow
git commit -m "feat(components): add SourceRow with state-keyed glyph and status"
```

---

## Task 7: SideSheet Component

A right-anchored 480px sliding panel with a dimmed backdrop. Closes on Escape key, backdrop click, or close button.

**Files:**
- Create: `src/components/SideSheet/SideSheet.tsx`
- Create: `src/components/SideSheet/SideSheet.module.css`
- Create: `src/components/SideSheet/SideSheet.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/SideSheet/SideSheet.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SideSheet } from './SideSheet';

describe('SideSheet', () => {
  it('renders nothing when closed', () => {
    render(
      <SideSheet open={false} onClose={() => {}} title="Job">
        <p>Hello</p>
      </SideSheet>,
    );
    expect(screen.queryByText('Hello')).not.toBeInTheDocument();
  });

  it('renders children and title when open', () => {
    render(
      <SideSheet open onClose={() => {}} title="Job detail">
        <p>Body</p>
      </SideSheet>,
    );
    expect(screen.getByText('Job detail')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <SideSheet open onClose={onClose} title="Job">
        <p>Body</p>
      </SideSheet>,
    );
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <SideSheet open onClose={onClose} title="Job">
        <p>Body</p>
      </SideSheet>,
    );
    await user.click(screen.getByTestId('sidesheet-backdrop'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <SideSheet open onClose={onClose} title="Job">
        <p>Body</p>
      </SideSheet>,
    );
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- SideSheet`
Expected: FAIL with `Cannot find module './SideSheet'`.

- [ ] **Step 3: Write the implementation**

Create `src/components/SideSheet/SideSheet.tsx`:

```tsx
import { useEffect, type ReactNode } from 'react';
import styles from './SideSheet.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function SideSheet({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.root} role="dialog" aria-modal="true" aria-label={title}>
      <div
        className={styles.backdrop}
        data-testid="sidesheet-backdrop"
        onClick={onClose}
      />
      <aside className={styles.panel}>
        <header className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>
        <div className={styles.body}>{children}</div>
      </aside>
    </div>
  );
}
```

Create `src/components/SideSheet/SideSheet.module.css`:

```css
.root {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  justify-content: flex-end;
}

.backdrop {
  position: absolute;
  inset: 0;
  background: rgb(0 0 0 / 50%);
}

.panel {
  position: relative;
  width: 480px;
  max-width: 100vw;
  height: 100%;
  background: var(--bg-surface);
  border-left: var(--border-width) solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  animation: slide-in var(--motion-sheet) var(--easing-out);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: var(--border-width) solid var(--border-subtle);
}

.title {
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.close {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 24px;
  line-height: 1;
  padding: 0 var(--space-2);
  cursor: pointer;
  transition: color var(--motion-fast) var(--easing-out);
}

.close:hover {
  color: var(--text-primary);
}

.body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-5);
}

@keyframes slide-in {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@media (prefers-reduced-motion: reduce) {
  .panel { animation: none; }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- SideSheet`
Expected: PASS, 5/5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/SideSheet
git commit -m "feat(components): add SideSheet right-anchored panel with backdrop"
```

---

## Task 8: ProfileMenu Component

Top-right avatar circle that opens a dropdown of three actions.

**Files:**
- Create: `src/components/ProfileMenu/ProfileMenu.tsx`
- Create: `src/components/ProfileMenu/ProfileMenu.module.css`
- Create: `src/components/ProfileMenu/ProfileMenu.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/ProfileMenu/ProfileMenu.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileMenu } from './ProfileMenu';

describe('ProfileMenu', () => {
  function setup() {
    const onEditProfile = vi.fn();
    const onSwitchResume = vi.fn();
    const onOpenSettings = vi.fn();
    render(
      <ProfileMenu
        onEditProfile={onEditProfile}
        onSwitchResume={onSwitchResume}
        onOpenSettings={onOpenSettings}
      />,
    );
    return { onEditProfile, onSwitchResume, onOpenSettings };
  }

  it('renders the menu button collapsed', () => {
    setup();
    expect(screen.getByRole('button', { name: /profile menu/i })).toBeInTheDocument();
    expect(screen.queryByText('Edit profile')).not.toBeInTheDocument();
  });

  it('opens menu and triggers edit profile', async () => {
    const user = userEvent.setup();
    const { onEditProfile } = setup();
    await user.click(screen.getByRole('button', { name: /profile menu/i }));
    await user.click(screen.getByRole('menuitem', { name: /edit profile/i }));
    expect(onEditProfile).toHaveBeenCalled();
  });

  it('triggers switch resume', async () => {
    const user = userEvent.setup();
    const { onSwitchResume } = setup();
    await user.click(screen.getByRole('button', { name: /profile menu/i }));
    await user.click(screen.getByRole('menuitem', { name: /switch resume/i }));
    expect(onSwitchResume).toHaveBeenCalled();
  });

  it('triggers open settings', async () => {
    const user = userEvent.setup();
    const { onOpenSettings } = setup();
    await user.click(screen.getByRole('button', { name: /profile menu/i }));
    await user.click(screen.getByRole('menuitem', { name: /^settings/i }));
    expect(onOpenSettings).toHaveBeenCalled();
  });

  it('closes when clicking outside', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: /profile menu/i }));
    expect(screen.getByText('Edit profile')).toBeInTheDocument();
    await user.click(document.body);
    expect(screen.queryByText('Edit profile')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ProfileMenu`
Expected: FAIL with `Cannot find module './ProfileMenu'`.

- [ ] **Step 3: Write the implementation**

Create `src/components/ProfileMenu/ProfileMenu.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import styles from './ProfileMenu.module.css';

interface Props {
  onEditProfile: () => void;
  onSwitchResume: () => void;
  onOpenSettings: () => void;
}

export function ProfileMenu({ onEditProfile, onSwitchResume, onOpenSettings }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  function pick(fn: () => void) {
    setOpen(false);
    fn();
  }

  return (
    <div ref={rootRef} className={styles.root}>
      <button
        type="button"
        className={styles.trigger}
        aria-label="Profile menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.avatar} />
      </button>
      {open && (
        <ul className={styles.menu} role="menu">
          <li>
            <button type="button" role="menuitem" className={styles.item} onClick={() => pick(onEditProfile)}>
              Edit profile
            </button>
          </li>
          <li>
            <button type="button" role="menuitem" className={styles.item} onClick={() => pick(onSwitchResume)}>
              Switch resume
            </button>
          </li>
          <li>
            <button type="button" role="menuitem" className={styles.item} onClick={() => pick(onOpenSettings)}>
              Settings
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
```

Create `src/components/ProfileMenu/ProfileMenu.module.css`:

```css
.root {
  position: relative;
}

.trigger {
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  border-radius: 50%;
}

.trigger:focus-visible {
  outline: var(--border-width) solid var(--accent);
  outline-offset: 2px;
}

.avatar {
  display: block;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg-surface-2);
  border: var(--border-width) solid var(--border-subtle);
  transition: border-color var(--motion-fast) var(--easing-out);
}

.trigger:hover .avatar {
  border-color: var(--border-strong);
}

.menu {
  position: absolute;
  top: calc(100% + var(--space-2));
  right: 0;
  min-width: 180px;
  list-style: none;
  margin: 0;
  padding: var(--space-1);
  background: var(--bg-surface);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius);
  box-shadow: 0 8px 24px rgb(0 0 0 / 40%);
  z-index: 50;
}

.item {
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-body);
  color: var(--text-primary);
  border-radius: calc(var(--radius) - 2px);
  cursor: pointer;
  transition: background-color var(--motion-fast) var(--easing-out);
}

.item:hover {
  background: var(--bg-surface-2);
}

.item:focus-visible {
  outline: var(--border-width) solid var(--accent);
  outline-offset: -1px;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ProfileMenu`
Expected: PASS, 5/5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/ProfileMenu
git commit -m "feat(components): add ProfileMenu dropdown for navigation shortcuts"
```

---

## Task 9: Results Screen — Assemble Everything

The Results screen owns the scan state machine. On mount, it kicks off `scanJobs` and runs cosmetic source-progress timers in parallel. Once jobs return, sources flip from scanning → done with staggered timers (0ms, 200ms, 400ms, 600ms, 800ms). If `scanJobs` throws, all sources flip to error and an error message is shown.

**Files:**
- Create: `src/screens/Results/Results.tsx`
- Create: `src/screens/Results/Results.module.css`
- Create: `src/screens/Results/Results.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/screens/Results/Results.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Results } from './Results';
import type { Profile, ScoredJob } from '../../types';

const PROFILE: Profile = {
  targetRole: 'Senior Backend Engineer',
  level: 'senior',
  compFloor: 200000,
  location: 'remote',
  stackSignals: ['Go'],
  dealBreakers: [],
};

const JOBS: ScoredJob[] = [
  { id: 'j1', source: 'linkedin', company: 'Acme', title: 'Senior Backend Engineer', location: 'Remote', compRange: '$220k', description: 'Build Go services for scale.', tags: ['Go'], score: 92, scoreReason: 'Match.' },
  { id: 'j2', source: 'greenhouse', company: 'Beta', title: 'Backend Engineer', location: 'Remote', compRange: null, description: 'Ship features.', tags: ['Go'], score: 65, scoreReason: 'Decent.' },
  { id: 'j3', source: 'lever', company: 'Gamma', title: 'Junior Backend', location: 'Remote', compRange: null, description: 'Junior.', tags: ['Go'], score: 30, scoreReason: 'Too junior.' },
];

vi.mock('../../lib/scanJobs', () => ({
  scanJobs: vi.fn(),
  SOURCE_LABELS: {
    linkedin: 'LinkedIn',
    greenhouse: 'Greenhouse',
    lever: 'Lever',
    workable: 'Workable',
    yc: 'Y Combinator',
  },
}));

vi.mock('../../lib/storage', () => ({
  loadSettings: () => ({
    openRouterKey: 'sk-or-test',
    model: 'anthropic/claude-sonnet-4-6',
    sources: { linkedin: true, greenhouse: true, lever: true, workable: false, yc: false },
  }),
}));

import { scanJobs } from '../../lib/scanJobs';

describe('Results screen', () => {
  beforeEach(() => {
    vi.mocked(scanJobs).mockResolvedValue(JOBS);
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows scanning state on mount', () => {
    render(
      <Results
        profile={PROFILE}
        onEditProfile={() => {}}
        onSwitchResume={() => {}}
        onOpenSettings={() => {}}
      />,
    );
    expect(screen.getAllByText(/scanning/i).length).toBeGreaterThan(0);
  });

  it('renders strong and decent matches grouped after scan finishes', async () => {
    render(
      <Results
        profile={PROFILE}
        onEditProfile={() => {}}
        onSwitchResume={() => {}}
        onOpenSettings={() => {}}
      />,
    );
    await waitFor(() => expect(screen.getByText(/strong matches/i)).toBeInTheDocument());
    expect(screen.getByText('Senior Backend Engineer')).toBeInTheDocument();
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
    expect(screen.getByText(/decent matches/i)).toBeInTheDocument();
  });

  it('shows skipped count instead of skip cards', async () => {
    render(
      <Results
        profile={PROFILE}
        onEditProfile={() => {}}
        onSwitchResume={() => {}}
        onOpenSettings={() => {}}
      />,
    );
    await waitFor(() => expect(screen.getByText(/1 skipped/i)).toBeInTheDocument());
    expect(screen.queryByText('Junior Backend')).not.toBeInTheDocument();
  });

  it('opens side sheet when a job card is clicked', async () => {
    const user = userEvent.setup();
    render(
      <Results
        profile={PROFILE}
        onEditProfile={() => {}}
        onSwitchResume={() => {}}
        onOpenSettings={() => {}}
      />,
    );
    await waitFor(() => expect(screen.getByText('Senior Backend Engineer')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Senior Backend Engineer at Acme/i }));
    expect(screen.getByText('Build Go services for scale.')).toBeInTheDocument();
    expect(screen.getByText(/why this score/i)).toBeInTheDocument();
  });

  it('shows error message when scan fails', async () => {
    vi.mocked(scanJobs).mockRejectedValueOnce(new Error('API down'));
    render(
      <Results
        profile={PROFILE}
        onEditProfile={() => {}}
        onSwitchResume={() => {}}
        onOpenSettings={() => {}}
      />,
    );
    await waitFor(() => expect(screen.getByText(/scan failed/i)).toBeInTheDocument());
    expect(screen.getByText(/API down/)).toBeInTheDocument();
  });

  it('triggers onEditProfile via profile menu', async () => {
    const user = userEvent.setup();
    const onEditProfile = vi.fn();
    render(
      <Results
        profile={PROFILE}
        onEditProfile={onEditProfile}
        onSwitchResume={() => {}}
        onOpenSettings={() => {}}
      />,
    );
    await user.click(screen.getByRole('button', { name: /profile menu/i }));
    await user.click(screen.getByRole('menuitem', { name: /edit profile/i }));
    expect(onEditProfile).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- Results`
Expected: FAIL with `Cannot find module './Results'`.

- [ ] **Step 3: Write the implementation**

Create `src/screens/Results/Results.tsx`:

```tsx
import { useEffect, useMemo, useState } from 'react';
import type { Profile, ScoredJob, SourceKey, SourceState } from '../../types';
import { loadSettings } from '../../lib/storage';
import { scanJobs, SOURCE_LABELS } from '../../lib/scanJobs';
import { scoreTier } from '../../lib/scoreTier';
import { JobCard } from '../../components/JobCard/JobCard';
import { SourceRow } from '../../components/SourceRow/SourceRow';
import { SideSheet } from '../../components/SideSheet/SideSheet';
import { ProfileMenu } from '../../components/ProfileMenu/ProfileMenu';
import { ScoreDot } from '../../components/ScoreDot/ScoreDot';
import styles from './Results.module.css';

interface Props {
  profile: Profile;
  onEditProfile: () => void;
  onSwitchResume: () => void;
  onOpenSettings: () => void;
}

export function Results({ profile, onEditProfile, onSwitchResume, onOpenSettings }: Props) {
  const settings = useMemo(() => loadSettings(), []);
  const enabledSources = useMemo<SourceKey[]>(
    () => (Object.keys(settings.sources) as SourceKey[]).filter((k) => settings.sources[k]),
    [settings],
  );

  const [sources, setSources] = useState<SourceState[]>(() =>
    enabledSources.map((k) => ({ key: k, label: SOURCE_LABELS[k], status: 'scanning' })),
  );
  const [jobs, setJobs] = useState<ScoredJob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [selected, setSelected] = useState<ScoredJob | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    async function run() {
      try {
        const results = await scanJobs(profile, enabledSources, settings.openRouterKey, settings.model);
        if (cancelled) return;
        setJobs(results);
        enabledSources.forEach((key, i) => {
          const t = setTimeout(() => {
            if (cancelled) return;
            setSources((prev) =>
              prev.map((s) => (s.key === key ? { ...s, status: 'done' } : s)),
            );
            if (i === enabledSources.length - 1) setFinished(true);
          }, i * 200);
          timers.push(t);
        });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Unknown error');
        setSources((prev) => prev.map((s) => ({ ...s, status: 'error' })));
        setFinished(true);
      }
    }

    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [profile, enabledSources, settings.openRouterKey, settings.model]);

  const grouped = useMemo(() => {
    const strong: ScoredJob[] = [];
    const decent: ScoredJob[] = [];
    let skipCount = 0;
    for (const j of jobs) {
      const t = scoreTier(j.score);
      if (t === 'strong') strong.push(j);
      else if (t === 'decent') decent.push(j);
      else skipCount += 1;
    }
    strong.sort((a, b) => b.score - a.score);
    decent.sort((a, b) => b.score - a.score);
    return { strong, decent, skipCount };
  }, [jobs]);

  const countsByKey = useMemo(() => {
    const m = new Map<SourceKey, number>();
    for (const j of jobs) m.set(j.source, (m.get(j.source) ?? 0) + 1);
    return m;
  }, [jobs]);

  const subtitle = `${profile.targetRole} · ${profile.level} · ${profile.location}`;

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Results</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        <ProfileMenu
          onEditProfile={onEditProfile}
          onSwitchResume={onSwitchResume}
          onOpenSettings={onOpenSettings}
        />
      </header>

      <section className={styles.scanPanel}>
        {sources.map((s) => (
          <SourceRow
            key={s.key}
            label={s.label}
            status={s.status}
            count={s.status === 'done' ? countsByKey.get(s.key) ?? 0 : undefined}
          />
        ))}
      </section>

      {error && (
        <div className={styles.errorBox}>
          <p className={styles.errorTitle}>Scan failed</p>
          <p className={styles.errorMsg}>{error}</p>
        </div>
      )}

      {finished && !error && grouped.strong.length === 0 && grouped.decent.length === 0 && (
        <p className={styles.empty}>No matches yet. Try widening your profile.</p>
      )}

      {grouped.strong.length > 0 && (
        <section className={styles.group}>
          <h2 className={styles.groupTitle}>
            <ScoreDot tier="strong" /> Strong matches ({grouped.strong.length})
          </h2>
          <div className={styles.list}>
            {grouped.strong.map((j) => (
              <JobCard key={j.id} job={j} onClick={setSelected} />
            ))}
          </div>
        </section>
      )}

      {grouped.decent.length > 0 && (
        <section className={styles.group}>
          <h2 className={styles.groupTitle}>
            <ScoreDot tier="decent" /> Decent matches ({grouped.decent.length})
          </h2>
          <div className={styles.list}>
            {grouped.decent.map((j) => (
              <JobCard key={j.id} job={j} onClick={setSelected} />
            ))}
          </div>
        </section>
      )}

      {grouped.skipCount > 0 && (
        <p className={styles.skipNote}>
          {grouped.skipCount} skipped — refine your profile to surface more.
        </p>
      )}

      <SideSheet
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.title ?? ''}
      >
        {selected && (
          <div className={styles.sheet}>
            <p className={styles.sheetMeta}>
              {selected.company} · {selected.location}
              {selected.compRange ? ` · ${selected.compRange}` : ''}
            </p>
            <div className={styles.sheetTags}>
              {selected.tags.map((t) => (
                <span key={t} className={styles.sheetTag}>{t}</span>
              ))}
            </div>
            <p className={styles.sheetSection}>Description</p>
            <p className={styles.sheetBody}>{selected.description}</p>
            <p className={styles.sheetSection}>Why this score</p>
            <p className={styles.sheetBody}>
              <ScoreDot tier={scoreTier(selected.score)} ariaLabel={`Score ${selected.score}`} />
              <span className={styles.sheetScore}>{selected.score}</span>
              {selected.scoreReason}
            </p>
          </div>
        )}
      </SideSheet>
    </div>
  );
}
```

Create `src/screens/Results/Results.module.css`:

```css
.root {
  max-width: 880px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-5);
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.headerLeft {
  flex: 1;
}

.title {
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-1);
}

.subtitle {
  font-size: var(--font-size-body);
  color: var(--text-secondary);
  margin: 0;
}

.scanPanel {
  background: var(--bg-surface);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-6);
}

.errorBox {
  background: var(--bg-surface);
  border: var(--border-width) solid var(--error);
  border-radius: var(--radius);
  padding: var(--space-4);
  margin-bottom: var(--space-6);
}

.errorTitle {
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-semibold);
  color: var(--error);
  margin: 0 0 var(--space-1);
}

.errorMsg {
  font-size: var(--font-size-body);
  color: var(--text-secondary);
  margin: 0;
}

.empty {
  font-size: var(--font-size-body);
  color: var(--text-secondary);
  text-align: center;
  padding: var(--space-7) 0;
}

.group {
  margin-bottom: var(--space-6);
}

.groupTitle {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin: 0 0 var(--space-2);
}

.list {
  border-top: var(--border-width) solid var(--border-subtle);
}

.skipNote {
  font-size: var(--font-size-caption);
  color: var(--text-tertiary);
  text-align: center;
  margin: var(--space-5) 0 0;
}

.sheet {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.sheetMeta {
  font-size: var(--font-size-body);
  color: var(--text-secondary);
  margin: 0;
}

.sheetTags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.sheetTag {
  font-size: var(--font-size-caption);
  color: var(--text-secondary);
  padding: 2px var(--space-2);
  background: var(--bg-surface-2);
  border-radius: var(--radius);
}

.sheetSection {
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-medium);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: var(--space-3) 0 0;
}

.sheetBody {
  font-size: var(--font-size-body);
  color: var(--text-primary);
  line-height: 1.5;
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.sheetScore {
  font-size: var(--font-size-mono);
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- Results`
Expected: PASS, 6/6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/screens/Results
git commit -m "feat(screens): add Results screen orchestrating scan and grouped display"
```

---

## Task 10: Wire App.tsx and Delete StubScan

**Files:**
- Modify: `src/App.tsx`
- Delete: `src/screens/StubScan/StubScan.tsx`
- Delete: `src/screens/StubScan/StubScan.module.css`

- [ ] **Step 1: Update `src/App.tsx`**

Replace the entire contents of `src/App.tsx` with:

```tsx
import { useState } from 'react';
import type { ResumeText, Profile, Screen } from './types';
import { loadSettings } from './lib/storage';
import { extractProfile } from './lib/extractProfile';
import { Upload } from './screens/Upload/Upload';
import { Settings } from './screens/Settings/Settings';
import { Confirm } from './screens/Confirm/Confirm';
import { Results } from './screens/Results/Results';
import styles from './App.module.css';

export function App() {
  const [screen, setScreen] = useState<Screen>('upload');
  const [resume, setResume] = useState<ResumeText | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [prevScreen, setPrevScreen] = useState<Screen>('upload');

  async function runExtract(rt: ResumeText, key: string, model: string) {
    setScreen('analyzing');
    setAnalyzeError(null);
    try {
      const p = await extractProfile(rt.text, key, model);
      setProfile(p);
      setScreen('confirm');
    } catch (err) {
      setAnalyzeError(
        err instanceof Error
          ? err.message
          : 'Analysis failed. Check your OpenRouter key in Settings.',
      );
      setScreen('upload');
    }
  }

  async function handleResumeParsed(rt: ResumeText) {
    setResume(rt);
    setAnalyzeError(null);
    const settings = loadSettings();
    if (!settings.openRouterKey) {
      setPrevScreen('upload');
      setScreen('settings');
      return;
    }
    await runExtract(rt, settings.openRouterKey, settings.model);
  }

  async function handleSettingsDone() {
    const settings = loadSettings();
    const pending = resume;
    if (prevScreen === 'upload' && pending && settings.openRouterKey) {
      await runExtract(pending, settings.openRouterKey, settings.model);
    } else {
      setScreen(prevScreen);
    }
  }

  function handleConfirm(p: Profile) {
    setProfile(p);
    setScreen('results');
  }

  function handleEditProfile() {
    setScreen('confirm');
  }

  function handleSwitchResume() {
    setResume(null);
    setProfile(null);
    setAnalyzeError(null);
    setScreen('upload');
  }

  function handleOpenSettingsFromResults() {
    setPrevScreen('results');
    setScreen('settings');
  }

  if (screen === 'analyzing') {
    return (
      <div className={styles.root}>
        <div className={styles.analyzing}>
          <p className={styles.analyzingText}>Analyzing your resume…</p>
        </div>
      </div>
    );
  }

  if (screen === 'settings') {
    return (
      <div className={styles.root}>
        <Settings onDone={handleSettingsDone} />
      </div>
    );
  }

  if (screen === 'confirm' && profile) {
    return (
      <div className={styles.root}>
        <Confirm profile={profile} onConfirm={handleConfirm} />
      </div>
    );
  }

  if (screen === 'results' && profile) {
    return (
      <div className={styles.root}>
        <Results
          profile={profile}
          onEditProfile={handleEditProfile}
          onSwitchResume={handleSwitchResume}
          onOpenSettings={handleOpenSettingsFromResults}
        />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <Upload onResumeParsed={handleResumeParsed} analyzeError={analyzeError} />
    </div>
  );
}
```

- [ ] **Step 2: Delete StubScan files**

```bash
rm -rf src/screens/StubScan
```

- [ ] **Step 3: Run typecheck and full unit suite**

Run in parallel: `npm run typecheck` and `npm test`
Expected: zero TS errors; all unit tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/screens/StubScan
git commit -m "feat(app): wire Results screen, remove StubScan placeholder"
```

---

## Task 11: E2E Tests, Verification, and PR

**Files:**
- Modify: `tests/e2e/upload.spec.ts` (existing tests reference Scanning the open web / Start over — these no longer exist)
- Create: `tests/e2e/results.spec.ts`

- [ ] **Step 1: Update `tests/e2e/upload.spec.ts`**

Replace the entire contents with:

```typescript
import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MOCK_PROFILE = {
  targetRole: 'Senior Backend Engineer',
  level: 'senior',
  compFloor: 200000,
  location: 'remote',
  stackSignals: ['Go', 'PostgreSQL', 'Kubernetes'],
  dealBreakers: [],
};

const MOCK_JOBS = [
  {
    id: 'j1', source: 'linkedin', company: 'Acme Corp', title: 'Senior Backend Engineer',
    location: 'Remote (US)', compRange: '$220k-$260k',
    description: 'Build scalable Go services for our infra team.',
    tags: ['Go', 'Postgres', 'Kubernetes'], score: 92, scoreReason: 'Stack matches.',
  },
  {
    id: 'j2', source: 'greenhouse', company: 'Beta Co', title: 'Backend Engineer',
    location: 'Remote', compRange: '$180k',
    description: 'Backend work on payments.',
    tags: ['Go', 'Postgres'], score: 65, scoreReason: 'Decent fit.',
  },
];

test.describe('upload flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'trajector_settings',
        JSON.stringify({
          openRouterKey: 'sk-or-v1-test-key',
          model: 'anthropic/claude-sonnet-4-6',
          sources: { linkedin: true, greenhouse: true, lever: true, workable: true, yc: true },
        }),
      );
    });

    await page.route('**/openrouter.ai/api/v1/chat/completions', async (route) => {
      const req = route.request();
      const body = req.postDataJSON() as { messages: Array<{ role: string; content: string }> };
      const lastUser = body.messages[body.messages.length - 1];
      const content = lastUser.role === 'user' && lastUser.content.startsWith('{')
        ? JSON.stringify(MOCK_JOBS)
        : JSON.stringify(MOCK_PROFILE);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ choices: [{ message: { content } }] }),
      });
    });
  });

  test('drops a PDF, goes through LLM analysis, and shows Confirm screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Drop your resume to begin')).toBeVisible();

    const fixturePath = path.resolve(__dirname, '../fixtures/sample-resume.pdf');
    await page.getByLabel('Drop here or click to browse').setInputFiles(fixturePath);

    await expect(page.getByText('Confirm your profile')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#target-role')).toHaveValue('Senior Backend Engineer');
  });

  test('confirms the profile and reaches the Results screen', async ({ page }) => {
    await page.goto('/');
    const fixturePath = path.resolve(__dirname, '../fixtures/sample-resume.pdf');
    await page.getByLabel('Drop here or click to browse').setInputFiles(fixturePath);

    await expect(page.getByText('Confirm your profile')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /start scanning/i }).click();

    await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible();
    await expect(page.getByText(/Senior Backend Engineer · senior · remote/)).toBeVisible();
    await expect(page.getByText('Senior Backend Engineer').first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('upload flow — no API key', () => {
  test('redirects to Settings when no API key is stored', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('trajector_settings');
    });

    await page.goto('/');

    const fixturePath = path.resolve(__dirname, '../fixtures/sample-resume.pdf');
    await page.getByLabel('Drop here or click to browse').setInputFiles(fixturePath);

    await expect(page.getByText('Settings')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel('OpenRouter API key')).toBeVisible();
  });
});
```

- [ ] **Step 2: Create `tests/e2e/results.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MOCK_PROFILE = {
  targetRole: 'Senior Backend Engineer',
  level: 'senior',
  compFloor: 200000,
  location: 'remote',
  stackSignals: ['Go', 'PostgreSQL'],
  dealBreakers: [],
};

const MOCK_JOBS = [
  { id: 'j1', source: 'linkedin', company: 'Acme', title: 'Senior Backend Engineer', location: 'Remote', compRange: '$220k', description: 'Strong match description.', tags: ['Go'], score: 92, scoreReason: 'Stack matches.' },
  { id: 'j2', source: 'greenhouse', company: 'Beta', title: 'Backend Engineer', location: 'Remote', compRange: null, description: 'Decent fit description.', tags: ['Go'], score: 65, scoreReason: 'Decent.' },
  { id: 'j3', source: 'lever', company: 'Gamma', title: 'Junior Backend', location: 'Remote', compRange: null, description: 'Skip description.', tags: ['Go'], score: 30, scoreReason: 'Too junior.' },
];

async function setup(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'trajector_settings',
      JSON.stringify({
        openRouterKey: 'sk-or-v1-test-key',
        model: 'anthropic/claude-sonnet-4-6',
        sources: { linkedin: true, greenhouse: true, lever: true, workable: false, yc: false },
      }),
    );
  });

  await page.route('**/openrouter.ai/api/v1/chat/completions', async (route) => {
    const req = route.request();
    const body = req.postDataJSON() as { messages: Array<{ role: string; content: string }> };
    const lastUser = body.messages[body.messages.length - 1];
    const content = lastUser.role === 'user' && lastUser.content.startsWith('{')
      ? JSON.stringify(MOCK_JOBS)
      : JSON.stringify(MOCK_PROFILE);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ choices: [{ message: { content } }] }),
    });
  });
}

test.describe('results flow', () => {
  test.beforeEach(setup);

  test('shows grouped strong/decent matches and skipped count', async ({ page }) => {
    await page.goto('/');
    const fixturePath = path.resolve(__dirname, '../fixtures/sample-resume.pdf');
    await page.getByLabel('Drop here or click to browse').setInputFiles(fixturePath);
    await expect(page.getByText('Confirm your profile')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /start scanning/i }).click();

    await expect(page.getByText(/strong matches/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Senior Backend Engineer').first()).toBeVisible();
    await expect(page.getByText(/decent matches/i)).toBeVisible();
    await expect(page.getByText('Backend Engineer')).toBeVisible();
    await expect(page.getByText(/1 skipped/i)).toBeVisible();
    await expect(page.getByText('Junior Backend')).toHaveCount(0);
  });

  test('opens side sheet with job detail on card click', async ({ page }) => {
    await page.goto('/');
    const fixturePath = path.resolve(__dirname, '../fixtures/sample-resume.pdf');
    await page.getByLabel('Drop here or click to browse').setInputFiles(fixturePath);
    await expect(page.getByText('Confirm your profile')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /start scanning/i }).click();
    await expect(page.getByText(/strong matches/i)).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /Senior Backend Engineer at Acme/i }).click();
    await expect(page.getByText('Strong match description.')).toBeVisible();
    await expect(page.getByText(/why this score/i)).toBeVisible();

    await page.getByRole('button', { name: /close/i }).click();
    await expect(page.getByText('Strong match description.')).toHaveCount(0);
  });

  test('profile menu Switch resume returns to upload', async ({ page }) => {
    await page.goto('/');
    const fixturePath = path.resolve(__dirname, '../fixtures/sample-resume.pdf');
    await page.getByLabel('Drop here or click to browse').setInputFiles(fixturePath);
    await expect(page.getByText('Confirm your profile')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /start scanning/i }).click();
    await expect(page.getByText(/strong matches/i)).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /profile menu/i }).click();
    await page.getByRole('menuitem', { name: /switch resume/i }).click();
    await expect(page.getByText('Drop your resume to begin')).toBeVisible();
  });

  test('profile menu Edit profile returns to Confirm', async ({ page }) => {
    await page.goto('/');
    const fixturePath = path.resolve(__dirname, '../fixtures/sample-resume.pdf');
    await page.getByLabel('Drop here or click to browse').setInputFiles(fixturePath);
    await expect(page.getByText('Confirm your profile')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /start scanning/i }).click();
    await expect(page.getByText(/strong matches/i)).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /profile menu/i }).click();
    await page.getByRole('menuitem', { name: /edit profile/i }).click();
    await expect(page.getByText('Confirm your profile')).toBeVisible();
  });
});
```

- [ ] **Step 3: Run all checks in parallel**

Run all of these and confirm zero failures:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

- [ ] **Step 4: Commit e2e changes**

```bash
git add tests/e2e/upload.spec.ts tests/e2e/results.spec.ts
git commit -m "test(e2e): cover Results screen flows and update upload assertions"
```

- [ ] **Step 5: Push and open PR**

```bash
git push -u origin HEAD
gh pr create --title "Plan 3: Results screen + LLM-powered scan" --body "$(cat <<'EOF'
## Summary
- Replace StubScan placeholder with a real Results screen that ranks plausible jobs against the user's profile via a single batched OpenRouter call.
- Add ScoreDot, JobCard, SourceRow, SideSheet, and ProfileMenu components, wired together in a Linear-style dark layout with grouped Strong/Decent matches and a skipped count.
- Wire ProfileMenu shortcuts (Edit profile / Switch resume / Settings) back into the existing screen state machine.

## Test plan
- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm test` (unit + component, including new scoreTier, scanJobs, ScoreDot, JobCard, SourceRow, SideSheet, ProfileMenu, Results suites)
- [x] `npm run build`
- [x] `npm run test:e2e` (existing upload flow + new results flow with mocked OpenRouter)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-Review (controller)

- **Spec coverage:**
  - Results screen replaces StubScan ✅ (Tasks 9, 10)
  - Single batched LLM call for jobs ✅ (Task 3)
  - Per-source progress, theatrical staggered timing ✅ (Task 9 useEffect)
  - Scored grouping (Strong / Decent / Skip count) ✅ (Task 9)
  - SideSheet for job detail ✅ (Tasks 7, 9)
  - ProfileMenu with Edit profile / Switch resume / Settings ✅ (Tasks 8, 10)
  - Error path when scan fails ✅ (Task 9 step 1 + step 3)
  - Reduced-motion support ✅ (CSS in Tasks 6, 7)
  - Score colors only chromatic tokens ✅ (verified — only --score-strong/--score-decent/--score-skip + --error in CSS)
- **Placeholder scan:** No TBD/TODO. Every code step has full code.
- **Type consistency:** `SourceKey`, `ScoreTier`, `ScoredJob`, `SourceState`, `Screen='results'` defined Task 1, used consistently across Tasks 2-11.
