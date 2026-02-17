/**
 * Basic integration tests for the comic engine.
 *
 * These verify that the app boots, themes switch, and overlays toggle
 * in a real browser environment. Run with:
 *   npx playwright test
 */

import { test, expect } from '@playwright/test';

test.describe('Comic Engine', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders the theme switcher', async ({ page }) => {
    await expect(page.getByText('THEME')).toBeVisible();
  });

  test('renders the overlay controls', async ({ page }) => {
    await expect(page.getByText('OVERLAYS')).toBeVisible();
  });

  test('can switch themes', async ({ page }) => {
    const select = page.locator('select').first();
    await select.selectOption('cyberpunk');
    await expect(select).toHaveValue('cyberpunk');
  });

  test('can toggle overlay checkboxes', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]').first();
    const initialState = await checkbox.isChecked();
    await checkbox.click();
    expect(await checkbox.isChecked()).toBe(!initialState);
  });
});
