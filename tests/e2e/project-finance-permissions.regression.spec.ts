import { expect, test } from '@playwright/test';
import {
  addActiveCompanyMember,
  cleanupCompanyGraph,
  cleanupProjectGraph,
  cleanupQaUser,
  createCompanyViaApi,
  createConfirmedQaUser,
  createProjectViaApi,
  getUserRecordByEmail,
  hasRemoteQaEnv,
  setUserContext,
  signInForAccessToken,
  signInThroughUi,
  updateProjectPersonalParticipantStatus,
  upsertCompanySubscription,
  waitForAuthenticatedShell,
} from './helpers/qa-auth';

// Scenario IDs: finance.permissions.follow-role-and-context

test.skip(!hasRemoteQaEnv, 'Remote QA browser tests require Supabase branch credentials.');

async function createPaidContractorProject({
  owner,
  label,
  homeownerEmail,
}: {
  owner: { email: string; password: string };
  label: string;
  homeownerEmail: string;
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
    homeownerEmail,
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

test('homeowner sees project finance as read-only on an entitled project', async ({ page }) => {
  const owner = await createConfirmedQaUser('finance-homeowner-owner');
  const homeowner = await createConfirmedQaUser('finance-homeowner-viewer');
  let companyId: string | null = null;
  let projectId: string | null = null;

  try {
    const { company, project } = await createPaidContractorProject({
      owner,
      label: 'Finance Homeowner Viewer',
      homeownerEmail: homeowner.email,
    });
    companyId = company.id;
    projectId = project.id;

    const homeownerProfile = await getUserRecordByEmail(homeowner.email);

    await updateProjectPersonalParticipantStatus({
      projectId: project.id,
      email: homeowner.email,
      status: 'active',
      userId: homeownerProfile.id,
    });

    await setUserContext({
      email: homeowner.email,
      activeContext: 'personal',
      activeCompanyId: null,
      companyIds: [],
      adminCompanyIds: [],
      projectIds: [project.id],
    });

    await signInThroughUi(page, homeowner.email, homeowner.password);
    await waitForAuthenticatedShell(page);
    await page.goto(`/app/ProjectDetail?id=${project.id}&tab=info`);
    await page.waitForLoadState('networkidle');

    const financeSection = page.locator('#section-finance');

    await expect(page.getByRole('heading', { level: 1, name: project.name })).toBeVisible();
    await expect(financeSection).toBeVisible();
    await expect(financeSection.getByText(/versione di controllo e trasparenza|transparency version of worksite finance/i)).toBeVisible();
    await expect(financeSection.locator('[data-tour="finance-budget-card"]')).toBeVisible();
    await expect(financeSection.locator('[data-tour="finance-costs-card"]')).toBeVisible();
    await expect(financeSection.locator('[data-tour="finance-progress-card"]')).toBeVisible();
    await expect(financeSection.locator('[data-tour="finance-settings-card"]')).toHaveCount(0);
    await expect(financeSection.locator('[data-tour="finance-rates-card"]')).toHaveCount(0);
    await expect(financeSection.getByRole('button', { name: /save settings|salva impostazioni|update settings|aggiorna impostazioni/i })).toHaveCount(0);
    await expect(financeSection.getByRole('button', { name: /record cost|registra costo/i })).toHaveCount(0);
  } finally {
    if (projectId) {
      await cleanupProjectGraph(projectId);
    }
    if (companyId) {
      await cleanupCompanyGraph(companyId);
    }
    await cleanupQaUser(homeowner.id, homeowner.email);
    await cleanupQaUser(owner.id, owner.email);
  }
});

test('company admin sees the full project finance controls on an entitled project', async ({ page }) => {
  const owner = await createConfirmedQaUser('finance-company-admin');
  const homeownerEmail = `qa-finance-admin-homeowner-${Date.now()}@edilsync.test`;
  let companyId: string | null = null;
  let projectId: string | null = null;

  try {
    const { company, project } = await createPaidContractorProject({
      owner,
      label: 'Finance Company Admin',
      homeownerEmail,
    });
    companyId = company.id;
    projectId = project.id;

    await signInThroughUi(page, owner.email, owner.password);
    await waitForAuthenticatedShell(page);
    await page.goto(`/app/ProjectDetail?id=${project.id}&tab=info`);
    await page.waitForLoadState('networkidle');

    const financeSection = page.locator('#section-finance');
    const settingsCard = financeSection.locator('[data-tour="finance-settings-card"]');
    const budgetCard = financeSection.locator('[data-tour="finance-budget-card"]');
    const costsCard = financeSection.locator('[data-tour="finance-costs-card"]');
    const ratesCard = financeSection.locator('[data-tour="finance-rates-card"]');
    const progressCard = financeSection.locator('[data-tour="finance-progress-card"]');

    await expect(page.getByRole('heading', { level: 1, name: project.name })).toBeVisible();
    await expect(financeSection.getByText(/versione di controllo e trasparenza|transparency version of worksite finance/i)).toHaveCount(0);
    await expect(financeSection.getByText(/puoi registrare costi e sincronizzare la manodopera|you can record costs and sync labor/i)).toHaveCount(0);
    await expect(settingsCard).toBeVisible();
    await expect(budgetCard).toBeVisible();
    await expect(costsCard).toBeVisible();
    await expect(ratesCard).toBeVisible();
    await expect(progressCard).toBeVisible();

    await settingsCard.getByRole('button', { name: /toggle-settings/i }).click();
    await expect(settingsCard.getByRole('button', { name: /save settings|salva impostazioni|update settings|aggiorna impostazioni/i })).toBeVisible();

    await budgetCard.locator('button').last().click();
    await expect(budgetCard.getByPlaceholder(/line title|titolo voce/i)).toBeVisible();

    await costsCard.locator('button').last().click();
    await expect(costsCard.getByPlaceholder(/cost description|descrizione costo/i)).toBeVisible();

    await ratesCard.locator('button').last().click();
    await expect(ratesCard.getByPlaceholder(/hourly cost|costo orario/i)).toBeVisible();
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

test('company member sees the contributor finance restrictions in the browser', async ({ page }) => {
  const owner = await createConfirmedQaUser('finance-company-owner');
  const member = await createConfirmedQaUser('finance-company-member');
  const homeownerEmail = `qa-finance-member-homeowner-${Date.now()}@edilsync.test`;
  let companyId: string | null = null;
  let projectId: string | null = null;

  try {
    const { company, project } = await createPaidContractorProject({
      owner,
      label: 'Finance Company Member',
      homeownerEmail,
    });
    companyId = company.id;
    projectId = project.id;

    await addActiveCompanyMember({
      companyId: company.id,
      userId: member.id,
      email: member.email,
      role: 'member',
    });

    await setUserContext({
      email: member.email,
      activeContext: 'company',
      activeCompanyId: company.id,
      companyIds: [company.id],
      adminCompanyIds: [],
      projectIds: [project.id],
    });

    await signInThroughUi(page, member.email, member.password);
    await waitForAuthenticatedShell(page);
    await page.goto(`/app/ProjectDetail?id=${project.id}&tab=info`);
    await page.waitForLoadState('networkidle');

    const financeSection = page.locator('#section-finance');
    const budgetCard = financeSection.locator('[data-tour="finance-budget-card"]');
    const costsCard = financeSection.locator('[data-tour="finance-costs-card"]');
    const ratesCard = financeSection.locator('[data-tour="finance-rates-card"]');

    await expect(page.getByRole('heading', { level: 1, name: project.name })).toBeVisible();
    await expect(financeSection.getByText(/puoi registrare costi e sincronizzare la manodopera|you can record costs and sync labor/i)).toBeVisible();
    await expect(financeSection.locator('[data-tour="finance-settings-card"]')).toHaveCount(0);

    await budgetCard.locator('button').last().click();
    await expect(budgetCard.getByPlaceholder(/line title|titolo voce/i)).toHaveCount(0);
    await expect(budgetCard.getByRole('button', { name: /add budget line|aggiungi voce budget/i })).toHaveCount(0);

    await costsCard.locator('button').last().click();
    await expect(costsCard.getByPlaceholder(/cost description|descrizione costo/i)).toBeVisible();

    await ratesCard.locator('button').last().click();
    await expect(ratesCard.getByPlaceholder(/hourly cost|costo orario/i)).toHaveCount(0);
  } finally {
    if (projectId) {
      await cleanupProjectGraph(projectId);
    }
    if (companyId) {
      await cleanupCompanyGraph(companyId);
    }
    await cleanupQaUser(member.id, member.email);
    await cleanupQaUser(owner.id, owner.email);
  }
});