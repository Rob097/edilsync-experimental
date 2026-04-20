import { expect, test } from '@playwright/test';
import {
  cleanupCompanyGraph,
  cleanupProjectGraph,
  cleanupQaUser,
  cleanupUserRecordByEmail,
  createCompanyViaApi,
  createConfirmedQaUser,
  createMilestoneRecordDirect,
  createProjectViaApi,
  createTaskRecordDirect,
  getTaskRecordByTitle,
  hasRemoteQaEnv,
  setUserContext,
  signInForAccessToken,
  signInThroughUi,
  upsertCompanySubscription,
  waitForAuthenticatedShell,
  waitForDialogToClose,
} from './helpers/qa-auth';

// Scenario IDs: task.milestone.link-unlink

test.skip(!hasRemoteQaEnv, 'Remote QA browser tests require Supabase branch credentials.');

test('project owner can link and unlink a task to a milestone from the UI', async ({ page }) => {
  const owner = await createConfirmedQaUser('task-milestone-owner');
  const homeownerEmail = `qa-task-milestone-homeowner-${Date.now()}@edilsync.test`;
  let companyId: string | null = null;
  let projectId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const sponsorCompany = await createCompanyViaApi({
      accessToken: ownerAccessToken,
      label: 'Task Milestone',
      email: owner.email,
    });
    companyId = sponsorCompany.id;

    await upsertCompanySubscription({
      companyId: sponsorCompany.id,
      planCode: 'paid',
      billingStatus: 'active',
      billingCycle: 'monthly',
    });

    await setUserContext({
      email: owner.email,
      activeContext: 'company',
      activeCompanyId: sponsorCompany.id,
      companyIds: [sponsorCompany.id],
      adminCompanyIds: [sponsorCompany.id],
      projectIds: [],
    });

    const project = await createProjectViaApi({
      accessToken: ownerAccessToken,
      label: 'Task Milestone',
      myRole: 'contractor',
      homeownerEmail,
    });
    projectId = project.id;

    await setUserContext({
      email: owner.email,
      activeContext: 'company',
      activeCompanyId: sponsorCompany.id,
      companyIds: [sponsorCompany.id],
      adminCompanyIds: [sponsorCompany.id],
      projectIds: [project.id],
    });

    const milestoneTitle = `QA Linked Milestone ${Date.now()}`;
    const taskTitle = `QA Task Link ${Date.now()}`;
    const milestone = await createMilestoneRecordDirect({
      projectId: project.id,
      title: milestoneTitle,
      description: 'Milestone used to validate task linking from the browser.',
      startDate: '2026-07-01',
      targetDate: '2026-07-10',
    });

    await createTaskRecordDirect({
      projectId: project.id,
      title: taskTitle,
      createdBy: owner.email,
      description: 'Task used to validate milestone linking from the browser.',
      status: 'not_started',
    });

    await signInThroughUi(page, owner.email, owner.password);
    await waitForAuthenticatedShell(page);
    await page.goto(`/app/ProjectDetail?id=${project.id}&tab=lavori&section=tasks`);
    await page.waitForLoadState('networkidle');

    const tasksSection = page.locator('#section-tasks');
    await expect(page.getByRole('heading', { level: 1, name: project.name })).toBeVisible();
    await tasksSection.getByRole('button', { name: /list view|vista lista/i }).click();
    await tasksSection.getByText(taskTitle).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: /edit task|modifica task/i })).toBeVisible();

    await dialog.getByRole('combobox').nth(1).click();
    await page.getByRole('option', { name: new RegExp(milestoneTitle, 'i') }).click();

    const linkResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'PATCH' &&
        response.url().includes('/rest/v1/tasks'),
    );
    await dialog.getByRole('button', { name: /^save$|^salva$/i }).click();
    const linkResponse = await linkResponsePromise;
    expect(linkResponse.ok()).toBeTruthy();
    await waitForDialogToClose(dialog);

    await expect.poll(async () => {
      const task = await getTaskRecordByTitle({ projectId: project.id, title: taskTitle });
      return task.milestone_id;
    }).toBe(milestone.id);

    await tasksSection.getByText(taskTitle).click();
    await expect(dialog.getByRole('heading', { name: /edit task|modifica task/i })).toBeVisible();
    await dialog.getByRole('combobox').nth(1).click();
    await page.getByRole('option', { name: /no milestone|nessuna milestone|none/i }).click();

    const unlinkResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'PATCH' &&
        response.url().includes('/rest/v1/tasks'),
    );
    await dialog.getByRole('button', { name: /^save$|^salva$/i }).click();
    const unlinkResponse = await unlinkResponsePromise;
    expect(unlinkResponse.ok()).toBeTruthy();

    await expect.poll(async () => {
      const task = await getTaskRecordByTitle({ projectId: project.id, title: taskTitle });
      return task.milestone_id;
    }).toBeNull();
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