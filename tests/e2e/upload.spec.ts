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
    await expect(page.locator('#target-role')).toHaveValue('Senior Backend Engineer');
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
