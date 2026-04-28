import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MOCK_PROFILE = {
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

const GREENHOUSE_RESPONSE = {
  jobs: [
    {
      id: 1, title: 'Senior Backend Engineer',
      absolute_url: 'https://boards.greenhouse.io/test/jobs/1',
      location: { name: 'Remote (US)' },
      departments: [{ name: 'Engineering' }],
      content: '<p>Build great software.</p>',
      updated_at: '2024-01-15T00:00:00Z',
    },
  ],
};

const ASHBY_RESPONSE = { jobs: [] };
const LEVER_RESPONSE: unknown[] = [];
const SCORING_RESPONSE = { jobs: [{ id: 'greenhouse:test:1', score: 88, reason: 'Match.' }] };

test.describe('mobile (iPhone 13)', () => {
  test.use({
    viewport: { width: 390, height: 664 },
    isMobile: true,
    hasTouch: true,
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'trajector_settings',
        JSON.stringify({
          openRouterKey: 'sk-or-v1-test',
          model: 'anthropic/claude-sonnet-4-6',
          sources: { greenhouse: true, ashby: true, lever: true },
        }),
      );
    });
    await page.route('**/openrouter.ai/api/v1/chat/completions', async (route) => {
      const body = route.request().postDataJSON() as { messages: Array<{ role: string; content: string }> };
      const last = body.messages[body.messages.length - 1];
      const isJson = last.content.trim().startsWith('{');
      const content = isJson ? JSON.stringify(SCORING_RESPONSE) : JSON.stringify(MOCK_PROFILE);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ choices: [{ message: { content } }] }) });
    });
    await page.route('**/boards-api.greenhouse.io/v1/boards/*/jobs*', (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(GREENHOUSE_RESPONSE) }),
    );
    await page.route('**/api.ashbyhq.com/posting-api/job-board/*', (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ASHBY_RESPONSE) }),
    );
    await page.route('**/api.lever.co/v0/postings/*', (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(LEVER_RESPONSE) }),
    );
  });

  test('Landing renders without horizontal scroll', async ({ page }) => {
    await page.goto('/');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    await expect(page.getByRole('heading', { name: /find the few jobs/i })).toBeVisible();
    // Drop zone should be visible without scrolling beyond first viewport
    await expect(page.getByLabel('Drop here or click to browse')).toBeVisible();
  });

  test('AppBar nav is hidden on mobile, brand + CTA still visible', async ({ page }) => {
    await page.goto('/');
    // Brand link
    await expect(page.getByRole('button', { name: /trajector home/i })).toBeVisible();
    // The 'Drop your resume' CTA should be visible
    await expect(page.getByRole('link', { name: /drop your resume/i })).toBeVisible();
    // Nav links should not be visible (display: none on mobile)
    const productLink = page.getByRole('link', { name: /^product$/i });
    await expect(productLink).toBeHidden();
  });

  test('end-to-end: drop resume, confirm, scan, see results on mobile', async ({ page }) => {
    await page.goto('/');
    const fixturePath = path.resolve(__dirname, '../fixtures/sample-resume.pdf');
    await page.getByLabel('Drop here or click to browse').setInputFiles(fixturePath);
    await expect(page.getByText('Confirm your profile')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /start scanning/i }).click();
    await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible({ timeout: 15_000 });
  });
});
