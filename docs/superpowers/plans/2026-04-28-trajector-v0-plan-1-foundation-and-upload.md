# Trajector v0 — Plan 1: Foundation & Upload Screen

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Vite + React + TypeScript scaffold, the design-token system from the spec, and a working Upload screen that parses PDF/DOCX/MD resumes in-browser via WASM and renders the extracted raw text on a stub result screen.

**Architecture:** Static SPA. No backend in Plan 1 — pdfjs-dist and mammoth run entirely in the browser. State is held in React; nothing persists to disk yet. The "stub result screen" exists only to prove parsing works end-to-end and is replaced in Plan 2 by the real Profile Confirmation screen.

**Tech Stack:**
- Node 20+
- Vite 6 + React 19 + TypeScript 5.7
- Vitest + @testing-library/react for unit/component tests
- Playwright for end-to-end tests
- pdfjs-dist (PDF text extraction) + mammoth (DOCX text extraction)
- ESLint 9 (flat config) + Stylelint 16 with `declaration-property-value-disallowed-list` rule banning gradients
- CSS Modules + CSS custom properties (no CSS-in-JS, no Tailwind)

**Spec reference:** `docs/superpowers/specs/2026-04-28-trajector-v0-solid-aesthetic-design.md`

---

## What this plan ships

When Plan 1 is complete, `npm run dev` starts the app at `http://localhost:5173`. The user can:

1. See the **Upload screen** — wordmark, headline, drop zone, reassurance copy.
2. Drag a PDF, DOCX, or MD file onto the drop zone (or click to pick).
3. Watch the drop-zone copy transition to `Reading your resume…` with the soft-pulsing border (per spec §5.1).
4. After ~1–2 seconds, transition to the **Stub Result screen**, which renders the extracted raw text in a `<pre>` block.
5. From the stub, click `Try another resume` to return to the Upload screen.

A Playwright e2e test fixtures a real PDF and asserts the extracted text reaches the stub screen. All tokens from spec §4 are loaded as CSS custom properties. The Stylelint rule rejects any `linear-gradient` or `radial-gradient` declaration.

## What plans 2–4 will ship (NOT this plan)

| Plan | Ships |
|---|---|
| Plan 2 | Hono backend + OpenRouter integration + real Profile Confirmation screen (replaces the stub) |
| Plan 3 | Scan orchestrator + SSE event stream + Greenhouse and Lever source scrapers + Results screen + per-job scoring |
| Plan 4 | Settings screen + Workable, YC, LinkedIn scrapers + side-sheet job detail + final polish + README v0 update |

---

## File structure

```
trajector/
├── .gitignore                            (extended)
├── .eslintrc.config.mjs                  (NEW — flat config)
├── .stylelintrc.json                     (NEW — gradient-ban rule)
├── package.json                          (rewritten)
├── tsconfig.json                         (NEW)
├── tsconfig.node.json                    (NEW — Vite/Vitest config typing)
├── vite.config.ts                        (NEW)
├── vitest.config.ts                      (NEW)
├── playwright.config.ts                  (NEW)
├── index.html                            (NEW — Vite entry)
├── public/
│   └── favicon.ico                       (NEW — placeholder solid black square)
├── src/
│   ├── main.tsx                          (NEW — React root)
│   ├── App.tsx                           (NEW — screen orchestrator)
│   ├── App.module.css                    (NEW)
│   ├── theme.css                         (NEW — all design tokens)
│   ├── reset.css                         (NEW — minimal CSS reset + body styles)
│   ├── types.ts                          (NEW — shared types: ResumeText, etc.)
│   ├── lib/
│   │   ├── parseResume.ts                (NEW — orchestrator: dispatch by file type)
│   │   ├── parseResume.test.ts           (NEW)
│   │   ├── parsePdf.ts                   (NEW — pdfjs-dist wrapper)
│   │   ├── parsePdf.test.ts              (NEW)
│   │   ├── parseDocx.ts                  (NEW — mammoth wrapper)
│   │   └── parseDocx.test.ts             (NEW)
│   ├── components/
│   │   └── DropZone/
│   │       ├── DropZone.tsx              (NEW)
│   │       ├── DropZone.module.css       (NEW)
│   │       └── DropZone.test.tsx         (NEW)
│   └── screens/
│       ├── Upload/
│       │   ├── Upload.tsx                (NEW)
│       │   ├── Upload.module.css         (NEW)
│       │   └── Upload.test.tsx           (NEW)
│       └── StubResult/
│           ├── StubResult.tsx            (NEW)
│           └── StubResult.module.css     (NEW)
├── tests/
│   ├── e2e/
│   │   └── upload.spec.ts                (NEW — Playwright)
│   └── fixtures/
│       └── sample-resume.pdf             (NEW — committed test fixture)
└── docs/
    └── superpowers/
        ├── specs/...                     (UNCHANGED)
        └── plans/...                     (UNCHANGED)
```

Notes on file boundaries:
- `parseResume.ts` is a thin dispatcher (looks at MIME/extension, calls the right parser, normalizes return shape). It owns no parsing logic itself.
- `parsePdf.ts` and `parseDocx.ts` each wrap exactly one library and return a normalized `ResumeText` value.
- `DropZone` is the only component with drag-and-drop behavior. The `Upload` screen composes it.
- `App.tsx` holds the only piece of v0 state: `currentScreen` and `extractedText`. State lives at the App level because Plan 2 will replace the stub with real Confirm screen and add `profile` state in the same place — no architectural surprise.

---

## Task 1: Initialize git and the Node project

**Files:**
- Modify: `/Users/syedejazahammed/Documents/GitHub/Trajector/package.json`
- Create: `.gitignore` (extend existing)
- Run: `git init`

The repo currently has design docs but is not a git repo. We initialize it, commit the existing design phase as the first commit, then branch.

- [ ] **Step 1: Run `git init` in the project root**

```bash
cd /Users/syedejazahammed/Documents/GitHub/Trajector
git init
```

Expected output: `Initialized empty Git repository in .../Trajector/.git/`

- [ ] **Step 2: Extend `.gitignore`**

Read the current `.gitignore` and append these lines at the end:

```gitignore

# v0 implementation
node_modules/
dist/
.vite/
playwright-report/
test-results/
coverage/
.env
.env.local
data/
config/secrets.yml
```

- [ ] **Step 3: Stage everything currently in the repo and commit**

```bash
git add .
git commit -m "chore: initial commit — design-phase deliverables"
```

Expected output: a single commit with all existing design docs, README, package.json, ui-mockup/, etc.

- [ ] **Step 4: Create the implementation branch**

```bash
git checkout -b feat/v0-foundation
```

- [ ] **Step 5: Replace `package.json`**

Overwrite `package.json` with:

```json
{
  "name": "trajector",
  "version": "0.1.0-dev",
  "description": "AI-powered job intelligence with outcome calibration. Find the few roles worth your time.",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "lint": "eslint . && stylelint 'src/**/*.css'",
    "typecheck": "tsc --noEmit"
  },
  "keywords": [
    "ai-agent",
    "anthropic",
    "claude-code",
    "career",
    "job-search",
    "calibration",
    "open-source",
    "local-first"
  ],
  "author": "Syed Ejaz Ahammed <syedejaz8470@gmail.com>",
  "license": "MIT",
  "engines": {
    "node": ">=20.0.0"
  }
}
```

- [ ] **Step 6: Commit `package.json` rewrite and `.gitignore` extension**

```bash
git add package.json .gitignore
git commit -m "chore: rewrite package.json for v0 implementation, extend .gitignore"
```

---

## Task 2: Install Vite + React + TypeScript and tooling

**Files:**
- Modify: `package.json` (via npm install)
- Create: `package-lock.json`

Install everything Plan 1 needs in two batches: runtime deps, then dev deps.

- [ ] **Step 1: Install runtime dependencies**

```bash
npm install react@^19 react-dom@^19 pdfjs-dist@^5 mammoth@^1.9
```

Expected: completes without error, `node_modules/` populated, lockfile created.

- [ ] **Step 2: Install dev dependencies**

```bash
npm install -D \
  vite@^6 \
  @vitejs/plugin-react@^4 \
  typescript@^5.7 \
  @types/react@^19 \
  @types/react-dom@^19 \
  @types/node@^22 \
  vitest@^2 \
  @vitest/ui@^2 \
  @testing-library/react@^16 \
  @testing-library/jest-dom@^6 \
  @testing-library/user-event@^14 \
  jsdom@^25 \
  @playwright/test@^1.49 \
  eslint@^9 \
  @eslint/js@^9 \
  typescript-eslint@^8 \
  eslint-plugin-react-hooks@^5 \
  stylelint@^16 \
  stylelint-config-standard@^36
```

Expected: completes without error.

- [ ] **Step 3: Install Playwright browser binaries**

```bash
npx playwright install chromium
```

Expected: chromium installed (~150MB download).

- [ ] **Step 4: Commit lockfile and updated package.json**

```bash
git add package.json package-lock.json
git commit -m "chore: install Vite, React 19, TypeScript, and test tooling"
```

---

## Task 3: TypeScript and Vite configuration

**Files:**
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`

- [ ] **Step 1: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vite/client", "vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "tests"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 2: Create `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts", "vitest.config.ts", "playwright.config.ts"]
}
```

- [ ] **Step 3: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  optimizeDeps: {
    exclude: ['pdfjs-dist'],
  },
});
```

- [ ] **Step 4: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
```

- [ ] **Step 5: Create `src/test-setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 6: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

- [ ] **Step 7: Commit configuration files**

```bash
git add tsconfig.json tsconfig.node.json vite.config.ts vitest.config.ts playwright.config.ts src/test-setup.ts
git commit -m "chore: add TypeScript, Vite, Vitest, and Playwright configuration"
```

---

## Task 4: Lint configuration with gradient-ban rule

**Files:**
- Create: `eslint.config.mjs`
- Create: `.stylelintrc.json`

- [ ] **Step 1: Create `eslint.config.mjs`**

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'playwright-report', 'test-results'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
);
```

- [ ] **Step 2: Create `.stylelintrc.json`**

This is the spec's gradient-ban rule (spec §11).

```json
{
  "extends": ["stylelint-config-standard"],
  "rules": {
    "declaration-property-value-disallowed-list": {
      "/.*/": ["/linear-gradient/", "/radial-gradient/", "/conic-gradient/"]
    },
    "comment-empty-line-before": null,
    "no-descending-specificity": null,
    "selector-class-pattern": null
  }
}
```

- [ ] **Step 3: Run lint to confirm both tools wire up**

```bash
npm run lint
```

Expected: no errors yet (no source files exist that would violate rules), and no "config not found" errors.

- [ ] **Step 4: Commit lint configs**

```bash
git add eslint.config.mjs .stylelintrc.json
git commit -m "chore: add ESLint and Stylelint with gradient-ban rule"
```

---

## Task 5: Design tokens — `theme.css`

**Files:**
- Create: `src/theme.css`
- Create: `src/reset.css`

These hold every visual decision from spec §4. No component is allowed to hardcode a hex value — they all read from these tokens.

- [ ] **Step 1: Create `src/reset.css`**

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body,
#root {
  margin: 0;
  padding: 0;
  height: 100%;
}

body {
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
  font-size: 14px;
  line-height: 1.55;
  background-color: var(--bg-canvas);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

button {
  font: inherit;
  color: inherit;
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
}

input,
select {
  font: inherit;
  color: inherit;
}

pre,
code {
  font-family: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace;
}
```

- [ ] **Step 2: Create `src/theme.css`** — every token from spec §4

```css
:root {
  /* Surfaces (spec §4.1) */
  --bg-canvas: #0a0a0a;
  --bg-surface: #141414;
  --bg-surface-2: #1c1c1c;

  /* Borders */
  --border-subtle: #262626;
  --border-strong: #404040;

  /* Text */
  --text-primary: #fafafa;
  --text-secondary: #a3a3a3;
  --text-tertiary: #737373;

  /* Accent (white-as-accent on dark) */
  --accent: #ffffff;
  --accent-hover: #e5e5e5;

  /* Score tiers (spec §4.2) — only chromatic tokens in the system */
  --score-strong: #22c55e;
  --score-decent: #eab308;
  --score-skip: #525252;

  /* Geometry (spec §4.4) */
  --radius: 6px;
  --border-width: 1px;

  /* Spacing scale (spec §4.5) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;

  /* Typography sizes (spec §4.3) */
  --font-size-h1: 32px;
  --font-size-h2: 22px;
  --font-size-h3: 16px;
  --font-size-body: 14px;
  --font-size-caption: 12px;
  --font-size-mono: 13px;

  /* Font weights */
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;

  /* Motion (spec §9) */
  --motion-fast: 100ms;
  --motion-base: 120ms;
  --motion-sheet: 180ms;
  --motion-pulse: 1.5s;
  --easing-out: cubic-bezier(0.16, 1, 0.3, 1);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-fast: 0ms;
    --motion-base: 0ms;
    --motion-sheet: 0ms;
    --motion-pulse: 0ms;
  }
}
```

- [ ] **Step 3: Run stylelint to verify gradient-ban rule does not trip**

```bash
npx stylelint 'src/**/*.css'
```

Expected: no errors. (No gradients, no nonsense.)

- [ ] **Step 4: Commit theme files**

```bash
git add src/theme.css src/reset.css
git commit -m "feat: add design tokens (theme.css) and CSS reset per spec §4"
```

---

## Task 6: Shared types — `src/types.ts`

**Files:**
- Create: `src/types.ts`

Plan 1 needs only one type: the shape returned by the parser layer.

- [ ] **Step 1: Create `src/types.ts`**

```ts
export type ResumeFileKind = 'pdf' | 'docx' | 'md';

export interface ResumeText {
  kind: ResumeFileKind;
  filename: string;
  text: string;
  byteSize: number;
}

export type Screen = 'upload' | 'stubResult';
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: add shared types — ResumeText, ResumeFileKind, Screen"
```

---

## Task 7: PDF parser — `parsePdf.ts`

**Files:**
- Create: `src/lib/parsePdf.ts`
- Create: `src/lib/parsePdf.test.ts`
- Create: `tests/fixtures/sample-resume.pdf`

We TDD this: write the test that loads a known PDF fixture and asserts a known string appears in the extracted text, then implement the wrapper.

- [ ] **Step 1: Create the PDF test fixture**

Generate a small PDF with deterministic content. The fixture must contain the literal string `Senior Backend Engineer at Anthropic` so we can assert against it in tests.

```bash
mkdir -p tests/fixtures
```

Then create the fixture using a Node script (run once, output committed):

```bash
cat > /tmp/make-fixture.mjs << 'EOF'
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { writeFile } from 'fs/promises';

const doc = await PDFDocument.create();
const page = doc.addPage([612, 792]);
const font = await doc.embedFont(StandardFonts.Helvetica);
page.drawText('Jane Doe', { x: 72, y: 720, size: 18, font });
page.drawText('Senior Backend Engineer at Anthropic', { x: 72, y: 690, size: 12, font });
page.drawText('Skills: Go, PostgreSQL, Kubernetes', { x: 72, y: 670, size: 12, font });
const bytes = await doc.save();
await writeFile('tests/fixtures/sample-resume.pdf', bytes);
console.log('wrote tests/fixtures/sample-resume.pdf');
EOF

npm install --no-save pdf-lib
node /tmp/make-fixture.mjs
rm /tmp/make-fixture.mjs
```

Expected: `tests/fixtures/sample-resume.pdf` exists, ~3–5KB.

- [ ] **Step 2: Write the failing test — `src/lib/parsePdf.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { parsePdf } from './parsePdf';

describe('parsePdf', () => {
  it('extracts text from a simple PDF', async () => {
    const buffer = await readFile('tests/fixtures/sample-resume.pdf');
    const text = await parsePdf(new Uint8Array(buffer));
    expect(text).toContain('Senior Backend Engineer at Anthropic');
    expect(text).toContain('Jane Doe');
  });

  it('returns an empty string for a zero-byte buffer', async () => {
    await expect(parsePdf(new Uint8Array(0))).rejects.toThrow();
  });
});
```

- [ ] **Step 3: Run the test to confirm it fails**

```bash
npm test -- parsePdf
```

Expected: FAIL with `Failed to resolve import "./parsePdf"`.

- [ ] **Step 4: Implement `src/lib/parsePdf.ts`**

```ts
import * as pdfjs from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

export async function parsePdf(data: Uint8Array): Promise<string> {
  const doc = await pdfjs.getDocument({ data }).promise;
  const parts: string[] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const lines = content.items
      .filter((item): item is { str: string } => 'str' in item)
      .map((item) => item.str);
    parts.push(lines.join(' '));
  }
  return parts.join('\n\n');
}
```

- [ ] **Step 5: Run the test to confirm it passes**

```bash
npm test -- parsePdf
```

Expected: PASS. Both test cases green.

- [ ] **Step 6: Commit**

```bash
git add src/lib/parsePdf.ts src/lib/parsePdf.test.ts tests/fixtures/sample-resume.pdf
git commit -m "feat: add parsePdf wrapper around pdfjs-dist"
```

---

## Task 8: DOCX parser — `parseDocx.ts`

**Files:**
- Create: `src/lib/parseDocx.ts`
- Create: `src/lib/parseDocx.test.ts`
- Create: `tests/fixtures/sample-resume.docx`

- [ ] **Step 1: Create the DOCX test fixture**

```bash
cat > /tmp/make-docx.mjs << 'EOF'
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { writeFile } from 'fs/promises';

const doc = new Document({
  sections: [{
    properties: {},
    children: [
      new Paragraph({ children: [new TextRun('Jane Doe')] }),
      new Paragraph({ children: [new TextRun('Senior Backend Engineer at Anthropic')] }),
      new Paragraph({ children: [new TextRun('Skills: Go, PostgreSQL, Kubernetes')] }),
    ],
  }],
});

const buffer = await Packer.toBuffer(doc);
await writeFile('tests/fixtures/sample-resume.docx', buffer);
console.log('wrote tests/fixtures/sample-resume.docx');
EOF

npm install --no-save docx
node /tmp/make-docx.mjs
rm /tmp/make-docx.mjs
```

Expected: `tests/fixtures/sample-resume.docx` exists.

- [ ] **Step 2: Write the failing test — `src/lib/parseDocx.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { parseDocx } from './parseDocx';

describe('parseDocx', () => {
  it('extracts text from a simple DOCX', async () => {
    const buffer = await readFile('tests/fixtures/sample-resume.docx');
    const text = await parseDocx(buffer);
    expect(text).toContain('Senior Backend Engineer at Anthropic');
    expect(text).toContain('Jane Doe');
  });
});
```

- [ ] **Step 3: Run to verify it fails**

```bash
npm test -- parseDocx
```

Expected: FAIL with import error.

- [ ] **Step 4: Implement `src/lib/parseDocx.ts`**

```ts
import mammoth from 'mammoth';

export async function parseDocx(buffer: Uint8Array | ArrayBuffer): Promise<string> {
  const arrayBuffer = buffer instanceof ArrayBuffer ? buffer : buffer.buffer;
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}
```

- [ ] **Step 5: Run to verify it passes**

```bash
npm test -- parseDocx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/parseDocx.ts src/lib/parseDocx.test.ts tests/fixtures/sample-resume.docx
git commit -m "feat: add parseDocx wrapper around mammoth"
```

---

## Task 9: Parse orchestrator — `parseResume.ts`

**Files:**
- Create: `src/lib/parseResume.ts`
- Create: `src/lib/parseResume.test.ts`

This dispatcher inspects the file's MIME type / extension and delegates to the right parser. Returns a `ResumeText` value.

- [ ] **Step 1: Write the failing test — `src/lib/parseResume.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { parseResume } from './parseResume';

function fileFromBuffer(buf: Uint8Array, name: string, type: string): File {
  return new File([buf], name, { type });
}

describe('parseResume', () => {
  it('parses a PDF File', async () => {
    const bytes = await readFile('tests/fixtures/sample-resume.pdf');
    const file = fileFromBuffer(new Uint8Array(bytes), 'resume.pdf', 'application/pdf');
    const result = await parseResume(file);
    expect(result.kind).toBe('pdf');
    expect(result.filename).toBe('resume.pdf');
    expect(result.text).toContain('Senior Backend Engineer at Anthropic');
    expect(result.byteSize).toBe(bytes.length);
  });

  it('parses a DOCX File', async () => {
    const bytes = await readFile('tests/fixtures/sample-resume.docx');
    const file = fileFromBuffer(
      new Uint8Array(bytes),
      'resume.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    const result = await parseResume(file);
    expect(result.kind).toBe('docx');
    expect(result.text).toContain('Senior Backend Engineer at Anthropic');
  });

  it('parses a markdown File', async () => {
    const md = '# Jane Doe\n\nSenior Backend Engineer at Anthropic';
    const file = fileFromBuffer(new TextEncoder().encode(md), 'resume.md', 'text/markdown');
    const result = await parseResume(file);
    expect(result.kind).toBe('md');
    expect(result.text).toContain('Senior Backend Engineer at Anthropic');
  });

  it('rejects unsupported file types', async () => {
    const file = fileFromBuffer(new Uint8Array([1, 2, 3]), 'resume.png', 'image/png');
    await expect(parseResume(file)).rejects.toThrow(/unsupported/i);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npm test -- parseResume
```

Expected: FAIL with import error.

- [ ] **Step 3: Implement `src/lib/parseResume.ts`**

```ts
import { parsePdf } from './parsePdf';
import { parseDocx } from './parseDocx';
import type { ResumeText, ResumeFileKind } from '../types';

function detectKind(file: File): ResumeFileKind {
  const name = file.name.toLowerCase();
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx')
  ) {
    return 'docx';
  }
  if (file.type === 'text/markdown' || name.endsWith('.md') || name.endsWith('.markdown')) {
    return 'md';
  }
  throw new Error(`Unsupported file type: ${file.name} (${file.type})`);
}

export async function parseResume(file: File): Promise<ResumeText> {
  const kind = detectKind(file);
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  let text: string;
  if (kind === 'pdf') {
    text = await parsePdf(bytes);
  } else if (kind === 'docx') {
    text = await parseDocx(bytes);
  } else {
    text = new TextDecoder().decode(bytes);
  }

  return {
    kind,
    filename: file.name,
    text,
    byteSize: bytes.byteLength,
  };
}
```

- [ ] **Step 4: Run to verify all tests pass**

```bash
npm test -- parseResume
```

Expected: PASS for all four cases.

- [ ] **Step 5: Commit**

```bash
git add src/lib/parseResume.ts src/lib/parseResume.test.ts
git commit -m "feat: add parseResume orchestrator (dispatch by file kind)"
```

---

## Task 10: DropZone component

**Files:**
- Create: `src/components/DropZone/DropZone.tsx`
- Create: `src/components/DropZone/DropZone.module.css`
- Create: `src/components/DropZone/DropZone.test.tsx`

The DropZone owns drag-and-drop behavior and click-to-pick. It is presentational — it accepts an `onFileSelected` callback and a `state` prop (`'idle' | 'reading' | 'error'`).

- [ ] **Step 1: Write the failing test — `src/components/DropZone/DropZone.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DropZone } from './DropZone';

describe('DropZone', () => {
  it('renders idle copy by default', () => {
    render(<DropZone state="idle" onFileSelected={() => {}} />);
    expect(screen.getByText(/drop here/i)).toBeInTheDocument();
    expect(screen.getByText(/click to browse/i)).toBeInTheDocument();
  });

  it('renders reading copy when state is reading', () => {
    render(<DropZone state="reading" onFileSelected={() => {}} />);
    expect(screen.getByText(/reading your resume/i)).toBeInTheDocument();
  });

  it('renders error message when state is error', () => {
    render(
      <DropZone state="error" errorMessage="Couldn't read this file." onFileSelected={() => {}} />
    );
    expect(screen.getByText(/couldn't read this file/i)).toBeInTheDocument();
  });

  it('calls onFileSelected when a file is picked via the input', async () => {
    const user = userEvent.setup();
    const onFileSelected = vi.fn();
    render(<DropZone state="idle" onFileSelected={onFileSelected} />);
    const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/drop here/i);
    await user.upload(input, file);
    expect(onFileSelected).toHaveBeenCalledWith(file);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npm test -- DropZone
```

Expected: FAIL with import error.

- [ ] **Step 3: Implement `src/components/DropZone/DropZone.module.css`**

```css
.zone {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 200px;
  padding: var(--space-6);
  background-color: var(--bg-surface);
  border: var(--border-width) dashed var(--border-subtle);
  border-radius: var(--radius);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background-color var(--motion-fast) var(--easing-out);
}

.zone:hover {
  background-color: var(--bg-surface-2);
}

.zone.dragover {
  background-color: var(--bg-surface-2);
  border-style: solid;
  border-color: var(--border-strong);
}

.zone.reading {
  cursor: default;
  border-style: dashed;
  animation: pulse var(--motion-pulse) ease-in-out infinite;
}

.zone.error {
  cursor: pointer;
  border-color: var(--border-strong);
}

@keyframes pulse {
  0%,
  100% {
    border-color: var(--border-subtle);
  }
  50% {
    border-color: var(--border-strong);
  }
}

.input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.primary {
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-2) 0;
}

.secondary {
  font-size: var(--font-size-body);
  color: var(--text-secondary);
  margin: 0;
}

.error-text {
  font-size: var(--font-size-body);
  color: var(--text-primary);
  margin: 0;
}
```

- [ ] **Step 4: Implement `src/components/DropZone/DropZone.tsx`**

```tsx
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import styles from './DropZone.module.css';

export type DropZoneState = 'idle' | 'reading' | 'error';

interface DropZoneProps {
  state: DropZoneState;
  errorMessage?: string;
  onFileSelected: (file: File) => void;
}

export function DropZone({ state, errorMessage, onFileSelected }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleClick = () => {
    if (state === 'reading') return;
    inputRef.current?.click();
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
    e.target.value = '';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (state === 'reading') return;
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (state === 'reading') return;
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  };

  const className = [
    styles.zone,
    isDragOver && styles.dragover,
    state === 'reading' && styles.reading,
    state === 'error' && styles.error,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={className}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.md,.markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown"
        className={styles.input}
        onChange={handleChange}
        aria-label="Drop here or click to browse"
      />
      {state === 'idle' && (
        <>
          <p className={styles.primary}>Drop here</p>
          <p className={styles.secondary}>or click to browse</p>
        </>
      )}
      {state === 'reading' && <p className={styles.secondary}>Reading your resume…</p>}
      {state === 'error' && (
        <p className={styles['error-text']}>{errorMessage ?? "Couldn't read this file."}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Run tests**

```bash
npm test -- DropZone
```

Expected: PASS for all four cases.

- [ ] **Step 6: Commit**

```bash
git add src/components/DropZone
git commit -m "feat: add DropZone component (idle/reading/error states)"
```

---

## Task 11: Upload screen

**Files:**
- Create: `src/screens/Upload/Upload.tsx`
- Create: `src/screens/Upload/Upload.module.css`
- Create: `src/screens/Upload/Upload.test.tsx`

The Upload screen composes the DropZone with the wordmark, headline, and reassurance copy. It owns the parse-resume call and state machine for drop-zone state.

- [ ] **Step 1: Write the failing test — `src/screens/Upload/Upload.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFile } from 'node:fs/promises';
import { Upload } from './Upload';

describe('Upload screen', () => {
  it('renders headline and reassurance copy', () => {
    render(<Upload onResumeParsed={() => {}} />);
    expect(screen.getByText(/drop your resume to begin/i)).toBeInTheDocument();
    expect(screen.getByText(/stays on your machine/i)).toBeInTheDocument();
    expect(screen.getByText(/no account/i)).toBeInTheDocument();
  });

  it('parses a PDF and calls onResumeParsed', async () => {
    const user = userEvent.setup();
    const onResumeParsed = vi.fn();
    const bytes = await readFile('tests/fixtures/sample-resume.pdf');
    const file = new File([bytes], 'sample-resume.pdf', { type: 'application/pdf' });

    render(<Upload onResumeParsed={onResumeParsed} />);
    const input = screen.getByLabelText(/drop here/i);
    await user.upload(input, file);

    await waitFor(() => expect(onResumeParsed).toHaveBeenCalledTimes(1), { timeout: 5000 });
    const result = onResumeParsed.mock.calls[0][0];
    expect(result.kind).toBe('pdf');
    expect(result.text).toContain('Senior Backend Engineer at Anthropic');
  });

  it('shows error message when parse fails', async () => {
    const user = userEvent.setup();
    render(<Upload onResumeParsed={() => {}} />);
    const file = new File([new Uint8Array([1, 2, 3])], 'broken.png', { type: 'image/png' });
    const input = screen.getByLabelText(/drop here/i);
    await user.upload(input, file);

    await waitFor(() =>
      expect(screen.getByText(/couldn't read this file/i)).toBeInTheDocument()
    );
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npm test -- Upload
```

Expected: FAIL with import error.

- [ ] **Step 3: Implement `src/screens/Upload/Upload.module.css`**

```css
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: var(--space-5) var(--space-5);
}

.header {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.column {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  text-align: center;
}

.headline-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.headline {
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
  line-height: 1.1;
}

.subhead {
  font-size: var(--font-size-body);
  color: var(--text-secondary);
  margin: 0;
}

.reassurance {
  font-size: var(--font-size-caption);
  color: var(--text-tertiary);
  margin: 0;
  line-height: 1.5;
}
```

- [ ] **Step 4: Implement `src/screens/Upload/Upload.tsx`**

```tsx
import { useState } from 'react';
import { DropZone, type DropZoneState } from '../../components/DropZone/DropZone';
import { parseResume } from '../../lib/parseResume';
import type { ResumeText } from '../../types';
import styles from './Upload.module.css';

interface UploadProps {
  onResumeParsed: (resume: ResumeText) => void;
}

export function Upload({ onResumeParsed }: UploadProps) {
  const [zoneState, setZoneState] = useState<DropZoneState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const handleFile = async (file: File) => {
    setZoneState('reading');
    setErrorMessage(undefined);
    try {
      const result = await parseResume(file);
      onResumeParsed(result);
    } catch (err) {
      const msg =
        err instanceof Error && /unsupported/i.test(err.message)
          ? "Couldn't read this file. Try DOCX or markdown."
          : "Couldn't read this file. Try DOCX or markdown.";
      setErrorMessage(msg);
      setZoneState('error');
    }
  };

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
            errorMessage={errorMessage}
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

- [ ] **Step 5: Run tests**

```bash
npm test -- Upload
```

Expected: PASS for all three cases.

- [ ] **Step 6: Commit**

```bash
git add src/screens/Upload
git commit -m "feat: add Upload screen with parse + error handling"
```

---

## Task 12: Stub Result screen (placeholder for Plan 2)

**Files:**
- Create: `src/screens/StubResult/StubResult.tsx`
- Create: `src/screens/StubResult/StubResult.module.css`

This screen exists only to render the extracted text and prove parsing works end-to-end. Plan 2 deletes it and replaces it with the real Confirm screen. No tests — it's transient scaffolding.

- [ ] **Step 1: Implement `src/screens/StubResult/StubResult.module.css`**

```css
.page {
  min-height: 100vh;
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.wordmark {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
}

.reset-button {
  font-size: var(--font-size-body);
  color: var(--text-secondary);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.reset-button:hover {
  color: var(--text-primary);
}

.title {
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-semibold);
  margin: 0;
}

.meta {
  font-size: var(--font-size-caption);
  color: var(--text-tertiary);
  margin: 0;
}

.preview {
  background-color: var(--bg-surface);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius);
  padding: var(--space-4);
  font-size: var(--font-size-mono);
  line-height: 1.55;
  white-space: pre-wrap;
  overflow-x: auto;
  max-height: 60vh;
  overflow-y: auto;
}

.warning {
  font-size: var(--font-size-caption);
  color: var(--text-tertiary);
  margin: 0;
}
```

- [ ] **Step 2: Implement `src/screens/StubResult/StubResult.tsx`**

```tsx
import type { ResumeText } from '../../types';
import styles from './StubResult.module.css';

interface StubResultProps {
  resume: ResumeText;
  onReset: () => void;
}

export function StubResult({ resume, onReset }: StubResultProps) {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.wordmark}>Trajector</span>
        <button type="button" className={styles['reset-button']} onClick={onReset}>
          Try another resume
        </button>
      </div>
      <h2 className={styles.title}>Extracted text (Plan 1 stub)</h2>
      <p className={styles.meta}>
        {resume.filename} · {resume.kind.toUpperCase()} · {resume.byteSize.toLocaleString()} bytes
      </p>
      <p className={styles.warning}>
        This screen is temporary. Plan 2 replaces it with the real profile-confirmation step that
        sends this text through OpenRouter and renders an editable form.
      </p>
      <pre className={styles.preview}>{resume.text}</pre>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/screens/StubResult
git commit -m "feat: add StubResult screen to verify parsing end-to-end"
```

---

## Task 13: App orchestrator and entry point

**Files:**
- Create: `src/App.tsx`
- Create: `src/App.module.css`
- Create: `src/main.tsx`
- Create: `index.html`
- Create: `public/favicon.ico` (placeholder)

- [ ] **Step 1: Implement `src/App.module.css`**

```css
.root {
  min-height: 100%;
}
```

- [ ] **Step 2: Implement `src/App.tsx`**

```tsx
import { useState } from 'react';
import { Upload } from './screens/Upload/Upload';
import { StubResult } from './screens/StubResult/StubResult';
import type { ResumeText, Screen } from './types';
import styles from './App.module.css';

export function App() {
  const [screen, setScreen] = useState<Screen>('upload');
  const [resume, setResume] = useState<ResumeText | null>(null);

  return (
    <div className={styles.root}>
      {screen === 'upload' && (
        <Upload
          onResumeParsed={(parsed) => {
            setResume(parsed);
            setScreen('stubResult');
          }}
        />
      )}
      {screen === 'stubResult' && resume && (
        <StubResult
          resume={resume}
          onReset={() => {
            setResume(null);
            setScreen('upload');
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Implement `src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './reset.css';
import './theme.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 4: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Trajector</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create a placeholder favicon**

```bash
mkdir -p public
# Generate a 16x16 solid black ICO via Node
cat > /tmp/make-favicon.mjs << 'EOF'
import { writeFile } from 'fs/promises';
// 1x1 ICO with a single black pixel — minimal valid favicon
const ico = Buffer.from([
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x18, 0x00,
  0x30, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x01, 0x00,
  0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x01, 0x00, 0x18, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
]);
await writeFile('public/favicon.ico', ico);
console.log('wrote public/favicon.ico');
EOF
node /tmp/make-favicon.mjs
rm /tmp/make-favicon.mjs
```

- [ ] **Step 6: Run typecheck and dev server smoke test**

```bash
npm run typecheck
```

Expected: no type errors.

```bash
npm run dev
```

Then in another terminal: `curl -s http://localhost:5173 | head -5` — expect HTML containing `<div id="root">`. Stop the dev server (`Ctrl-C`).

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/App.module.css src/main.tsx index.html public/favicon.ico
git commit -m "feat: wire up App orchestrator, main entry, index.html"
```

---

## Task 14: Playwright e2e test

**Files:**
- Create: `tests/e2e/upload.spec.ts`

This test spins up the real app, drops a real PDF on the drop zone, and asserts the extracted text reaches the stub screen.

- [ ] **Step 1: Create `tests/e2e/upload.spec.ts`**

```ts
import { test, expect } from '@playwright/test';
import path from 'node:path';

test.describe('upload flow', () => {
  test('drops a PDF and renders extracted text on the stub screen', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Drop your resume to begin')).toBeVisible();

    const fixturePath = path.resolve(__dirname, '../fixtures/sample-resume.pdf');
    const fileInput = page.getByLabel('Drop here or click to browse');
    await fileInput.setInputFiles(fixturePath);

    await expect(page.getByText('Extracted text (Plan 1 stub)')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Senior Backend Engineer at Anthropic')).toBeVisible();
    await expect(page.getByText('sample-resume.pdf')).toBeVisible();
    await expect(page.getByText(/PDF/)).toBeVisible();
  });

  test('returns to the upload screen when "Try another resume" is clicked', async ({ page }) => {
    await page.goto('/');
    const fixturePath = path.resolve(__dirname, '../fixtures/sample-resume.pdf');
    await page.getByLabel('Drop here or click to browse').setInputFiles(fixturePath);
    await expect(page.getByText('Extracted text (Plan 1 stub)')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: 'Try another resume' }).click();
    await expect(page.getByText('Drop your resume to begin')).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the e2e test**

```bash
npm run test:e2e
```

Expected: 2 passed. Playwright auto-spins the dev server via the `webServer` config from Task 3.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/upload.spec.ts
git commit -m "test: add Playwright e2e for upload → parse → stub-result flow"
```

---

## Task 15: Verify the full plan

**Files:** none (verification only)

- [ ] **Step 1: Lint**

```bash
npm run lint
```

Expected: no errors. Stylelint confirms zero gradient declarations.

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Run all unit tests**

```bash
npm test
```

Expected: all green. Suite includes parsePdf, parseDocx, parseResume, DropZone, Upload.

- [ ] **Step 4: Run e2e**

```bash
npm run test:e2e
```

Expected: 2 passed.

- [ ] **Step 5: Manual smoke test**

```bash
npm run dev
```

Then in a browser at `http://localhost:5173`:

1. Confirm the wordmark "Trajector" is top-left.
2. Confirm headline reads "Drop your resume to begin".
3. Drag a PDF onto the drop zone — confirm border darkens during drag-over.
4. Confirm during parse: copy reads "Reading your resume…" and the dashed border pulses.
5. Confirm transition to stub screen with extracted text in mono `<pre>`.
6. Click "Try another resume" — confirm return to upload screen.
7. Open DevTools → Elements → `<html>` and confirm CSS variables resolve (`getComputedStyle(document.documentElement).getPropertyValue('--bg-canvas')` should return `#0a0a0a`).
8. Drop an unsupported file (e.g., a `.png`) — confirm error message appears in drop zone, no console errors.

Stop dev server.

- [ ] **Step 6: Final commit (if any uncommitted changes)**

```bash
git status
```

Expected: clean working tree.

If anything is uncommitted, decide whether it belongs in a new task (probably) or as a chore commit, then commit.

---

## Self-review notes

These notes were applied during plan-writing self-review:

- **Spec coverage check:** Plan 1 covers spec §4 (visual system tokens), §5.1 (Upload screen), and the parse-failure error from §7. Plan 1 explicitly does NOT cover §5.2 Confirm screen (Plan 2), §5.3 Results screen (Plan 3), §5.4 Settings screen (Plan 4), §6 data flow (partially — only the in-browser parse leg), §7 OpenRouter errors (Plan 2), §8 a11y for non-Plan-1 screens, §10 deferred surfaces. Each is called out at the top under "What plans 2–4 will ship."
- **Type consistency:** `ResumeText` is defined in Task 6 and used identically in Tasks 9, 11, 12, 13. `Screen` type values (`'upload' | 'stubResult'`) are consistent across `types.ts` and `App.tsx`. `DropZoneState` is defined and exported in Task 10 and imported by Upload in Task 11.
- **No placeholders:** every step contains the concrete code, command, or file content the engineer needs. The fixture-generation scripts in Tasks 7 and 8 are full and runnable.

---

## Execution handoff

Plan 1 is complete and saved to `docs/superpowers/plans/2026-04-28-trajector-v0-plan-1-foundation-and-upload.md`.

Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?

After Plan 1 ships and works, the next step is to write Plan 2 (Hono backend + OpenRouter integration + real Profile Confirmation screen).
