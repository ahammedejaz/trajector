import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MOCK_PROFILE = {
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

const GREENHOUSE_RESPONSE = {
  jobs: [
    {
      id: 'g1',
      title: 'Senior Backend Engineer',
      absolute_url: 'https://boards.greenhouse.io/stripe/jobs/g1',
      location: { name: 'Remote (US)' },
      departments: [{ name: 'Engineering' }],
      content: '<p>Strong-match description.</p>',
      updated_at: '2024-01-15T00:00:00Z',
    },
    {
      id: 'g2',
      title: 'Backend Engineer',
      absolute_url: 'https://boards.greenhouse.io/stripe/jobs/g2',
      location: { name: 'Remote' },
      departments: [{ name: 'Engineering' }],
      content: '<p>Decent-fit description.</p>',
      updated_at: '2024-01-15T00:00:00Z',
    },
  ],
};

const ASHBY_RESPONSE = { jobs: [] };
const LEVER_RESPONSE: unknown[] = [];

const SCORING_RESPONSE = {
  jobs: [
    { id: 'greenhouse:stripe:g1', score: 92, reason: 'Strong match.' },
    { id: 'greenhouse:stripe:g2', score: 65, reason: 'Decent.' },
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

  await page.route('**/boards-api.greenhouse.io/v1/boards/*/jobs*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(GREENHOUSE_RESPONSE) });
  });

  await page.route('**/api.ashbyhq.com/posting-api/job-board/*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ASHBY_RESPONSE) });
  });

  await page.route('**/api.lever.co/v0/postings/*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(LEVER_RESPONSE) });
  });
}

test.describe('results flow', () => {
  test.beforeEach(setupRoutes);

  test('shows real-fetched matches with strong/decent grouping', async ({ page }) => {
    await page.goto('/');
    const fixturePath = path.resolve(__dirname, '../fixtures/sample-resume.pdf');
    await page.getByLabel('Drop here or click to browse').setInputFiles(fixturePath);
    await expect(page.getByText('Confirm your profile')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /start scanning/i }).click();

    await expect(page.getByText(/strong matches/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/decent matches/i)).toBeVisible();
    // Senior Backend Engineer (score 92) appears in main column AND in sidebar profile summary
    await expect(page.getByRole('button', { name: /Senior Backend Engineer at Stripe/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Backend Engineer at Stripe', exact: true })).toBeVisible();
  });

  test('opens side sheet with full job detail and a real Apply link', async ({ page }) => {
    await page.goto('/');
    const fixturePath = path.resolve(__dirname, '../fixtures/sample-resume.pdf');
    await page.getByLabel('Drop here or click to browse').setInputFiles(fixturePath);
    await expect(page.getByText('Confirm your profile')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /start scanning/i }).click();
    await expect(page.getByText(/strong matches/i)).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /Senior Backend Engineer at Stripe/i }).click();
    await expect(page.getByText('Strong-match description.')).toBeVisible();
    await expect(page.getByRole('heading', { name: /why this score/i })).toBeVisible();

    const apply = page.getByRole('link', { name: /apply on greenhouse/i });
    await expect(apply).toBeVisible();
    await expect(apply).toHaveAttribute('href', 'https://boards.greenhouse.io/stripe/jobs/g1');
    await expect(apply).toHaveAttribute('target', '_blank');

    await page.getByRole('button', { name: /close/i }).click();
    await expect(page.getByText('Strong-match description.')).toHaveCount(0);
  });

  test('sidebar New scan returns to upload', async ({ page }) => {
    await page.goto('/');
    const fixturePath = path.resolve(__dirname, '../fixtures/sample-resume.pdf');
    await page.getByLabel('Drop here or click to browse').setInputFiles(fixturePath);
    await expect(page.getByText('Confirm your profile')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /start scanning/i }).click();
    await expect(page.getByText(/strong matches/i)).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /new scan/i }).click();
    await expect(page.getByText('Drop your resume to begin')).toBeVisible();
  });

  test('sidebar Edit profile returns to Confirm', async ({ page }) => {
    await page.goto('/');
    const fixturePath = path.resolve(__dirname, '../fixtures/sample-resume.pdf');
    await page.getByLabel('Drop here or click to browse').setInputFiles(fixturePath);
    await expect(page.getByText('Confirm your profile')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /start scanning/i }).click();
    await expect(page.getByText(/strong matches/i)).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /edit profile/i }).click();
    await expect(page.getByText('Confirm your profile')).toBeVisible();
  });

  test('filter by tier — Strong hides Decent matches', async ({ page }) => {
    await page.goto('/');
    const fixturePath = path.resolve(__dirname, '../fixtures/sample-resume.pdf');
    await page.getByLabel('Drop here or click to browse').setInputFiles(fixturePath);
    await expect(page.getByText('Confirm your profile')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /start scanning/i }).click();
    await expect(page.getByText(/strong matches/i)).toBeVisible({ timeout: 15_000 });

    await expect(page.getByText(/decent matches/i)).toBeVisible();
    await page.getByRole('radio', { name: 'Strong' }).click();
    await expect(page.getByText(/decent matches/i)).toHaveCount(0);
    await expect(page.getByText(/strong matches/i)).toBeVisible();
  });
});
