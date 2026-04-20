import { expect, test } from '@playwright/test';
import {
  addCompanyChannelMember,
  cleanupCompanyGraph,
  cleanupQaUser,
  createCompanyChannel,
  createCompanyViaApi,
  createConfirmedQaUser,
  getCompanyMember,
  hasRemoteQaEnv,
  signInForAccessToken,
  signInThroughUi,
  upsertCompanySubscription,
  waitForAuthenticatedShell,
} from './helpers/qa-auth';

// Scenario IDs: pricing.gates.company-paid-full-access

test.skip(!hasRemoteQaEnv, 'Remote QA browser tests require Supabase branch credentials.');

test('paid company sees full premium features across chat documents and time tracking', async ({ page }) => {
  const owner = await createConfirmedQaUser('company-paid-gating');
  let companyId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const company = await createCompanyViaApi({ accessToken: ownerAccessToken, label: 'Paid Gate', email: owner.email });
    companyId = company.id;

    await upsertCompanySubscription({
      companyId: company.id,
      planCode: 'paid',
      billingStatus: 'active',
      billingCycle: 'monthly',
    });

    const ownerMembership = await getCompanyMember({ companyId: company.id, email: owner.email });
    const customChannel = await createCompanyChannel({
      companyId: company.id,
      name: `QA Paid Custom ${Date.now()}`,
      createdByEmail: owner.email,
      type: 'custom',
      description: 'QA custom channel for paid-company regression.',
    });
    await addCompanyChannelMember({
      channelId: customChannel.id,
      companyId: company.id,
      participantId: ownerMembership.id,
      userEmail: owner.email,
    });

    await signInThroughUi(page, owner.email, owner.password);
    await waitForAuthenticatedShell(page);
    await page.goto(`/app/CompanyDetail?id=${company.id}&tab=operativita&section=all`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { level: 1, name: company.name })).toBeVisible();
    await expect(page.getByText(/premium time tracking|timbrature premium/i)).toHaveCount(0);
    await expect(page.getByRole('button', { name: customChannel.name })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /write a message|scrivi un messaggio/i })).toBeVisible();

    await page.getByRole('tab', { name: /info/i }).click();
    await page.getByRole('button', { name: /documents|documenti/i }).click();

    await expect(page.getByText(/company documents|documenti societa/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /upload document|carica documento/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /grid view|vista a griglia/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /list view|vista a lista/i })).toBeVisible();
  } finally {
    if (companyId) {
      await cleanupCompanyGraph(companyId);
    }
    await cleanupQaUser(owner.id, owner.email);
  }
});