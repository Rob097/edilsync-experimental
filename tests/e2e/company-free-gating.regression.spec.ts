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
  waitForAuthenticatedShell,
} from './helpers/qa-auth';

// Scenario IDs: company.free-plan.gates-chat-documents-time-tracking

test.skip(!hasRemoteQaEnv, 'Remote QA browser tests require Supabase branch credentials.');

test('company free plan keeps time tracking gated and reduces chat/documents UI', async ({ page }) => {
  const owner = await createConfirmedQaUser('company-free-gating');
  let companyId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const company = await createCompanyViaApi({ accessToken: ownerAccessToken, label: 'Free Gate', email: owner.email });
    companyId = company.id;

    const ownerMembership = await getCompanyMember({ companyId: company.id, email: owner.email });
    const customChannel = await createCompanyChannel({
      companyId: company.id,
      name: `QA Free Custom ${Date.now()}`,
      createdByEmail: owner.email,
      type: 'custom',
      description: 'QA custom channel for gating regression.',
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
    await expect(page.getByText(/premium time tracking|timbrature premium/i)).toBeVisible();
    await expect(page.getByText(/general channel|canale generale/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /create channel|crea canale/i })).toHaveCount(0);
    await expect(page.getByText(customChannel.name)).toHaveCount(0);

    await page.getByRole('tab', { name: /info/i }).click();
    await page.getByRole('button', { name: /documents|documenti/i }).click();

    await expect(page.getByText(/company documents|documenti societa/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /upload document|carica documento/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /grid view|vista a griglia/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /list view|vista a lista/i })).toHaveCount(0);
    await expect(page.getByText(/upload the first company document|carica il primo documento della societa/i)).toBeVisible();
  } finally {
    if (companyId) {
      await cleanupCompanyGraph(companyId);
    }
    await cleanupQaUser(owner.id, owner.email);
  }
});