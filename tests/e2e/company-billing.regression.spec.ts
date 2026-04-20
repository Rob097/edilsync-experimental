import { expect, test } from '@playwright/test';
import { cleanupCompanyGraph, cleanupQaUser, createConfirmedQaUser, hasRemoteQaEnv, signInThroughUi, waitForAuthenticatedShell } from './helpers/qa-auth';

test.skip(!hasRemoteQaEnv, 'Remote QA browser tests require Supabase branch credentials.');

test('company admin can open the billing tab from company detail', async ({ page }) => {
  const user = await createConfirmedQaUser('billing');
  let companyId: string | null = null;

  try {
    await signInThroughUi(page, user.email, user.password);
    await waitForAuthenticatedShell(page);
    await page.goto('/app/NewCompany');

    const companyName = `QA Billing Company ${Date.now()}`;

    await page.locator('#name').fill(companyName);
    await page.locator('#address').fill('Via Billing QA 4, Milano');
    await page.locator('#email').fill(user.email);
    await page.locator('button[type="submit"]').click();

    await page.waitForURL(/\/app\/CompanyDetail\?id=/);
    const currentUrl = new URL(page.url());
    companyId = currentUrl.searchParams.get('id');

    await expect(page.getByRole('tab', { name: /billing|fatturazione/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /go to billing|vai alla fatturazione/i })).toBeVisible();

    await page.getByRole('button', { name: /go to billing|vai alla fatturazione/i }).click();

    await expect(page.getByText(/billing and plan|fatturazione e piano/i)).toBeVisible();
  } finally {
    if (companyId) {
      await cleanupCompanyGraph(companyId);
    }
    await cleanupQaUser(user.id, user.email);
  }
});