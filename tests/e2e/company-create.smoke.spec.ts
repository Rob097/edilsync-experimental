import { expect, test } from '@playwright/test';
import { cleanupCompanyGraph, cleanupQaUser, createConfirmedQaUser, hasRemoteQaEnv, signInThroughUi } from './helpers/qa-auth';

test.skip(!hasRemoteQaEnv, 'Remote QA browser tests require Supabase branch credentials.');

test('signed-in user can create a company from the UI', async ({ page }) => {
  const user = await createConfirmedQaUser('company');
  let companyId: string | null = null;

  try {
    await signInThroughUi(page, user.email, user.password);
    await page.goto('/app/NewCompany');

    const companyName = `QA UI Company ${Date.now()}`;

    await page.locator('#name').fill(companyName);
    await page.locator('#address').fill('Via Browser QA 7, Milano');
    await page.locator('#email').fill(user.email);
    await page.locator('button[type="submit"]').click();

    await page.waitForURL(/\/app\/CompanyDetail\?id=/);
    const currentUrl = new URL(page.url());
    companyId = currentUrl.searchParams.get('id');

    await expect(page.getByRole('heading', { level: 1, name: companyName })).toBeVisible();
  } finally {
    if (companyId) {
      await cleanupCompanyGraph(companyId);
    }
    await cleanupQaUser(user.id, user.email);
  }
});