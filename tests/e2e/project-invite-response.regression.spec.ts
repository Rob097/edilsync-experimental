import { expect, test } from '@playwright/test';
import {
  addProjectCompanyParticipant,
  cleanupCompanyGraph,
  cleanupProjectGraph,
  cleanupQaUser,
  createCompanyViaApi,
  createConfirmedQaUser,
  createProjectViaApi,
  getProjectParticipantRecord,
  hasRemoteQaEnv,
  setUserContext,
  signInForAccessToken,
  signInThroughUi,
  waitForAuthenticatedShell,
} from './helpers/qa-auth';

test.skip(!hasRemoteQaEnv, 'Remote QA browser tests require Supabase branch credentials.');

function getInviteBanner(page: import('@playwright/test').Page) {
  return page.locator('div').filter({
    has: page.getByRole('heading', { name: /you have been invited to this worksite|sei stato invitato/i }),
  }).first();
}

test('an invited company admin can accept a project invitation from the project detail page', async ({ page }) => {
  const owner = await createConfirmedQaUser('project-invite-accept-owner');
  const invitedAdmin = await createConfirmedQaUser('project-invite-accept-admin');
  let companyId: string | null = null;
  let projectId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const invitedAccessToken = await signInForAccessToken(invitedAdmin.email, invitedAdmin.password);
    const invitedCompany = await createCompanyViaApi({ accessToken: invitedAccessToken, label: 'Project Invite Accept', email: invitedAdmin.email });
    const project = await createProjectViaApi({ accessToken: ownerAccessToken, label: 'Project Invite Accept' });
    companyId = invitedCompany.id;
    projectId = project.id;

    await addProjectCompanyParticipant({
      projectId: project.id,
      companyId: invitedCompany.id,
      projectRole: 'contractor',
      status: 'invited',
      canInvite: true,
    });

    await setUserContext({
      email: invitedAdmin.email,
      activeContext: 'company',
      activeCompanyId: invitedCompany.id,
      companyIds: [invitedCompany.id],
      adminCompanyIds: [invitedCompany.id],
      projectIds: [project.id],
    });

    await signInThroughUi(page, invitedAdmin.email, invitedAdmin.password);
    await waitForAuthenticatedShell(page);
    await page.goto(`/app/ProjectDetail?id=${project.id}`);
    await page.waitForLoadState('networkidle');

    const inviteBanner = getInviteBanner(page);
    await expect(inviteBanner.getByRole('heading', { name: /you have been invited to this worksite|sei stato invitato/i })).toBeVisible();

    const acceptResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST'
        && response.url().includes('/functions/v1/respondProjectParticipantInvite'),
    );

    await inviteBanner.getByRole('button', { name: /^accept$|^accetta$/i }).click();
    const acceptResponse = await acceptResponsePromise;

    expect(acceptResponse.ok()).toBeTruthy();
    const participant = await getProjectParticipantRecord({
      projectId: project.id,
      companyId: invitedCompany.id,
    });

    expect(participant.status).toBe('active');
    await expect(inviteBanner.getByRole('button', { name: /^accept$|^accetta$/i })).toHaveCount(0);
  } finally {
    if (projectId) {
      await cleanupProjectGraph(projectId);
    }
    if (companyId) {
      await cleanupCompanyGraph(companyId);
    }
    await cleanupQaUser(invitedAdmin.id, invitedAdmin.email);
    await cleanupQaUser(owner.id, owner.email);
  }
});

test('an invited company admin can decline a project invitation from the project detail page', async ({ page }) => {
  const owner = await createConfirmedQaUser('project-invite-decline-owner');
  const invitedAdmin = await createConfirmedQaUser('project-invite-decline-admin');
  let companyId: string | null = null;
  let projectId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const invitedAccessToken = await signInForAccessToken(invitedAdmin.email, invitedAdmin.password);
    const invitedCompany = await createCompanyViaApi({ accessToken: invitedAccessToken, label: 'Project Invite Decline', email: invitedAdmin.email });
    const project = await createProjectViaApi({ accessToken: ownerAccessToken, label: 'Project Invite Decline' });
    companyId = invitedCompany.id;
    projectId = project.id;

    await addProjectCompanyParticipant({
      projectId: project.id,
      companyId: invitedCompany.id,
      projectRole: 'contractor',
      status: 'invited',
      canInvite: false,
    });

    await setUserContext({
      email: invitedAdmin.email,
      activeContext: 'company',
      activeCompanyId: invitedCompany.id,
      companyIds: [invitedCompany.id],
      adminCompanyIds: [invitedCompany.id],
      projectIds: [project.id],
    });

    await signInThroughUi(page, invitedAdmin.email, invitedAdmin.password);
    await waitForAuthenticatedShell(page);
    await page.goto(`/app/ProjectDetail?id=${project.id}`);
    await page.waitForLoadState('networkidle');

    const inviteBanner = getInviteBanner(page);
    await expect(inviteBanner.getByRole('heading', { name: /you have been invited to this worksite|sei stato invitato/i })).toBeVisible();

    const declineResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST'
        && response.url().includes('/functions/v1/respondProjectParticipantInvite'),
    );

    await inviteBanner.getByRole('button', { name: /^decline$|^rifiuta$/i }).click();
    const declineResponse = await declineResponsePromise;

    expect(declineResponse.ok()).toBeTruthy();
    const participant = await getProjectParticipantRecord({
      projectId: project.id,
      companyId: invitedCompany.id,
    });

    expect(participant.status).toBe('declined');
    await page.waitForURL(/\/app\/Projects$/);
    await expect(page.getByRole('heading', { level: 1, name: /worksites|cantieri/i })).toBeVisible();
  } finally {
    if (projectId) {
      await cleanupProjectGraph(projectId);
    }
    if (companyId) {
      await cleanupCompanyGraph(companyId);
    }
    await cleanupQaUser(invitedAdmin.id, invitedAdmin.email);
    await cleanupQaUser(owner.id, owner.email);
  }
});