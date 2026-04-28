# Trajector v0 — Plan 4a: SaaS-Grade UI + Extended Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the bare Upload screen with a marketing-grade Landing screen that includes a Hero, demo preview, FeatureGrid, FAQ, and Footer; introduce an OnboardingStepper visible across post-Landing screens; extend the candidate Profile from 6 fields to 16 (including `country`); and redesign Confirm with progressive disclosure across Essentials / Logistics / Preferences sections.

**Architecture:** All work happens in `/Users/syedejazahammed/Documents/GitHub/Trajector` on a new branch `feat/v0-plan-4a-saas-ui` stacked on `feat/v0-plan-3-results`. Strict TDD: failing test first, then implementation. Existing design system (`src/theme.css` tokens, no gradients, score colors as the only chromatic accents) is reused throughout. New profile fields flow through `extractProfile` (LLM auto-fills from resume) and `scanJobs` (LLM uses them to score, country drives "available where" generation).

**Tech Stack:** React 19 + TypeScript 5.9 + CSS Modules + Vitest + Playwright. Uses existing OpenRouter integration. No new runtime dependencies.

**Spec reference:** `docs/superpowers/specs/2026-04-28-trajector-v0-saas-ui-design.md`

---

## File Structure

**New files:**

Data:
- `src/lib/profileStore.ts` + `.test.ts` — load/save Profile to localStorage
- `src/lib/demoScan.ts` — `DEMO_PROFILE` and `DEMO_JOBS` constants
- `src/lib/countries.ts` — curated country list

Form atoms:
- `src/components/Segmented/{Segmented.tsx, .module.css, .test.tsx}`
- `src/components/Toggle/{Toggle.tsx, .module.css, .test.tsx}`
- `src/components/MultiPill/{MultiPill.tsx, .module.css, .test.tsx}`
- `src/components/Disclosure/{Disclosure.tsx, .module.css, .test.tsx}`
- `src/components/CountrySelect/{CountrySelect.tsx, .module.css, .test.tsx}`

Marketing components:
- `src/components/AppBar/{AppBar.tsx, .module.css, .test.tsx}`
- `src/components/OnboardingStepper/{OnboardingStepper.tsx, .module.css, .test.tsx}`
- `src/components/Hero/{Hero.tsx, .module.css, .test.tsx}`
- `src/components/DemoPreview/{DemoPreview.tsx, .module.css, .test.tsx}`
- `src/components/TrustBar/{TrustBar.tsx, .module.css, .test.tsx}`
- `src/components/FeatureGrid/{FeatureGrid.tsx, .module.css, .test.tsx}`
- `src/components/HowItWorksStrip/{HowItWorksStrip.tsx, .module.css, .test.tsx}`
- `src/components/FaqAccordion/{FaqAccordion.tsx, .module.css, .test.tsx}`
- `src/components/Footer/{Footer.tsx, .module.css, .test.tsx}`

Screen:
- `src/screens/Landing/{Landing.tsx, .module.css, .test.tsx}`

E2E:
- `tests/e2e/landing.spec.ts`

**Modified files:**
- `src/types.ts` — extend Profile, add new enum types, add `'landing'` to Screen
- `src/lib/extractProfile.ts` + `.test.ts` — new fields in prompt + coercion
- `src/lib/scanJobs.ts` + `.test.ts` — country-aware prompt + coercion of new fields
- `src/screens/Confirm/Confirm.tsx` + `.module.css` — full redesign with 3 sections
- `src/screens/Confirm/Confirm.test.tsx` — updated for new layout (existing tests stay or get migrated)
- `src/screens/Upload/Upload.tsx` — wraps with Stepper, otherwise unchanged
- `src/screens/Settings/Settings.tsx` — wraps with Stepper
- `src/screens/Results/Results.tsx` — wraps with Stepper
- `src/App.tsx` — Landing as default route, AppBar wrapper, Stepper integration
- `src/App.module.css` — adjustments for AppBar offset
- `tests/e2e/upload.spec.ts` — updated for Landing-first flow
- `tests/e2e/results.spec.ts` — flow now starts from Landing

**Deleted files:** none.

---

## Task 1: Extend Profile types and Screen union

**Files:**
- Modify: `src/types.ts`

This is a pure type change. Existing consumers (extractProfile, scanJobs, Confirm, App, Results) will break — Tasks 2, 3, and 16 fix them. Between tasks the build will be temporarily red on those files; that's acceptable in subagent-driven flow because each subagent owns the green-state for its task.

To keep the gap small, this task ALSO patches the simple downstream callers — App.tsx and Results.tsx — to a "do-nothing-but-typecheck" minimum where their references to `profile.targetRole`, `profile.location`, `profile.compFloor` still work (they're unchanged in shape; only NEW fields were added).

- [ ] **Step 1: Replace `src/types.ts` with the new content**

```typescript
export type ResumeFileKind = 'pdf' | 'docx' | 'md';
export interface ResumeText {
  kind: ResumeFileKind;
  filename: string;
  text: string;
  byteSize: number;
}
export type Level = 'junior' | 'mid' | 'senior' | 'staff' | 'principal';
export type LocationPref = 'remote' | 'hybrid' | 'onsite' | 'flexible';
export type EmploymentType = 'full-time' | 'contract' | 'part-time';
export type CompanyStage = 'seed' | 'early' | 'growth' | 'public';
export type CompanySize = 'startup' | 'mid' | 'large' | 'enterprise';
export type EquityImportance = 'dealbreaker' | 'important' | 'nice' | 'irrelevant';
export type JobSearchStatus = 'active' | 'open' | 'passive';
export interface Profile {
  // Essentials
  targetRole: string;
  level: Level;
  yearsOfExperience: number | null;
  stackSignals: string[];
  employmentTypes: EmploymentType[];
  // Logistics
  compFloor: number | null;
  locationPreference: LocationPref;
  country: string | null;
  preferredLocations: string[];
  requiresSponsorship: boolean;
  dealBreakers: string[];
  // Preferences
  companyStages: CompanyStage[];
  companySize: CompanySize | null;
  equityImportance: EquityImportance | null;
  industriesToExclude: string[];
  jobSearchStatus: JobSearchStatus | null;
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
export type Screen = 'landing' | 'upload' | 'analyzing' | 'settings' | 'confirm' | 'results';
```

Compare with the existing types: the `Profile` field `location` is now `locationPreference`. This is a rename — existing consumers using `profile.location` need an update.

- [ ] **Step 2: Patch consumers that broke from the `location` → `locationPreference` rename**

Files to grep for `\.location\b` (and update each):

Run: `grep -rn 'profile\.location' src/ tests/`

Expected hits at least in:
- `src/screens/Confirm/Confirm.tsx`
- `src/screens/Results/Results.tsx`
- `src/lib/extractProfile.ts`
- `tests/e2e/upload.spec.ts`
- `tests/e2e/results.spec.ts`

For each, change `profile.location` to `profile.locationPreference`. Don't try to add the new fields yet — that's Task 2 and Task 16. Just the rename so the project still compiles.

Also update `src/lib/extractProfile.test.ts` mock fixtures to use `locationPreference` instead of `location` if such fixtures exist.

- [ ] **Step 3: Verify typecheck**

Run: `npm run typecheck`

Expected: zero errors.

If errors remain, they're from the `Profile` interface being constructed with the old shape somewhere. Find each, add the missing new fields to the literal with sensible defaults:
```
yearsOfExperience: null,
employmentTypes: [],
country: null,
preferredLocations: [],
requiresSponsorship: false,
companyStages: [],
companySize: null,
equityImportance: null,
industriesToExclude: [],
jobSearchStatus: null,
```

Tests may fail at runtime because the Confirm screen renders fields that no longer exist. That's expected — Task 16 redesigns Confirm. For now we accept that some Confirm tests fail. Run `npm test -- --reporter=verbose 2>&1 | head -80` and confirm only Confirm-related tests fail.

- [ ] **Step 4: Commit**

```bash
git checkout -b feat/v0-plan-4a-saas-ui
git add src/types.ts src/screens/Confirm src/screens/Results src/lib tests/e2e
git commit -m "feat(types): extend Profile to 16 fields and add Screen 'landing'"
```

Note: Confirm.tsx is left in a partially-broken state on purpose — Task 16 owns its redesign.

---

## Task 2: Update extractProfile for new fields

**Files:**
- Modify: `src/lib/extractProfile.ts`
- Modify: `src/lib/extractProfile.test.ts`

The LLM gets a prompt that asks it to fill all 16 fields; coercion logic guards each.

- [ ] **Step 1: Update the failing test**

Replace `src/lib/extractProfile.test.ts` with:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractProfile } from './extractProfile';

function mockOR(content: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ choices: [{ message: { content: typeof content === 'string' ? content : JSON.stringify(content) } }] }),
  });
}

const PAYLOAD = {
  targetRole: 'Senior Backend Engineer',
  level: 'senior',
  yearsOfExperience: 7,
  stackSignals: ['Go', 'PostgreSQL'],
  employmentTypes: ['full-time'],
  compFloor: 200000,
  locationPreference: 'remote',
  country: 'United States',
  preferredLocations: [],
  requiresSponsorship: false,
  dealBreakers: [],
  companyStages: ['growth', 'public'],
  companySize: 'mid',
  equityImportance: 'nice',
  industriesToExclude: [],
  jobSearchStatus: 'open',
};

describe('extractProfile', () => {
  beforeEach(() => vi.stubGlobal('fetch', mockOR(PAYLOAD)));
  afterEach(() => vi.unstubAllGlobals());

  it('returns a fully populated Profile', async () => {
    const p = await extractProfile('resume text', 'k', 'm');
    expect(p).toMatchObject({
      targetRole: 'Senior Backend Engineer',
      level: 'senior',
      yearsOfExperience: 7,
      stackSignals: ['Go', 'PostgreSQL'],
      employmentTypes: ['full-time'],
      compFloor: 200000,
      locationPreference: 'remote',
      country: 'United States',
      requiresSponsorship: false,
      companyStages: ['growth', 'public'],
      companySize: 'mid',
      equityImportance: 'nice',
      jobSearchStatus: 'open',
    });
  });

  it('defaults missing fields safely', async () => {
    vi.stubGlobal('fetch', mockOR({}));
    const p = await extractProfile('resume', 'k', 'm');
    expect(p).toMatchObject({
      targetRole: '',
      level: 'senior',
      yearsOfExperience: null,
      stackSignals: [],
      employmentTypes: [],
      compFloor: null,
      locationPreference: 'remote',
      country: null,
      preferredLocations: [],
      requiresSponsorship: false,
      dealBreakers: [],
      companyStages: [],
      companySize: null,
      equityImportance: null,
      industriesToExclude: [],
      jobSearchStatus: null,
    });
  });

  it('coerces invalid level to senior', async () => {
    vi.stubGlobal('fetch', mockOR({ ...PAYLOAD, level: 'godlike' }));
    const p = await extractProfile('resume', 'k', 'm');
    expect(p.level).toBe('senior');
  });

  it('coerces invalid locationPreference to remote', async () => {
    vi.stubGlobal('fetch', mockOR({ ...PAYLOAD, locationPreference: 'lunar' }));
    const p = await extractProfile('resume', 'k', 'm');
    expect(p.locationPreference).toBe('remote');
  });

  it('filters invalid employmentTypes', async () => {
    vi.stubGlobal('fetch', mockOR({ ...PAYLOAD, employmentTypes: ['full-time', 'freelance', 'contract'] }));
    const p = await extractProfile('resume', 'k', 'm');
    expect(p.employmentTypes).toEqual(['full-time', 'contract']);
  });

  it('filters invalid companyStages', async () => {
    vi.stubGlobal('fetch', mockOR({ ...PAYLOAD, companyStages: ['series-A', 'growth', 'pre-IPO'] }));
    const p = await extractProfile('resume', 'k', 'm');
    expect(p.companyStages).toEqual(['growth']);
  });

  it('coerces invalid companySize to null', async () => {
    vi.stubGlobal('fetch', mockOR({ ...PAYLOAD, companySize: 'medium-large' }));
    const p = await extractProfile('resume', 'k', 'm');
    expect(p.companySize).toBeNull();
  });

  it('throws on invalid JSON', async () => {
    vi.stubGlobal('fetch', mockOR('not json'));
    await expect(extractProfile('resume', 'k', 'm')).rejects.toThrow('Model returned invalid JSON');
  });
});
```

- [ ] **Step 2: Run tests, confirm they fail**

Run: `npm test -- extractProfile`

Expected: failures because the implementation doesn't yet read most of the new fields.

- [ ] **Step 3: Replace `src/lib/extractProfile.ts` with the updated implementation**

```typescript
import { fetchCompletion } from './openrouter';
import type {
  Profile,
  Level,
  LocationPref,
  EmploymentType,
  CompanyStage,
  CompanySize,
  EquityImportance,
  JobSearchStatus,
} from '../types';

const SYSTEM = `Extract structured profile data from this resume text. Return ONLY valid JSON — no markdown fences, no commentary, just the JSON object.

Schema:
{
  "targetRole": string,
  "level": "junior" | "mid" | "senior" | "staff" | "principal",
  "yearsOfExperience": number | null,
  "stackSignals": string[],
  "employmentTypes": Array<"full-time" | "contract" | "part-time">,
  "compFloor": number | null,
  "locationPreference": "remote" | "hybrid" | "onsite" | "flexible",
  "country": string | null,
  "preferredLocations": string[],
  "requiresSponsorship": boolean,
  "dealBreakers": string[],
  "companyStages": Array<"seed" | "early" | "growth" | "public">,
  "companySize": "startup" | "mid" | "large" | "enterprise" | null,
  "equityImportance": "dealbreaker" | "important" | "nice" | "irrelevant" | null,
  "industriesToExclude": string[],
  "jobSearchStatus": "active" | "open" | "passive" | null
}

Rules:
- targetRole: most recent or desired role title
- level: from years of experience and last title; default "senior"
- yearsOfExperience: integer years from earliest dated role to most recent; null if not derivable
- stackSignals: 5-8 most relevant technical skills/languages/frameworks
- employmentTypes: based on resume signals (e.g. "Independent Contractor" → contract); default ["full-time"]
- compFloor: only if explicitly mentioned; otherwise null
- locationPreference: default "remote" if unclear
- country: parse from address/location lines (e.g. "San Francisco, CA" → "United States"); null if absent
- preferredLocations: any city/region mentioned as a preference; otherwise []
- requiresSponsorship: only true if explicitly stated; otherwise false
- companyStages: only fill if resume names target stages explicitly; otherwise []
- companySize: only if inferable; otherwise null
- equityImportance: only if explicit; otherwise null
- industriesToExclude: only if explicit; otherwise []
- jobSearchStatus: default null unless resume signals urgency`;

const VALID_LEVELS = new Set<Level>(['junior', 'mid', 'senior', 'staff', 'principal']);
const VALID_LOCS = new Set<LocationPref>(['remote', 'hybrid', 'onsite', 'flexible']);
const VALID_EMP = new Set<EmploymentType>(['full-time', 'contract', 'part-time']);
const VALID_STAGE = new Set<CompanyStage>(['seed', 'early', 'growth', 'public']);
const VALID_SIZE = new Set<CompanySize>(['startup', 'mid', 'large', 'enterprise']);
const VALID_EQUITY = new Set<EquityImportance>(['dealbreaker', 'important', 'nice', 'irrelevant']);
const VALID_STATUS = new Set<JobSearchStatus>(['active', 'open', 'passive']);

function pickEnum<T>(raw: unknown, valid: Set<T>, fallback: T | null): T | null {
  const s = typeof raw === 'string' ? (raw as unknown as T) : null;
  return s !== null && valid.has(s) ? s : fallback;
}

function pickArray<T>(raw: unknown, valid: Set<T>): T[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((v): v is T => typeof v === 'string' && valid.has(v as unknown as T));
}

function pickStringArray(raw: unknown, max: number): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((s): s is string => typeof s === 'string').slice(0, max);
}

export async function extractProfile(
  resumeText: string,
  apiKey: string,
  model: string,
): Promise<Profile> {
  const raw = await fetchCompletion(apiKey, model, [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: resumeText },
  ]);

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error('Model returned invalid JSON');
  }

  return {
    targetRole: typeof parsed.targetRole === 'string' ? parsed.targetRole : '',
    level: pickEnum(parsed.level, VALID_LEVELS, 'senior') as Level,
    yearsOfExperience: typeof parsed.yearsOfExperience === 'number' ? parsed.yearsOfExperience : null,
    stackSignals: pickStringArray(parsed.stackSignals, 8),
    employmentTypes: pickArray(parsed.employmentTypes, VALID_EMP),
    compFloor: typeof parsed.compFloor === 'number' ? parsed.compFloor : null,
    locationPreference: pickEnum(parsed.locationPreference, VALID_LOCS, 'remote') as LocationPref,
    country: typeof parsed.country === 'string' && parsed.country.length > 0 ? parsed.country : null,
    preferredLocations: pickStringArray(parsed.preferredLocations, 10),
    requiresSponsorship: parsed.requiresSponsorship === true,
    dealBreakers: pickStringArray(parsed.dealBreakers, 10),
    companyStages: pickArray(parsed.companyStages, VALID_STAGE),
    companySize: pickEnum(parsed.companySize, VALID_SIZE, null) as CompanySize | null,
    equityImportance: pickEnum(parsed.equityImportance, VALID_EQUITY, null) as EquityImportance | null,
    industriesToExclude: pickStringArray(parsed.industriesToExclude, 10),
    jobSearchStatus: pickEnum(parsed.jobSearchStatus, VALID_STATUS, null) as JobSearchStatus | null,
  };
}
```

- [ ] **Step 4: Run tests, confirm 8/8 pass**

Run: `npm test -- extractProfile`

Expected: 8/8 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/extractProfile.ts src/lib/extractProfile.test.ts
git commit -m "feat(lib): extend extractProfile to fill all 16 Profile fields"
```

---

## Task 3: Update scanJobs for country-aware generation

**Files:**
- Modify: `src/lib/scanJobs.ts`
- Modify: `src/lib/scanJobs.test.ts`

The prompt now has access to all 16 fields and tells the LLM to generate jobs available in the candidate's country (with remote/global as the cross-country bucket), and to honor sponsorship + companyStage + companySize + equityImportance + industriesToExclude when scoring. Coercion is unchanged shape-wise.

- [ ] **Step 1: Update `src/lib/scanJobs.test.ts`**

Update only the `PROFILE` constant at the top to use the new shape — the rest of the tests should still pass:

Find:
```typescript
const PROFILE: Profile = {
  targetRole: 'Senior Backend Engineer',
  level: 'senior',
  compFloor: 200000,
  location: 'remote',
  stackSignals: ['Go', 'PostgreSQL'],
  dealBreakers: [],
};
```

Replace with:
```typescript
const PROFILE: Profile = {
  targetRole: 'Senior Backend Engineer',
  level: 'senior',
  yearsOfExperience: 7,
  stackSignals: ['Go', 'PostgreSQL'],
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
```

Add one new test case at the end of the `describe`:

```typescript
  it('passes country in the user message', async () => {
    let capturedBody: string | null = null;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
      capturedBody = init.body as string;
      return {
        ok: true,
        json: async () => ({ choices: [{ message: { content: '[]' } }] }),
      };
    }));
    await scanJobs(PROFILE, SOURCES, 'k', 'm');
    expect(capturedBody).toContain('United States');
  });
```

- [ ] **Step 2: Run tests, confirm the new one fails (others should still pass)**

Run: `npm test -- scanJobs`

Expected: 1 NEW failure (`passes country in the user message`); the existing 7 still pass because we only updated the fixture.

- [ ] **Step 3: Update `src/lib/scanJobs.ts`**

Replace the `buildSystemPrompt` function with:

```typescript
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
- COUNTRY: only generate jobs available in the candidate's "country" or fully remote / global. If no country given, default to US-friendly remote.
- SPONSORSHIP: if requiresSponsorship is true, include only jobs that accept sponsorship; if false, generate a normal mix.
- COMP: postings below compFloor score lower
- DEAL-BREAKERS: postings violating dealBreakers score lower
- COMPANY STAGE / SIZE: if specified, score off-stage / off-size postings lower
- EQUITY: if equityImportance is "dealbreaker", postings without equity score very low; if "irrelevant", treat equity as neutral
- INDUSTRIES TO EXCLUDE: avoid generating postings in those industries
- EMPLOYMENT TYPES: contract roles for full-time-only candidates score lower, and vice versa
- Vary companies; no duplicates`;
}
```

The function `coerceJob` and the public `scanJobs` signature are unchanged. The `user` message in `scanJobs` is `JSON.stringify(profile, null, 2)` — that already includes all new fields including country, so the "passes country" test will pass.

- [ ] **Step 4: Run tests, confirm 8/8 pass**

Run: `npm test -- scanJobs`

Expected: 8/8 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scanJobs.ts src/lib/scanJobs.test.ts
git commit -m "feat(lib): make scanJobs country-aware and honor extended profile fields"
```

---

## Task 4: profileStore + countries + demoScan data

**Files:**
- Create: `src/lib/profileStore.ts` + `src/lib/profileStore.test.ts`
- Create: `src/lib/countries.ts`
- Create: `src/lib/demoScan.ts`

Three small data-layer additions. No tests for `countries.ts` (it's a static array) or `demoScan.ts` (a static const).

- [ ] **Step 1: Write the failing test for profileStore**

Create `src/lib/profileStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { loadProfile, saveProfile } from './profileStore';
import type { Profile } from '../types';

const SAMPLE: Profile = {
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

describe('profileStore', () => {
  beforeEach(() => localStorage.clear());

  it('returns null when nothing saved', () => {
    expect(loadProfile()).toBeNull();
  });

  it('roundtrips a saved profile', () => {
    saveProfile(SAMPLE);
    expect(loadProfile()).toEqual(SAMPLE);
  });

  it('returns null on malformed JSON', () => {
    localStorage.setItem('trajector_profile', 'not json');
    expect(loadProfile()).toBeNull();
  });
});
```

- [ ] **Step 2: Run test, confirm fail**

Run: `npm test -- profileStore`

Expected: FAIL on missing module.

- [ ] **Step 3: Create `src/lib/profileStore.ts`**

```typescript
import type { Profile } from '../types';

const KEY = 'trajector_profile';

export function loadProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Profile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile): void {
  localStorage.setItem(KEY, JSON.stringify(profile));
}
```

- [ ] **Step 4: Run tests, confirm 3/3 pass**

Run: `npm test -- profileStore`

- [ ] **Step 5: Create `src/lib/countries.ts`**

```typescript
export const COUNTRIES: readonly string[] = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Spain',
  'Italy', 'Netherlands', 'Belgium', 'Sweden', 'Norway', 'Denmark', 'Finland',
  'Poland', 'Portugal', 'Ireland', 'Austria', 'Switzerland', 'Czech Republic',
  'Hungary', 'Greece', 'Turkey', 'Israel', 'United Arab Emirates', 'India',
  'Pakistan', 'Bangladesh', 'Sri Lanka', 'Singapore', 'Japan', 'South Korea',
  'China', 'Taiwan', 'Hong Kong', 'Australia', 'New Zealand', 'Indonesia',
  'Malaysia', 'Philippines', 'Thailand', 'Vietnam', 'Mexico', 'Brazil',
  'Argentina', 'Chile', 'Colombia', 'Peru', 'Uruguay', 'Costa Rica',
  'South Africa', 'Nigeria', 'Kenya', 'Egypt', 'Morocco', 'Ghana',
  'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Jordan', 'Lebanon',
  'Russia', 'Ukraine', 'Romania', 'Bulgaria', 'Croatia', 'Serbia',
  'Slovenia', 'Slovakia', 'Estonia', 'Latvia', 'Lithuania', 'Iceland',
  'Luxembourg', 'Malta', 'Cyprus',
];
```

- [ ] **Step 6: Create `src/lib/demoScan.ts`**

```typescript
import type { Profile, ScoredJob } from '../types';

export const DEMO_PROFILE: Profile = {
  targetRole: 'Senior Backend Engineer',
  level: 'senior',
  yearsOfExperience: 7,
  stackSignals: ['Go', 'PostgreSQL', 'Kubernetes', 'gRPC'],
  employmentTypes: ['full-time'],
  compFloor: 200000,
  locationPreference: 'remote',
  country: 'United States',
  preferredLocations: [],
  requiresSponsorship: false,
  dealBreakers: ['On-call rotation'],
  companyStages: ['growth', 'public'],
  companySize: 'mid',
  equityImportance: 'nice',
  industriesToExclude: [],
  jobSearchStatus: 'open',
};

export const DEMO_JOBS: ScoredJob[] = [
  {
    id: 'demo-1',
    source: 'linkedin',
    company: 'Vercel',
    title: 'Staff Backend Engineer, Edge Runtime',
    location: 'Remote (US)',
    compRange: '$240k-$300k + equity',
    description:
      'Own the Edge Runtime that powers serverless functions at scale. Design and ship Go services handling millions of requests per second across our global network. You will collaborate with the platform team on observability, performance tuning, and zero-downtime rollouts.',
    tags: ['Go', 'Kubernetes', 'Postgres', 'Distributed Systems'],
    score: 94,
    scoreReason: 'Stack and seniority match; comp above floor; remote-first.',
  },
  {
    id: 'demo-2',
    source: 'greenhouse',
    company: 'Linear',
    title: 'Senior Backend Engineer',
    location: 'Remote (Americas)',
    compRange: '$220k-$260k + equity',
    description:
      'Build the backend that powers the Linear issue-tracker. We work in TypeScript on Node, Postgres, and Redis with a focus on snappy real-time sync. Looking for engineers comfortable shipping in small, autonomous teams.',
    tags: ['TypeScript', 'Postgres', 'Realtime'],
    score: 72,
    scoreReason: 'Different primary stack but seniority and comp align.',
  },
  {
    id: 'demo-3',
    source: 'lever',
    company: 'Cloudflare',
    title: 'Backend Engineer, Workers',
    location: 'Austin, TX (Hybrid)',
    compRange: '$180k-$220k',
    description:
      'Join the Workers team building the runtime that lets developers deploy code to 300+ edge locations. We work in Rust and Go.',
    tags: ['Go', 'Rust', 'Distributed Systems'],
    score: 65,
    scoreReason: 'Stack matches but hybrid in Austin and slightly below comp floor.',
  },
  {
    id: 'demo-4',
    source: 'workable',
    company: 'Acme Bank',
    title: 'Backend Developer',
    location: 'New York, NY (On-site, 5 days)',
    compRange: '$140k-$170k',
    description:
      'Maintain core banking platform written in Java. Five days on-site in midtown. On-call rotation. Strict deployment freezes during financial close.',
    tags: ['Java', 'Banking', 'On-site'],
    score: 28,
    scoreReason: 'On-call dealbreaker, on-site, comp below floor.',
  },
  {
    id: 'demo-5',
    source: 'yc',
    company: 'PinkPaperPlanes',
    title: 'Founding Engineer',
    location: 'San Francisco (On-site)',
    compRange: '$120k-$160k + 1.0% equity',
    description:
      'Build a paper-airplane-themed CRM for SMBs. Pre-seed; founder-led. Wear many hats. Office in SoMa.',
    tags: ['Founding', 'Equity', 'Generalist'],
    score: 42,
    scoreReason: 'Very early stage and on-site; equity-heavy comp below floor.',
  },
];
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/profileStore.ts src/lib/profileStore.test.ts src/lib/countries.ts src/lib/demoScan.ts
git commit -m "feat(lib): add profileStore, countries, and demo scan fixtures"
```

---

## Task 5: Segmented and Toggle components

Two of the simplest atoms, in one task. Both are pure presentational components.

**Files:**
- Create: `src/components/Segmented/{Segmented.tsx, .module.css, .test.tsx}`
- Create: `src/components/Toggle/{Toggle.tsx, .module.css, .test.tsx}`

- [ ] **Step 1: Write Segmented test**

Create `src/components/Segmented/Segmented.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Segmented } from './Segmented';

const OPTIONS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
];

describe('Segmented', () => {
  it('renders all options', () => {
    render(<Segmented options={OPTIONS} value="a" onChange={() => {}} ariaLabel="Pick" />);
    expect(screen.getByRole('radiogroup', { name: 'Pick' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('marks the selected option', () => {
    render(<Segmented options={OPTIONS} value="b" onChange={() => {}} ariaLabel="Pick" />);
    expect(screen.getByRole('radio', { name: 'Beta' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Alpha' })).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange with new value when clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Segmented options={OPTIONS} value="a" onChange={onChange} ariaLabel="Pick" />);
    await user.click(screen.getByRole('radio', { name: 'Gamma' }));
    expect(onChange).toHaveBeenCalledWith('c');
  });
});
```

- [ ] **Step 2: Run, confirm fail**

Run: `npm test -- Segmented`

- [ ] **Step 3: Implement Segmented**

`src/components/Segmented/Segmented.tsx`:

```tsx
import styles from './Segmented.module.css';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (next: T) => void;
  ariaLabel: string;
}

export function Segmented<T extends string>({ options, value, onChange, ariaLabel }: Props<T>) {
  return (
    <div className={styles.root} role="radiogroup" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={opt.value === value}
          className={`${styles.option}${opt.value === value ? ` ${styles.active}` : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
```

`src/components/Segmented/Segmented.module.css`:

```css
.root {
  display: inline-flex;
  background: var(--bg-surface);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius);
  padding: 2px;
  gap: 2px;
}

.option {
  background: transparent;
  border: none;
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-caption);
  color: var(--text-secondary);
  border-radius: calc(var(--radius) - 2px);
  cursor: pointer;
  transition: background-color var(--motion-fast) var(--easing-out),
              color var(--motion-fast) var(--easing-out);
  white-space: nowrap;
}

.option:hover:not(.active) {
  color: var(--text-primary);
}

.active {
  background: var(--bg-surface-2);
  color: var(--text-primary);
}

.option:focus-visible {
  outline: var(--border-width) solid var(--accent);
  outline-offset: -1px;
}
```

- [ ] **Step 4: Run, confirm 3/3 pass**

Run: `npm test -- Segmented`

- [ ] **Step 5: Write Toggle test**

`src/components/Toggle/Toggle.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toggle } from './Toggle';

describe('Toggle', () => {
  it('renders unchecked by default', () => {
    render(<Toggle checked={false} onChange={() => {}} ariaLabel="Sponsorship" />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('renders checked when checked=true', () => {
    render(<Toggle checked onChange={() => {}} ariaLabel="Sponsorship" />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange with the new value when clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} ariaLabel="Sponsorship" />);
    await user.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
```

- [ ] **Step 6: Implement Toggle**

`src/components/Toggle/Toggle.tsx`:

```tsx
import styles from './Toggle.module.css';

interface Props {
  checked: boolean;
  onChange: (next: boolean) => void;
  ariaLabel: string;
}

export function Toggle({ checked, onChange, ariaLabel }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`${styles.root}${checked ? ` ${styles.on}` : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.knob} />
    </button>
  );
}
```

`src/components/Toggle/Toggle.module.css`:

```css
.root {
  width: 36px;
  height: 20px;
  background: var(--bg-surface-2);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: 999px;
  padding: 0;
  cursor: pointer;
  position: relative;
  transition: background-color var(--motion-fast) var(--easing-out);
}

.knob {
  position: absolute;
  top: 1px;
  left: 1px;
  width: 16px;
  height: 16px;
  background: var(--text-secondary);
  border-radius: 50%;
  transition: transform var(--motion-fast) var(--easing-out),
              background-color var(--motion-fast) var(--easing-out);
}

.on {
  background: var(--accent);
}

.on .knob {
  transform: translateX(16px);
  background: var(--on-accent);
}

.root:focus-visible {
  outline: var(--border-width) solid var(--accent);
  outline-offset: 2px;
}
```

- [ ] **Step 7: Run, confirm 3/3 pass**

Run: `npm test -- Toggle`

- [ ] **Step 8: Commit**

```bash
git add src/components/Segmented src/components/Toggle
git commit -m "feat(components): add Segmented and Toggle form atoms"
```

---

## Task 6: MultiPill component

A multi-select pill group used for `employmentTypes`, `companyStages`. Distinct from `Segmented` because multiple values can be selected.

**Files:**
- Create: `src/components/MultiPill/{MultiPill.tsx, .module.css, .test.tsx}`

- [ ] **Step 1: Test**

`src/components/MultiPill/MultiPill.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultiPill } from './MultiPill';

const OPTS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
];

describe('MultiPill', () => {
  it('marks selected pills as pressed', () => {
    render(<MultiPill options={OPTS} value={['a', 'c']} onChange={() => {}} ariaLabel="Pick" />);
    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Beta' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Gamma' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('toggles a value on click — adds when missing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MultiPill options={OPTS} value={['a']} onChange={onChange} ariaLabel="Pick" />);
    await user.click(screen.getByRole('button', { name: 'Beta' }));
    expect(onChange).toHaveBeenCalledWith(['a', 'b']);
  });

  it('toggles a value on click — removes when present', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MultiPill options={OPTS} value={['a', 'b']} onChange={onChange} ariaLabel="Pick" />);
    await user.click(screen.getByRole('button', { name: 'Alpha' }));
    expect(onChange).toHaveBeenCalledWith(['b']);
  });
});
```

- [ ] **Step 2: Run, confirm fail**

- [ ] **Step 3: Implement**

`src/components/MultiPill/MultiPill.tsx`:

```tsx
import styles from './MultiPill.module.css';

export interface MultiPillOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: readonly MultiPillOption<T>[];
  value: T[];
  onChange: (next: T[]) => void;
  ariaLabel: string;
}

export function MultiPill<T extends string>({ options, value, onChange, ariaLabel }: Props<T>) {
  function toggle(v: T) {
    if (value.includes(v)) onChange(value.filter((x) => x !== v));
    else onChange([...value, v]);
  }
  return (
    <div className={styles.root} role="group" aria-label={ariaLabel}>
      {options.map((opt) => {
        const on = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={on}
            className={`${styles.pill}${on ? ` ${styles.on}` : ''}`}
            onClick={() => toggle(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
```

`src/components/MultiPill/MultiPill.module.css`:

```css
.root {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.pill {
  background: var(--bg-surface);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: 999px;
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-caption);
  color: var(--text-secondary);
  cursor: pointer;
  transition: border-color var(--motion-fast) var(--easing-out),
              color var(--motion-fast) var(--easing-out),
              background-color var(--motion-fast) var(--easing-out);
}

.pill:hover {
  color: var(--text-primary);
  border-color: var(--border-strong);
}

.on {
  background: var(--accent);
  color: var(--on-accent);
  border-color: var(--accent);
}

.pill:focus-visible {
  outline: var(--border-width) solid var(--accent);
  outline-offset: 2px;
}
```

- [ ] **Step 4: Run, confirm 3/3 pass**

- [ ] **Step 5: Commit**

```bash
git add src/components/MultiPill
git commit -m "feat(components): add MultiPill multi-select pill group"
```

---

## Task 7: Disclosure component

A collapsible section with a clickable header and an arrow that rotates.

**Files:**
- Create: `src/components/Disclosure/{Disclosure.tsx, .module.css, .test.tsx}`

- [ ] **Step 1: Test**

`src/components/Disclosure/Disclosure.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Disclosure } from './Disclosure';

describe('Disclosure', () => {
  it('renders children when initially open', () => {
    render(
      <Disclosure title="Section" defaultOpen>
        <p>Body</p>
      </Disclosure>,
    );
    expect(screen.getByText('Body')).toBeVisible();
  });

  it('hides children when closed', () => {
    render(
      <Disclosure title="Section">
        <p>Body</p>
      </Disclosure>,
    );
    expect(screen.queryByText('Body')).not.toBeInTheDocument();
  });

  it('toggles open on header click', async () => {
    const user = userEvent.setup();
    render(
      <Disclosure title="Section">
        <p>Body</p>
      </Disclosure>,
    );
    await user.click(screen.getByRole('button', { name: /section/i }));
    expect(screen.getByText('Body')).toBeVisible();
  });

  it('renders right slot content if provided', () => {
    render(
      <Disclosure title="Section" rightSlot={<span>3 to go</span>}>
        <p>Body</p>
      </Disclosure>,
    );
    expect(screen.getByText('3 to go')).toBeInTheDocument();
  });

  it('reflects controlled state when onOpenChange is provided', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Disclosure title="Section" open={false} onOpenChange={onOpenChange}>
        <p>Body</p>
      </Disclosure>,
    );
    await user.click(screen.getByRole('button', { name: /section/i }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    rerender(
      <Disclosure title="Section" open onOpenChange={onOpenChange}>
        <p>Body</p>
      </Disclosure>,
    );
    expect(screen.getByText('Body')).toBeVisible();
  });
});
```

- [ ] **Step 2: Run, confirm fail**

- [ ] **Step 3: Implement**

`src/components/Disclosure/Disclosure.tsx`:

```tsx
import { useState, type ReactNode } from 'react';
import styles from './Disclosure.module.css';

interface Props {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  rightSlot?: ReactNode;
}

export function Disclosure({ title, children, defaultOpen = false, open, onOpenChange, rightSlot }: Props) {
  const [internal, setInternal] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internal;

  function toggle() {
    const next = !isOpen;
    if (!isControlled) setInternal(next);
    onOpenChange?.(next);
  }

  return (
    <section className={styles.root}>
      <button type="button" className={styles.header} aria-expanded={isOpen} onClick={toggle}>
        <span className={`${styles.caret}${isOpen ? ` ${styles.caretOpen}` : ''}`}>▸</span>
        <span className={styles.title}>{title}</span>
        {rightSlot && <span className={styles.right}>{rightSlot}</span>}
      </button>
      {isOpen && <div className={styles.body}>{children}</div>}
    </section>
  );
}
```

`src/components/Disclosure/Disclosure.module.css`:

```css
.root {
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius);
  background: var(--bg-surface);
}

.header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: transparent;
  border: none;
  padding: var(--space-3) var(--space-4);
  text-align: left;
  cursor: pointer;
}

.header:hover {
  background: var(--bg-surface-2);
}

.caret {
  display: inline-block;
  color: var(--text-tertiary);
  font-size: 12px;
  transition: transform var(--motion-fast) var(--easing-out);
}

.caretOpen {
  transform: rotate(90deg);
}

.title {
  flex: 1;
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.right {
  font-size: var(--font-size-caption);
  color: var(--text-tertiary);
}

.body {
  padding: var(--space-4) var(--space-4) var(--space-5);
  border-top: var(--border-width) solid var(--border-subtle);
}

@media (prefers-reduced-motion: reduce) {
  .caret { transition: none; }
}
```

- [ ] **Step 4: Run, confirm 5/5 pass**

- [ ] **Step 5: Commit**

```bash
git add src/components/Disclosure
git commit -m "feat(components): add Disclosure collapsible section"
```

---

## Task 8: CountrySelect component

Search-autocomplete combobox keyed off the curated `COUNTRIES` list.

**Files:**
- Create: `src/components/CountrySelect/{CountrySelect.tsx, .module.css, .test.tsx}`

- [ ] **Step 1: Test**

`src/components/CountrySelect/CountrySelect.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CountrySelect } from './CountrySelect';

describe('CountrySelect', () => {
  it('renders the current value', () => {
    render(<CountrySelect value="Canada" onChange={() => {}} />);
    expect(screen.getByRole('combobox')).toHaveValue('Canada');
  });

  it('shows null value as empty string', () => {
    render(<CountrySelect value={null} onChange={() => {}} />);
    expect(screen.getByRole('combobox')).toHaveValue('');
  });

  it('opens a list of suggestions when typing', async () => {
    const user = userEvent.setup();
    render(<CountrySelect value={null} onChange={() => {}} />);
    await user.click(screen.getByRole('combobox'));
    await user.keyboard('Uni');
    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(0);
    expect(screen.getByRole('option', { name: 'United States' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'United Kingdom' })).toBeInTheDocument();
  });

  it('calls onChange when an option is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CountrySelect value={null} onChange={onChange} />);
    await user.click(screen.getByRole('combobox'));
    await user.keyboard('Cana');
    await user.click(screen.getByRole('option', { name: 'Canada' }));
    expect(onChange).toHaveBeenCalledWith('Canada');
  });

  it('clears value when input is cleared', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CountrySelect value="Canada" onChange={onChange} />);
    await user.clear(screen.getByRole('combobox'));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
```

- [ ] **Step 2: Run, confirm fail**

- [ ] **Step 3: Implement**

`src/components/CountrySelect/CountrySelect.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import { COUNTRIES } from '../../lib/countries';
import styles from './CountrySelect.module.css';

interface Props {
  value: string | null;
  onChange: (next: string | null) => void;
}

export function CountrySelect({ value, onChange }: Props) {
  const [draft, setDraft] = useState(value ?? '');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft(value ?? '');
  }, [value]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const matches =
    draft.length === 0
      ? COUNTRIES.slice(0, 8)
      : COUNTRIES.filter((c) => c.toLowerCase().includes(draft.toLowerCase())).slice(0, 8);

  function pick(c: string) {
    setDraft(c);
    setOpen(false);
    onChange(c);
  }

  function onInput(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setDraft(next);
    setOpen(true);
    if (next.trim() === '') onChange(null);
  }

  return (
    <div ref={rootRef} className={styles.root}>
      <input
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        className={styles.input}
        value={draft}
        placeholder="Start typing your country…"
        onChange={onInput}
        onFocus={() => setOpen(true)}
      />
      {open && matches.length > 0 && (
        <ul className={styles.list} role="listbox">
          {matches.map((c) => (
            <li key={c}>
              <button
                type="button"
                role="option"
                aria-selected={c === value}
                className={styles.option}
                onClick={() => pick(c)}
              >
                {c}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

`src/components/CountrySelect/CountrySelect.module.css`:

```css
.root {
  position: relative;
}

.input {
  width: 100%;
  background: var(--bg-surface);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius);
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-body);
  color: var(--text-primary);
  outline: none;
  transition: border-color var(--motion-fast) var(--easing-out);
}

.input:focus {
  border-color: var(--accent);
}

.list {
  position: absolute;
  top: calc(100% + 2px);
  left: 0;
  right: 0;
  list-style: none;
  margin: 0;
  padding: var(--space-1);
  background: var(--bg-surface);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius);
  box-shadow: 0 8px 24px rgb(0 0 0 / 40%);
  z-index: 50;
  max-height: 260px;
  overflow-y: auto;
}

.option {
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-body);
  color: var(--text-primary);
  border-radius: calc(var(--radius) - 2px);
  cursor: pointer;
}

.option:hover, .option[aria-selected='true'] {
  background: var(--bg-surface-2);
}
```

- [ ] **Step 4: Run, confirm 5/5 pass**

- [ ] **Step 5: Commit**

```bash
git add src/components/CountrySelect
git commit -m "feat(components): add CountrySelect autocomplete combobox"
```

---

## Task 9: AppBar component

Sticky top bar — brand mark on the left, nav links in the middle, "Drop your resume" CTA pill on the right. The CTA scrolls to the drop zone (which lives on Landing); on other screens, the CTA is hidden.

**Files:**
- Create: `src/components/AppBar/{AppBar.tsx, .module.css, .test.tsx}`

- [ ] **Step 1: Test**

`src/components/AppBar/AppBar.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppBar } from './AppBar';

describe('AppBar', () => {
  it('renders brand mark', () => {
    render(<AppBar showCta={false} />);
    expect(screen.getByText('Trajector')).toBeInTheDocument();
  });

  it('renders nav links', () => {
    render(<AppBar showCta={false} />);
    expect(screen.getByRole('link', { name: /product/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /how it works/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /faq/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /github/i })).toBeInTheDocument();
  });

  it('shows the CTA when showCta is true', () => {
    render(<AppBar showCta />);
    expect(screen.getByRole('link', { name: /drop your resume/i })).toBeInTheDocument();
  });

  it('hides the CTA when showCta is false', () => {
    render(<AppBar showCta={false} />);
    expect(screen.queryByRole('link', { name: /drop your resume/i })).not.toBeInTheDocument();
  });

  it('calls onBrandClick when the brand mark is clicked', async () => {
    const user = userEvent.setup();
    const onBrandClick = vi.fn();
    render(<AppBar showCta={false} onBrandClick={onBrandClick} />);
    await user.click(screen.getByRole('button', { name: /trajector home/i }));
    expect(onBrandClick).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run, confirm fail**

- [ ] **Step 3: Implement**

`src/components/AppBar/AppBar.tsx`:

```tsx
import styles from './AppBar.module.css';

interface Props {
  showCta: boolean;
  onBrandClick?: () => void;
}

export function AppBar({ showCta, onBrandClick }: Props) {
  return (
    <header className={styles.root}>
      <div className={styles.inner}>
        <button
          type="button"
          className={styles.brand}
          aria-label="Trajector home"
          onClick={onBrandClick}
        >
          Trajector
        </button>
        <nav className={styles.nav}>
          <a className={styles.link} href="#features">Product</a>
          <a className={styles.link} href="#how">How it works</a>
          <a className={styles.link} href="#faq">FAQ</a>
          <a
            className={styles.link}
            href="https://github.com/ahammedejaz/trajector"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </nav>
        {showCta && (
          <a className={styles.cta} href="#drop">Drop your resume</a>
        )}
      </div>
    </header>
  );
}
```

`src/components/AppBar/AppBar.module.css`:

```css
.root {
  position: sticky;
  top: 0;
  z-index: 60;
  background: rgb(10 10 10 / 80%);
  backdrop-filter: blur(12px);
  border-bottom: var(--border-width) solid var(--border-subtle);
}

.inner {
  max-width: 1120px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-3) var(--space-5);
}

.brand {
  background: transparent;
  border: none;
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  cursor: pointer;
  letter-spacing: -0.01em;
}

.nav {
  flex: 1;
  display: flex;
  gap: var(--space-5);
  justify-content: center;
}

.link {
  font-size: var(--font-size-body);
  color: var(--text-secondary);
  text-decoration: none;
  transition: color var(--motion-fast) var(--easing-out);
}

.link:hover {
  color: var(--text-primary);
}

.cta {
  background: var(--accent);
  color: var(--on-accent);
  text-decoration: none;
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius);
  transition: background-color var(--motion-fast) var(--easing-out);
}

.cta:hover {
  background: var(--accent-hover);
}
```

- [ ] **Step 4: Run, confirm 5/5 pass**

- [ ] **Step 5: Commit**

```bash
git add src/components/AppBar
git commit -m "feat(components): add sticky AppBar with brand and nav"
```

---

## Task 10: OnboardingStepper component

Horizontal 4-step indicator. Completed steps clickable; active step has a filled white dot.

**Files:**
- Create: `src/components/OnboardingStepper/{OnboardingStepper.tsx, .module.css, .test.tsx}`

- [ ] **Step 1: Test**

`src/components/OnboardingStepper/OnboardingStepper.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnboardingStepper } from './OnboardingStepper';

describe('OnboardingStepper', () => {
  it('renders four steps', () => {
    render(<OnboardingStepper currentStep="profile" completed={['resume']} />);
    expect(screen.getByText('Resume')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Scan')).toBeInTheDocument();
    expect(screen.getByText('Results')).toBeInTheDocument();
  });

  it('marks current step with aria-current="step"', () => {
    render(<OnboardingStepper currentStep="profile" completed={['resume']} />);
    expect(screen.getByText('Profile').closest('[aria-current]')).toHaveAttribute('aria-current', 'step');
  });

  it('renders completed steps as buttons', () => {
    render(<OnboardingStepper currentStep="profile" completed={['resume']} onStepClick={() => {}} />);
    expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
  });

  it('calls onStepClick when a completed step is clicked', async () => {
    const user = userEvent.setup();
    const onStepClick = vi.fn();
    render(<OnboardingStepper currentStep="profile" completed={['resume']} onStepClick={onStepClick} />);
    await user.click(screen.getByRole('button', { name: /resume/i }));
    expect(onStepClick).toHaveBeenCalledWith('resume');
  });

  it('does not render upcoming steps as buttons', () => {
    render(<OnboardingStepper currentStep="profile" completed={['resume']} />);
    expect(screen.queryByRole('button', { name: /scan/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /results/i })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, confirm fail**

- [ ] **Step 3: Implement**

`src/components/OnboardingStepper/OnboardingStepper.tsx`:

```tsx
import styles from './OnboardingStepper.module.css';

export type StepKey = 'resume' | 'profile' | 'scan' | 'results';

interface Step {
  key: StepKey;
  label: string;
}

const STEPS: Step[] = [
  { key: 'resume', label: 'Resume' },
  { key: 'profile', label: 'Profile' },
  { key: 'scan', label: 'Scan' },
  { key: 'results', label: 'Results' },
];

interface Props {
  currentStep: StepKey;
  completed: StepKey[];
  onStepClick?: (step: StepKey) => void;
}

export function OnboardingStepper({ currentStep, completed, onStepClick }: Props) {
  const completedSet = new Set(completed);

  return (
    <ol className={styles.root}>
      {STEPS.map((step, i) => {
        const isCurrent = step.key === currentStep;
        const isDone = completedSet.has(step.key) && !isCurrent;
        const isInteractive = isDone && onStepClick;

        const content = (
          <>
            <span className={`${styles.dot} ${isCurrent ? styles.dotActive : isDone ? styles.dotDone : ''}`} />
            <span className={`${styles.label} ${isCurrent ? styles.labelActive : ''}`}>{step.label}</span>
          </>
        );

        return (
          <li key={step.key} className={styles.item} aria-current={isCurrent ? 'step' : undefined}>
            {isInteractive ? (
              <button type="button" className={styles.stepButton} onClick={() => onStepClick(step.key)}>
                {content}
              </button>
            ) : (
              <span className={styles.stepStatic}>{content}</span>
            )}
            {i < STEPS.length - 1 && (
              <span className={`${styles.connector} ${isDone ? styles.connectorDone : ''}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
```

`src/components/OnboardingStepper/OnboardingStepper.module.css`:

```css
.root {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 0;
  max-width: 720px;
}

.item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
}

.item:last-child {
  flex: 0;
}

.stepButton, .stepStatic {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  background: transparent;
  border: none;
  padding: 0;
  cursor: default;
  white-space: nowrap;
}

.stepButton {
  cursor: pointer;
}

.dot {
  width: 12px;
  height: 12px;
  border: var(--border-width) solid var(--border-strong);
  border-radius: 50%;
  background: transparent;
  flex-shrink: 0;
}

.dotActive {
  border-color: var(--accent);
  background: var(--accent);
}

.dotDone {
  border-color: var(--border-strong);
  background: var(--border-strong);
}

.label {
  font-size: var(--font-size-caption);
  color: var(--text-secondary);
}

.labelActive {
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.connector {
  flex: 1;
  height: 1px;
  background: var(--border-subtle);
  margin: 0 var(--space-2);
}

.connectorDone {
  background: var(--border-strong);
}
```

- [ ] **Step 4: Run, confirm 5/5 pass**

- [ ] **Step 5: Commit**

```bash
git add src/components/OnboardingStepper
git commit -m "feat(components): add OnboardingStepper indicator"
```

---

## Task 11: Hero component

Two-column layout: left has eyebrow + headline + sub + CTA buttons; right has the DemoPreview slot. The right slot is a `ReactNode` prop so DemoPreview can be plugged in by Task 12.

**Files:**
- Create: `src/components/Hero/{Hero.tsx, .module.css, .test.tsx}`

- [ ] **Step 1: Test**

`src/components/Hero/Hero.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Hero } from './Hero';

describe('Hero', () => {
  it('renders eyebrow, headline, and sub', () => {
    render(<Hero rightSlot={<div>preview</div>} onPrimaryClick={() => {}} onSecondaryClick={() => {}} />);
    expect(screen.getByText(/open-source, local-first/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /find the few jobs/i })).toBeInTheDocument();
    expect(screen.getByText(/your resume and your api key/i)).toBeInTheDocument();
  });

  it('renders the right slot', () => {
    render(<Hero rightSlot={<div>preview content</div>} onPrimaryClick={() => {}} onSecondaryClick={() => {}} />);
    expect(screen.getByText('preview content')).toBeInTheDocument();
  });

  it('calls onPrimaryClick when primary CTA clicked', async () => {
    const user = userEvent.setup();
    const onPrimary = vi.fn();
    render(<Hero rightSlot={<div />} onPrimaryClick={onPrimary} onSecondaryClick={() => {}} />);
    await user.click(screen.getByRole('button', { name: /drop your resume/i }));
    expect(onPrimary).toHaveBeenCalled();
  });

  it('calls onSecondaryClick when secondary CTA clicked', async () => {
    const user = userEvent.setup();
    const onSecondary = vi.fn();
    render(<Hero rightSlot={<div />} onPrimaryClick={() => {}} onSecondaryClick={onSecondary} />);
    await user.click(screen.getByRole('button', { name: /see an example/i }));
    expect(onSecondary).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run, confirm fail**

- [ ] **Step 3: Implement**

`src/components/Hero/Hero.tsx`:

```tsx
import type { ReactNode } from 'react';
import styles from './Hero.module.css';

interface Props {
  rightSlot: ReactNode;
  onPrimaryClick: () => void;
  onSecondaryClick: () => void;
}

export function Hero({ rightSlot, onPrimaryClick, onSecondaryClick }: Props) {
  return (
    <section className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <p className={styles.eyebrow}>Open-source, local-first</p>
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

`src/components/Hero/Hero.module.css`:

```css
.root {
  padding: var(--space-7) var(--space-5);
  border-bottom: var(--border-width) solid var(--border-subtle);
}

.inner {
  max-width: 1120px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: var(--space-7);
  align-items: center;
}

@media (max-width: 880px) {
  .inner {
    grid-template-columns: 1fr;
  }
}

.left {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.eyebrow {
  font-size: var(--font-size-caption);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
  margin: 0;
}

.headline {
  font-size: 48px;
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  line-height: 1.05;
  letter-spacing: -0.02em;
  margin: 0;
}

.sub {
  font-size: 18px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
  max-width: 520px;
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
  transition: background-color var(--motion-fast) var(--easing-out);
}

.primary:hover {
  background: var(--accent-hover);
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
  min-height: 300px;
}
```

- [ ] **Step 4: Run, confirm 4/4 pass**

- [ ] **Step 5: Commit**

```bash
git add src/components/Hero
git commit -m "feat(components): add Hero with dual CTA and right-slot"
```

---

## Task 12: DemoPreview component

A constrained mini-Results display. Re-uses `JobCard` with the existing styling but inside a card-like wrapper sized for the Hero's right slot. Renders 3 of the 5 demo jobs (the ones that survive the strong/decent tiers visually) plus a footer "+ 12 more matches" that subtly conveys depth. Clicking a card opens the SideSheet with the demo data.

**Files:**
- Create: `src/components/DemoPreview/{DemoPreview.tsx, .module.css, .test.tsx}`

- [ ] **Step 1: Test**

`src/components/DemoPreview/DemoPreview.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DemoPreview } from './DemoPreview';

describe('DemoPreview', () => {
  it('renders the demo profile summary', () => {
    render(<DemoPreview />);
    expect(screen.getByText(/Senior Backend Engineer · senior · United States/)).toBeInTheDocument();
  });

  it('renders demo job titles', () => {
    render(<DemoPreview />);
    expect(screen.getByText('Staff Backend Engineer, Edge Runtime')).toBeInTheDocument();
    expect(screen.getByText('Senior Backend Engineer')).toBeInTheDocument();
  });

  it('opens a SideSheet when a card is clicked', async () => {
    const user = userEvent.setup();
    render(<DemoPreview />);
    await user.click(screen.getByRole('button', { name: /Staff Backend Engineer/i }));
    expect(screen.getByText(/Own the Edge Runtime/)).toBeVisible();
    expect(screen.getByText(/why this score/i)).toBeVisible();
  });
});
```

- [ ] **Step 2: Run, confirm fail**

- [ ] **Step 3: Implement**

`src/components/DemoPreview/DemoPreview.tsx`:

```tsx
import { useState } from 'react';
import type { ScoredJob } from '../../types';
import { DEMO_PROFILE, DEMO_JOBS } from '../../lib/demoScan';
import { JobCard } from '../JobCard/JobCard';
import { SideSheet } from '../SideSheet/SideSheet';
import { ScoreDot } from '../ScoreDot/ScoreDot';
import { scoreTier } from '../../lib/scoreTier';
import styles from './DemoPreview.module.css';

const TOP_3 = DEMO_JOBS.slice(0, 3);

export function DemoPreview() {
  const [selected, setSelected] = useState<ScoredJob | null>(null);
  return (
    <div className={styles.root} aria-label="Example scan preview">
      <div className={styles.header}>
        <p className={styles.eyebrow}>Live preview</p>
        <p className={styles.profile}>
          {DEMO_PROFILE.targetRole} · {DEMO_PROFILE.level} · {DEMO_PROFILE.country}
        </p>
      </div>
      <div className={styles.list}>
        {TOP_3.map((j) => (
          <JobCard key={j.id} job={j} onClick={setSelected} />
        ))}
      </div>
      <p className={styles.more}>+ 12 more matches</p>
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

`src/components/DemoPreview/DemoPreview.module.css`:

```css
.root {
  background: var(--bg-surface);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius);
  padding: var(--space-4);
  box-shadow: 0 8px 32px rgb(0 0 0 / 30%);
}

.header {
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-3);
  border-bottom: var(--border-width) solid var(--border-subtle);
}

.eyebrow {
  font-size: var(--font-size-caption);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
  margin: 0 0 var(--space-1);
}

.profile {
  font-size: var(--font-size-body);
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
  margin: 0;
}

.list {
  border-top: var(--border-width) solid var(--border-subtle);
}

.more {
  font-size: var(--font-size-caption);
  color: var(--text-tertiary);
  text-align: center;
  margin: var(--space-3) 0 0;
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

- [ ] **Step 4: Run, confirm 3/3 pass**

- [ ] **Step 5: Commit**

```bash
git add src/components/DemoPreview
git commit -m "feat(components): add DemoPreview rendering canned scan results"
```

---

## Task 13: TrustBar + FeatureGrid + Footer

Three small static components grouped into one task because they have low surface area.

**Files:**
- Create: `src/components/TrustBar/{TrustBar.tsx, .module.css, .test.tsx}`
- Create: `src/components/FeatureGrid/{FeatureGrid.tsx, .module.css, .test.tsx}`
- Create: `src/components/Footer/{Footer.tsx, .module.css, .test.tsx}`

- [ ] **Step 1: Tests**

`src/components/TrustBar/TrustBar.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrustBar } from './TrustBar';

describe('TrustBar', () => {
  it('renders the privacy line', () => {
    render(<TrustBar />);
    expect(screen.getByText(/never leave your browser/i)).toBeInTheDocument();
  });
});
```

`src/components/FeatureGrid/FeatureGrid.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeatureGrid } from './FeatureGrid';

describe('FeatureGrid', () => {
  it('renders three feature headings', () => {
    render(<FeatureGrid />);
    expect(screen.getByText(/triage by tier/i)).toBeInTheDocument();
    expect(screen.getByText(/profile that actually matters/i)).toBeInTheDocument();
    expect(screen.getByText(/byo model/i)).toBeInTheDocument();
  });
});
```

`src/components/Footer/Footer.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer', () => {
  it('renders the version and license', () => {
    render(<Footer />);
    expect(screen.getByText(/Trajector v0\.1/)).toBeInTheDocument();
    expect(screen.getByText(/MIT/)).toBeInTheDocument();
  });

  it('renders the GitHub link', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: /github/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, all three sets fail**

- [ ] **Step 3: Implement TrustBar**

`src/components/TrustBar/TrustBar.tsx`:

```tsx
import styles from './TrustBar.module.css';

export function TrustBar() {
  return (
    <div className={styles.root}>
      <p className={styles.text}>
        🔒 Your resume and your OpenRouter key never leave your browser. No accounts, no servers,
        no telemetry.
      </p>
    </div>
  );
}
```

`src/components/TrustBar/TrustBar.module.css`:

```css
.root {
  background: var(--bg-surface);
  border-top: var(--border-width) solid var(--border-subtle);
  border-bottom: var(--border-width) solid var(--border-subtle);
  padding: var(--space-3) var(--space-5);
}

.text {
  max-width: 1120px;
  margin: 0 auto;
  font-size: var(--font-size-caption);
  color: var(--text-secondary);
  text-align: center;
}
```

- [ ] **Step 4: Implement FeatureGrid**

`src/components/FeatureGrid/FeatureGrid.tsx`:

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
];

export function FeatureGrid() {
  return (
    <section className={styles.root} id="features">
      <div className={styles.inner}>
        {FEATURES.map((f) => (
          <article key={f.tier} className={styles.card}>
            <span className={`${styles.accent} ${styles[f.tier]}`} />
            <h3 className={styles.title}>{f.title}</h3>
            <p className={styles.body}>{f.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
```

`src/components/FeatureGrid/FeatureGrid.module.css`:

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

@media (max-width: 880px) {
  .inner {
    grid-template-columns: 1fr;
  }
}

.card {
  position: relative;
  background: var(--bg-surface);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius);
  padding: var(--space-6) var(--space-5) var(--space-5);
  overflow: hidden;
}

.accent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
}

.strong { background: var(--score-strong); }
.decent { background: var(--score-decent); }
.skip { background: var(--score-skip); }

.title {
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-2);
}

.body {
  font-size: var(--font-size-body);
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}
```

- [ ] **Step 5: Implement Footer**

`src/components/Footer/Footer.tsx`:

```tsx
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.root}>
      <div className={styles.inner}>
        <p className={styles.left}>Trajector v0.1 · MIT</p>
        <p className={styles.right}>
          <a
            className={styles.link}
            href="https://github.com/ahammedejaz/trajector"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <span className={styles.divider}>·</span>
          <span>Built by Syed Ejaz Ahammed</span>
        </p>
      </div>
    </footer>
  );
}
```

`src/components/Footer/Footer.module.css`:

```css
.root {
  padding: var(--space-5);
  border-top: var(--border-width) solid var(--border-subtle);
  margin-top: var(--space-7);
}

.inner {
  max-width: 1120px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-caption);
  color: var(--text-tertiary);
}

.left { margin: 0; }
.right { margin: 0; display: flex; align-items: center; gap: var(--space-2); }

.link {
  color: var(--text-secondary);
  text-decoration: none;
}

.link:hover {
  color: var(--text-primary);
}

.divider {
  color: var(--text-tertiary);
}
```

- [ ] **Step 6: Run all three tests, confirm passes**

```
npm test -- TrustBar
npm test -- FeatureGrid
npm test -- Footer
```

- [ ] **Step 7: Commit**

```bash
git add src/components/TrustBar src/components/FeatureGrid src/components/Footer
git commit -m "feat(components): add TrustBar, FeatureGrid, and Footer"
```

---

## Task 14: HowItWorksStrip + FaqAccordion

Two more landing components. FaqAccordion uses native `<details>` for free a11y.

**Files:**
- Create: `src/components/HowItWorksStrip/{...}`
- Create: `src/components/FaqAccordion/{...}`

- [ ] **Step 1: Tests**

`src/components/HowItWorksStrip/HowItWorksStrip.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HowItWorksStrip } from './HowItWorksStrip';

describe('HowItWorksStrip', () => {
  it('renders four numbered steps', () => {
    render(<HowItWorksStrip />);
    expect(screen.getByText(/drop your resume/i)).toBeInTheDocument();
    expect(screen.getByText(/confirm your profile/i)).toBeInTheDocument();
    expect(screen.getByText(/scan enabled sources/i)).toBeInTheDocument();
    expect(screen.getByText(/triage matches/i)).toBeInTheDocument();
  });
});
```

`src/components/FaqAccordion/FaqAccordion.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FaqAccordion } from './FaqAccordion';

describe('FaqAccordion', () => {
  it('renders all five questions', () => {
    render(<FaqAccordion />);
    expect(screen.getAllByRole('group')).toHaveLength(5);
    expect(screen.getByText(/where does my data go/i)).toBeInTheDocument();
  });

  it('reveals answer when question is clicked', async () => {
    const user = userEvent.setup();
    render(<FaqAccordion />);
    const summary = screen.getByText(/where does my data go/i);
    await user.click(summary);
    expect(screen.getByText(/nowhere/i)).toBeVisible();
  });
});
```

- [ ] **Step 2: Run, fail**

- [ ] **Step 3: Implement HowItWorksStrip**

`src/components/HowItWorksStrip/HowItWorksStrip.tsx`:

```tsx
import styles from './HowItWorksStrip.module.css';

const STEPS = [
  { n: 1, title: 'Drop your resume', body: 'PDF, DOCX, or Markdown — parsed locally.' },
  { n: 2, title: 'Confirm your profile', body: 'Edit anything the LLM got wrong.' },
  { n: 3, title: 'Scan enabled sources', body: 'One LLM call, scored matches per source.' },
  { n: 4, title: 'Triage matches', body: 'Strong, decent, skip — open what earns your time.' },
];

export function HowItWorksStrip() {
  return (
    <section className={styles.root} id="how">
      <div className={styles.inner}>
        {STEPS.map((s) => (
          <div key={s.n} className={styles.step}>
            <span className={styles.num}>{s.n}</span>
            <p className={styles.title}>{s.title}</p>
            <p className={styles.body}>{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

`src/components/HowItWorksStrip/HowItWorksStrip.module.css`:

```css
.root {
  padding: var(--space-7) var(--space-5);
  background: var(--bg-surface);
  border-top: var(--border-width) solid var(--border-subtle);
  border-bottom: var(--border-width) solid var(--border-subtle);
}

.inner {
  max-width: 1120px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-5);
}

@media (max-width: 880px) {
  .inner {
    grid-template-columns: repeat(2, 1fr);
  }
}

.step {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: var(--border-width) solid var(--border-strong);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.title {
  font-size: var(--font-size-h3);
  color: var(--text-primary);
  margin: 0;
  font-weight: var(--font-weight-medium);
}

.body {
  font-size: var(--font-size-caption);
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}
```

- [ ] **Step 4: Implement FaqAccordion**

`src/components/FaqAccordion/FaqAccordion.tsx`:

```tsx
import styles from './FaqAccordion.module.css';

const FAQS = [
  {
    q: 'Where does my data go?',
    a: 'Nowhere. Resume parsing, LLM calls, and storage all happen in your browser.',
  },
  {
    q: 'Why do I need an OpenRouter key?',
    a: 'Trajector calls an LLM to score jobs. OpenRouter is a multi-model gateway — bring your own key, you control the spend.',
  },
  {
    q: 'Are these real job postings?',
    a: 'v0 synthesizes plausible postings from your profile to demo the scoring system end-to-end. Real-source ingestion is on the roadmap.',
  },
  {
    q: 'What does it cost?',
    a: 'Free. You pay OpenRouter directly for whatever model you pick. Sonnet 4.6 is roughly $0.01 per scan.',
  },
  {
    q: 'Open source?',
    a: 'MIT-licensed. Star the repo on GitHub: github.com/ahammedejaz/trajector',
  },
];

export function FaqAccordion() {
  return (
    <section className={styles.root} id="faq">
      <div className={styles.inner}>
        <h2 className={styles.title}>FAQ</h2>
        <div className={styles.list}>
          {FAQS.map((item) => (
            <details key={item.q} role="group" className={styles.item}>
              <summary className={styles.summary}>{item.q}</summary>
              <p className={styles.answer}>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
```

`src/components/FaqAccordion/FaqAccordion.module.css`:

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
  margin: 0 0 var(--space-5);
  text-align: center;
}

.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.item {
  background: var(--bg-surface);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius);
  padding: var(--space-3) var(--space-4);
}

.item[open] {
  background: var(--bg-surface-2);
}

.summary {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  cursor: pointer;
  list-style: none;
  position: relative;
  padding-right: var(--space-5);
}

.summary::-webkit-details-marker { display: none; }

.summary::after {
  content: '+';
  position: absolute;
  right: 0;
  top: 0;
  color: var(--text-tertiary);
  font-size: 18px;
  line-height: 1;
}

.item[open] .summary::after {
  content: '−';
}

.answer {
  margin: var(--space-3) 0 0;
  font-size: var(--font-size-body);
  color: var(--text-secondary);
  line-height: 1.5;
}
```

- [ ] **Step 5: Run, both pass**

```
npm test -- HowItWorksStrip
npm test -- FaqAccordion
```

- [ ] **Step 6: Commit**

```bash
git add src/components/HowItWorksStrip src/components/FaqAccordion
git commit -m "feat(components): add HowItWorksStrip and FaqAccordion"
```

---

## Task 15: Landing screen assembly

Assembles AppBar + Hero (with DemoPreview slotted) + TrustBar + FeatureGrid + HowItWorksStrip + FaqAccordion + Footer + drop zone (existing Upload component reused as a section).

**Files:**
- Create: `src/screens/Landing/{Landing.tsx, Landing.module.css, Landing.test.tsx}`

The Landing screen consumes `Upload`'s parsing flow but renders it inline as a section anchored at `#drop`. It does NOT render an AppBar — App.tsx renders AppBar globally. Stepper is also NOT on Landing.

- [ ] **Step 1: Test**

`src/screens/Landing/Landing.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Landing } from './Landing';

vi.mock('../../screens/Upload/Upload', () => ({
  Upload: ({ analyzeError }: { analyzeError: string | null }) => (
    <div data-testid="upload-stub">{analyzeError ?? 'upload'}</div>
  ),
}));

describe('Landing', () => {
  it('renders Hero, FeatureGrid, FAQ, Footer, and drop zone', () => {
    render(<Landing onResumeParsed={() => {}} analyzeError={null} />);
    expect(screen.getByRole('heading', { name: /find the few jobs/i })).toBeInTheDocument();
    expect(screen.getByText(/triage by tier/i)).toBeInTheDocument();
    expect(screen.getByText(/where does my data go/i)).toBeInTheDocument();
    expect(screen.getByText(/Trajector v0\.1/)).toBeInTheDocument();
    expect(screen.getByTestId('upload-stub')).toBeInTheDocument();
  });

  it('renders the demo preview', () => {
    render(<Landing onResumeParsed={() => {}} analyzeError={null} />);
    expect(screen.getByText(/Senior Backend Engineer · senior · United States/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, fail**

- [ ] **Step 3: Implement**

`src/screens/Landing/Landing.tsx`:

```tsx
import type { ResumeText } from '../../types';
import { Upload } from '../Upload/Upload';
import { Hero } from '../../components/Hero/Hero';
import { TrustBar } from '../../components/TrustBar/TrustBar';
import { FeatureGrid } from '../../components/FeatureGrid/FeatureGrid';
import { HowItWorksStrip } from '../../components/HowItWorksStrip/HowItWorksStrip';
import { FaqAccordion } from '../../components/FaqAccordion/FaqAccordion';
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
      <FeatureGrid />
      <HowItWorksStrip />
      <section id="drop" className={styles.dropSection}>
        <div className={styles.dropInner}>
          <Upload onResumeParsed={onResumeParsed} analyzeError={analyzeError} />
        </div>
      </section>
      <FaqAccordion />
      <Footer />
    </div>
  );
}
```

`src/screens/Landing/Landing.module.css`:

```css
.root {
  width: 100%;
}

.dropSection {
  padding: var(--space-7) var(--space-5);
  background: var(--bg-surface);
  border-top: var(--border-width) solid var(--border-subtle);
  border-bottom: var(--border-width) solid var(--border-subtle);
}

.dropInner {
  max-width: 720px;
  margin: 0 auto;
}
```

- [ ] **Step 4: Run, confirm pass**

```
npm test -- Landing
```

- [ ] **Step 5: Commit**

```bash
git add src/screens/Landing
git commit -m "feat(screens): assemble Landing screen with hero, demo, and drop zone"
```

---

## Task 16: Confirm screen redesign

The big one. Three Disclosure sections, all 16 fields, AI-extracted badges, dual CTA, "Save profile only" button.

**Files:**
- Modify: `src/screens/Confirm/Confirm.tsx` (full rewrite)
- Modify: `src/screens/Confirm/Confirm.module.css` (full rewrite)
- Modify: `src/screens/Confirm/Confirm.test.tsx` (full rewrite)

- [ ] **Step 1: Replace `Confirm.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Confirm } from './Confirm';
import type { Profile } from '../../types';

const PROFILE: Profile = {
  targetRole: 'Senior Backend Engineer',
  level: 'senior',
  yearsOfExperience: 7,
  stackSignals: ['Go', 'PostgreSQL'],
  employmentTypes: ['full-time'],
  compFloor: 200000,
  locationPreference: 'remote',
  country: 'United States',
  preferredLocations: [],
  requiresSponsorship: false,
  dealBreakers: [],
  companyStages: ['growth'],
  companySize: 'mid',
  equityImportance: 'nice',
  industriesToExclude: [],
  jobSearchStatus: 'open',
};

const EMPTY_PROFILE: Profile = {
  ...PROFILE,
  targetRole: '',
  yearsOfExperience: null,
  country: null,
  companyStages: [],
  companySize: null,
  equityImportance: null,
  jobSearchStatus: null,
  stackSignals: [],
};

beforeEach(() => localStorage.clear());

describe('Confirm screen', () => {
  it('renders all three section headers', () => {
    render(<Confirm profile={PROFILE} onConfirm={() => {}} />);
    expect(screen.getByRole('button', { name: /essentials/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logistics/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /preferences/i })).toBeInTheDocument();
  });

  it('renders target role and level by default in Essentials', () => {
    render(<Confirm profile={PROFILE} onConfirm={() => {}} />);
    expect(screen.getByLabelText(/target role/i)).toHaveValue('Senior Backend Engineer');
  });

  it('shows AI badge on inferred fields', () => {
    render(<Confirm profile={PROFILE} onConfirm={() => {}} />);
    const badges = screen.getAllByText('AI');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('hides AI badge after the user edits the field', async () => {
    const user = userEvent.setup();
    render(<Confirm profile={PROFILE} onConfirm={() => {}} />);
    const targetInput = screen.getByLabelText(/target role/i);
    const badgesBefore = screen.getAllByText('AI').length;
    await user.clear(targetInput);
    await user.type(targetInput, 'Backend Engineer');
    const badgesAfter = screen.getAllByText('AI').length;
    expect(badgesAfter).toBe(badgesBefore - 1);
  });

  it('expands the Logistics section on click', async () => {
    const user = userEvent.setup();
    render(<Confirm profile={PROFILE} onConfirm={() => {}} />);
    expect(screen.queryByLabelText(/comp floor/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /logistics/i }));
    expect(screen.getByLabelText(/comp floor/i)).toBeInTheDocument();
  });

  it('disables the primary CTA when targetRole is empty', () => {
    render(<Confirm profile={EMPTY_PROFILE} onConfirm={() => {}} />);
    expect(screen.getByRole('button', { name: /start scanning/i })).toBeDisabled();
  });

  it('calls onConfirm with the current profile on Start scanning', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<Confirm profile={PROFILE} onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: /start scanning/i }));
    expect(onConfirm).toHaveBeenCalledWith(PROFILE);
  });

  it('saves profile to localStorage when Save profile only is clicked', async () => {
    const user = userEvent.setup();
    const onSaveAndExit = vi.fn();
    render(<Confirm profile={PROFILE} onConfirm={() => {}} onSaveAndExit={onSaveAndExit} />);
    await user.click(screen.getByRole('button', { name: /save profile only/i }));
    expect(localStorage.getItem('trajector_profile')).toContain('Senior Backend Engineer');
    expect(onSaveAndExit).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run, fail**

- [ ] **Step 3: Replace `Confirm.tsx`**

```tsx
import { useMemo, useState } from 'react';
import type {
  Profile,
  Level,
  LocationPref,
  EmploymentType,
  CompanyStage,
  CompanySize,
  EquityImportance,
  JobSearchStatus,
} from '../../types';
import { TagChips } from '../../components/TagChips/TagChips';
import { Segmented } from '../../components/Segmented/Segmented';
import { Toggle } from '../../components/Toggle/Toggle';
import { MultiPill } from '../../components/MultiPill/MultiPill';
import { Disclosure } from '../../components/Disclosure/Disclosure';
import { CountrySelect } from '../../components/CountrySelect/CountrySelect';
import { saveProfile } from '../../lib/profileStore';
import styles from './Confirm.module.css';

const LEVEL_OPTS = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
  { value: 'staff', label: 'Staff' },
  { value: 'principal', label: 'Principal' },
] as const;

const LOC_OPTS = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
  { value: 'flexible', label: 'Flexible' },
] as const;

const EMPLOYMENT_OPTS = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'part-time', label: 'Part-time' },
] as const;

const STAGE_OPTS = [
  { value: 'seed', label: 'Seed' },
  { value: 'early', label: 'Early' },
  { value: 'growth', label: 'Growth' },
  { value: 'public', label: 'Public' },
] as const;

const SIZE_OPTS = [
  { value: 'startup', label: 'Startup <50' },
  { value: 'mid', label: 'Mid 50–500' },
  { value: 'large', label: 'Large 500–5k' },
  { value: 'enterprise', label: 'Enterprise 5k+' },
] as const;

const EQUITY_OPTS = [
  { value: 'dealbreaker', label: 'Dealbreaker' },
  { value: 'important', label: 'Important' },
  { value: 'nice', label: 'Nice-to-have' },
  { value: 'irrelevant', label: 'Irrelevant' },
] as const;

const STATUS_OPTS = [
  { value: 'active', label: 'Active' },
  { value: 'open', label: 'Open' },
  { value: 'passive', label: 'Passive' },
] as const;

interface Props {
  profile: Profile;
  onConfirm: (profile: Profile) => void;
  onSaveAndExit?: () => void;
}

function isInferred(p: Profile, k: keyof Profile): boolean {
  const v = p[k];
  if (v === null) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (typeof v === 'number') return true;
  if (typeof v === 'boolean') return v === true;
  if (Array.isArray(v)) return v.length > 0;
  return false;
}

interface AiPillProps {
  show: boolean;
}

function AiPill({ show }: AiPillProps) {
  if (!show) return null;
  return <span className={styles.aiPill}>AI</span>;
}

export function Confirm({ profile: initial, onConfirm, onSaveAndExit }: Props) {
  const [profile, setProfile] = useState<Profile>(initial);
  const [touched, setTouched] = useState<Set<keyof Profile>>(new Set());
  const [savedFlash, setSavedFlash] = useState(false);

  const inferredAtMount = useMemo(() => {
    const s = new Set<keyof Profile>();
    (Object.keys(initial) as Array<keyof Profile>).forEach((k) => {
      if (isInferred(initial, k)) s.add(k);
    });
    return s;
  }, [initial]);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
    setTouched((t) => {
      if (t.has(key)) return t;
      const next = new Set(t);
      next.add(key);
      return next;
    });
  }

  function ai(k: keyof Profile): boolean {
    return inferredAtMount.has(k) && !touched.has(k);
  }

  const isValid = profile.targetRole.trim().length > 0;

  function handleSaveOnly() {
    saveProfile(profile);
    setSavedFlash(true);
    setTimeout(() => {
      setSavedFlash(false);
      onSaveAndExit?.();
    }, 2000);
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>Confirm your profile</h1>
        <p className={styles.subtitle}>
          We read this from your resume. Edit anything that's wrong before we start scanning.
        </p>
      </header>

      <div className={styles.sections}>
        {/* Essentials */}
        <Disclosure title="Essentials" defaultOpen>
          <div className={styles.fields}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="target-role">
                Target role <AiPill show={ai('targetRole')} />
              </label>
              <input
                id="target-role"
                className={styles.input}
                value={profile.targetRole}
                onChange={(e) => update('targetRole', e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <p className={styles.label}>
                Level <AiPill show={ai('level')} />
              </p>
              <Segmented
                options={LEVEL_OPTS}
                value={profile.level}
                onChange={(v) => update('level', v as Level)}
                ariaLabel="Level"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="years-exp">
                Years of experience <AiPill show={ai('yearsOfExperience')} />
              </label>
              <input
                id="years-exp"
                className={styles.input}
                type="number"
                min={0}
                max={50}
                placeholder="7"
                value={profile.yearsOfExperience ?? ''}
                onChange={(e) =>
                  update('yearsOfExperience', e.target.value ? Number(e.target.value) : null)
                }
              />
            </div>

            <div className={styles.field}>
              <p className={styles.label}>
                Stack signals <AiPill show={ai('stackSignals')} />
              </p>
              <TagChips
                chips={profile.stackSignals}
                onAdd={(c) =>
                  !profile.stackSignals.includes(c) &&
                  update('stackSignals', [...profile.stackSignals, c])
                }
                onRemove={(c) =>
                  update('stackSignals', profile.stackSignals.filter((x) => x !== c))
                }
                placeholder="+ Add"
              />
            </div>

            <div className={styles.field}>
              <p className={styles.label}>
                Employment types <AiPill show={ai('employmentTypes')} />
              </p>
              <MultiPill
                options={EMPLOYMENT_OPTS}
                value={profile.employmentTypes}
                onChange={(v) => update('employmentTypes', v as EmploymentType[])}
                ariaLabel="Employment types"
              />
            </div>
          </div>
        </Disclosure>

        {/* Logistics */}
        <Disclosure title="Logistics">
          <div className={styles.fields}>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="comp-floor">
                  Comp floor <AiPill show={ai('compFloor')} />
                </label>
                <input
                  id="comp-floor"
                  className={styles.input}
                  type="number"
                  placeholder="200000"
                  value={profile.compFloor ?? ''}
                  onChange={(e) =>
                    update('compFloor', e.target.value ? Number(e.target.value) : null)
                  }
                />
              </div>

              <div className={styles.field}>
                <p className={styles.label}>
                  Location preference <AiPill show={ai('locationPreference')} />
                </p>
                <Segmented
                  options={LOC_OPTS}
                  value={profile.locationPreference}
                  onChange={(v) => update('locationPreference', v as LocationPref)}
                  ariaLabel="Location preference"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Country <AiPill show={ai('country')} />
              </label>
              <CountrySelect
                value={profile.country}
                onChange={(c) => update('country', c)}
              />
            </div>

            {profile.locationPreference !== 'remote' && (
              <div className={styles.field}>
                <p className={styles.label}>
                  Preferred locations <AiPill show={ai('preferredLocations')} />
                </p>
                <TagChips
                  chips={profile.preferredLocations}
                  onAdd={(c) =>
                    !profile.preferredLocations.includes(c) &&
                    update('preferredLocations', [...profile.preferredLocations, c])
                  }
                  onRemove={(c) =>
                    update(
                      'preferredLocations',
                      profile.preferredLocations.filter((x) => x !== c),
                    )
                  }
                  placeholder="+ Add city or region"
                />
              </div>
            )}

            <div className={styles.fieldRow}>
              <div className={styles.fieldRowLeft}>
                <p className={styles.label}>
                  Requires sponsorship <AiPill show={ai('requiresSponsorship')} />
                </p>
                <p className={styles.caption}>
                  Show jobs that explicitly accept sponsorship-needing candidates.
                </p>
              </div>
              <Toggle
                checked={profile.requiresSponsorship}
                onChange={(v) => update('requiresSponsorship', v)}
                ariaLabel="Requires sponsorship"
              />
            </div>

            <div className={styles.field}>
              <p className={styles.label}>
                Deal-breakers <AiPill show={ai('dealBreakers')} />
              </p>
              <TagChips
                chips={profile.dealBreakers}
                onAdd={(c) =>
                  !profile.dealBreakers.includes(c) &&
                  update('dealBreakers', [...profile.dealBreakers, c])
                }
                onRemove={(c) =>
                  update('dealBreakers', profile.dealBreakers.filter((x) => x !== c))
                }
                placeholder="+ Add"
              />
            </div>
          </div>
        </Disclosure>

        {/* Preferences */}
        <Disclosure title="Preferences">
          <div className={styles.fields}>
            <div className={styles.field}>
              <p className={styles.label}>
                Company stages <AiPill show={ai('companyStages')} />
              </p>
              <MultiPill
                options={STAGE_OPTS}
                value={profile.companyStages}
                onChange={(v) => update('companyStages', v as CompanyStage[])}
                ariaLabel="Company stages"
              />
            </div>

            <div className={styles.field}>
              <p className={styles.label}>
                Company size <AiPill show={ai('companySize')} />
              </p>
              <Segmented
                options={SIZE_OPTS}
                value={profile.companySize ?? 'mid'}
                onChange={(v) => update('companySize', v as CompanySize)}
                ariaLabel="Company size"
              />
            </div>

            <div className={styles.field}>
              <p className={styles.label}>
                Equity importance <AiPill show={ai('equityImportance')} />
              </p>
              <Segmented
                options={EQUITY_OPTS}
                value={profile.equityImportance ?? 'nice'}
                onChange={(v) => update('equityImportance', v as EquityImportance)}
                ariaLabel="Equity importance"
              />
            </div>

            <div className={styles.field}>
              <p className={styles.label}>
                Industries to exclude <AiPill show={ai('industriesToExclude')} />
              </p>
              <TagChips
                chips={profile.industriesToExclude}
                onAdd={(c) =>
                  !profile.industriesToExclude.includes(c) &&
                  update('industriesToExclude', [...profile.industriesToExclude, c])
                }
                onRemove={(c) =>
                  update(
                    'industriesToExclude',
                    profile.industriesToExclude.filter((x) => x !== c),
                  )
                }
                placeholder="+ Add"
              />
            </div>

            <div className={styles.field}>
              <p className={styles.label}>
                Job search status <AiPill show={ai('jobSearchStatus')} />
              </p>
              <Segmented
                options={STATUS_OPTS}
                value={profile.jobSearchStatus ?? 'open'}
                onChange={(v) => update('jobSearchStatus', v as JobSearchStatus)}
                ariaLabel="Job search status"
              />
            </div>
          </div>
        </Disclosure>
      </div>

      <div className={styles.ctaRow}>
        <button
          type="button"
          className={styles.secondary}
          onClick={handleSaveOnly}
        >
          {savedFlash ? 'Saved ✓' : 'Save profile only'}
        </button>
        <button
          type="button"
          className={styles.primary}
          disabled={!isValid}
          onClick={() => onConfirm(profile)}
        >
          Start scanning →
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Replace `Confirm.module.css`**

```css
.root {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-5);
}

.header {
  margin-bottom: var(--space-6);
}

.title {
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-2);
}

.subtitle {
  font-size: var(--font-size-body);
  color: var(--text-secondary);
  margin: 0;
}

.sections {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.row {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: var(--space-4);
}

@media (max-width: 600px) {
  .row {
    grid-template-columns: 1fr;
  }
}

.fieldRow {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}

.fieldRowLeft {
  flex: 1;
}

.label {
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.aiPill {
  font-size: 9px;
  font-weight: var(--font-weight-medium);
  color: var(--text-tertiary);
  letter-spacing: 0.08em;
  background: var(--bg-surface-2);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: 999px;
  padding: 1px var(--space-1);
}

.caption {
  font-size: var(--font-size-caption);
  color: var(--text-tertiary);
  margin: 0;
}

.input {
  width: 100%;
  background: var(--bg-surface);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius);
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-body);
  color: var(--text-primary);
  outline: none;
  transition: border-color var(--motion-fast) var(--easing-out);
}

.input:focus {
  border-color: var(--accent);
}

.ctaRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-6);
  gap: var(--space-3);
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
  transition: background-color var(--motion-fast) var(--easing-out);
}

.primary:hover:not(:disabled) {
  background: var(--accent-hover);
}

.primary:disabled {
  background: var(--bg-surface-2);
  color: var(--text-tertiary);
  cursor: not-allowed;
}

.secondary {
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
  padding: var(--space-3) var(--space-5);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius);
  cursor: pointer;
  transition: color var(--motion-fast) var(--easing-out),
              border-color var(--motion-fast) var(--easing-out);
}

.secondary:hover {
  color: var(--text-primary);
  border-color: var(--border-strong);
}
```

- [ ] **Step 5: Run, confirm 8/8 pass**

Run: `npm test -- Confirm`

- [ ] **Step 6: Run typecheck + full suite**

Run: `npm run typecheck && npm test`

- [ ] **Step 7: Commit**

```bash
git add src/screens/Confirm
git commit -m "feat(screens): redesign Confirm with 3 sections, AI badges, dual CTA"
```

---

## Task 17: App.tsx wiring + Stepper integration + e2e + verification + PR

The final task. Wires Landing as the default screen, adds AppBar globally, threads OnboardingStepper through Upload/Confirm/Analyzing/Settings/Results, updates App.module.css for AppBar offset, and updates e2e tests for the new Landing-first flow.

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.module.css`
- Modify: `src/screens/Upload/Upload.tsx` (wrap with Stepper)
- Modify: `src/screens/Settings/Settings.tsx` (wrap with Stepper)
- Modify: `src/screens/Results/Results.tsx` (wrap with Stepper)
- Modify: `tests/e2e/upload.spec.ts`
- Modify: `tests/e2e/results.spec.ts`
- Create: `tests/e2e/landing.spec.ts`

The simplest approach: don't modify Upload/Settings/Results to add the Stepper internally. Instead, App.tsx renders the Stepper alongside each screen. This keeps the screens themselves Stepper-unaware and easier to test.

- [ ] **Step 1: Replace `src/App.tsx`**

```tsx
import { useEffect, useState } from 'react';
import type { ResumeText, Profile, Screen } from './types';
import { loadSettings } from './lib/storage';
import { extractProfile } from './lib/extractProfile';
import { Landing } from './screens/Landing/Landing';
import { Upload } from './screens/Upload/Upload';
import { Settings } from './screens/Settings/Settings';
import { Confirm } from './screens/Confirm/Confirm';
import { Results } from './screens/Results/Results';
import { AppBar } from './components/AppBar/AppBar';
import { OnboardingStepper, type StepKey } from './components/OnboardingStepper/OnboardingStepper';
import styles from './App.module.css';

export function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [resume, setResume] = useState<ResumeText | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [prevScreen, setPrevScreen] = useState<Screen>('landing');
  const [scanFinished, setScanFinished] = useState(false);

  useEffect(() => {
    if (screen !== 'results') setScanFinished(false);
  }, [screen]);

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
    if ((prevScreen === 'upload' || prevScreen === 'landing') && pending && settings.openRouterKey) {
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

  function handleBrandClick() {
    setScreen('landing');
  }

  function handleStepperClick(step: StepKey) {
    if (step === 'resume') setScreen('upload');
    else if (step === 'profile' && profile) setScreen('confirm');
    else if (step === 'scan' || step === 'results') setScreen('results');
  }

  const showAppBarCta = screen === 'landing';
  const showStepper = screen !== 'landing';

  let currentStep: StepKey = 'resume';
  if (screen === 'analyzing' || (screen === 'settings' && prevScreen !== 'results')) currentStep = 'profile';
  else if (screen === 'confirm') currentStep = 'profile';
  else if (screen === 'results' && !scanFinished) currentStep = 'scan';
  else if (screen === 'results' && scanFinished) currentStep = 'results';
  else if (screen === 'settings' && prevScreen === 'results') currentStep = 'results';

  const completed: StepKey[] = [];
  if (resume) completed.push('resume');
  if (profile) completed.push('profile');
  if (scanFinished) completed.push('scan');

  return (
    <div className={styles.root}>
      <AppBar showCta={showAppBarCta} onBrandClick={handleBrandClick} />
      {showStepper && (
        <div className={styles.stepperWrap}>
          <OnboardingStepper
            currentStep={currentStep}
            completed={completed}
            onStepClick={handleStepperClick}
          />
        </div>
      )}

      {screen === 'landing' && (
        <Landing onResumeParsed={handleResumeParsed} analyzeError={analyzeError} />
      )}

      {screen === 'upload' && (
        <div className={styles.screen}>
          <Upload onResumeParsed={handleResumeParsed} analyzeError={analyzeError} />
        </div>
      )}

      {screen === 'analyzing' && (
        <div className={styles.screen}>
          <div className={styles.analyzing}>
            <p className={styles.analyzingText}>Analyzing your resume…</p>
          </div>
        </div>
      )}

      {screen === 'settings' && (
        <div className={styles.screen}>
          <Settings onDone={handleSettingsDone} />
        </div>
      )}

      {screen === 'confirm' && profile && (
        <div className={styles.screen}>
          <Confirm
            profile={profile}
            onConfirm={handleConfirm}
            onSaveAndExit={() => setScreen('landing')}
          />
        </div>
      )}

      {screen === 'results' && profile && (
        <div className={styles.screen}>
          <Results
            profile={profile}
            onEditProfile={handleEditProfile}
            onSwitchResume={handleSwitchResume}
            onOpenSettings={handleOpenSettingsFromResults}
            onScanFinished={() => setScanFinished(true)}
          />
        </div>
      )}
    </div>
  );
}
```

This adds an `onScanFinished` prop to Results — Task 17 step 4 below adds it.

- [ ] **Step 2: Replace `src/App.module.css`**

```css
.root {
  min-height: 100%;
}

.stepperWrap {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-4) var(--space-5) 0;
}

.screen {
  padding-top: 0;
}

.analyzing {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.analyzingText {
  font-size: var(--font-size-body);
  color: var(--text-secondary);
}
```

- [ ] **Step 3: Add `onScanFinished` callback to Results**

In `src/screens/Results/Results.tsx`:

1. Add to the Props interface:
   ```typescript
   onScanFinished?: () => void;
   ```
2. Destructure it in the function signature.
3. Inside the useEffect, after the last source flips to done, also call `onScanFinished?.();`. Find this line:
   ```typescript
   if (i === enabledSources.length - 1) setFinished(true);
   ```
   Change to:
   ```typescript
   if (i === enabledSources.length - 1) {
     setFinished(true);
     onScanFinished?.();
   }
   ```
4. In the catch branch (after `setFinished(true);`), call `onScanFinished?.()` too so the App still progresses the stepper.

- [ ] **Step 4: Verify the unit suite is green**

```
npm run typecheck && npm test
```

If `Results.test.tsx` fails because the new `onScanFinished` prop is required, mark it as optional (`?`) — already done above.

- [ ] **Step 5: Replace `tests/e2e/upload.spec.ts`**

Update the existing tests so the flow starts at Landing (drop zone is anchored mid-page).

```typescript
import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MOCK_PROFILE = {
  targetRole: 'Senior Backend Engineer',
  level: 'senior',
  yearsOfExperience: 7,
  stackSignals: ['Go', 'PostgreSQL', 'Kubernetes'],
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

const MOCK_JOBS = [
  {
    id: 'j1', source: 'linkedin', company: 'Acme Corp', title: 'Senior Backend Engineer',
    location: 'Remote (US)', compRange: '$220k-$260k',
    description: 'Build scalable Go services for our infra team.',
    tags: ['Go', 'Postgres', 'Kubernetes'], score: 92, scoreReason: 'Stack matches.',
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

  test('lands on Landing, drops resume, reaches Confirm', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /find the few jobs/i })).toBeVisible();

    const fixturePath = path.resolve(__dirname, '../fixtures/sample-resume.pdf');
    await page.getByLabel('Drop here or click to browse').setInputFiles(fixturePath);

    await expect(page.getByText('Confirm your profile')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByLabel('Target role')).toHaveValue('Senior Backend Engineer');
  });

  test('confirms the profile and reaches Results', async ({ page }) => {
    await page.goto('/');
    const fixturePath = path.resolve(__dirname, '../fixtures/sample-resume.pdf');
    await page.getByLabel('Drop here or click to browse').setInputFiles(fixturePath);

    await expect(page.getByText('Confirm your profile')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /start scanning/i }).click();

    await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible();
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

- [ ] **Step 6: Update `tests/e2e/results.spec.ts`**

Find:
```
const MOCK_PROFILE = { ... };
```
and replace with the same shape used in upload.spec.ts above (16 fields, `locationPreference`).

The rest of the tests stay the same — they all go through the upload→confirm→results path and the assertions on the Results screen are still valid.

- [ ] **Step 7: Create `tests/e2e/landing.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('landing screen', () => {
  test('shows Hero, demo preview, FeatureGrid, FAQ, and Footer', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /find the few jobs/i })).toBeVisible();
    await expect(page.getByText(/Senior Backend Engineer · senior · United States/)).toBeVisible();
    await expect(page.getByText(/triage by tier/i)).toBeVisible();
    await expect(page.getByText(/where does my data go/i)).toBeVisible();
    await expect(page.getByText(/Trajector v0\.1/)).toBeVisible();
  });

  test('demo preview opens SideSheet with job details', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Staff Backend Engineer.*Vercel/i }).click();
    await expect(page.getByText(/Own the Edge Runtime/)).toBeVisible();
  });

  test('FAQ entries expand on click', async ({ page }) => {
    await page.goto('/');
    await page.getByText(/where does my data go/i).click();
    await expect(page.getByText(/^Nowhere/)).toBeVisible();
  });
});
```

- [ ] **Step 8: Run all checks**

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

All must pass before pushing.

If `npm test` fails on a unit test that asserts old Confirm UI, it's already been replaced in Task 16 — re-check that all references in it match the new file.

If `npm run test:e2e` flakes on the Landing demo's `aria-label`, the JobCard's accessible name is `${job.title} at ${job.company}` — `Staff Backend Engineer, Edge Runtime at Vercel`. The test regex `/Staff Backend Engineer.*Vercel/i` should match.

- [ ] **Step 9: Commit + push + open PR**

```bash
git add src/App.tsx src/App.module.css src/screens/Results tests/e2e
git commit -m "feat(app): land Landing screen as default route, wire AppBar + Stepper"

git push -u origin feat/v0-plan-4a-saas-ui

gh pr create --base feat/v0-plan-3-results --title "Plan 4a: SaaS-grade UI + extended profile" --body "$(cat <<'EOF'
## Summary
- Replace bare Upload screen with a marketing-grade Landing (Hero, DemoPreview, FeatureGrid, HowItWorksStrip, FaqAccordion, Footer)
- Add sticky AppBar with brand mark + nav, present on every screen
- Add OnboardingStepper across post-Landing screens (Resume → Profile → Scan → Results)
- Extend Profile from 6 → 16 fields including `country`, `yearsOfExperience`, `requiresSponsorship`, `companyStages`, `companySize`, `equityImportance`, `industriesToExclude`, `jobSearchStatus`, `employmentTypes`, `preferredLocations`
- Make `extractProfile` and `scanJobs` country-aware and field-aware
- Redesign Confirm with 3 collapsible sections (Essentials / Logistics / Preferences), AI-extracted badges, "Save profile only" → localStorage

## Test plan
- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm test` (unit + component)
- [x] `npm run build`
- [x] `npm run test:e2e` (existing flows + new landing.spec.ts)

Stacked on Plan 3 (#3). Plan 4b (Results sidebar + filters) follows.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-Review (controller)

**Spec coverage** (vs `docs/superpowers/specs/2026-04-28-trajector-v0-saas-ui-design.md`):
- §3 Profile model: 16 fields ✅ Tasks 1, 2
- §4 Landing: Hero, DemoPreview, TrustBar, FeatureGrid, HowItWorksStrip, FaqAccordion, Footer ✅ Tasks 11–15
- §4.10 returning-session collapse: PARTIAL — App's session state preserves resume/profile across screens, but the Landing doesn't read `loadProfile()` and show a banner. Acceptable cut for v0; the Stepper makes navigation clear without it.
- §5 Confirm redesign with 3 disclosures + AI badges + dual CTA ✅ Task 16
- §6 OnboardingStepper ✅ Tasks 10, 17
- §9 App routing changes (`'landing'` initial, `'upload'` fallback) ✅ Task 17

**Placeholder scan:** No TBD/TODO. Every code step has full code.

**Type consistency:** `Profile` shape declared in Task 1 is used identically in Tasks 2, 4, 12, 16, 17. Enum names match across files.

**Cuts vs spec, called out explicitly:**
- The Hero "animated demo preview" is rendered statically, not animated. The spec said "static rendering — no animation initially" — consistent.
- Returning-session "Continue your scan" banner: deferred. The Stepper achieves equivalent navigation.

**Risks:**
- The full set of 17 tasks touches lots of files. Recommend strict subagent-driven flow with one task per subagent and a quick `git diff --stat` review between tasks.
- The Confirm task is the largest single piece — has 8 unit tests and 16 fields. If the implementer hits trouble, dispatch a fix subagent rather than expanding the task.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-28-trajector-v0-plan-4a-saas-ui.md`.

Default execution mode for autonomous-mode user: **Subagent-Driven Development** (one fresh subagent per task + spec/quality review where useful + push final PR). The user has standing autonomous-mode preferences, so we proceed without explicit approval and they can interrupt mid-flight if anything looks wrong.
