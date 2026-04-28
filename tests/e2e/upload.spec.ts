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

// One ATS job per ATS so the aggregator + filter has something to chew on
const GREENHOUSE_RESPONSE = {
  jobs: [
    {
      id: 1001,
      title: 'Senior Backend Engineer',
      absolute_url: 'https://boards.greenhouse.io/stripe/jobs/1001',
      location: { name: 'Remote (US)' },
      departments: [{ name: 'Engineering' }],
      content: '<p>Build payment systems at scale with Go and Postgres.</p>',
      updated_at: '2024-01-15T00:00:00Z',
    },
  ],
};

const ASHBY_RESPONSE = {
  jobs: [
    {
      id: 'ashby-uuid-1',
      title: 'Staff Backend Engineer',
      department: 'Engineering',
      location: 'Remote',
      applyUrl: 'https://jobs.ashbyhq.com/linear/ashby-uuid-1/application',
      jobUrl: 'https://jobs.ashbyhq.com/linear/ashby-uuid-1',
      descriptionPlain: 'Build the future of issue tracking.',
      publishedAt: '2024-01-10T00:00:00Z',
    },
  ],
};

const LEVER_RESPONSE = [
  {
    id: 'lever-uuid-1',
    text: 'Senior Software Engineer',
    categories: { department: 'Engineering', location: 'Remote' },
    descriptionPlain: 'Build streaming platform at scale.',
    createdAt: 1700000000000,
    hostedUrl: 'https://jobs.lever.co/spotify/lever-uuid-1',
    applyUrl: 'https://jobs.lever.co/spotify/lever-uuid-1/apply',
  },
];

const SCORING_RESPONSE = {
  jobs: [
    { id: 'greenhouse:stripe:1001', score: 92, reason: 'Stack and seniority match.' },
    { id: 'ashby:linear:ashby-uuid-1', score: 78, reason: 'Decent stack overlap.' },
    { id: 'lever:spotify:lever-uuid-1', score: 65, reason: 'Different stack but seniority fits.' },
  ],
};

async function setupRoutes({ page }: { page: import('@playwright/test').Page }) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'trajector_settings',
      JSON.stringify({
        openRouterKey: 'sk-or-v1-test-key',
        model: 'anthropic/claude-sonnet-4-6',
        sources: { greenhouse: true, ashby: true, lever: true },
      }),
    );
  });

  // OpenRouter: distinguish profile-extraction from scoring by the user message shape.
  // Profile extraction: user message is raw resume text. Scoring: user message is a JSON object {profile, jobs}.
  await page.route('**/openrouter.ai/api/v1/chat/completions', async (route) => {
    const req = route.request();
    const body = req.postDataJSON() as { messages: Array<{ role: string; content: string }> };
    const lastUser = body.messages[body.messages.length - 1];
    const isJsonRequest = lastUser.content.trim().startsWith('{');
    const responseContent = isJsonRequest ? JSON.stringify(SCORING_RESPONSE) : JSON.stringify(MOCK_PROFILE);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ choices: [{ message: { content: responseContent } }] }),
    });
  });

  // Greenhouse: any company, return a single canned job
  await page.route('**/boards-api.greenhouse.io/v1/boards/*/jobs*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(GREENHOUSE_RESPONSE),
    });
  });

  // Ashby: any company, return a single canned job
  await page.route('**/api.ashbyhq.com/posting-api/job-board/*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(ASHBY_RESPONSE),
    });
  });

  // Lever: any company, return a single canned job
  await page.route('**/api.lever.co/v0/postings/*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(LEVER_RESPONSE),
    });
  });
}

test.describe('upload flow', () => {
  test.beforeEach(setupRoutes);

  test('lands on Landing, drops resume, reaches Confirm', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /find the few jobs/i })).toBeVisible();

    const fixturePath = path.resolve(__dirname, '../fixtures/sample-resume.pdf');
    await page.getByLabel('Drop here or click to browse').setInputFiles(fixturePath);

    await expect(page.getByText('Confirm your profile')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByLabel('Target role')).toHaveValue('Senior Backend Engineer');
  });

  test('confirms the profile and reaches Results with real-shape ScoredJobs', async ({ page }) => {
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

    // Even though no key, we still need to mock the ATS endpoints in case anything probes them.
    // The redirect happens before any scan kicks off, so these are belt-and-suspenders.
    await page.route('**/openrouter.ai/api/v1/chat/completions', async (r) => {
      await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ choices: [{ message: { content: '{}' } }] }) });
    });

    await page.goto('/');
    const fixturePath = path.resolve(__dirname, '../fixtures/sample-resume.pdf');
    await page.getByLabel('Drop here or click to browse').setInputFiles(fixturePath);

    await expect(page.getByText('Settings')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel('OpenRouter API key')).toBeVisible();
  });
});
