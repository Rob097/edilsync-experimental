import { expect, test } from '@playwright/test';
import {
  cleanupCompanyGraph,
  cleanupProjectGraph,
  cleanupQaUser,
  cleanupUserRecordByEmail,
  createCompanyViaApi,
  createConfirmedQaUser,
  createProjectRecordDirect,
  createProjectSponsorshipRecord,
  createProjectViaApi,
  hasRemoteQaEnv,
  setUserContext,
  signInForAccessToken,
  signInThroughUi,
  waitForAuthenticatedShell,
} from './helpers/qa-auth';

// Scenario IDs: pricing.sponsor-loss.blocks-personal-invites, pricing.sponsor-loss.transitions-to-blocked-state

test.skip(!hasRemoteQaEnv, 'Remote QA browser tests require Supabase branch credentials.');

test('sponsor-loss projects hide premium surfaces and allow only company invitations from the UI', async ({ page }) => {
  const owner = await createConfirmedQaUser('project-sponsor-loss');
  const homeownerEmail = `qa-sponsor-loss-homeowner-${Date.now()}@edilsync.test`;
  let companyId: string | null = null;
  let blockedProjectId: string | null = null;
  let siblingProjectId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const company = await createCompanyViaApi({
      accessToken: ownerAccessToken,
      label: 'Sponsor Loss Owner',
      email: owner.email,
    });
    companyId = company.id;

    await setUserContext({
      email: owner.email,
      activeContext: 'company',
      activeCompanyId: company.id,
      companyIds: [company.id],
      adminCompanyIds: [company.id],
      projectIds: [],
    });

    const blockedProject = await createProjectViaApi({
      accessToken: ownerAccessToken,
      label: 'Sponsor Loss Blocked',
      myRole: 'contractor',
      homeownerEmail,
    });
    blockedProjectId = blockedProject.id;

    const siblingProject = await createProjectRecordDirect({
      name: `QA Sponsor Loss Sibling ${Date.now()}`,
      address: 'Via Sponsor Loss 4, Bergamo',
      description: 'Unsponsored sibling project used to trigger sponsor-loss pricing status.',
      ownerType: 'company',
      ownerCompanyId: company.id,
      status: 'planning',
    });
    siblingProjectId = siblingProject.id;

    await createProjectSponsorshipRecord({
      projectId: blockedProject.id,
      sponsorCompanyId: company.id,
      status: 'ended',
      endedAt: new Date().toISOString(),
    });

    await signInThroughUi(page, owner.email, owner.password);
    await waitForAuthenticatedShell(page);
    await page.goto(`/app/ProjectDetail?id=${blockedProject.id}&tab=info`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { level: 1, name: blockedProject.name })).toBeVisible();
    await expect(page.getByText(/worksite blocked after sponsor loss|cantiere bloccato per perdita sponsor/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /messaging|messaggistica/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /documents|documenti/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /finance|economia/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /open quick actions|apri azioni rapide/i })).toHaveCount(0);

    const inviteSponsorButton = page.getByRole('button', { name: /invite sponsor company|invita societa sponsor/i });
    await expect(inviteSponsorButton).toBeVisible();
    await inviteSponsorButton.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/worksite blocked after sponsor loss|cantiere bloccato per perdita sponsor/i)).toBeVisible();
    await expect(dialog.locator('label[for="company"]')).toBeVisible();
    await expect(dialog.locator('label[for="personal"]')).toHaveCount(0);
  } finally {
    if (blockedProjectId) {
      await cleanupProjectGraph(blockedProjectId);
    }
    if (siblingProjectId) {
      await cleanupProjectGraph(siblingProjectId);
    }
    if (companyId) {
      await cleanupCompanyGraph(companyId);
    }
    await cleanupUserRecordByEmail(homeownerEmail);
    await cleanupQaUser(owner.id, owner.email);
  }
});