import { expect, test } from '@playwright/test';
import {
  cleanupQaUser,
  createConfirmedQaUser,
  hasRemoteQaEnv,
  setUserRole,
  signInThroughUi,
  waitForAuthenticatedShell,
} from './helpers/qa-auth';

test.skip(!hasRemoteQaEnv, 'Remote QA browser tests require Supabase branch credentials.');

test('non admin users are redirected back to the app when they open the web admin area', async ({ page }) => {
  const user = await createConfirmedQaUser('web-admin-normal');

  try {
    await signInThroughUi(page, user.email, user.password);
    await waitForAuthenticatedShell(page);
    await page.goto('/web-admin');

    await page.waitForURL(/\/app$/);
    await expect(page.locator('[data-tour="user-menu-trigger"]')).toBeVisible();
  } finally {
    await cleanupQaUser(user.id, user.email);
  }
});

test('platform admins can reach the hidden web admin dashboard', async ({ page }) => {
  const admin = await createConfirmedQaUser('web-admin-platform-admin');

  try {
    await setUserRole({ email: admin.email, role: 'admin' });

    await signInThroughUi(page, admin.email, admin.password);
    await waitForAuthenticatedShell(page);
    await page.goto('/web-admin');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'EdilSync Web Admin' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Web Admin', exact: true })).toBeVisible();
  } finally {
    await cleanupQaUser(admin.id, admin.email);
  }
});