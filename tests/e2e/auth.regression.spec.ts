import { expect, test } from '@playwright/test';
import { cleanupQaUser, createConfirmedQaUser, hasRemoteQaEnv, openUserMenu, signInThroughUi, waitForAuthenticatedShell } from './helpers/qa-auth';

// Scenario IDs: auth.signin.rejects-invalid-password, auth.session.logout-clears-state, auth.session.restore-existing-session

test.skip(!hasRemoteQaEnv, 'Remote QA browser tests require Supabase branch credentials.');

test('invalid login shows the auth error and keeps the user on the sign-in screen', async ({ page }) => {
  const invalidEmail = `qa-missing-${Date.now()}@edilsync.test`;

  await page.goto('/app');
  await page.locator('#signin-email').fill(invalidEmail);
  await page.locator('#signin-password').fill('WrongPassword!123');

  const authResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url().includes('/auth/v1/token?grant_type=password'),
  );

  await page.getByRole('button', { name: /entra|sign in/i }).click();

  const authResponse = await authResponsePromise;

  expect(authResponse.ok()).toBeFalsy();
  await expect(page.locator('#signin-email')).toBeVisible();
  await expect(page.locator('#signin-password')).toBeVisible();
  await expect(page.locator('[data-tour="user-menu-trigger"]')).toHaveCount(0);
});

test('authenticated user can reload the app and keep the active session', async ({ page }) => {
  const user = await createConfirmedQaUser('session-persist');

  try {
    await signInThroughUi(page, user.email, user.password);
    await waitForAuthenticatedShell(page);

    await page.reload();
    await page.waitForLoadState('networkidle');

    await waitForAuthenticatedShell(page);
  } finally {
    await cleanupQaUser(user.id, user.email);
  }
});

test('authenticated user can log out and return to the auth screen', async ({ page }) => {
  const user = await createConfirmedQaUser('logout');

  try {
    await signInThroughUi(page, user.email, user.password);
    await waitForAuthenticatedShell(page);

    await openUserMenu(page);
    await page.getByRole('menuitem', { name: /esci|logout/i }).click();

    await expect(page.locator('#signin-email')).toBeVisible();
    await expect(page.locator('#signin-password')).toBeVisible();
  } finally {
    await cleanupQaUser(user.id, user.email);
  }
});