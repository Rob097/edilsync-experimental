import { expect, test } from '@playwright/test';
import {
  cleanupCompanyGraph,
  cleanupProjectGraph,
  cleanupQaUser,
  cleanupUserRecordByEmail,
  createCompanyViaApi,
  createConfirmedQaUser,
  getProjectParticipantRecord,
  getProjectPersonalParticipantRecord,
  getProjectRecord,
  hasRemoteQaEnv,
  setUserContext,
  signInForAccessToken,
  signInThroughUi,
  waitForAuthenticatedShell,
} from './helpers/qa-auth';

// Scenario IDs: project.create.company-contractor-flow, project.create.company-flow-invites-homeowner

test.skip(!hasRemoteQaEnv, 'Remote QA browser tests require Supabase branch credentials.');

test('company admin can create a contractor project from the UI and invite the homeowner during creation', async ({ page }) => {
  const owner = await createConfirmedQaUser('project-company-create');
  const homeownerEmail = `qa-company-project-homeowner-${Date.now()}@edilsync.test`;
  let companyId: string | null = null;
  let projectId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const company = await createCompanyViaApi({
      accessToken: ownerAccessToken,
      label: 'Project Company Create',
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

    await signInThroughUi(page, owner.email, owner.password);
    await waitForAuthenticatedShell(page);
    await page.goto('/app/NewProject');
    await page.waitForLoadState('networkidle');

    const projectName = `QA UI Company Project ${Date.now()}`;

    await expect(page.getByRole('main')).toContainText(company.name);
    await page.locator('#name').fill(projectName);
    await page.locator('#address').fill('Via Contractor UI 12, Milano');
    await page.locator('#description').fill('Company-context contractor project created from the browser.');

    await page.getByRole('combobox').nth(0).click();
    await page.getByRole('option', { name: /^contractor$/i }).click();
    await page.locator('#homeowner_email').fill(homeownerEmail);

    const createResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/functions/v1/createProjectWithContext'),
    );

    await page.getByRole('button', { name: /create worksite|crea cantiere/i }).click();
    const createResponse = await createResponsePromise;
    expect(createResponse.ok()).toBeTruthy();

    await expect.poll(() => page.url()).toMatch(/\/app\/ProjectDetail\?id=/);
    projectId = new URL(page.url()).searchParams.get('id');
    expect(projectId).toBeTruthy();
    await expect(page.getByRole('heading', { level: 1, name: projectName })).toBeVisible();

    const project = await getProjectRecord(projectId as string);
    expect(project.owner_type).toBe('company');
    expect(project.owner_company_id).toBe(company.id);

    const contractorParticipant = await getProjectParticipantRecord({
      projectId: projectId as string,
      companyId: company.id,
    });
    expect(contractorParticipant.project_role).toBe('contractor');
    expect(contractorParticipant.status).toBe('active');

    const homeownerParticipant = await getProjectPersonalParticipantRecord({
      projectId: projectId as string,
      email: homeownerEmail,
    });
    expect(homeownerParticipant.project_role).toBe('homeowner');
    expect(homeownerParticipant.status).toBe('invited');
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