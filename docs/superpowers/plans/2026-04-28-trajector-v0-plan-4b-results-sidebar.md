# Trajector v0 — Plan 4b: Results Sidebar + Filters

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add a 260px left sidebar to the Results screen with profile summary, tier / source / min-score filters, and footer actions (Settings, New scan). Filters apply client-side over the LLM-returned jobs without re-scanning.

**Architecture:** Reuse Plan 4a's design tokens and existing components (Segmented, ScoreDot, AppBar, OnboardingStepper). Add four new components — RangeSlider, ProfileSummary, FilterGroup, Sidebar. The Results screen gets a 2-column layout (sidebar + main) and a `Filters` state machine; the existing `ProfileMenu` is removed (its actions moved to the sidebar). Source-row counts continue to show the *unfiltered* totals (it's a scan-progress indicator); the per-tier match-list counts and skipped-count footer reflect the *filtered* set so users see what their filters did.

**Tech Stack:** React 19 + TypeScript + CSS Modules + Vitest + Playwright. No new dependencies.

---

## File Structure

**New files:**
- `src/components/RangeSlider/{RangeSlider.tsx, .module.css, .test.tsx}` — styled `<input type="range">`
- `src/components/FilterGroup/{FilterGroup.tsx, .module.css, .test.tsx}` — labeled wrapper for any filter control
- `src/components/ProfileSummary/{ProfileSummary.tsx, .module.css, .test.tsx}` — sidebar profile card
- `src/components/Sidebar/{Sidebar.tsx, .module.css, .test.tsx}` — 260px left rail with sticky footer

**Modified files:**
- `src/screens/Results/Results.tsx` — full rewrite for 2-column layout + filter state
- `src/screens/Results/Results.module.css` — full rewrite for sidebar grid
- `src/screens/Results/Results.test.tsx` — extend with 3 filter tests
- `tests/e2e/results.spec.ts` — add a filter-flow test

**Deleted files:** none. ProfileMenu component remains in the codebase (still used in DemoPreview's parent could re-import if needed; currently only Results uses it, so it becomes dead code — leave it for now and let a future refactor delete it).

---

## Task 1: RangeSlider component

A styled native `<input type="range">` with a value label rendered inline. Reused for the min-score filter (0–100). Strict TDD.

**Files:**
- Create: `src/components/RangeSlider/RangeSlider.tsx`
- Create: `src/components/RangeSlider/RangeSlider.module.css`
- Create: `src/components/RangeSlider/RangeSlider.test.tsx`

- [ ] **Step 1: Test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RangeSlider } from './RangeSlider';

describe('RangeSlider', () => {
  it('renders the current value', () => {
    render(<RangeSlider min={0} max={100} value={42} onChange={() => {}} ariaLabel="Min score" />);
    expect(screen.getByRole('slider', { name: 'Min score' })).toHaveValue('42');
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('calls onChange with the new numeric value', () => {
    const onChange = vi.fn();
    render(<RangeSlider min={0} max={100} value={0} onChange={onChange} ariaLabel="Min score" />);
    fireEvent.change(screen.getByRole('slider', { name: 'Min score' }), { target: { value: '75' } });
    expect(onChange).toHaveBeenCalledWith(75);
  });
});
```

- [ ] **Step 2: Run, confirm fail.**

- [ ] **Step 3: Implement**

`src/components/RangeSlider/RangeSlider.tsx`:

```tsx
import styles from './RangeSlider.module.css';

interface Props {
  min: number;
  max: number;
  value: number;
  onChange: (next: number) => void;
  ariaLabel: string;
}

export function RangeSlider({ min, max, value, onChange, ariaLabel }: Props) {
  return (
    <div className={styles.root}>
      <input
        type="range"
        className={styles.input}
        min={min}
        max={max}
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className={styles.value}>{value}</span>
    </div>
  );
}
```

`src/components/RangeSlider/RangeSlider.module.css`:

```css
.root {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.input {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  background: var(--bg-surface-2);
  border-radius: 999px;
  outline: none;
  cursor: pointer;
}

.input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: var(--accent);
  border-radius: 50%;
  cursor: pointer;
  transition: transform var(--motion-fast) var(--easing-out);
}

.input::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: var(--accent);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.input:focus-visible {
  outline: var(--border-width) solid var(--accent);
  outline-offset: 4px;
}

.value {
  font-size: var(--font-size-mono);
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
  min-width: 28px;
  text-align: right;
}
```

- [ ] **Step 4: Run, confirm 2/2 pass + full suite + typecheck green.**

- [ ] **Step 5: Commit**

```bash
git add src/components/RangeSlider
git commit -m "feat(components): add RangeSlider styled native input[type=range]"
```

---

## Task 2: FilterGroup component

A simple labeled wrapper around any control. Renders a section label + its child control. Used 3× in the sidebar (Tier / Sources / Min score).

**Files:** `src/components/FilterGroup/{FilterGroup.tsx, .module.css, .test.tsx}`

- [ ] **Step 1: Test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FilterGroup } from './FilterGroup';

describe('FilterGroup', () => {
  it('renders the title and children', () => {
    render(<FilterGroup title="Tier"><span>child</span></FilterGroup>);
    expect(screen.getByText('Tier')).toBeInTheDocument();
    expect(screen.getByText('child')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, confirm fail.**

- [ ] **Step 3: Implement**

`src/components/FilterGroup/FilterGroup.tsx`:

```tsx
import type { ReactNode } from 'react';
import styles from './FilterGroup.module.css';

interface Props {
  title: string;
  children: ReactNode;
}

export function FilterGroup({ title, children }: Props) {
  return (
    <section className={styles.root}>
      <p className={styles.title}>{title}</p>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
```

`src/components/FilterGroup/FilterGroup.module.css`:

```css
.root {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3) 0;
  border-bottom: var(--border-width) solid var(--border-subtle);
}

.title {
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-medium);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
}

.body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
```

- [ ] **Step 4: Run, confirm 1/1 pass + full suite + typecheck green.**

- [ ] **Step 5: Commit**

```bash
git add src/components/FilterGroup
git commit -m "feat(components): add FilterGroup wrapper for filter controls"
```

---

## Task 3: ProfileSummary component

Mini card showing the candidate snapshot for the sidebar.

**Files:** `src/components/ProfileSummary/{ProfileSummary.tsx, .module.css, .test.tsx}`

- [ ] **Step 1: Test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileSummary } from './ProfileSummary';
import type { Profile } from '../../types';

const PROFILE: Profile = {
  targetRole: 'Senior Backend Engineer',
  level: 'senior',
  yearsOfExperience: 7,
  stackSignals: ['Go', 'PostgreSQL', 'Kubernetes', 'gRPC', 'Redis'],
  employmentTypes: ['full-time'],
  compFloor: 200000,
  locationPreference: 'remote',
  country: 'United States',
  preferredLocations: [],
  requiresSponsorship: false,
  dealBreakers: [],
  companyStages: [],
  companySize: null,
  equityImportance: null,
  industriesToExclude: [],
  jobSearchStatus: null,
};

describe('ProfileSummary', () => {
  it('renders role, level, years, country', () => {
    render(<ProfileSummary profile={PROFILE} onEdit={() => {}} />);
    expect(screen.getByText('Senior Backend Engineer')).toBeInTheDocument();
    expect(screen.getByText(/senior · 7 yrs · United States/)).toBeInTheDocument();
  });

  it('renders the first 4 stack signals', () => {
    render(<ProfileSummary profile={PROFILE} onEdit={() => {}} />);
    expect(screen.getByText(/Go, PostgreSQL, Kubernetes, gRPC/)).toBeInTheDocument();
    expect(screen.queryByText(/Redis/)).not.toBeInTheDocument();
  });

  it('omits country segment when null', () => {
    render(<ProfileSummary profile={{ ...PROFILE, country: null }} onEdit={() => {}} />);
    expect(screen.getByText(/senior · 7 yrs/)).toBeInTheDocument();
    expect(screen.queryByText(/United States/)).not.toBeInTheDocument();
  });

  it('calls onEdit when Edit profile is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<ProfileSummary profile={PROFILE} onEdit={onEdit} />);
    await user.click(screen.getByRole('button', { name: /edit profile/i }));
    expect(onEdit).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run, confirm fail.**

- [ ] **Step 3: Implement**

`src/components/ProfileSummary/ProfileSummary.tsx`:

```tsx
import type { Profile } from '../../types';
import styles from './ProfileSummary.module.css';

interface Props {
  profile: Profile;
  onEdit: () => void;
}

export function ProfileSummary({ profile, onEdit }: Props) {
  const meta = [
    profile.level,
    profile.yearsOfExperience !== null ? `${profile.yearsOfExperience} yrs` : null,
    profile.country,
  ]
    .filter(Boolean)
    .join(' · ');

  const stack = profile.stackSignals.slice(0, 4).join(', ');

  return (
    <div className={styles.root}>
      <p className={styles.role}>{profile.targetRole}</p>
      <p className={styles.meta}>{meta}</p>
      {stack && <p className={styles.stack}>{stack}</p>}
      <button type="button" className={styles.edit} onClick={onEdit}>
        Edit profile
      </button>
    </div>
  );
}
```

`src/components/ProfileSummary/ProfileSummary.module.css`:

```css
.root {
  padding: var(--space-3) 0;
  border-bottom: var(--border-width) solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.role {
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin: 0;
  line-height: 1.2;
}

.meta {
  font-size: var(--font-size-caption);
  color: var(--text-secondary);
  margin: 0;
}

.stack {
  font-size: var(--font-size-caption);
  color: var(--text-tertiary);
  margin: 0;
  line-height: 1.4;
}

.edit {
  align-self: flex-start;
  margin-top: var(--space-2);
  background: transparent;
  border: none;
  padding: 0;
  font-size: var(--font-size-caption);
  color: var(--text-secondary);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-color: var(--border-subtle);
  transition: color var(--motion-fast) var(--easing-out);
}

.edit:hover {
  color: var(--text-primary);
}

.edit:focus-visible {
  outline: var(--border-width) solid var(--accent);
  outline-offset: 2px;
}
```

- [ ] **Step 4: Run, confirm 4/4 pass + full + typecheck.**

- [ ] **Step 5: Commit**

```bash
git add src/components/ProfileSummary
git commit -m "feat(components): add ProfileSummary mini card for sidebar"
```

---

## Task 4: Sidebar component

Fixed-width 260px left rail with a body slot and a sticky footer slot. Pure presentational composition.

**Files:** `src/components/Sidebar/{Sidebar.tsx, .module.css, .test.tsx}`

- [ ] **Step 1: Test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from './Sidebar';

describe('Sidebar', () => {
  it('renders body and footer slots', () => {
    render(
      <Sidebar footer={<button>New scan</button>}>
        <p>filter content</p>
      </Sidebar>,
    );
    expect(screen.getByText('filter content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New scan' })).toBeInTheDocument();
  });

  it('renders without footer', () => {
    render(<Sidebar><p>only body</p></Sidebar>);
    expect(screen.getByText('only body')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, confirm fail.**

- [ ] **Step 3: Implement**

`src/components/Sidebar/Sidebar.tsx`:

```tsx
import type { ReactNode } from 'react';
import styles from './Sidebar.module.css';

interface Props {
  children: ReactNode;
  footer?: ReactNode;
}

export function Sidebar({ children, footer }: Props) {
  return (
    <aside className={styles.root}>
      <div className={styles.body}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </aside>
  );
}
```

`src/components/Sidebar/Sidebar.module.css`:

```css
.root {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: var(--border-width) solid var(--border-subtle);
  background: var(--bg-canvas);
  position: sticky;
  top: 0;
  align-self: flex-start;
  max-height: calc(100vh - 80px);
}

.body {
  flex: 1;
  padding: var(--space-4);
  overflow-y: auto;
}

.footer {
  padding: var(--space-3) var(--space-4);
  border-top: var(--border-width) solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

@media (max-width: 880px) {
  .root {
    width: 100%;
    border-right: none;
    border-bottom: var(--border-width) solid var(--border-subtle);
    position: static;
    max-height: none;
  }
}
```

- [ ] **Step 4: Run, confirm 2/2 pass + full + typecheck.**

- [ ] **Step 5: Commit**

```bash
git add src/components/Sidebar
git commit -m "feat(components): add Sidebar 260px rail with sticky footer"
```

---

## Task 5: Results redesign — 2-column layout + filter logic

The biggest task. Full rewrite of `Results.tsx` and its CSS. Adds `Filters` state, derives `filteredJobs` via useMemo, renders the new 2-column layout, removes ProfileMenu from header.

**Files:**
- Modify: `src/screens/Results/Results.tsx`
- Modify: `src/screens/Results/Results.module.css`
- Modify: `src/screens/Results/Results.test.tsx`

- [ ] **Step 1: Extend the existing test file**

Replace the entire `src/screens/Results/Results.test.tsx` with:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Results } from './Results';
import type { Profile, ScoredJob } from '../../types';

const PROFILE: Profile = {
  targetRole: 'Senior Backend Engineer',
  level: 'senior',
  yearsOfExperience: 7,
  stackSignals: ['Go'],
  employmentTypes: ['full-time'],
  compFloor: 200000,
  locationPreference: 'remote',
  country: 'United States',
  preferredLocations: [],
  requiresSponsorship: false,
  dealBreakers: [],
  companyStages: [],
  companySize: null,
  equityImportance: null,
  industriesToExclude: [],
  jobSearchStatus: null,
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

const NOOP_PROPS = {
  onEditProfile: () => {},
  onSwitchResume: () => {},
  onOpenSettings: () => {},
};

describe('Results screen — sidebar layout', () => {
  beforeEach(() => {
    vi.mocked(scanJobs).mockResolvedValue(JOBS);
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders sidebar with profile summary', async () => {
    render(<Results profile={PROFILE} {...NOOP_PROPS} />);
    await waitFor(() => expect(screen.getByText(/strong matches/i)).toBeInTheDocument());
    expect(screen.getByText('Senior Backend Engineer')).toBeInTheDocument();
    expect(screen.getByText(/senior · 7 yrs · United States/)).toBeInTheDocument();
  });

  it('renders strong + decent matches and skipped count by default', async () => {
    render(<Results profile={PROFILE} {...NOOP_PROPS} />);
    await waitFor(() => expect(screen.getByText(/strong matches/i)).toBeInTheDocument());
    expect(screen.getByText(/decent matches/i)).toBeInTheDocument();
    expect(screen.getByText(/1 skipped/i)).toBeInTheDocument();
  });

  it('filters by tier — selecting Strong hides decent matches', async () => {
    const user = userEvent.setup();
    render(<Results profile={PROFILE} {...NOOP_PROPS} />);
    await waitFor(() => expect(screen.getByText(/strong matches/i)).toBeInTheDocument());
    await user.click(screen.getByRole('radio', { name: 'Strong' }));
    expect(screen.queryByText(/decent matches/i)).not.toBeInTheDocument();
    expect(screen.getByText(/strong matches/i)).toBeInTheDocument();
  });

  it('filters by source — unchecking Greenhouse hides Beta', async () => {
    const user = userEvent.setup();
    render(<Results profile={PROFILE} {...NOOP_PROPS} />);
    await waitFor(() => expect(screen.getByText(/strong matches/i)).toBeInTheDocument());
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'Greenhouse' }));
    expect(screen.queryByText('Backend Engineer')).not.toBeInTheDocument();
    expect(screen.getByText('Senior Backend Engineer')).toBeInTheDocument();
  });

  it('filters by min score — slider at 70 cuts the 65 job', async () => {
    render(<Results profile={PROFILE} {...NOOP_PROPS} />);
    await waitFor(() => expect(screen.getByText(/strong matches/i)).toBeInTheDocument());
    fireEvent.change(screen.getByRole('slider', { name: /min score/i }), { target: { value: '70' } });
    expect(screen.queryByText('Backend Engineer')).not.toBeInTheDocument();
    expect(screen.getByText('Senior Backend Engineer')).toBeInTheDocument();
  });

  it('triggers onSwitchResume from sidebar New scan button', async () => {
    const user = userEvent.setup();
    const onSwitchResume = vi.fn();
    render(<Results profile={PROFILE} {...NOOP_PROPS} onSwitchResume={onSwitchResume} />);
    await waitFor(() => expect(screen.getByText(/strong matches/i)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /new scan/i }));
    expect(onSwitchResume).toHaveBeenCalled();
  });

  it('triggers onEditProfile from sidebar Edit profile link', async () => {
    const user = userEvent.setup();
    const onEditProfile = vi.fn();
    render(<Results profile={PROFILE} {...NOOP_PROPS} onEditProfile={onEditProfile} />);
    await waitFor(() => expect(screen.getByText(/strong matches/i)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /edit profile/i }));
    expect(onEditProfile).toHaveBeenCalled();
  });

  it('triggers onOpenSettings from sidebar Settings link', async () => {
    const user = userEvent.setup();
    const onOpenSettings = vi.fn();
    render(<Results profile={PROFILE} {...NOOP_PROPS} onOpenSettings={onOpenSettings} />);
    await waitFor(() => expect(screen.getByText(/strong matches/i)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /^settings$/i }));
    expect(onOpenSettings).toHaveBeenCalled();
  });

  it('shows error message when scan fails', async () => {
    vi.mocked(scanJobs).mockRejectedValueOnce(new Error('API down'));
    render(<Results profile={PROFILE} {...NOOP_PROPS} />);
    await waitFor(() => expect(screen.getByText(/scan failed/i)).toBeInTheDocument());
    expect(screen.getByText(/API down/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests, confirm they fail.**

`npm test -- Results`
Expected: many fail because the current Results.tsx doesn't have a sidebar, doesn't have filters, and uses a ProfileMenu (not the sidebar). That's expected.

- [ ] **Step 3: Replace `src/screens/Results/Results.tsx`**

```tsx
import { useEffect, useMemo, useState } from 'react';
import type { Profile, ScoredJob, SourceKey, SourceState, ScoreTier } from '../../types';
import { loadSettings } from '../../lib/storage';
import { scanJobs, SOURCE_LABELS } from '../../lib/scanJobs';
import { scoreTier } from '../../lib/scoreTier';
import { JobCard } from '../../components/JobCard/JobCard';
import { SourceRow } from '../../components/SourceRow/SourceRow';
import { SideSheet } from '../../components/SideSheet/SideSheet';
import { ScoreDot } from '../../components/ScoreDot/ScoreDot';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import { ProfileSummary } from '../../components/ProfileSummary/ProfileSummary';
import { FilterGroup } from '../../components/FilterGroup/FilterGroup';
import { Segmented } from '../../components/Segmented/Segmented';
import { RangeSlider } from '../../components/RangeSlider/RangeSlider';
import styles from './Results.module.css';

interface Props {
  profile: Profile;
  onEditProfile: () => void;
  onSwitchResume: () => void;
  onOpenSettings: () => void;
  onScanFinished?: () => void;
}

type TierFilter = 'all' | ScoreTier;

interface Filters {
  tier: TierFilter;
  sources: Set<SourceKey>;
  minScore: number;
}

const TIER_OPTS = [
  { value: 'all', label: 'All' },
  { value: 'strong', label: 'Strong' },
  { value: 'decent', label: 'Decent' },
  { value: 'skip', label: 'Skip' },
] as const;

export function Results({ profile, onEditProfile, onSwitchResume, onOpenSettings, onScanFinished }: Props) {
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

  const [filters, setFilters] = useState<Filters>(() => ({
    tier: 'all',
    sources: new Set(enabledSources),
    minScore: 0,
  }));

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
            if (i === enabledSources.length - 1) {
              setFinished(true);
              onScanFinished?.();
            }
          }, i * 200);
          timers.push(t);
        });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Unknown error');
        setSources((prev) => prev.map((s) => ({ ...s, status: 'error' })));
        setFinished(true);
        onScanFinished?.();
      }
    }

    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [profile, enabledSources, settings.openRouterKey, settings.model, onScanFinished]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const tier = scoreTier(j.score);
      if (filters.tier !== 'all' && tier !== filters.tier) return false;
      if (!filters.sources.has(j.source)) return false;
      if (j.score < filters.minScore) return false;
      return true;
    });
  }, [jobs, filters]);

  const grouped = useMemo(() => {
    const strong: ScoredJob[] = [];
    const decent: ScoredJob[] = [];
    let skipCount = 0;
    for (const j of filteredJobs) {
      const t = scoreTier(j.score);
      if (t === 'strong') strong.push(j);
      else if (t === 'decent') decent.push(j);
      else skipCount += 1;
    }
    strong.sort((a, b) => b.score - a.score);
    decent.sort((a, b) => b.score - a.score);
    return { strong, decent, skipCount };
  }, [filteredJobs]);

  const countsByKey = useMemo(() => {
    const m = new Map<SourceKey, number>();
    for (const j of jobs) m.set(j.source, (m.get(j.source) ?? 0) + 1);
    return m;
  }, [jobs]);

  function toggleSource(k: SourceKey) {
    setFilters((f) => {
      const next = new Set(f.sources);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return { ...f, sources: next };
    });
  }

  const subtitle = `${profile.targetRole} · ${profile.level} · ${profile.locationPreference}`;

  return (
    <div className={styles.root}>
      <Sidebar
        footer={
          <>
            <button type="button" className={styles.settingsLink} onClick={onOpenSettings}>
              Settings
            </button>
            <button type="button" className={styles.newScan} onClick={onSwitchResume}>
              New scan
            </button>
          </>
        }
      >
        <ProfileSummary profile={profile} onEdit={onEditProfile} />

        <FilterGroup title="Tier">
          <Segmented
            options={TIER_OPTS}
            value={filters.tier}
            onChange={(v) => setFilters((f) => ({ ...f, tier: v as TierFilter }))}
            ariaLabel="Tier filter"
          />
        </FilterGroup>

        <FilterGroup title="Sources">
          {enabledSources.map((k) => (
            <label key={k} className={styles.checkRow}>
              <input
                type="checkbox"
                aria-label={SOURCE_LABELS[k]}
                checked={filters.sources.has(k)}
                onChange={() => toggleSource(k)}
              />
              <span>{SOURCE_LABELS[k]}</span>
            </label>
          ))}
        </FilterGroup>

        <FilterGroup title="Min score">
          <RangeSlider
            min={0}
            max={100}
            value={filters.minScore}
            onChange={(v) => setFilters((f) => ({ ...f, minScore: v }))}
            ariaLabel="Min score"
          />
        </FilterGroup>
      </Sidebar>

      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>Results</h1>
          <p className={styles.subtitle}>{subtitle}</p>
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
          <p className={styles.empty}>No matches yet. Try widening your profile or relaxing filters.</p>
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
            {grouped.skipCount} skipped — refine filters or profile to surface more.
          </p>
        )}
      </main>

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

- [ ] **Step 4: Replace `src/screens/Results/Results.module.css`**

```css
.root {
  display: flex;
  align-items: flex-start;
  gap: 0;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 880px) {
  .root {
    flex-direction: column;
  }
}

.main {
  flex: 1;
  padding: var(--space-6) var(--space-5);
  min-width: 0;
}

.header {
  margin-bottom: var(--space-6);
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

.checkRow {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-caption);
  color: var(--text-secondary);
  cursor: pointer;
}

.checkRow input {
  accent-color: var(--accent);
  cursor: pointer;
}

.settingsLink {
  background: transparent;
  border: none;
  padding: var(--space-2) 0;
  font-size: var(--font-size-caption);
  color: var(--text-secondary);
  cursor: pointer;
  text-align: left;
  transition: color var(--motion-fast) var(--easing-out);
}

.settingsLink:hover {
  color: var(--text-primary);
}

.newScan {
  background: var(--accent);
  color: var(--on-accent);
  border: none;
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius);
  cursor: pointer;
  transition: background-color var(--motion-fast) var(--easing-out);
}

.newScan:hover {
  background: var(--accent-hover);
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

- [ ] **Step 5: Run all Results tests**

`npm test -- Results`
Expected: 9/9 pass.

If a filter test fails because of timing, increase `waitFor` timeout. If a click target isn't found, double-check the rendered output matches the test's selectors.

- [ ] **Step 6: Run full suite + typecheck + lint**

```bash
npm test
npm run typecheck
npm run lint
```

All must be green.

- [ ] **Step 7: Commit**

```bash
git add src/screens/Results
git commit -m "feat(screens): redesign Results with sidebar, filters, and new-scan"
```

---

## Task 6: E2E + verification + push PR

**Files:**
- Modify: `tests/e2e/results.spec.ts` — add a filter test, update existing tests if profile menu was used (it's removed now)

- [ ] **Step 1: Update `tests/e2e/results.spec.ts`**

The existing test cases use the ProfileMenu to trigger Switch resume / Edit profile. Those interactions now happen via the sidebar buttons. Update the assertions accordingly.

Find:
```typescript
    await page.getByRole('button', { name: /profile menu/i }).click();
    await page.getByRole('menuitem', { name: /switch resume/i }).click();
```

Replace with:
```typescript
    await page.getByRole('button', { name: /new scan/i }).click();
```

Find:
```typescript
    await page.getByRole('button', { name: /profile menu/i }).click();
    await page.getByRole('menuitem', { name: /edit profile/i }).click();
```

Replace with:
```typescript
    await page.getByRole('button', { name: /edit profile/i }).click();
```

Add a new test at the end:

```typescript
  test('filter by tier — Strong hides Decent matches', async ({ page }) => {
    await page.goto('/');
    const fixturePath = path.resolve(__dirname, '../fixtures/sample-resume.pdf');
    await page.getByLabel('Drop here or click to browse').setInputFiles(fixturePath);
    await expect(page.getByText('Confirm your profile')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /start scanning/i }).click();
    await expect(page.getByText(/strong matches/i)).toBeVisible({ timeout: 10_000 });

    await expect(page.getByText(/decent matches/i)).toBeVisible();
    await page.getByRole('radio', { name: 'Strong' }).click();
    await expect(page.getByText(/decent matches/i)).toHaveCount(0);
    await expect(page.getByText(/strong matches/i)).toBeVisible();
  });
```

- [ ] **Step 2: Run all checks**

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

All green required before pushing.

- [ ] **Step 3: Commit + push + open PR**

```bash
git add tests/e2e/results.spec.ts
git commit -m "test(e2e): cover sidebar filters and new-scan/edit-profile flows"

git push -u origin feat/v0-plan-4b-results-sidebar

gh pr create --base main --title "Plan 4b: Results sidebar + filters" --body "$(cat <<'EOF'
## Summary
- Add 260px left sidebar to the Results screen with profile summary, tier/source/min-score filters, and footer actions (Settings, New scan)
- Filters apply client-side over LLM-returned jobs — no re-scan needed when narrowing
- Source-row counts continue to show unfiltered scan totals; group counts and skipped footer reflect the filtered set
- Remove ProfileMenu from Results header (its actions moved to the sidebar)

## Test plan
- [x] \`npm run typecheck\`
- [x] \`npm run lint\`
- [x] \`npm test\` (unit + component, Results suite expanded)
- [x] \`npm run build\`
- [x] \`npm run test:e2e\` (filter tests added)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-Review

**Spec coverage:**
- Sidebar with profile summary ✅ Tasks 3, 4, 5
- 3 filters (tier, source, min-score) ✅ Tasks 1, 2, 5
- Footer actions (Settings, New scan) ✅ Task 5
- ProfileMenu removed from Results header ✅ Task 5
- Source-row counts show unfiltered totals; group counts show filtered ✅ Task 5 (`countsByKey` over `jobs`, grouping over `filteredJobs`)

**Placeholder scan:** No TBD/TODO. All code blocks complete.

**Type consistency:** `Filters` uses `Set<SourceKey>` so we don't double-track membership; `TierFilter` is the discriminated `'all' | ScoreTier` union. Imported types match Plan 4a's exports.

**Risks:**
- The Results test mocks scanJobs with all 5 sources but `loadSettings` returns only 3 enabled. Tests reference jobs across linkedin/greenhouse/lever (all enabled in the mock) so they should resolve. Double-check by running the suite.
- The sidebar's `position: sticky` + `max-height` only works inside a flex/grid parent that doesn't constrain its own scroll. App.tsx wraps Results in a `.screen` div — verify it doesn't have `overflow: hidden`.
- Screen-narrow viewport: at <880px the sidebar stacks above main. Acceptable for v0.

**Cuts:**
- Saved searches (deferred indefinitely)
- Sidebar collapse with hamburger on small viewports (just stack)
- Sort options
