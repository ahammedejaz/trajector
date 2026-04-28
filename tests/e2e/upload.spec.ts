import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.describe('upload flow', () => {
  test('drops a PDF and renders extracted text on the stub screen', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Drop your resume to begin')).toBeVisible();

    const fixturePath = path.resolve(__dirname, '../fixtures/sample-resume.pdf');
    const fileInput = page.getByLabel('Drop here or click to browse');
    await fileInput.setInputFiles(fixturePath);

    await expect(page.getByText('Extracted text (Plan 1 stub)')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('pre')).toContainText('Senior Backend Engineer at Anthropic');
    await expect(page.getByText('sample-resume.pdf')).toBeVisible();
    await expect(page.getByText(/PDF/)).toBeVisible();
  });

  test('returns to the upload screen when "Try another resume" is clicked', async ({ page }) => {
    await page.goto('/');
    const fixturePath = path.resolve(__dirname, '../fixtures/sample-resume.pdf');
    await page.getByLabel('Drop here or click to browse').setInputFiles(fixturePath);
    await expect(page.getByText('Extracted text (Plan 1 stub)')).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: 'Try another resume' }).click();
    await expect(page.getByText('Drop your resume to begin')).toBeVisible();
  });
});
