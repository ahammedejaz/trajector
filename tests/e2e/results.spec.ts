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

const MOCK_JOBS = [
  {
    id: 'j1',
    source: 'linkedin',
    company: 'Acme',
    title: 'Senior Backend Engineer',
    location: 'Remote',
    compRange: '$220k',
    description: 'Strong match description.',
    tags: ['Go'],
    score: 92,
    scoreReason: 'Stack matches.',
    applyUrl: 'https://example.com/apply',
    responsibilities: ['Build services'],
    requirements: ['7+ years Go'],
    benefits: ['Remote'],
    experienceYears: '7+ years',
    companyBlurb: 'Acme builds.',
  },
  {
    id: 'j2',
    source: 'greenhouse',
    company: 'Beta',
    title: 'Backend Engineer',
    location: 'Remote',
    compRange: null,
    description: 'Decent fit description.',
    tags: ['Go'],
    score: 65,
    scoreReason: 'Decent.',
    applyUrl: 'https://example.com/beta',
    responsibilities: [],
    requirements: [],
    benefits: [],
    experienceYears: null,
    companyBlurb: null,
  },
  {
    id: 'j3',
    source: 'lever',
    company: 'Gamma',
    title: 'Junior Backend',
    location: 'Remote',
    compRange: null,
    description: 'Skip description.',
    tags: ['Go'],
    score: 30,
    scoreReason: 'Too junior.',
    applyUrl: 'https://example.com/gamma',
    responsibilities: [],
    requirements: [],
    benefits: [],
    experienceYears: null,
    companyBlurb: null,
  },
];

async function setup({ page }: { page: import('@playwright/test').Page }) {
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
    await expect(page.getByRole('button', { name: /Backend Engineer at Beta/i })).toBeVisible();
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
    await expect(page.getByRole('heading', { name: /why this score/i })).toBeVisible();
    // New: Apply button
    await expect(page.getByRole('link', { name: /apply on linkedin/i })).toBeVisible();

    await page.getByRole('button', { name: /close/i }).click();
    await expect(page.getByText('Strong match description.')).toHaveCount(0);
  });

  test('sidebar New scan returns to upload', async ({ page }) => {
    await page.goto('/');
    const fixturePath = path.resolve(__dirname, '../fixtures/sample-resume.pdf');
    await page.getByLabel('Drop here or click to browse').setInputFiles(fixturePath);
    await expect(page.getByText('Confirm your profile')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /start scanning/i }).click();
    await expect(page.getByText(/strong matches/i)).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /new scan/i }).click();
    await expect(page.getByText('Drop your resume to begin')).toBeVisible();
  });

  test('sidebar Edit profile returns to Confirm', async ({ page }) => {
    await page.goto('/');
    const fixturePath = path.resolve(__dirname, '../fixtures/sample-resume.pdf');
    await page.getByLabel('Drop here or click to browse').setInputFiles(fixturePath);
    await expect(page.getByText('Confirm your profile')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /start scanning/i }).click();
    await expect(page.getByText(/strong matches/i)).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /edit profile/i }).click();
    await expect(page.getByText('Confirm your profile')).toBeVisible();
  });

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
});
