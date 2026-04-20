import { expect, test } from '@playwright/test';
import {
  cleanupQaUser,
  createConfirmedQaUser,
  hasRemoteQaEnv,
  signInThroughUi,
  waitForAuthenticatedShell,
} from './helpers/qa-auth';

// Scenario IDs: routing.operativa.denies-personal-user

test.skip(!hasRemoteQaEnv, 'Remote QA browser tests require Supabase branch credentials.');

test('personal-context user sees the operative mode company guard instead of operative workspaces', async ({ page }) => {
  const user = await createConfirmedQaUser('operativa-personal-guard');

  try {
    await signInThroughUi(page, user.email, user.password);
    await waitForAuthenticatedShell(page);

    await page.goto('/app/operativa');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { level: 1, name: /select a company context|seleziona un contesto aziendale/i })).toBeVisible();
    await expect(page.getByText(/operational mode is available only in company context|la modalita operativa e disponibile solo nel contesto aziendale/i)).toBeVisible();
    await expect(page.getByText(/how do you want to start|come vuoi iniziare/i)).toHaveCount(0);
    await expect(page).toHaveURL(/\/app\/operativa$/);
  } finally {
    await cleanupQaUser(user.id, user.email);
  }
});