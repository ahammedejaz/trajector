import { test, expect } from '@playwright/test';

test.describe('landing screen', () => {
  test('shows Hero, drop zone, FeatureGrid, example section, FAQ, and Footer', async ({ page }) => {
    await page.goto('/');

    // Hero
    await expect(page.getByRole('heading', { name: /find the few jobs/i })).toBeVisible();
    // Drop zone is in Hero's right slot now
    await expect(page.getByLabel(/drop here or click to browse/i)).toBeVisible();
    // FeatureGrid (3 cards)
    await expect(page.getByText(/triage by tier/i)).toBeVisible();
    // Example section — scroll it into view so Reveal IntersectionObserver fires
    await page.getByRole('heading', { name: /what a real scan looks like/i }).scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: /what a real scan looks like/i })).toBeVisible();
    // FAQ — scroll into view
    await page.getByText(/where does my data go/i).scrollIntoViewIfNeeded();
    await expect(page.getByText(/where does my data go/i)).toBeVisible();
    // Footer
    await page.getByText(/Trajector v0\.1/).scrollIntoViewIfNeeded();
    await expect(page.getByText(/Trajector v0\.1/)).toBeVisible();
  });

  test('demo preview opens SideSheet with full job detail and Apply button', async ({ page }) => {
    await page.goto('/');
    // Scroll to example section to ensure DemoPreview is visible
    await page.getByRole('heading', { name: /what a real scan looks like/i }).scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: /Staff Backend Engineer.*Vercel/i }).click();

    // SideSheet body — JobDetail content
    await expect(page.getByRole('heading', { name: /^responsibilities$/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^requirements$/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^benefits$/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /about the company/i })).toBeVisible();

    // Apply button — opens applyUrl in new tab
    const apply = page.getByRole('link', { name: /apply on linkedin/i });
    await expect(apply).toBeVisible();
    await expect(apply).toHaveAttribute('href', 'https://vercel.com/careers');
    await expect(apply).toHaveAttribute('target', '_blank');
  });

  test('FAQ entries expand on click', async ({ page }) => {
    await page.goto('/');
    await page.getByText(/where does my data go/i).scrollIntoViewIfNeeded();
    await page.getByText(/where does my data go/i).click();
    await expect(page.getByText(/^Nowhere/)).toBeVisible();
  });
});
