# Trajector Plan 2 — LLM Integration + Profile Confirmation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the uploaded resume text through OpenRouter (user's API key) to extract a structured profile, then display an editable Confirm screen (Screen 2) before a stub scan placeholder.

**Architecture:** Static SPA — no backend. After file parsing (Plan 1), App calls `extractProfile()` which POSTs to `https://openrouter.ai/api/v1/chat/completions` with the user's stored API key; the LLM returns JSON that maps to a `Profile` shape. The Confirm screen lets the user edit that profile before proceeding to the StubScan placeholder (real scan in Plan 3). Settings (Screen 4) stores the API key and model in `localStorage`.

**Tech Stack:** Vite 6 + React 19 + TypeScript 5.7 + CSS Modules + Vitest + @testing-library/react + Playwright. All LLM calls go through `https://openrouter.ai/api/v1`. CSS tokens in `src/theme.css` — no hardcoded hex in component files except the new `--error` and `--on-accent` tokens added in Task 1.

---

## Branch setup

All work in this plan goes on a new branch. Before Task 1, run:

```bash
cd /Users/syedejazahammed/Documents/GitHub/Trajector
git checkout feat/v0-foundation
git pull origin feat/v0-foundation
git checkout -b feat/v0-plan-2-llm-profile
```

---

## File map

| File | Action | Purpose |
|---|---|---|
| `src/theme.css` | Modify | Add `--error` and `--on-accent` tokens |
| `src/types.ts` | Modify | Add `Profile`, `AppSettings`, `Level`, `LocationPref`; extend `Screen` |
| `src/lib/storage.ts` | Create | `loadSettings()` / `saveSettings()` via `localStorage` |
| `src/lib/storage.test.ts` | Create | Unit tests for storage layer |
| `src/lib/openrouter.ts` | Create | `fetchCompletion()` — thin `fetch` wrapper for OpenRouter chat completions |
| `src/lib/openrouter.test.ts` | Create | Unit tests with stubbed `fetch` |
| `src/lib/extractProfile.ts` | Create | `extractProfile()` — builds prompt, calls OpenRouter, parses JSON → `Profile` |
| `src/lib/extractProfile.test.ts` | Create | Unit tests with mocked `openrouter` module |
| `src/components/TagChips/TagChips.tsx` | Create | Chip list with inline add-by-Enter and × remove |
| `src/components/TagChips/TagChips.module.css` | Create | Chip styles |
| `src/components/TagChips/TagChips.test.tsx` | Create | Unit tests |
| `src/screens/Settings/Settings.tsx` | Create | Screen 4: API key, model select, source toggles |
| `src/screens/Settings/Settings.module.css` | Create | Settings layout |
| `src/screens/Settings/Settings.test.tsx` | Create | Unit tests |
| `src/screens/Confirm/Confirm.tsx` | Create | Screen 2: editable profile form + "Start scanning" CTA |
| `src/screens/Confirm/Confirm.module.css` | Create | Confirm layout |
| `src/screens/Confirm/Confirm.test.tsx` | Create | Unit tests |
| `src/screens/StubScan/StubScan.tsx` | Create | Screen 3 placeholder: profile summary + queued source rows |
| `src/screens/StubScan/StubScan.module.css` | Create | StubScan layout |
| `src/screens/Upload/Upload.tsx` | Modify | Add `analyzeError` prop; show analyze errors in drop zone area |
| `src/screens/Upload/Upload.test.tsx` | Modify | Add test for `analyzeError` prop |
| `src/screens/StubResult/StubResult.tsx` | Delete | Replaced by Confirm + StubScan |
| `src/screens/StubResult/StubResult.module.css` | Delete | |
| `src/App.tsx` | Modify | New state machine: upload → analyzing → confirm → stubScan; settings branch |
| `src/App.module.css` | Modify | Add `.analyzing` class |
| `tests/e2e/upload.spec.ts` | Modify | Update to mock OpenRouter + expect Confirm screen |

---

## Task 1: Types, theme tokens, and storage layer

**Files:**
- Modify: `src/theme.css`
- Modify: `src/types.ts`
- Create: `src/lib/storage.ts`
- Create: `src/lib/storage.test.ts`

- [ ] **Step 1: Write the failing storage tests**

Create `src/lib/storage.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { loadSettings, saveSettings } from './storage';
import type { AppSettings } from '../types';

beforeEach(() => {
  localStorage.clear();
});

describe('loadSettings', () => {
  it('returns default settings when localStorage is empty', () => {
    const s = loadSettings();
    expect(s.openRouterKey).toBe('');
    expect(s.model).toBe('anthropic/claude-sonnet-4-6');
    expect(s.sources.linkedin).toBe(true);
    expect(s.sources.yc).toBe(true);
  });

  it('returns stored settings when present', () => {
    const stored: AppSettings = {
      openRouterKey: 'sk-or-test',
      model: 'openai/gpt-4o',
      sources: { linkedin: true, greenhouse: false, lever: true, workable: true, yc: false },
    };
    localStorage.setItem('trajector_settings', JSON.stringify(stored));
    const s = loadSettings();
    expect(s.openRouterKey).toBe('sk-or-test');
    expect(s.model).toBe('openai/gpt-4o');
    expect(s.sources.greenhouse).toBe(false);
  });

  it('returns defaults when stored JSON is corrupt', () => {
    localStorage.setItem('trajector_settings', 'not-json{{{');
    const s = loadSettings();
    expect(s.openRouterKey).toBe('');
  });
});

describe('saveSettings', () => {
  it('persists settings to localStorage', () => {
    const s = loadSettings();
    saveSettings({ ...s, openRouterKey: 'sk-or-persisted' });
    const raw = localStorage.getItem('trajector_settings');
    expect(JSON.parse(raw!).openRouterKey).toBe('sk-or-persisted');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/syedejazahammed/Documents/GitHub/Trajector
npm test -- storage
```

Expected: FAIL — `storage` module not found.

- [ ] **Step 3: Add `--error` and `--on-accent` tokens to `src/theme.css`**

Add these two lines after `--score-skip`:

```css
  /* Error state (only non-score chromatic token) */
  --error: #ef4444;
  /* Text color on --accent (white) backgrounds */
  --on-accent: #000;
```

Full updated block (lines 20–22 area, after `--score-skip: #525252;`):

```css
  --score-skip: #525252;

  /* Error state (only non-score chromatic token) */
  --error: #ef4444;
  /* Text color on --accent (white) backgrounds */
  --on-accent: #000;
```

- [ ] **Step 4: Replace `src/types.ts` with the expanded types**

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

export type Screen = 'upload' | 'analyzing' | 'settings' | 'confirm' | 'stubScan';
```

- [ ] **Step 5: Create `src/lib/storage.ts`**

```typescript
import type { AppSettings } from '../types';

const KEY = 'trajector_settings';

const DEFAULTS: AppSettings = {
  openRouterKey: '',
  model: 'anthropic/claude-sonnet-4-6',
  sources: {
    linkedin: true,
    greenhouse: true,
    lever: true,
    workable: true,
    yc: true,
  },
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS, sources: { ...DEFAULTS.sources } };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...DEFAULTS,
      ...parsed,
      sources: { ...DEFAULTS.sources, ...parsed.sources },
    };
  } catch {
    return { ...DEFAULTS, sources: { ...DEFAULTS.sources } };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(KEY, JSON.stringify(settings));
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npm test -- storage
```

Expected: PASS — 4 tests.

- [ ] **Step 7: Run typecheck**

```bash
npm run typecheck
```

Expected: no errors. (The old `Screen = 'upload' | 'stubResult'` is gone; `App.tsx` will have a TS error referencing `stubResult` — that's expected and will be fixed in Task 8.)

Actually: typecheck WILL fail now because `App.tsx` references the old `Screen` shape. That's fine — confirm the storage tests pass, then commit.

- [ ] **Step 8: Commit**

```bash
git add src/theme.css src/types.ts src/lib/storage.ts src/lib/storage.test.ts
git commit -m "feat: extend types, add error token, add storage layer"
```

---

## Task 2: OpenRouter API client

**Files:**
- Create: `src/lib/openrouter.ts`
- Create: `src/lib/openrouter.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/openrouter.test.ts`:

```typescript
import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchCompletion, OpenRouterError } from './openrouter';

afterEach(() => {
  vi.unstubAllGlobals();
});

function makeFetch(ok: boolean, status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
  });
}

describe('fetchCompletion', () => {
  it('returns the assistant message content on success', async () => {
    vi.stubGlobal(
      'fetch',
      makeFetch(true, 200, { choices: [{ message: { content: 'hello world' } }] }),
    );
    const result = await fetchCompletion('sk-key', 'model-x', [
      { role: 'user', content: 'hi' },
    ]);
    expect(result).toBe('hello world');
  });

  it('sends Authorization header with Bearer token', async () => {
    const spy = makeFetch(true, 200, { choices: [{ message: { content: 'ok' } }] });
    vi.stubGlobal('fetch', spy);
    await fetchCompletion('sk-test', 'model-x', [{ role: 'user', content: 'hi' }]);
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer sk-test');
  });

  it('throws OpenRouterError with message on 401', async () => {
    vi.stubGlobal(
      'fetch',
      makeFetch(false, 401, { error: { message: 'Invalid API key' } }),
    );
    await expect(
      fetchCompletion('bad-key', 'model-x', [{ role: 'user', content: 'hi' }]),
    ).rejects.toThrow('Invalid API key');
  });

  it('throws OpenRouterError with HTTP status fallback on unknown error shape', async () => {
    vi.stubGlobal('fetch', makeFetch(false, 500, {}));
    await expect(
      fetchCompletion('key', 'model', [{ role: 'user', content: 'hi' }]),
    ).rejects.toThrow('HTTP 500');
  });

  it('throws OpenRouterError when choices array is empty', async () => {
    vi.stubGlobal('fetch', makeFetch(true, 200, { choices: [] }));
    await expect(
      fetchCompletion('key', 'model', [{ role: 'user', content: 'hi' }]),
    ).rejects.toThrow(OpenRouterError);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- openrouter
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/lib/openrouter.ts`**

```typescript
export interface ORMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

export async function fetchCompletion(
  apiKey: string,
  model: string,
  messages: ORMessage[],
): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/ahammedejaz/trajector',
    },
    body: JSON.stringify({ model, messages }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as Record<string, unknown>) as {
      error?: { message?: string };
    };
    throw new OpenRouterError(body.error?.message ?? `HTTP ${res.status}`, res.status);
  }

  const data = await res.json() as {
    choices: Array<{ message: { content: string } }>;
  };
  const content = data.choices[0]?.message?.content;
  if (content === undefined) throw new OpenRouterError('Empty response from model');
  return content;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- openrouter
```

Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/openrouter.ts src/lib/openrouter.test.ts
git commit -m "feat: add OpenRouter API client"
```

---

## Task 3: Profile extraction via LLM

**Files:**
- Create: `src/lib/extractProfile.ts`
- Create: `src/lib/extractProfile.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/extractProfile.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { extractProfile } from './extractProfile';
import * as openrouter from './openrouter';

vi.mock('./openrouter');

function mockLLM(json: unknown) {
  vi.mocked(openrouter.fetchCompletion).mockResolvedValueOnce(JSON.stringify(json));
}

describe('extractProfile', () => {
  it('parses a complete valid JSON response', async () => {
    mockLLM({
      targetRole: 'Senior Backend Engineer',
      level: 'senior',
      compFloor: 200000,
      location: 'remote',
      stackSignals: ['Go', 'PostgreSQL', 'Kubernetes'],
      dealBreakers: ['crypto'],
    });

    const p = await extractProfile('resume text', 'key', 'model');
    expect(p.targetRole).toBe('Senior Backend Engineer');
    expect(p.level).toBe('senior');
    expect(p.compFloor).toBe(200000);
    expect(p.location).toBe('remote');
    expect(p.stackSignals).toEqual(['Go', 'PostgreSQL', 'Kubernetes']);
    expect(p.dealBreakers).toEqual(['crypto']);
  });

  it('coerces an unknown level to "senior"', async () => {
    mockLLM({ targetRole: 'Eng', level: 'lead', compFloor: null, location: 'remote', stackSignals: [], dealBreakers: [] });
    const p = await extractProfile('text', 'key', 'model');
    expect(p.level).toBe('senior');
  });

  it('coerces an unknown location to "remote"', async () => {
    mockLLM({ targetRole: 'Eng', level: 'senior', compFloor: null, location: 'new york', stackSignals: [], dealBreakers: [] });
    const p = await extractProfile('text', 'key', 'model');
    expect(p.location).toBe('remote');
  });

  it('caps stackSignals at 8 items', async () => {
    mockLLM({
      targetRole: 'Eng', level: 'senior', compFloor: null, location: 'remote',
      stackSignals: ['a','b','c','d','e','f','g','h','i','j'],
      dealBreakers: [],
    });
    const p = await extractProfile('text', 'key', 'model');
    expect(p.stackSignals).toHaveLength(8);
  });

  it('handles null compFloor', async () => {
    mockLLM({ targetRole: 'Eng', level: 'mid', compFloor: null, location: 'hybrid', stackSignals: [], dealBreakers: [] });
    const p = await extractProfile('text', 'key', 'model');
    expect(p.compFloor).toBeNull();
  });

  it('throws on invalid JSON from LLM', async () => {
    vi.mocked(openrouter.fetchCompletion).mockResolvedValueOnce('not json at all {{');
    await expect(extractProfile('text', 'key', 'model')).rejects.toThrow('invalid JSON');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- extractProfile
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/lib/extractProfile.ts`**

```typescript
import { fetchCompletion } from './openrouter';
import type { Profile, Level, LocationPref } from '../types';

const SYSTEM = `Extract structured profile data from this resume text. Return ONLY valid JSON — no markdown fences, no commentary, just the JSON object.

Schema:
{
  "targetRole": string,
  "level": "junior" | "mid" | "senior" | "staff" | "principal",
  "compFloor": number | null,
  "location": "remote" | "hybrid" | "onsite",
  "stackSignals": string[],
  "dealBreakers": string[]
}

Rules:
- targetRole: infer the most recent or desired role title
- level: infer from years of experience and last title; default "senior"
- compFloor: extract if mentioned explicitly; otherwise null
- location: default to "remote" if unclear
- stackSignals: 5-8 technical skills, languages, and frameworks most relevant to this candidate
- dealBreakers: only if explicitly mentioned in the resume; otherwise []`;

const VALID_LEVELS = new Set<string>(['junior', 'mid', 'senior', 'staff', 'principal']);
const VALID_LOCATIONS = new Set<string>(['remote', 'hybrid', 'onsite']);

function coerceLevel(raw: unknown): Level {
  const s = String(raw).toLowerCase().trim();
  return VALID_LEVELS.has(s) ? (s as Level) : 'senior';
}

function coerceLocation(raw: unknown): LocationPref {
  const s = String(raw).toLowerCase().trim();
  return VALID_LOCATIONS.has(s) ? (s as LocationPref) : 'remote';
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
    level: coerceLevel(parsed.level),
    compFloor: typeof parsed.compFloor === 'number' ? parsed.compFloor : null,
    location: coerceLocation(parsed.location),
    stackSignals: Array.isArray(parsed.stackSignals)
      ? (parsed.stackSignals as unknown[])
          .filter((s): s is string => typeof s === 'string')
          .slice(0, 8)
      : [],
    dealBreakers: Array.isArray(parsed.dealBreakers)
      ? (parsed.dealBreakers as unknown[]).filter((s): s is string => typeof s === 'string')
      : [],
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- extractProfile
```

Expected: PASS — 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/extractProfile.ts src/lib/extractProfile.test.ts
git commit -m "feat: add LLM profile extraction"
```

---

## Task 4: TagChips component

**Files:**
- Create: `src/components/TagChips/TagChips.tsx`
- Create: `src/components/TagChips/TagChips.module.css`
- Create: `src/components/TagChips/TagChips.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/TagChips/TagChips.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagChips } from './TagChips';

describe('TagChips', () => {
  it('renders all provided chips', () => {
    render(<TagChips chips={['Go', 'Rust']} onRemove={() => {}} onAdd={() => {}} />);
    expect(screen.getByText('Go')).toBeInTheDocument();
    expect(screen.getByText('Rust')).toBeInTheDocument();
  });

  it('calls onRemove with the chip label when × is clicked', async () => {
    const onRemove = vi.fn();
    render(<TagChips chips={['Go']} onRemove={onRemove} onAdd={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove Go' }));
    expect(onRemove).toHaveBeenCalledWith('Go');
  });

  it('calls onAdd with trimmed value when Enter is pressed', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<TagChips chips={[]} onRemove={() => {}} onAdd={onAdd} />);
    await user.type(screen.getByRole('textbox'), '  TypeScript  {Enter}');
    expect(onAdd).toHaveBeenCalledWith('TypeScript');
  });

  it('clears the input after adding', async () => {
    const user = userEvent.setup();
    render(<TagChips chips={[]} onRemove={() => {}} onAdd={() => {}} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    await user.type(input, 'Go{Enter}');
    expect(input.value).toBe('');
  });

  it('does not call onAdd when Enter is pressed with empty input', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<TagChips chips={[]} onRemove={() => {}} onAdd={onAdd} />);
    await user.type(screen.getByRole('textbox'), '{Enter}');
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('shows custom placeholder', () => {
    render(<TagChips chips={[]} onRemove={() => {}} onAdd={() => {}} placeholder="+ Add skill" />);
    expect(screen.getByPlaceholderText('+ Add skill')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- TagChips
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/components/TagChips/TagChips.tsx`**

```typescript
import { useState } from 'react';
import styles from './TagChips.module.css';

interface Props {
  chips: string[];
  onRemove: (chip: string) => void;
  onAdd: (chip: string) => void;
  placeholder?: string;
}

export function TagChips({ chips, onRemove, onAdd, placeholder = 'Add...' }: Props) {
  const [draft, setDraft] = useState('');

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && draft.trim()) {
      e.preventDefault();
      onAdd(draft.trim());
      setDraft('');
    }
  }

  return (
    <div className={styles.root}>
      {chips.map((chip) => (
        <span key={chip} className={styles.chip}>
          {chip}
          <button
            type="button"
            className={styles.remove}
            onClick={() => onRemove(chip)}
            aria-label={`Remove ${chip}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        className={styles.input}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/TagChips/TagChips.module.css`**

```css
.root {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-2);
  align-items: center;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  background: var(--bg-surface-2);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius);
  font-size: var(--font-size-caption);
  color: var(--text-primary);
}

.remove {
  color: var(--text-tertiary);
  font-size: 14px;
  line-height: 1;
  padding: 0 2px;
  transition: color var(--motion-fast) var(--easing-out);
}

.remove:hover {
  color: var(--text-primary);
}

.input {
  background: transparent;
  border: none;
  outline: none;
  font-size: var(--font-size-caption);
  color: var(--text-secondary);
  min-width: 80px;
}

.input::placeholder {
  color: var(--text-tertiary);
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- TagChips
```

Expected: PASS — 6 tests.

- [ ] **Step 6: Commit**

```bash
git add src/components/TagChips/
git commit -m "feat: add TagChips component"
```

---

## Task 5: Settings screen

**Files:**
- Create: `src/screens/Settings/Settings.tsx`
- Create: `src/screens/Settings/Settings.module.css`
- Create: `src/screens/Settings/Settings.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/screens/Settings/Settings.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Settings } from './Settings';

beforeEach(() => {
  localStorage.clear();
});

describe('Settings screen', () => {
  it('renders the API key input', () => {
    render(<Settings onDone={() => {}} />);
    expect(screen.getByLabelText('OpenRouter API key')).toBeInTheDocument();
  });

  it('renders the model select', () => {
    render(<Settings onDone={() => {}} />);
    expect(screen.getByLabelText('Model')).toBeInTheDocument();
  });

  it('calls onDone when Done is clicked', async () => {
    const onDone = vi.fn();
    render(<Settings onDone={onDone} />);
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(onDone).toHaveBeenCalled();
  });

  it('masks the API key by default', () => {
    render(<Settings onDone={() => {}} />);
    const input = screen.getByLabelText('OpenRouter API key') as HTMLInputElement;
    expect(input.type).toBe('password');
  });

  it('reveals the API key when Show is clicked', async () => {
    render(<Settings onDone={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Show' }));
    const input = screen.getByLabelText('OpenRouter API key') as HTMLInputElement;
    expect(input.type).toBe('text');
  });

  it('persists the API key to localStorage on change', async () => {
    const user = userEvent.setup();
    render(<Settings onDone={() => {}} />);
    await user.type(screen.getByLabelText('OpenRouter API key'), 'sk-or-v1-test');
    const stored = JSON.parse(localStorage.getItem('trajector_settings') ?? '{}') as { openRouterKey: string };
    expect(stored.openRouterKey).toBe('sk-or-v1-test');
  });

  it('renders source toggle checkboxes', () => {
    render(<Settings onDone={() => {}} />);
    expect(screen.getByRole('checkbox', { name: /linkedin/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /greenhouse/i })).toBeInTheDocument();
  });

  it('toggles a source off and persists it', async () => {
    render(<Settings onDone={() => {}} />);
    await userEvent.click(screen.getByRole('checkbox', { name: /linkedin/i }));
    const stored = JSON.parse(localStorage.getItem('trajector_settings') ?? '{}') as { sources: Record<string, boolean> };
    expect(stored.sources.linkedin).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- Settings
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/screens/Settings/Settings.tsx`**

```typescript
import { useState } from 'react';
import { loadSettings, saveSettings } from '../../lib/storage';
import type { AppSettings } from '../../types';
import styles from './Settings.module.css';

const CURATED_MODELS = [
  'anthropic/claude-sonnet-4-6',
  'anthropic/claude-haiku-4-5-20251001',
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'google/gemini-2.0-flash-001',
  'meta-llama/llama-4-maverick',
] as const;

const SOURCE_LABELS: Record<keyof AppSettings['sources'], string> = {
  linkedin: 'LinkedIn',
  greenhouse: 'Greenhouse',
  lever: 'Lever',
  workable: 'Workable',
  yc: 'Y Combinator',
};

interface Props {
  onDone: () => void;
}

export function Settings({ onDone }: Props) {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [showKey, setShowKey] = useState(false);

  function update(patch: Partial<AppSettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  }

  function toggleSource(name: keyof AppSettings['sources']) {
    update({ sources: { ...settings.sources, [name]: !settings.sources[name] } });
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <button type="button" className={styles.done} onClick={onDone}>
          Done
        </button>
      </header>

      <section className={styles.section}>
        <label className={styles.label} htmlFor="api-key">
          OpenRouter API key
        </label>
        <div className={styles.keyRow}>
          <input
            id="api-key"
            className={styles.input}
            type={showKey ? 'text' : 'password'}
            value={settings.openRouterKey}
            onChange={(e) => update({ openRouterKey: e.target.value })}
            placeholder="sk-or-v1-..."
            autoComplete="off"
          />
          <button
            type="button"
            className={styles.showToggle}
            onClick={() => setShowKey((v) => !v)}
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
        <p className={styles.hint}>Stored locally in your browser. Never sent to Trajector servers.</p>
      </section>

      <section className={styles.section}>
        <label className={styles.label} htmlFor="model-select">
          Model
        </label>
        <select
          id="model-select"
          className={styles.select}
          value={settings.model}
          onChange={(e) => update({ model: e.target.value })}
        >
          {CURATED_MODELS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <p className={styles.hint}>Used for resume parsing and job scoring. Sonnet 4.6 is the recommended default.</p>
      </section>

      <section className={styles.section}>
        <p className={styles.label}>Sources</p>
        {(Object.keys(settings.sources) as Array<keyof AppSettings['sources']>).map((src) => (
          <label key={src} className={styles.sourceRow}>
            <input
              type="checkbox"
              checked={settings.sources[src]}
              onChange={() => toggleSource(src)}
              aria-label={SOURCE_LABELS[src]}
            />
            <span>{SOURCE_LABELS[src]}</span>
          </label>
        ))}
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/screens/Settings/Settings.module.css`**

```css
.root {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--space-7) var(--space-5);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-7);
}

.title {
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.done {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
  color: var(--accent);
  padding: var(--space-2) var(--space-4);
  border: var(--border-width) solid var(--accent);
  border-radius: var(--radius);
  transition: background-color var(--motion-fast) var(--easing-out);
}

.done:hover {
  background-color: var(--bg-surface-2);
}

.section {
  margin-bottom: var(--space-6);
}

.label {
  display: block;
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: var(--space-2);
}

.keyRow {
  display: flex;
  gap: var(--space-2);
}

.input {
  flex: 1;
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

.showToggle {
  font-size: var(--font-size-caption);
  color: var(--text-secondary);
  padding: var(--space-2) var(--space-3);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius);
  white-space: nowrap;
  transition: color var(--motion-fast) var(--easing-out);
}

.showToggle:hover {
  color: var(--text-primary);
}

.select {
  width: 100%;
  background: var(--bg-surface);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius);
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-body);
  color: var(--text-primary);
  outline: none;
  appearance: none;
  cursor: pointer;
  transition: border-color var(--motion-fast) var(--easing-out);
}

.select:focus {
  border-color: var(--accent);
}

.hint {
  font-size: var(--font-size-caption);
  color: var(--text-tertiary);
  margin: var(--space-2) 0 0;
}

.sourceRow {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) 0;
  font-size: var(--font-size-body);
  color: var(--text-secondary);
  cursor: pointer;
}

.sourceRow input[type='checkbox'] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--accent);
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- Settings
```

Expected: PASS — 8 tests.

- [ ] **Step 6: Commit**

```bash
git add src/screens/Settings/
git commit -m "feat: add Settings screen"
```

---

## Task 6: Confirm screen

**Files:**
- Create: `src/screens/Confirm/Confirm.tsx`
- Create: `src/screens/Confirm/Confirm.module.css`
- Create: `src/screens/Confirm/Confirm.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/screens/Confirm/Confirm.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Confirm } from './Confirm';
import type { Profile } from '../../types';

const SAMPLE: Profile = {
  targetRole: 'Senior Backend Engineer',
  level: 'senior',
  compFloor: 200000,
  location: 'remote',
  stackSignals: ['Go', 'PostgreSQL'],
  dealBreakers: [],
};

describe('Confirm screen', () => {
  it('renders the heading', () => {
    render(<Confirm profile={SAMPLE} onConfirm={() => {}} />);
    expect(screen.getByText('Confirm your profile')).toBeInTheDocument();
  });

  it('pre-fills the target role field', () => {
    render(<Confirm profile={SAMPLE} onConfirm={() => {}} />);
    expect(screen.getByDisplayValue('Senior Backend Engineer')).toBeInTheDocument();
  });

  it('renders stack signal chips', () => {
    render(<Confirm profile={SAMPLE} onConfirm={() => {}} />);
    expect(screen.getByText('Go')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
  });

  it('calls onConfirm with the current profile when Start scanning is clicked', async () => {
    const onConfirm = vi.fn();
    render(<Confirm profile={SAMPLE} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole('button', { name: /start scanning/i }));
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({
      targetRole: 'Senior Backend Engineer',
      level: 'senior',
    }));
  });

  it('disables Start scanning when targetRole is empty', () => {
    render(<Confirm profile={{ ...SAMPLE, targetRole: '' }} onConfirm={() => {}} />);
    expect(screen.getByRole('button', { name: /start scanning/i })).toBeDisabled();
  });

  it('shows "Required." after blurring an empty targetRole', async () => {
    const user = userEvent.setup();
    render(<Confirm profile={{ ...SAMPLE, targetRole: '' }} onConfirm={() => {}} />);
    await user.click(screen.getByLabelText('Target role'));
    await user.tab();
    expect(screen.getByText('Required.')).toBeInTheDocument();
  });

  it('lets the user edit targetRole and calls onConfirm with updated value', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<Confirm profile={SAMPLE} onConfirm={onConfirm} />);
    const input = screen.getByLabelText('Target role');
    await user.clear(input);
    await user.type(input, 'Staff Engineer');
    await user.click(screen.getByRole('button', { name: /start scanning/i }));
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ targetRole: 'Staff Engineer' }));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- Confirm
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/screens/Confirm/Confirm.tsx`**

```typescript
import { useState } from 'react';
import type { Profile } from '../../types';
import { TagChips } from '../../components/TagChips/TagChips';
import styles from './Confirm.module.css';

const LEVELS = ['junior', 'mid', 'senior', 'staff', 'principal'] as const;
const LOCATIONS = ['remote', 'hybrid', 'onsite'] as const;

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface Props {
  profile: Profile;
  onConfirm: (profile: Profile) => void;
}

export function Confirm({ profile: initial, onConfirm }: Props) {
  const [profile, setProfile] = useState<Profile>(initial);
  const [roleTouched, setRoleTouched] = useState(false);

  function update(patch: Partial<Profile>) {
    setProfile((p) => ({ ...p, ...patch }));
  }

  const roleError = roleTouched && !profile.targetRole.trim() ? 'Required.' : null;
  const isValid = Boolean(profile.targetRole.trim() && profile.level && profile.location);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>Confirm your profile</h1>
        <p className={styles.subtitle}>
          We read this from your resume. Edit anything that's wrong before we start scanning.
        </p>
      </header>

      <div className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="target-role">
            Target role
          </label>
          <input
            id="target-role"
            className={`${styles.input}${roleError ? ` ${styles.inputError}` : ''}`}
            value={profile.targetRole}
            onChange={(e) => update({ targetRole: e.target.value })}
            onBlur={() => setRoleTouched(true)}
          />
          {roleError && <p className={styles.errorMsg}>{roleError}</p>}
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="level">
              Level
            </label>
            <select
              id="level"
              className={styles.select}
              value={profile.level}
              onChange={(e) => update({ level: e.target.value as Profile['level'] })}
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {capitalize(l)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="comp-floor">
              Comp floor
            </label>
            <input
              id="comp-floor"
              className={styles.input}
              type="number"
              placeholder="200000"
              value={profile.compFloor ?? ''}
              onChange={(e) =>
                update({ compFloor: e.target.value ? Number(e.target.value) : null })
              }
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="location">
              Location
            </label>
            <select
              id="location"
              className={styles.select}
              value={profile.location}
              onChange={(e) => update({ location: e.target.value as Profile['location'] })}
            >
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>
                  {capitalize(l)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <p className={styles.label}>Stack signals</p>
          <TagChips
            chips={profile.stackSignals}
            onRemove={(chip) => update({ stackSignals: profile.stackSignals.filter((s) => s !== chip) })}
            onAdd={(chip) => {
              if (!profile.stackSignals.includes(chip)) {
                update({ stackSignals: [...profile.stackSignals, chip] });
              }
            }}
            placeholder="+ Add"
          />
        </div>

        <div className={styles.field}>
          <p className={styles.label}>Deal-breakers</p>
          <TagChips
            chips={profile.dealBreakers}
            onRemove={(chip) => update({ dealBreakers: profile.dealBreakers.filter((s) => s !== chip) })}
            onAdd={(chip) => {
              if (!profile.dealBreakers.includes(chip)) {
                update({ dealBreakers: [...profile.dealBreakers, chip] });
              }
            }}
            placeholder="+ Add"
          />
        </div>

        <button
          type="button"
          className={styles.cta}
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

- [ ] **Step 4: Create `src/screens/Confirm/Confirm.module.css`**

```css
.root {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--space-7) var(--space-5);
}

.header {
  margin-bottom: var(--space-7);
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

.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-4);
}

.label {
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
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

.inputError {
  border-color: var(--error);
}

.errorMsg {
  font-size: var(--font-size-caption);
  color: var(--error);
  margin: 0;
}

.select {
  width: 100%;
  background: var(--bg-surface);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius);
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-body);
  color: var(--text-primary);
  outline: none;
  appearance: none;
  cursor: pointer;
  transition: border-color var(--motion-fast) var(--easing-out);
}

.select:focus {
  border-color: var(--accent);
}

.cta {
  align-self: center;
  width: 240px;
  padding: var(--space-3) var(--space-5);
  background: var(--accent);
  color: var(--on-accent);
  border-radius: var(--radius);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  transition: background-color var(--motion-fast) var(--easing-out);
  margin-top: var(--space-4);
}

.cta:hover:not(:disabled) {
  background-color: var(--accent-hover);
}

.cta:disabled {
  background: var(--bg-surface-2);
  color: var(--text-tertiary);
  cursor: not-allowed;
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- Confirm
```

Expected: PASS — 7 tests.

- [ ] **Step 6: Commit**

```bash
git add src/screens/Confirm/
git commit -m "feat: add Confirm screen"
```

---

## Task 7: StubScan screen + retire StubResult

**Files:**
- Create: `src/screens/StubScan/StubScan.tsx`
- Create: `src/screens/StubScan/StubScan.module.css`
- Delete: `src/screens/StubResult/StubResult.tsx`
- Delete: `src/screens/StubResult/StubResult.module.css`

- [ ] **Step 1: Create `src/screens/StubScan/StubScan.tsx`**

```typescript
import type { Profile } from '../../types';
import styles from './StubScan.module.css';

const SOURCES = ['LinkedIn', 'Greenhouse', 'Lever', 'Workable', 'Y Combinator'];

interface Props {
  profile: Profile;
  onReset: () => void;
}

export function StubScan({ profile, onReset }: Props) {
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>Scanning the open web</h1>
        <p className={styles.subtitle}>
          {profile.targetRole} · {profile.level} · {profile.location}
        </p>
      </header>

      <div className={styles.sources}>
        {SOURCES.map((src) => (
          <div key={src} className={styles.sourceRow}>
            <span className={styles.glyph}>○</span>
            <span className={styles.sourceName}>{src}</span>
            <span className={styles.status}>queued</span>
          </div>
        ))}
      </div>

      <p className={styles.stub}>Job scanning arrives in Plan 3.</p>

      <button type="button" className={styles.reset} onClick={onReset}>
        Start over
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/screens/StubScan/StubScan.module.css`**

```css
.root {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-7) var(--space-5);
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

.sources {
  border-top: var(--border-width) solid var(--border-subtle);
  margin-bottom: var(--space-6);
}

.sourceRow {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: var(--border-width) solid var(--border-subtle);
}

.glyph {
  font-size: var(--font-size-body);
  color: var(--text-tertiary);
  width: 16px;
  text-align: center;
}

.sourceName {
  flex: 1;
  font-size: var(--font-size-body);
  color: var(--text-secondary);
}

.status {
  font-size: var(--font-size-caption);
  color: var(--text-tertiary);
}

.stub {
  font-size: var(--font-size-caption);
  color: var(--text-tertiary);
  margin: 0 0 var(--space-5);
}

.reset {
  font-size: var(--font-size-body);
  color: var(--text-secondary);
  padding: var(--space-2) var(--space-4);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius);
  transition: color var(--motion-fast) var(--easing-out),
              border-color var(--motion-fast) var(--easing-out);
}

.reset:hover {
  color: var(--text-primary);
  border-color: var(--border-strong);
}
```

- [ ] **Step 3: Delete the StubResult files**

```bash
rm /Users/syedejazahammed/Documents/GitHub/Trajector/src/screens/StubResult/StubResult.tsx
rm /Users/syedejazahammed/Documents/GitHub/Trajector/src/screens/StubResult/StubResult.module.css
rmdir /Users/syedejazahammed/Documents/GitHub/Trajector/src/screens/StubResult
```

If a `StubResult.test.tsx` exists in that directory, delete it too before running rmdir.

- [ ] **Step 4: Run typecheck to confirm App.tsx now has errors (expected)**

```bash
npm run typecheck 2>&1 | head -20
```

Expected: errors in `App.tsx` referencing `StubResult` and old `Screen` type — will be fixed in Task 8.

- [ ] **Step 5: Commit**

```bash
git add src/screens/StubScan/ src/screens/StubResult/
git commit -m "feat: add StubScan screen, retire StubResult"
```

---

## Task 8: Upload.tsx `analyzeError` prop + App.tsx state machine

**Files:**
- Modify: `src/screens/Upload/Upload.tsx`
- Modify: `src/screens/Upload/Upload.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.module.css`

- [ ] **Step 1: Write the new Upload test for `analyzeError`**

Open `src/screens/Upload/Upload.test.tsx`. The existing tests stay. Add this new test at the end of the `describe` block:

```typescript
  it('shows an analyze error message when analyzeError prop is set', () => {
    render(
      <Upload
        onResumeParsed={() => {}}
        analyzeError="Couldn't analyze your resume. Check your OpenRouter key in Settings."
      />,
    );
    expect(
      screen.getByText(/couldn't analyze your resume/i),
    ).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run tests to verify the new test fails**

```bash
npm test -- Upload
```

Expected: new test FAILs, existing 3 tests PASS.

- [ ] **Step 3: Update `src/screens/Upload/Upload.tsx` to accept `analyzeError` prop**

Replace the entire file with:

```typescript
import { useState } from 'react';
import { DropZone, type DropZoneState } from '../../components/DropZone/DropZone';
import { parseResume } from '../../lib/parseResume';
import type { ResumeText } from '../../types';
import styles from './Upload.module.css';

interface UploadProps {
  onResumeParsed: (resume: ResumeText) => void;
  analyzeError?: string | null;
}

export function Upload({ onResumeParsed, analyzeError }: UploadProps) {
  const [zoneState, setZoneState] = useState<DropZoneState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const handleFile = async (file: File) => {
    setZoneState('reading');
    setErrorMessage(undefined);
    try {
      const result = await parseResume(file);
      onResumeParsed(result);
    } catch {
      setErrorMessage("Couldn't read this file. Try DOCX or markdown.");
      setZoneState('error');
    }
  };

  const displayError =
    zoneState === 'idle' && analyzeError ? analyzeError : errorMessage;

  return (
    <div className={styles.page}>
      <div className={styles.header}>Trajector</div>
      <div className={styles.body}>
        <div className={styles.column}>
          <div className={styles['headline-group']}>
            <h1 className={styles.headline}>Drop your resume to begin</h1>
            <p className={styles.subhead}>PDF, DOCX, or markdown · stays on your machine</p>
          </div>
          <DropZone
            state={zoneState}
            errorMessage={displayError}
            onFileSelected={handleFile}
          />
          <p className={styles.reassurance}>
            No account. No upload to a server.
            <br />
            Parsed locally, evaluated locally.
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run Upload tests to verify all 4 pass**

```bash
npm test -- Upload
```

Expected: PASS — 4 tests.

- [ ] **Step 5: Add `.analyzing` class to `src/App.module.css`**

Replace the file with:

```css
.root {
  min-height: 100%;
}

.analyzing {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.analyzingText {
  font-size: var(--font-size-body);
  color: var(--text-secondary);
}
```

- [ ] **Step 6: Rewrite `src/App.tsx`**

```typescript
import { useState } from 'react';
import type { ResumeText, Profile, Screen } from './types';
import { loadSettings } from './lib/storage';
import { extractProfile } from './lib/extractProfile';
import { Upload } from './screens/Upload/Upload';
import { Settings } from './screens/Settings/Settings';
import { Confirm } from './screens/Confirm/Confirm';
import { StubScan } from './screens/StubScan/StubScan';
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
        err instanceof Error ? err.message : 'Analysis failed. Check your OpenRouter key in Settings.',
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
    setScreen('stubScan');
  }

  function handleReset() {
    setResume(null);
    setProfile(null);
    setAnalyzeError(null);
    setScreen('upload');
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

  if (screen === 'stubScan' && profile) {
    return (
      <div className={styles.root}>
        <StubScan profile={profile} onReset={handleReset} />
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

- [ ] **Step 7: Run typecheck — must pass cleanly**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 8: Run all unit tests**

```bash
npm test
```

Expected: all existing tests PASS (Upload: 4, TagChips: 6, Settings: 8, Confirm: 7, storage: 4, openrouter: 5, extractProfile: 6, plus all Plan 1 lib tests). The e2e tests will fail until Task 9.

- [ ] **Step 9: Commit**

```bash
git add src/screens/Upload/Upload.tsx src/screens/Upload/Upload.test.tsx src/App.tsx src/App.module.css
git commit -m "feat: wire up state machine — upload → analyzing → confirm → stubScan"
```

---

## Task 9: Update e2e tests + full verification + push

**Files:**
- Modify: `tests/e2e/upload.spec.ts`

- [ ] **Step 1: Rewrite `tests/e2e/upload.spec.ts`**

The old tests expected `'Extracted text (Plan 1 stub)'` — that screen is gone. Replace the file with:

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

const OR_RESPONSE = {
  choices: [{ message: { content: JSON.stringify(MOCK_PROFILE) } }],
};

test.describe('upload flow', () => {
  test.beforeEach(async ({ page }) => {
    // Pre-load a fake API key so the app skips the Settings redirect
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

    // Intercept all OpenRouter completions calls
    await page.route('**/openrouter.ai/api/v1/chat/completions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(OR_RESPONSE),
      });
    });
  });

  test('drops a PDF, goes through LLM analysis, and shows Confirm screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Drop your resume to begin')).toBeVisible();

    const fixturePath = path.resolve(__dirname, '../fixtures/sample-resume.pdf');
    await page.getByLabel('Drop here or click to browse').setInputFiles(fixturePath);

    await expect(page.getByText('Confirm your profile')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByDisplayValue('Senior Backend Engineer')).toBeVisible();
  });

  test('confirms the profile and reaches StubScan screen', async ({ page }) => {
    await page.goto('/');
    const fixturePath = path.resolve(__dirname, '../fixtures/sample-resume.pdf');
    await page.getByLabel('Drop here or click to browse').setInputFiles(fixturePath);

    await expect(page.getByText('Confirm your profile')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /start scanning/i }).click();

    await expect(page.getByText('Scanning the open web')).toBeVisible();
    await expect(page.getByText('Senior Backend Engineer · senior · remote')).toBeVisible();
  });

  test('Start over from StubScan returns to upload screen', async ({ page }) => {
    await page.goto('/');
    const fixturePath = path.resolve(__dirname, '../fixtures/sample-resume.pdf');
    await page.getByLabel('Drop here or click to browse').setInputFiles(fixturePath);

    await expect(page.getByText('Confirm your profile')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /start scanning/i }).click();
    await expect(page.getByText('Scanning the open web')).toBeVisible();

    await page.getByRole('button', { name: 'Start over' }).click();
    await expect(page.getByText('Drop your resume to begin')).toBeVisible();
  });

  test('redirects to Settings when no API key is stored', async ({ page }) => {
    // Override the beforeEach pre-load with an empty key
    await page.addInitScript(() => {
      localStorage.removeItem('trajector_settings');
    });

    await page.goto('/');
    const fixturePath = path.resolve(__dirname, '../fixtures/sample-resume.pdf');
    await page.getByLabel('Drop here or click to browse').setInputFiles(fixturePath);

    await expect(page.getByText('Settings')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabelText('OpenRouter API key')).toBeVisible();
  });
});
```

- [ ] **Step 2: Run e2e tests**

```bash
npm run test:e2e
```

Expected: PASS — 4 tests. If the "no API key" test is flaky (race condition between addInitScript calls), adjust the test by navigating to a blank page first, clearing storage, then going to `/`.

If "no API key" test is flaky, replace the beforeEach override approach with a separate test that uses `page.goto` after clearing storage:

```typescript
  test('redirects to Settings when no API key is stored', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    const fixturePath = path.resolve(__dirname, '../fixtures/sample-resume.pdf');
    await page.getByLabel('Drop here or click to browse').setInputFiles(fixturePath);

    await expect(page.getByText('Settings')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabelText('OpenRouter API key')).toBeVisible();
  });
```

- [ ] **Step 3: Run the full verification suite**

```bash
npm run lint && npm run typecheck && npm test && npm run test:e2e
```

Expected: all pass, no errors.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/upload.spec.ts
git commit -m "test: update e2e tests for Plan 2 flow"
```

- [ ] **Step 5: Push the branch and open a PR**

```bash
git push -u origin feat/v0-plan-2-llm-profile
```

```bash
gh pr create \
  --base feat/v0-foundation \
  --title "feat: Plan 2 — LLM integration + profile confirmation" \
  --body "$(cat <<'EOF'
## Summary

- OpenRouter client (`fetchCompletion`) with typed errors
- `extractProfile()` — resume text → LLM → structured `Profile` JSON
- `localStorage` settings layer (API key, model, source toggles)
- TagChips component (add-by-Enter, × remove)
- Settings screen (Screen 4): API key, model select, source toggles
- Confirm screen (Screen 2): editable profile fields, inline validation, Start scanning CTA
- StubScan screen (Screen 3 placeholder): queued source rows, profile summary
- App state machine: upload → analyzing → confirm → stubScan; Settings branch for missing API key
- StubResult screen retired

## Test plan

- [ ] `npm run lint` — no errors
- [ ] `npm run typecheck` — no errors
- [ ] `npm test` — all unit/component tests pass
- [ ] `npm run test:e2e` — 4/4 Playwright tests pass
- [ ] Upload PDF with API key pre-seeded → Confirm screen shows extracted profile
- [ ] Edit profile, click Start scanning → StubScan shows correct profile summary
- [ ] Upload PDF with no API key → Settings screen appears
- [ ] Enter key in Settings, click Done → analysis resumes automatically

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review

**Spec coverage check:**

| Spec requirement | Task covering it |
|---|---|
| Screen 1 (Upload) — analyzeError inline display | Task 8 |
| Screen 2 (Confirm) — all fields, inline validation, CTA | Task 6 |
| Screen 4 (Settings) — API key, model, source toggles | Task 5 |
| OpenRouter LLM gateway | Task 2, 3 |
| Screen 3 stub (real scan deferred) | Task 7 |
| `localStorage` for settings | Task 1 |
| `--error` token for error states | Task 1 |
| App state machine wiring | Task 8 |
| E2e coverage for full flow | Task 9 |
| Settings redirect when no key | Task 8 (logic), Task 9 (e2e) |

**No placeholders:** all code is complete and explicit.

**Type consistency:** `Profile`, `Level`, `LocationPref`, `AppSettings`, `Screen` all defined once in `src/types.ts` and referenced consistently across all tasks.
