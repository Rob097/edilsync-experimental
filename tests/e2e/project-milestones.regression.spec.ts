import { expect, test } from '@playwright/test';
import {
  cleanupCompanyGraph,
  cleanupProjectGraph,
  cleanupQaUser,
  cleanupUserRecordByEmail,
  createCompanyViaApi,
  createConfirmedQaUser,
  createProjectViaApi,
  getMilestoneRecordByTitle,
  hasRemoteQaEnv,
  setUserContext,
  signInForAccessToken,
  signInThroughUi,
  upsertCompanySubscription,
  waitForAuthenticatedShell,
  waitForDialogToClose,
} from './helpers/qa-auth';

// Scenario IDs: project.milestone.create-entitled

test.skip(!hasRemoteQaEnv, 'Remote QA browser tests require Supabase branch credentials.');

test('company admin can create a milestone on a sponsored paid project from the UI', async ({ page }) => {
  const owner = await createConfirmedQaUser('milestone-owner');
  const homeownerEmail = `qa-milestone-homeowner-${Date.now()}@edilsync.test`;
  let companyId: string | null = null;
  let projectId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const company = await createCompanyViaApi({
      accessToken: ownerAccessToken,
      label: 'Milestone Entitled',
      email: owner.email,
    });
    companyId = company.id;

    await upsertCompanySubscription({
      companyId: company.id,
      planCode: 'paid',
      billingStatus: 'active',
      billingCycle: 'monthly',
    });

    await setUserContext({
      email: owner.email,
      activeContext: 'company',
      activeCompanyId: company.id,
      companyIds: [company.id],
      adminCompanyIds: [company.id],
      projectIds: [],
    });

    const project = await createProjectViaApi({
      accessToken: ownerAccessToken,
      label: 'Milestone Entitled',
      myRole: 'contractor',
      homeownerEmail,
    });
    projectId = project.id;

    await setUserContext({
      email: owner.email,
      activeContext: 'company',
      activeCompanyId: company.id,
      companyIds: [company.id],
      adminCompanyIds: [company.id],
      projectIds: [project.id],
    });

    await signInThroughUi(page, owner.email, owner.password);
    await waitForAuthenticatedShell(page);
    await page.goto(`/app/ProjectDetail?id=${project.id}&tab=lavori`);
    await page.waitForLoadState('networkidle');

    const milestonesSection = page.locator('#section-milestones');
    const milestoneTitle = `QA Milestone ${Date.now()}`;

    await expect(page.getByRole('heading', { level: 1, name: project.name })).toBeVisible();
    await expect(milestonesSection.getByText(/premium milestones|milestone premium/i)).toHaveCount(0);
    await milestonesSection.getByRole('button', { name: /^add$|^aggiungi$/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: /new milestone|nuova milestone/i })).toBeVisible();

    await dialog.locator('#title').fill(milestoneTitle);
    await dialog.locator('#description').fill('Milestone created from the entitled project browser regression.');
    await dialog.locator('#start_date').fill('2026-06-10');
    await dialog.locator('#target_date').fill('2026-06-20');

    const createResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/rest/v1/milestones'),
    );

    await dialog.getByRole('button', { name: /^create$|^crea$/i }).click();
    const createResponse = await createResponsePromise;
    expect(createResponse.ok()).toBeTruthy();
    await waitForDialogToClose(dialog);

    await expect.poll(async () => {
      const milestone = await getMilestoneRecordByTitle({ projectId: project.id, title: milestoneTitle });
      return {
        description: milestone.description,
        startDate: milestone.start_date,
        targetDate: milestone.target_date,
        status: milestone.status,
      };
    }).toEqual({
      description: 'Milestone created from the entitled project browser regression.',
      startDate: '2026-06-10',
      targetDate: '2026-06-20',
      status: 'pending',
    });

    await expect(milestonesSection.getByText(milestoneTitle)).toBeVisible();
  } finally {
    if (projectId) {
      await cleanupProjectGraph(projectId);
    }
    if (companyId) {
      await cleanupCompanyGraph(companyId);
    }
    await cleanupUserRecordByEmail(homeownerEmail);
    await cleanupQaUser(owner.id, owner.email);
  }
});