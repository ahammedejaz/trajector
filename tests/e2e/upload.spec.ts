import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MOCK_PROFILE = {
  targetRole: 'Senior Backend Engineer',
  level: 'senior',
  yearsOfExperience: null,
  stackSignals: ['Go', 'PostgreSQL', 'Kubernetes'],
  employmentTypes: [],
  compFloor: 200000,
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
