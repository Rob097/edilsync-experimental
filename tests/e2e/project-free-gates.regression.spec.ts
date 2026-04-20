import { expect, test } from '@playwright/test';
import {
  cleanupProjectGraph,
  cleanupQaUser,
  createConfirmedQaUser,
  createProjectViaApi,
  hasRemoteQaEnv,
  setUserContext,
  signInForAccessToken,
  signInThroughUi,
  waitForAuthenticatedShell,
} from './helpers/qa-auth';

// Scenario IDs: pricing.project-free.milestones-gated, pricing.project-free.finance-gated

test.skip(!hasRemoteQaEnv, 'Remote QA browser tests require Supabase branch credentials.');

async function createFreeProjectSession(label: string) {
  const owner = await createConfirmedQaUser(label.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
  const accessToken = await signInForAccessToken(owner.email, owner.password);
  const project = await createProjectViaApi({
    accessToken,
    label,
  });

  await setUserContext({
    email: owner.email,
    activeContext: 'personal',
    activeCompanyId: null,
    companyIds: [],
    adminCompanyIds: [],
    projectIds: [project.id],
  });

  return { owner, project };
}

test('free personal project keeps milestones visible but locked behind sponsorship', async ({ page }) => {
  const { owner, project } = await createFreeProjectSession('Project Free Milestones');

  try {
    await signInThroughUi(page, owner.email, owner.password);
    await waitForAuthenticatedShell(page);
    await page.goto(`/app/ProjectDetail?id=${project.id}&tab=lavori`);
    await page.waitForLoadState('networkidle');

    const milestonesSection = page.locator('#section-milestones');

    await expect(page.getByRole('heading', { level: 1, name: project.name })).toBeVisible();
    await expect(milestonesSection.getByText(/premium milestones|milestone premium/i)).toBeVisible();
    await expect(milestonesSection.getByText(/^sponsored worksite$|^cantiere sponsorizzato$/i)).toBeVisible();
    await expect(
      milestonesSection.getByText(/available on sponsored worksites|disponibili nei cantieri sponsorizzati/i),
    ).toBeVisible();
    await expect(milestonesSection.getByRole('button', { name: /new milestone|nuova milestone/i })).toHaveCount(0);
  } finally {
    await cleanupProjectGraph(project.id);
    await cleanupQaUser(owner.id, owner.email);
  }
});

test('free personal project shows finance gate instead of financial controls', async ({ page }) => {
  const { owner, project } = await createFreeProjectSession('Project Free Finance');

  try {
    await signInThroughUi(page, owner.email, owner.password);
    await waitForAuthenticatedShell(page);
    await page.goto(`/app/ProjectDetail?id=${project.id}&tab=info`);
    await page.waitForLoadState('networkidle');

    const financeSection = page.locator('#section-finance');

    await expect(page.getByRole('heading', { level: 1, name: project.name })).toBeVisible();
    await expect(page.getByRole('button', { name: /finance|economia/i })).toBeVisible();
    await expect(financeSection.getByText(/premium worksite finance|economia di cantiere premium/i)).toBeVisible();
    await expect(financeSection.getByText(/requires sponsorship|richiede sponsorship/i)).toBeVisible();
    await expect(
      financeSection.getByText(/budget, costs, progress statements and financial settings unlock only when the worksite is sponsored|budget, costi, sal e impostazioni finanziarie si sbloccano solo quando il cantiere/i),
    ).toBeVisible();
    await expect(financeSection.getByRole('button', { name: /section guide|guida sezione/i })).toHaveCount(0);
    await expect(financeSection.getByRole('button', { name: /save settings|salva impostazioni|update settings|aggiorna impostazioni/i })).toHaveCount(0);
    await expect(financeSection.getByRole('button', { name: /add budget line|aggiungi voce budget/i })).toHaveCount(0);
    await expect(financeSection.getByRole('button', { name: /record cost|registra costo/i })).toHaveCount(0);
  } finally {
    await cleanupProjectGraph(project.id);
    await cleanupQaUser(owner.id, owner.email);
  }
});