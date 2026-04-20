import { expect, Page, test } from '@playwright/test';
import {
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

// Scenario IDs: project.participants.list-updates-after-invite, project.participants.reject-duplicate-homeowner, project.participants.reject-duplicate-participant

test.skip(!hasRemoteQaEnv, 'Remote QA browser tests require Supabase branch credentials.');

async function selectDialogComboboxOption(page: Page, index: number, optionLabel: RegExp | string) {
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox').nth(index).click();
  await page.getByRole('option', { name: optionLabel }).click();
}

async function openProjectParticipantsSection(page: Page) {
  await page.getByRole('tab', { name: /info & team|info e team/i }).click();
  await expect(page.getByRole('button', { name: /invita|invite/i })).toBeVisible();
}

function getInfoTeamPanel(page: Page) {
  return page.getByRole('tabpanel', { name: /info & team|info e team/i });
}

test('project participant list updates after inviting a company from the UI', async ({ page }) => {
  const owner = await createConfirmedQaUser('project-invite-owner');
  const invitedCompanyAdmin = await createConfirmedQaUser('project-invite-company-admin');
  let companyId: string | null = null;
  let projectId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const invitedCompanyAccessToken = await signInForAccessToken(invitedCompanyAdmin.email, invitedCompanyAdmin.password);
    const company = await createCompanyViaApi({ accessToken: invitedCompanyAccessToken, label: 'Project Invite Target', email: invitedCompanyAdmin.email });
    const project = await createProjectViaApi({ accessToken: ownerAccessToken, label: 'Participant Invite UI' });
    companyId = company.id;
    projectId = project.id;

    await signInThroughUi(page, owner.email, owner.password);
    await waitForAuthenticatedShell(page);
    await page.goto(`/app/ProjectDetail?id=${project.id}`);
    await page.waitForLoadState('networkidle');
    await openProjectParticipantsSection(page);

    await page.getByRole('button', { name: /invita|invite/i }).click();
    await selectDialogComboboxOption(page, 0, new RegExp(company.name, 'i'));
    await selectDialogComboboxOption(page, 1, /^contractor\b/i);

    const inviteResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/functions/v1/inviteProjectParticipantWithValidation'),
    );

    await page.getByRole('dialog').getByRole('button', { name: /invita|invite/i }).click();
    const inviteResponse = await inviteResponsePromise;

    expect(inviteResponse.ok()).toBeTruthy();
    const participant = await getProjectParticipantRecord({
      projectId: project.id,
      companyId: company.id,
    });

    expect(participant.status).toBe('invited');

    const infoTeamPanel = getInfoTeamPanel(page);
    await expect(infoTeamPanel.getByText(/in attesa di conferma|awaiting confirmation/i)).toBeVisible();
    await expect(infoTeamPanel.getByText(company.name, { exact: true })).toBeVisible();
  } finally {
    if (projectId) {
      await cleanupProjectGraph(projectId);
    }
    if (companyId) {
      await cleanupCompanyGraph(companyId);
    }
    await cleanupQaUser(invitedCompanyAdmin.id, invitedCompanyAdmin.email);
    await cleanupQaUser(owner.id, owner.email);
  }
});

test('project invite blocks a duplicate homeowner when one is already canonical', async ({ page }) => {
  const owner = await createConfirmedQaUser('duplicate-homeowner-owner');
  const secondHomeowner = await createConfirmedQaUser('duplicate-homeowner-second');
  let projectId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const project = await createProjectViaApi({ accessToken: ownerAccessToken, label: 'Duplicate Homeowner' });
    projectId = project.id;

    await signInThroughUi(page, owner.email, owner.password);
    await waitForAuthenticatedShell(page);
    await page.goto(`/app/ProjectDetail?id=${project.id}`);
    await page.waitForLoadState('networkidle');
    await openProjectParticipantsSection(page);

    await page.getByRole('button', { name: /invita|invite/i }).click();
    await page.getByRole('dialog').locator('label[for="personal"]').click();
    await page.getByRole('dialog').locator('#email').fill(secondHomeowner.email);
    await selectDialogComboboxOption(page, 0, /^(committente|homeowner)\b/i);

    const inviteResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/functions/v1/inviteProjectParticipantWithValidation'),
    );

    await page.getByRole('dialog').getByRole('button', { name: /invita|invite/i }).click();
    const inviteResponse = await inviteResponsePromise;

    expect(inviteResponse.status()).toBe(409);
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').locator('#email')).toHaveValue(secondHomeowner.email);
  } finally {
    if (projectId) {
      await cleanupProjectGraph(projectId);
    }
    await cleanupQaUser(secondHomeowner.id, secondHomeowner.email);
    await cleanupQaUser(owner.id, owner.email);
  }
});

test('project invite blocks a duplicate company participant from the UI', async ({ page }) => {
  const owner = await createConfirmedQaUser('duplicate-participant-owner');
  const invitedCompanyAdmin = await createConfirmedQaUser('duplicate-participant-company-admin');
  let companyId: string | null = null;
  let projectId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const invitedCompanyAccessToken = await signInForAccessToken(invitedCompanyAdmin.email, invitedCompanyAdmin.password);
    const company = await createCompanyViaApi({ accessToken: invitedCompanyAccessToken, label: 'Duplicate Participant Target', email: invitedCompanyAdmin.email });
    const project = await createProjectViaApi({ accessToken: ownerAccessToken, label: 'Duplicate Participant' });
    companyId = company.id;
    projectId = project.id;

    await signInThroughUi(page, owner.email, owner.password);
    await waitForAuthenticatedShell(page);
    await page.goto(`/app/ProjectDetail?id=${project.id}`);
    await page.waitForLoadState('networkidle');
    await openProjectParticipantsSection(page);

    await page.getByRole('button', { name: /invita|invite/i }).click();
    await selectDialogComboboxOption(page, 0, new RegExp(company.name, 'i'));
    await selectDialogComboboxOption(page, 1, /^contractor\b/i);

    const firstInviteResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/functions/v1/inviteProjectParticipantWithValidation'),
    );

    await page.getByRole('dialog').getByRole('button', { name: /invita|invite/i }).click();
    const firstInviteResponse = await firstInviteResponsePromise;
    expect(firstInviteResponse.ok()).toBeTruthy();
    const participant = await getProjectParticipantRecord({
      projectId: project.id,
      companyId: company.id,
    });

    expect(participant.status).toBe('invited');
    await expect(getInfoTeamPanel(page).getByText(company.name, { exact: true })).toBeVisible();

    await page.getByRole('button', { name: /invita|invite/i }).click();
    await selectDialogComboboxOption(page, 0, new RegExp(company.name, 'i'));
    await selectDialogComboboxOption(page, 1, /^contractor\b/i);

    const duplicateInviteResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/functions/v1/inviteProjectParticipantWithValidation'),
    );

    await page.getByRole('dialog').getByRole('button', { name: /invita|invite/i }).click();
    const duplicateInviteResponse = await duplicateInviteResponsePromise;

    expect(duplicateInviteResponse.status()).toBe(409);
    await expect(page.getByRole('dialog')).toBeVisible();
  } finally {
    if (projectId) {
      await cleanupProjectGraph(projectId);
    }
    if (companyId) {
      await cleanupCompanyGraph(companyId);
    }
    await cleanupQaUser(invitedCompanyAdmin.id, invitedCompanyAdmin.email);
    await cleanupQaUser(owner.id, owner.email);
  }
});