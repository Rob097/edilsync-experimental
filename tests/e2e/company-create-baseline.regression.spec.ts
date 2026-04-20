import { expect, test } from '@playwright/test';
import { cleanupCompanyGraph, cleanupQaUser, createConfirmedQaUser, hasRemoteQaEnv, signInThroughUi, waitForAuthenticatedShell } from './helpers/qa-auth';

// Scenario IDs: company.create.bootstraps-free-subscription, company.create.bootstraps-general-channel

test.skip(!hasRemoteQaEnv, 'Remote QA browser tests require Supabase branch credentials.');

test('creating a company from the UI exposes the free billing state and the general internal channel', async ({ page }) => {
  const user = await createConfirmedQaUser('company-baseline');
  let companyId: string | null = null;

  try {
    await signInThroughUi(page, user.email, user.password);
    await waitForAuthenticatedShell(page);
    await page.goto('/app/NewCompany');
    await expect(page.locator('#name')).toBeVisible();

    const companyName = `QA Baseline Company ${Date.now()}`;

    await page.locator('#name').fill(companyName);
    await page.locator('#address').fill('Via Baseline QA 10, Milano');
    await page.locator('#email').fill(user.email);
    await page.locator('button[type="submit"]').click();

    await page.waitForURL(/\/app\/CompanyDetail\?id=/);
    companyId = new URL(page.url()).searchParams.get('id');

    await expect(page.getByRole('button', { name: /go to billing|vai alla fatturazione/i })).toBeVisible();
    await page.getByRole('button', { name: /go to billing|vai alla fatturazione/i }).click();
    await expect(page.getByText(/base plan active|piano base attivo/i)).toBeVisible();

    await page.getByRole('tab', { name: /operations|operativita/i }).click();
    await page.getByRole('button', { name: /internal chat|chat interna/i }).click();
    await expect(page.getByText(/general channel|canale generale/i)).toBeVisible();
  } finally {
    if (companyId) {
      await cleanupCompanyGraph(companyId);
    }
    await cleanupQaUser(user.id, user.email);
  }
});