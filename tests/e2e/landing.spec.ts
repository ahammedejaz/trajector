import { test, expect } from '@playwright/test';

test.describe('landing screen', () => {
  test('shows Hero, demo preview, FeatureGrid, FAQ, and Footer', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /find the few jobs/i })).toBeVisible();
    await expect(page.getByText(/Senior Backend Engineer · senior · United States/)).toBeVisible();
    await expect(page.getByText(/triage by tier/i)).toBeVisible();
    await expect(page.getByText(/where does my data go/i)).toBeVisible();
    await expect(page.getByText(/Trajector v0\.1/)).toBeVisible();
  });

  test('demo preview opens SideSheet with job details', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Staff Backend Engineer.*Vercel/i }).click();
    await expect(page.getByText(/Own the Edge Runtime/)).toBeVisible();
  });

  test('FAQ entries expand on click', async ({ page }) => {
    await page.goto('/');
    await page.getByText(/where does my data go/i).click();
    await expect(page.getByText(/^Nowhere/)).toBeVisible();
  });
});
