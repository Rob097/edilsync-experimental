import { expect, test } from '@playwright/test';
import {
  cleanupProjectGraph,
  cleanupQaUser,
  createConfirmedQaUser,
  createDisputeCaseDirect,
  createDisputeEventDirect,
  createProjectViaApi,
  createTaskRecordDirect,
  getDisputeCaseByTaskId,
  getDisputeCaseByTitle,
  getDisputeEvidenceRecord,
  getProjectPersonalParticipantRecord,
  getTaskRecordByTitle,
  hasRemoteQaEnv,
  listDisputeEvents,
  setUserContext,
  signInForAccessToken,
  signInThroughUi,
  waitForAuthenticatedShell,
} from './helpers/qa-auth';

// Scenario IDs: dispute.project.create, dispute.task-blocked.create, dispute.comment-and-status

test.skip(!hasRemoteQaEnv, 'Remote QA browser tests require Supabase branch credentials.');

test('project participant can open a dispute directly from the project UI', async ({ page }) => {
  const owner = await createConfirmedQaUser('dispute-project-owner');
  let projectId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const project = await createProjectViaApi({
      accessToken: ownerAccessToken,
      label: 'Dispute Project Create',
    });
    projectId = project.id;

    await setUserContext({
      email: owner.email,
      activeContext: 'personal',
      activeCompanyId: null,
      companyIds: [],
      adminCompanyIds: [],
      projectIds: [project.id],
    });

    await signInThroughUi(page, owner.email, owner.password);
    await waitForAuthenticatedShell(page);
    await page.goto(`/app/ProjectDetail?id=${project.id}&tab=lavori&section=disputes`);
    await page.waitForLoadState('networkidle');

    const disputesSection = page.locator('#section-disputes');
    const disputeTitle = `QA Project Dispute ${Date.now()}`;
    const disputeSummary = 'Project-level dispute opened from browser regression.';

    await disputesSection.getByRole('button', { name: /new dispute|nuova disputa/i }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: /new dispute|nuova disputa/i })).toBeVisible();
    await dialog.locator('input').first().fill(disputeTitle);
    await dialog.locator('textarea').first().fill(disputeSummary);
    await dialog.getByRole('combobox').click();
    await page.getByRole('option', { name: /cost|costo/i }).click();
    await dialog.locator('input[type="number"]').nth(0).fill('2400');
    await dialog.locator('input[type="number"]').nth(1).fill('6');

    const createResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/rest/v1/dispute_cases'),
    );
    await dialog.getByRole('button', { name: /open dispute|apri disputa/i }).click();
    const createResponse = await createResponsePromise;
    expect(createResponse.ok()).toBeTruthy();

    await expect.poll(async () => {
      const dispute = await getDisputeCaseByTitle({ projectId: project.id, title: disputeTitle });
      const events = await listDisputeEvents({ disputeCaseId: dispute.id, eventType: 'opened' });
      return {
        status: dispute.status,
        category: dispute.category,
        amountImpact: dispute.amount_impact,
        timeImpactDays: dispute.time_impact_days,
        openedEvents: events.length,
      };
    }).toEqual({
      status: 'open',
      category: 'cost',
      amountImpact: 2400,
      timeImpactDays: 6,
      openedEvents: 1,
    });

    await expect(disputesSection.getByText(disputeTitle)).toBeVisible();
  } finally {
    if (projectId) {
      await cleanupProjectGraph(projectId);
    }
    await cleanupQaUser(owner.id, owner.email);
  }
});

test('blocking a task can open a linked dispute with automatic task evidence', async ({ page }) => {
  const owner = await createConfirmedQaUser('dispute-task-owner');
  let projectId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const project = await createProjectViaApi({
      accessToken: ownerAccessToken,
      label: 'Dispute Task Create',
    });
    projectId = project.id;

    await setUserContext({
      email: owner.email,
      activeContext: 'personal',
      activeCompanyId: null,
      companyIds: [],
      adminCompanyIds: [],
      projectIds: [project.id],
    });

    const taskTitle = `QA Blocked Task ${Date.now()}`;
    const blockedReason = 'Waiting for approved structural revision before proceeding.';
    await createTaskRecordDirect({
      projectId: project.id,
      title: taskTitle,
      createdBy: owner.email,
      description: 'Task used to validate dispute creation from a blocked task.',
      status: 'not_started',
    });

    await signInThroughUi(page, owner.email, owner.password);
    await waitForAuthenticatedShell(page);
    await page.goto(`/app/ProjectDetail?id=${project.id}&tab=lavori&section=tasks`);
    await page.waitForLoadState('networkidle');

    const tasksSection = page.locator('#section-tasks');
    await tasksSection.getByRole('button', { name: /list view|vista lista/i }).click();
    await tasksSection.getByText(taskTitle).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: /edit task|modifica task/i })).toBeVisible();

    await dialog.getByRole('combobox').first().click();
    await page.getByRole('option', { name: /blocked|bloccat/i }).click();
    await dialog.locator('#blocked_reason').fill(blockedReason);
    await dialog.locator('#blocked_by_select').click();
    await page.getByRole('option', { name: /someone else|qualcun altro/i }).click();
    await dialog.locator('#blocked_by_other').fill('QA External Blocker');
    const linkedDisputeCheckbox = dialog.locator('#create_linked_dispute');
    await linkedDisputeCheckbox.click();
    await expect(linkedDisputeCheckbox).toHaveAttribute('data-state', 'checked');

    const saveResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'PATCH' &&
        response.url().includes('/rest/v1/tasks'),
    );
    const disputeResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/rest/v1/dispute_cases'),
    );
    await dialog.getByRole('button', { name: /^save$|^salva$/i }).click();
    const saveResponse = await saveResponsePromise;
    const disputeResponse = await disputeResponsePromise;
    expect(saveResponse.ok()).toBeTruthy();
    expect(disputeResponse.ok()).toBeTruthy();

    const taskRecord = await getTaskRecordByTitle({ projectId: project.id, title: taskTitle });
    await expect.poll(async () => {
      const task = await getTaskRecordByTitle({ projectId: project.id, title: taskTitle });
      const dispute = await getDisputeCaseByTaskId({ projectId: project.id, taskId: task.id });
      return {
        taskStatus: task.status,
        taskBlockedReason: task.blocked_reason,
        disputeTaskId: dispute.task_id,
        disputeSummary: dispute.summary,
      };
    }, { timeout: 15000 }).toEqual({
      taskStatus: 'blocked',
      taskBlockedReason: blockedReason,
      disputeTaskId: taskRecord.id,
      disputeSummary: blockedReason,
    });
  } finally {
    if (projectId) {
      await cleanupProjectGraph(projectId);
    }
    await cleanupQaUser(owner.id, owner.email);
  }
});

test('project participant can comment on a dispute and change its status from the UI', async ({ page }) => {
  const owner = await createConfirmedQaUser('dispute-comment-owner');
  let projectId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const project = await createProjectViaApi({
      accessToken: ownerAccessToken,
      label: 'Dispute Comment Status',
    });
    projectId = project.id;

    const currentParticipant = await getProjectPersonalParticipantRecord({
      projectId: project.id,
      email: owner.email,
    });
    const disputeTitle = `QA Dispute Thread ${Date.now()}`;
    const dispute = await createDisputeCaseDirect({
      projectId: project.id,
      title: disputeTitle,
      summary: 'Dispute prepared to validate comment and status flows.',
      category: 'quality',
      openedByParticipantId: currentParticipant.id,
    });
    await createDisputeEventDirect({
      disputeCaseId: dispute.id,
      projectId: project.id,
      actorParticipantId: currentParticipant.id,
      eventType: 'opened',
      note: dispute.summary,
    });

    await setUserContext({
      email: owner.email,
      activeContext: 'personal',
      activeCompanyId: null,
      companyIds: [],
      adminCompanyIds: [],
      projectIds: [project.id],
    });

    await signInThroughUi(page, owner.email, owner.password);
    await waitForAuthenticatedShell(page);
    await page.goto(`/app/ProjectDetail?id=${project.id}&tab=lavori&section=disputes`);
    await page.waitForLoadState('networkidle');

    const disputesSection = page.locator('#section-disputes');
    const disputeCard = disputesSection.locator(`#dispute-${dispute.id}`);
    const commentText = `QA dispute comment ${Date.now()}`;

    await disputeCard.getByRole('combobox').click();
    await page.getByRole('option', { name: /resolved|risolt/i }).click();

    await expect.poll(async () => {
      const updated = await getDisputeCaseByTitle({ projectId: project.id, title: disputeTitle });
      const statusEvents = await listDisputeEvents({ disputeCaseId: updated.id });
      return {
        status: updated.status,
        hasResolvedEvent: statusEvents.some((event) => event.event_type === 'resolved' || event.note === 'resolved'),
      };
    }).toEqual({
      status: 'resolved',
      hasResolvedEvent: true,
    });

    await disputeCard.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: new RegExp(disputeTitle, 'i') })).toBeVisible();
    await dialog.locator('textarea').last().fill(commentText);
    await dialog.getByRole('button', { name: /publish comment|pubblica commento/i }).click();

    await expect.poll(async () => {
      const events = await listDisputeEvents({ disputeCaseId: dispute.id });
      return {
        commentCount: events.filter((event) => event.event_type === 'commented' && event.note === commentText).length,
        resolvedCount: events.filter((event) => event.event_type === 'resolved' || event.note === 'resolved').length,
      };
    }).toEqual({
      commentCount: 1,
      resolvedCount: 1,
    });

    await expect(dialog.getByText(commentText)).toBeVisible();
  } finally {
    if (projectId) {
      await cleanupProjectGraph(projectId);
    }
    await cleanupQaUser(owner.id, owner.email);
  }
});