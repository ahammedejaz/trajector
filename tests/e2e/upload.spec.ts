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
    id: 'j1',
    source: 'greenhouse',
    company: 'Acme Corp',
    title: 'Senior Backend Engineer',
    location: 'Remote (US)',
    compRange: '$220k-$260k',
    description: 'Build scalable Go services for our infra team.',
    tags: ['Go', 'Postgres', 'Kubernetes'],
    score: 92,
    scoreReason: 'Stack matches.',
    applyUrl: 'https://example.com/apply',
    responsibilities: ['Build scalable services'],
    requirements: ['5+ years Go'],
    benefits: ['Remote'],
    experienceYears: '5+ years',
    companyBlurb: 'Acme Corp builds infrastructure.',
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
          sources: { greenhouse: true, ashby: true, lever: true },
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
