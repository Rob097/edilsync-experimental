import { expect, test } from '@playwright/test';
import {
  cleanupCompanyGraph,
  cleanupProjectGraph,
  cleanupQaUser,
  createCompanyViaApi,
  createConfirmedQaUser,
  createProjectViaApi,
  createTaskRecordDirect,
  getProjectParticipantRecord,
  hasRemoteQaEnv,
  setUserContext,
  signInForAccessToken,
  signInThroughUi,
  upsertCompanySubscription,
  waitForAuthenticatedShell,
} from './helpers/qa-auth';

// Scenario IDs: operativa.entry-loads-company-workspaces-only

test.skip(!hasRemoteQaEnv, 'Remote QA browser tests require Supabase branch credentials.');

test('company context user can open the operative company workspace from the operational entry page', async ({ page }) => {
  const owner = await createConfirmedQaUser('operativa-company-workspace');
  let companyId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const company = await createCompanyViaApi({
      accessToken: ownerAccessToken,
      label: 'Operativa Company Workspace',
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

    await signInThroughUi(page, owner.email, owner.password);
    await waitForAuthenticatedShell(page);
    await page.goto('/app/operativa');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/come vuoi iniziare|how do you want to start/i)).toBeVisible();
    await expect(page.getByText(/scegli cantiere|select worksite/i)).toBeVisible();

    await page.getByRole('button', { name: /societ|company/i }).click();
    await page.waitForURL(/\/app\/operativa\/societa$/);

    await expect(page.locator('main').getByText(company.name)).toBeVisible();
    await page.getByRole('button', { name: /tracking|timbrature/i }).click();
    await expect(page.getByText(/timbratura rapida|quick clock-in\/out/i)).toBeVisible();
    await expect(page.getByText(/gps attivo se disponibile|gps enabled when available/i)).toBeVisible();
  } finally {
    if (companyId) {
      await cleanupCompanyGraph(companyId);
    }
    await cleanupQaUser(owner.id, owner.email);
  }
});

test('company context user can load the operative project workspace with today and work sections', async ({ page }) => {
  const owner = await createConfirmedQaUser('operativa-project-workspace');
  let companyId: string | null = null;
  let projectId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const company = await createCompanyViaApi({
      accessToken: ownerAccessToken,
      label: 'Operativa Project Workspace',
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
      label: 'Operativa Project Workspace',
      myRole: 'contractor',
      homeownerEmail: `qa-operativa-workspace-homeowner-${Date.now()}@edilsync.test`,
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

    const companyParticipant = await getProjectParticipantRecord({
      projectId: project.id,
      companyId: company.id,
    });
    const taskTitle = `QA Operative Project Task ${Date.now()}`;

    await createTaskRecordDirect({
      projectId: project.id,
      title: taskTitle,
      createdBy: owner.email,
      status: 'in_progress',
      assignedParticipantId: companyParticipant.id,
      assignedParticipantType: 'company',
      assignedCompanyId: company.id,
      assignedCompanyName: company.name,
      dueDate: new Date().toISOString().slice(0, 10),
    });

    await signInThroughUi(page, owner.email, owner.password);
    await waitForAuthenticatedShell(page);
    await page.goto(`/app/operativa/progetto/${project.id}`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('main').getByText(project.name)).toBeVisible();
    await expect(page.getByRole('button', { name: /^oggi$|^today$/i })).toBeVisible();
    await expect(page.getByText(taskTitle)).toBeVisible();

    await page.getByRole('button', { name: /^lavoro$|^work$/i }).click();
    await expect(page.locator('main').getByText(/^storia attivita$|^activity history$/i)).toBeVisible();
    await expect(page.locator('main').getByText(/^attivita$|^tasks$/i)).toBeVisible();
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