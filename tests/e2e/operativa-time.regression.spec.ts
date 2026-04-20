import { expect, test } from '@playwright/test';
import {
  cleanupCompanyGraph,
  cleanupProjectGraph,
  cleanupQaUser,
  createCompanyViaApi,
  createConfirmedQaUser,
  createEventRecord,
  createProjectViaApi,
  createTaskRecordDirect,
  getLatestWorkSessionForUser,
  getProjectParticipantRecord,
  hasRemoteQaEnv,
  setUserContext,
  signInForAccessToken,
  signInThroughUi,
  upsertCompanySubscription,
  waitForAuthenticatedShell,
} from './helpers/qa-auth';

// Scenario IDs: operativa.day-summary-shows-today-tasks-and-events

test.skip(!hasRemoteQaEnv, 'Remote QA browser tests require Supabase branch credentials.');

async function createPaidCompanyProject({
  owner,
  label,
}: {
  owner: { email: string; password: string };
  label: string;
}) {
  const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
  const company = await createCompanyViaApi({
    accessToken: ownerAccessToken,
    label,
    email: owner.email,
  });

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
    label,
    myRole: 'contractor',
    homeownerEmail: `qa-operativa-homeowner-${Date.now()}@edilsync.test`,
  });

  await setUserContext({
    email: owner.email,
    activeContext: 'company',
    activeCompanyId: company.id,
    companyIds: [company.id],
    adminCompanyIds: [company.id],
    projectIds: [project.id],
  });

  return { company, project };
}

test('company user can clock in and clock out from the operative company workspace', async ({ page }) => {
  const owner = await createConfirmedQaUser('operativa-clock-owner');
  let companyId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const company = await createCompanyViaApi({
      accessToken: ownerAccessToken,
      label: 'Operativa Clock',
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
    await page.goto('/app/operativa/societa');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('main').getByText(company.name)).toBeVisible();
    await page.getByRole('button', { name: /tracking|timbrature/i }).click();
    await expect(page.getByText(/timbratura rapida|quick clock-in\/out/i)).toBeVisible();
    await expect(page.getByText(/nessuna sessione aperta|no open session/i)).toBeVisible();

    await page.getByRole('button', { name: /^clock-in$/i }).click();

    await expect(page.getByText(/sessione aperta|open session/i)).toBeVisible();
    await expect.poll(async () => {
      try {
        const session = await getLatestWorkSessionForUser({ companyId: company.id, email: owner.email });
        return session.ended_at === null;
      } catch {
        return false;
      }
    }).toBe(true);

    await page.getByRole('button', { name: /^clock-out$/i }).click();

    await expect(page.getByText(/nessuna sessione aperta|no open session/i)).toBeVisible();
    await expect.poll(async () => {
      const session = await getLatestWorkSessionForUser({ companyId: company.id, email: owner.email });
      return Boolean(session.ended_at);
    }).toBe(true);
  } finally {
    if (companyId) {
      await cleanupCompanyGraph(companyId);
    }
    await cleanupQaUser(owner.id, owner.email);
  }
});

test('operative day summary shows today tasks and events and can open the project workspace', async ({ page }) => {
  const owner = await createConfirmedQaUser('operativa-day-summary');
  let companyId: string | null = null;
  let projectId: string | null = null;

  try {
    const { company, project } = await createPaidCompanyProject({
      owner,
      label: 'Operativa Day Summary',
    });
    companyId = company.id;
    projectId = project.id;

    const companyParticipant = await getProjectParticipantRecord({
      projectId: project.id,
      companyId: company.id,
    });

    const taskTitle = `QA Today Task ${Date.now()}`;
    await createTaskRecordDirect({
      projectId: project.id,
      title: taskTitle,
      createdBy: owner.email,
      status: 'not_started',
      assignedParticipantId: companyParticipant.id,
      assignedParticipantType: 'company',
      assignedCompanyId: company.id,
      assignedCompanyName: company.name,
      dueDate: new Date().toISOString().slice(0, 10),
    });

    await createEventRecord({
      title: `QA Today Event ${Date.now()}`,
      creatorEmail: owner.email,
      creatorName: owner.email,
      ownerType: 'company',
      ownerCompanyId: company.id,
    });

    await signInThroughUi(page, owner.email, owner.password);
    await waitForAuthenticatedShell(page);
    await page.goto('/app/operativa/riepilogo');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('main').getByText(/riepilogo|day summary/i).first()).toBeVisible();
    await expect(page.locator('main').getByText(/^attivita di oggi$|^attività di oggi$|^today tasks$|^today's tasks$/i).first()).toBeVisible();
    await expect(page.locator('main').getByText(/^eventi di oggi$|^today events$|^today's events$/i)).toBeVisible();
    await expect(page.getByText(taskTitle)).toBeVisible();

    await page.getByText(taskTitle).click();
    await page.waitForURL(new RegExp(`/app/operativa/progetto/${project.id}`));
    await expect(page.getByText(project.name)).toBeVisible();
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