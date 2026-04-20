import { expect, test } from '@playwright/test';
import {
  addProjectCompanyParticipant,
  addProjectPersonalParticipant,
  cleanupCompanyGraph,
  cleanupProjectGraph,
  cleanupQaUser,
  createCompanyViaApi,
  createConfirmedQaUser,
  createProjectViaApi,
  createTaskRecordDirect,
  getTaskRecordByTitle,
  getProjectPersonalParticipantRecord,
  getProjectParticipantRecord,
  hasRemoteQaEnv,
  setUserContext,
  signInForAccessToken,
  signInThroughUi,
  waitForAuthenticatedShell,
  waitForDialogToClose,
} from './helpers/qa-auth';

// Scenario IDs: task.create.personal-assignee, task.create.company-assignee, task.status.change-standard, task.block.with-reason

test.skip(!hasRemoteQaEnv, 'Remote QA browser tests require Supabase branch credentials.');

test('project owner can create a task assigned to a personal participant from the UI', async ({ page }) => {
  const owner = await createConfirmedQaUser('task-owner');
  const assignee = await createConfirmedQaUser('task-assignee');
  const assigneeNameOrEmailPattern = new RegExp(
    `QA E2E task-assignee|${assignee.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
    'i',
  );
  let projectId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const project = await createProjectViaApi({
      accessToken: ownerAccessToken,
      label: 'Task Personal Assignee',
    });
    projectId = project.id;

    await addProjectPersonalParticipant({
      projectId: project.id,
      userId: assignee.id,
      email: assignee.email,
      projectRole: 'consultant',
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
    await page.goto(`/app/ProjectDetail?id=${project.id}&tab=lavori`);
    await page.waitForLoadState('networkidle');

    const taskTitle = `QA Task Personal ${Date.now()}`;
    const dueDate = '2026-05-15';
    const tasksSection = page.locator('#section-tasks');

    await expect(page.getByRole('heading', { level: 1, name: project.name })).toBeVisible();
    await tasksSection.getByRole('button', { name: /new task|nuova attivit|create task|crea attivit/i }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: /new task|nuovo task/i })).toBeVisible();

    await dialog.locator('#title').fill(taskTitle);
    await dialog.locator('#description').fill('Personal assignee task created from browser regression.');
    await dialog.locator('#room_area').fill('Kitchen');
    await dialog.locator('#due_date').fill(dueDate);

    const assigneeTrigger = dialog.getByRole('button', { name: /none|nessuno/i }).first();
    await assigneeTrigger.click();
  await dialog.getByRole('button', { name: assigneeNameOrEmailPattern }).click();

    const createResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/rest/v1/tasks'),
    );
    await dialog.getByRole('button', { name: /^create$|^crea$/i }).click();
    const createResponse = await createResponsePromise;
    expect(createResponse.ok()).toBeTruthy();
    await waitForDialogToClose(dialog);

    await expect.poll(async () => {
      const task = await getTaskRecordByTitle({ projectId: project.id, title: taskTitle });
      return {
        assignedUserEmail: task.assigned_user_email,
        assignedParticipantType: task.assigned_participant_type,
        roomArea: task.room_area,
        dueDate: task.due_date,
      };
    }).toEqual({
      assignedUserEmail: assignee.email,
      assignedParticipantType: 'personal',
      roomArea: 'Kitchen',
      dueDate,
    });

    await expect(tasksSection.getByText(taskTitle)).toBeVisible();
  } finally {
    if (projectId) {
      await cleanupProjectGraph(projectId);
    }
    await cleanupQaUser(assignee.id, assignee.email);
    await cleanupQaUser(owner.id, owner.email);
  }
});

test('project owner can create a task assigned to a company participant from the UI', async ({ page }) => {
  const owner = await createConfirmedQaUser('task-company-owner');
  let projectId: string | null = null;
  let companyId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const project = await createProjectViaApi({
      accessToken: ownerAccessToken,
      label: 'Task Company Assignee',
    });
    projectId = project.id;

    const company = await createCompanyViaApi({
      accessToken: ownerAccessToken,
      label: 'Task Company Assignee',
      email: owner.email,
    });
    companyId = company.id;

    await addProjectCompanyParticipant({
      projectId: project.id,
      companyId: company.id,
      projectRole: 'contractor',
    });

    await setUserContext({
      email: owner.email,
      activeContext: 'personal',
      activeCompanyId: null,
      companyIds: [company.id],
      adminCompanyIds: [company.id],
      projectIds: [project.id],
    });

    await signInThroughUi(page, owner.email, owner.password);
    await waitForAuthenticatedShell(page);
    await page.goto(`/app/ProjectDetail?id=${project.id}&tab=lavori`);
    await page.waitForLoadState('networkidle');

    const taskTitle = `QA Task Company ${Date.now()}`;
    const tasksSection = page.locator('#section-tasks');

    await expect(page.getByRole('heading', { level: 1, name: project.name })).toBeVisible();
    await tasksSection.getByRole('button', { name: /new task|nuova attivit|create task|crea attivit/i }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: /new task|nuovo task/i })).toBeVisible();

    await dialog.locator('#title').fill(taskTitle);
    await dialog.locator('#description').fill('Company assignee task created from browser regression.');

    await dialog.getByRole('button', { name: /none|nessuno/i }).click();
    await dialog.getByRole('button', { name: new RegExp(company.name, 'i') }).click();

    const createResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/rest/v1/tasks'),
    );
    await dialog.getByRole('button', { name: /^create$|^crea$/i }).click();
    const createResponse = await createResponsePromise;
    expect(createResponse.ok()).toBeTruthy();

    await expect.poll(async () => {
      const task = await getTaskRecordByTitle({ projectId: project.id, title: taskTitle });
      return {
        assignedCompanyId: task.assigned_company_id,
        assignedParticipantType: task.assigned_participant_type,
      };
    }).toEqual({
      assignedCompanyId: company.id,
      assignedParticipantType: 'company',
    });

    await expect(tasksSection.getByText(taskTitle)).toBeVisible();
    await expect(getProjectParticipantRecord({ projectId: project.id, companyId: company.id })).resolves.toBeTruthy();
  } finally {
    if (projectId) {
      await cleanupProjectGraph(projectId);
    }
    if (companyId) {
      await cleanupCompanyGraph(companyId);
    }
    await cleanupQaUser(owner.id, owner.email);
  }
});

test('project owner can change a task status from not started to completed from the UI', async ({ page }) => {
  const owner = await createConfirmedQaUser('task-status-owner');
  let projectId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const project = await createProjectViaApi({
      accessToken: ownerAccessToken,
      label: 'Task Status Change',
    });
    projectId = project.id;

    const taskTitle = `QA Task Status ${Date.now()}`;
    await createTaskRecordDirect({
      projectId: project.id,
      title: taskTitle,
      createdBy: owner.email,
      description: 'Task that will be completed from the UI.',
      status: 'not_started',
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
    await page.goto(`/app/ProjectDetail?id=${project.id}&tab=lavori`);
    await page.waitForLoadState('networkidle');

    const tasksSection = page.locator('#section-tasks');

    await expect(page.getByRole('heading', { level: 1, name: project.name })).toBeVisible();
    await tasksSection.getByRole('button', { name: /list view|vista lista/i }).click();
    await tasksSection.getByText(taskTitle).click();

    const dialog = page.getByRole('dialog', { name: /edit task|modifica task/i });
    await expect(dialog).toBeVisible();

    await dialog.getByRole('combobox').first().click();
    await page.getByRole('option', { name: /completed|completato/i }).click();

    const updateResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'PATCH' &&
        response.url().includes('/rest/v1/tasks'),
    );
    await dialog.getByRole('button', { name: /^save$|^salva$/i }).click();
    const updateResponse = await updateResponsePromise;
    expect(updateResponse.ok()).toBeTruthy();

    await expect.poll(async () => {
      const task = await getTaskRecordByTitle({ projectId: project.id, title: taskTitle });
      return task.status;
    }).toBe('completed');

    await waitForDialogToClose(dialog);
    await expect(tasksSection.getByText(/^completed$|^completato$/i).first()).toBeVisible();
  } finally {
    if (projectId) {
      await cleanupProjectGraph(projectId);
    }
    await cleanupQaUser(owner.id, owner.email);
  }
});

test('project owner can block an existing task with a reason and responsible party from the UI', async ({ page }) => {
  const owner = await createConfirmedQaUser('task-block-owner');
  const participant = await createConfirmedQaUser('task-block-participant');
  const participantNameOrEmailPattern = new RegExp(
    `QA E2E task-block-participant|${participant.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
    'i',
  );
  let projectId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const project = await createProjectViaApi({
      accessToken: ownerAccessToken,
      label: 'Task Block',
    });
    projectId = project.id;

    const personalParticipant = await addProjectPersonalParticipant({
      projectId: project.id,
      userId: participant.id,
      email: participant.email,
      projectRole: 'consultant',
    });

    const taskTitle = `QA Task Block ${Date.now()}`;
    await createTaskRecordDirect({
      projectId: project.id,
      title: taskTitle,
      createdBy: owner.email,
      description: 'Task that will be blocked from the UI.',
      status: 'not_started',
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
    await page.goto(`/app/ProjectDetail?id=${project.id}&tab=lavori`);
    await page.waitForLoadState('networkidle');
    const tasksSection = page.locator('#section-tasks');

    await expect(page.getByRole('heading', { level: 1, name: project.name })).toBeVisible();
    await tasksSection.getByRole('button', { name: /list view|vista lista/i }).click();
    await tasksSection.getByText(taskTitle).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: /edit task|modifica task/i })).toBeVisible();

    await dialog.getByRole('combobox').first().click();
    await page.getByRole('option', { name: /blocked|bloccato/i }).click();
    await dialog.locator('#blocked_reason').fill('Waiting for final material approval.');

    await dialog.locator('#blocked_by_select').click();
    await page.getByRole('option', { name: participantNameOrEmailPattern }).click();

    const updateResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'PATCH' &&
        response.url().includes('/rest/v1/tasks'),
    );
    await dialog.getByRole('button', { name: /^save$|^salva$/i }).click();
    const updateResponse = await updateResponsePromise;
    expect(updateResponse.ok()).toBeTruthy();

    await expect.poll(async () => {
      const task = await getTaskRecordByTitle({ projectId: project.id, title: taskTitle });
      return {
        status: task.status,
        blockedReason: task.blocked_reason,
        blockedByEmail: task.blocked_by_email,
        blockedByName: task.blocked_by_name,
      };
    }).toEqual({
      status: 'blocked',
      blockedReason: 'Waiting for final material approval.',
      blockedByEmail: participant.email,
      blockedByName: 'QA E2E task-block-participant',
    });

    await dialog.getByRole('button', { name: /cancel|annulla/i }).click();

    await expect(tasksSection.getByText(/blocked by|bloccato da/i)).toBeVisible();
    await expect(tasksSection.getByText('Waiting for final material approval.')).toBeVisible();
    expect(personalParticipant.id).toBeTruthy();
    await expect(getProjectPersonalParticipantRecord({ projectId: project.id, email: participant.email })).resolves.toBeTruthy();
  } finally {
    if (projectId) {
      await cleanupProjectGraph(projectId);
    }
    await cleanupQaUser(participant.id, participant.email);
    await cleanupQaUser(owner.id, owner.email);
  }
});