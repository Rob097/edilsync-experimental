import { expect, test } from '@playwright/test';
import {
  addActiveCompanyMember,
  cleanupCompanyGraph,
  cleanupQaUser,
  createCompanyViaApi,
  createConfirmedQaUser,
  hasRemoteQaEnv,
  setUserContext,
  signInForAccessToken,
  signInThroughUi,
  waitForAuthenticatedShell,
} from './helpers/qa-auth';

// Scenario IDs: company.detail.billing-tab-visible-only-to-admin

test.skip(!hasRemoteQaEnv, 'Remote QA browser tests require Supabase branch credentials.');

test('non-admin company member cannot see the billing tab even on direct billing links', async ({ page }) => {
  const owner = await createConfirmedQaUser('member-owner');
  const member = await createConfirmedQaUser('member-viewer');
  let companyId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const company = await createCompanyViaApi({ accessToken: ownerAccessToken, label: 'Member Visibility', email: owner.email });
    companyId = company.id;

    await addActiveCompanyMember({
      companyId: company.id,
      userId: member.id,
      email: member.email,
      role: 'member',
      profession: 'worker',
      companyMemberRole: 'worker',
    });

    await setUserContext({
      email: member.email,
      activeContext: 'company',
      activeCompanyId: company.id,
      companyIds: [company.id],
      adminCompanyIds: [],
    });

    await signInThroughUi(page, member.email, member.password);
    await waitForAuthenticatedShell(page);
    await page.goto(`/app/CompanyDetail?id=${company.id}&tab=billing`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { level: 1, name: company.name })).toBeVisible();
    await expect(page.getByRole('tab', { name: /billing|fatturazione/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /go to billing|vai alla fatturazione/i })).toHaveCount(0);
    await expect(page.getByText(/billing and plan|fatturazione e piano/i)).toHaveCount(0);
  } finally {
    if (companyId) {
      await cleanupCompanyGraph(companyId);
    }
    await cleanupQaUser(member.id, member.email);
    await cleanupQaUser(owner.id, owner.email);
  }
});