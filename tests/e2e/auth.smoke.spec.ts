import { expect, test } from '@playwright/test';

test('auth screen renders email-password entrypoints', async ({ page }) => {
  await page.goto('/app');

  await expect(page.locator('#signin-email')).toBeVisible();
  await expect(page.locator('#signin-password')).toBeVisible();
  await expect(page.getByRole('button', { name: /entra|sign in/i })).toBeVisible();
});