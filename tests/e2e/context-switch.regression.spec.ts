import { expect, test } from '@playwright/test';
import {
  cleanupCompanyGraph,
  cleanupQaUser,
  createCompanyViaApi,
  createConfirmedQaUser,
  hasRemoteQaEnv,
  setUserContext,
  signInForAccessToken,
  signInThroughUi,
  switchContextThroughUi,
  waitForAuthenticatedShell,
} from './helpers/qa-auth';

// Scenario IDs: context.switch.personal-to-company-updates-visible-data, context.switch.company-to-personal-updates-visible-data

test.skip(!hasRemoteQaEnv, 'Remote QA browser tests require Supabase branch credentials.');

test('user can switch from personal to company context and see the active company reflected in UI', async ({ page }) => {
  const user = await createConfirmedQaUser('ctx-personal-company');
  let companyId: string | null = null;

  try {
    const accessToken = await signInForAccessToken(user.email, user.password);
    const company = await createCompanyViaApi({ accessToken, label: 'Ctx Personal Company', email: user.email });
    companyId = company.id;

    await setUserContext({
      email: user.email,
      activeContext: 'personal',
      activeCompanyId: null,
      companyIds: [company.id],
      adminCompanyIds: [company.id],
    });

    await signInThroughUi(page, user.email, user.password);
    await waitForAuthenticatedShell(page);
    const visibleContextSwitcher = page.locator('[data-tour="context-switcher"]:visible');
    await expect(visibleContextSwitcher).toContainText(/privato|private/i);

    await switchContextThroughUi(page, new RegExp(company.name, 'i'));

    await page.waitForLoadState('networkidle');
    await waitForAuthenticatedShell(page);
    await expect(page.getByText(new RegExp(`operating as ${company.name}`, 'i'))).toBeVisible();
    await expect(page.getByRole('link', { name: /^companies$|^società$/i })).toHaveAttribute(
      'href',
      expect.stringContaining(`id=${company.id}`),
    );
  } finally {
    if (companyId) {
      await cleanupCompanyGraph(companyId);
    }
    await cleanupQaUser(user.id, user.email);
  }
});

test('user can switch from company back to personal context and restore the private workspace', async ({ page }) => {
  const user = await createConfirmedQaUser('ctx-company-personal');
  let companyId: string | null = null;

  try {
    const accessToken = await signInForAccessToken(user.email, user.password);
    const company = await createCompanyViaApi({ accessToken, label: 'Ctx Company Personal', email: user.email });
    companyId = company.id;

    await setUserContext({
      email: user.email,
      activeContext: 'company',
      activeCompanyId: company.id,
      companyIds: [company.id],
      adminCompanyIds: [company.id],
    });

    await signInThroughUi(page, user.email, user.password);
    await waitForAuthenticatedShell(page);
    const visibleContextSwitcher = page.locator('[data-tour="context-switcher"]:visible');
    await expect(visibleContextSwitcher).toContainText(company.name);

    await switchContextThroughUi(page, /privato|private/i);

    await page.waitForLoadState('networkidle');
    await waitForAuthenticatedShell(page);
    await expect(page.getByText(/your companies|le tue societa/i)).toBeVisible();
  } finally {
    if (companyId) {
      await cleanupCompanyGraph(companyId);
    }
    await cleanupQaUser(user.id, user.email);
  }
});

test('user can switch the active company when belonging to multiple companies', async ({ page }) => {
  const user = await createConfirmedQaUser('ctx-multi-company');
  const companyIds: string[] = [];

  try {
    const accessToken = await signInForAccessToken(user.email, user.password);
    const firstCompany = await createCompanyViaApi({ accessToken, label: 'Ctx Multi One', email: user.email });
    const secondCompany = await createCompanyViaApi({ accessToken, label: 'Ctx Multi Two', email: user.email });
    companyIds.push(firstCompany.id, secondCompany.id);

    await setUserContext({
      email: user.email,
      activeContext: 'company',
      activeCompanyId: firstCompany.id,
      companyIds,
      adminCompanyIds: companyIds,
    });

    await signInThroughUi(page, user.email, user.password);
    await waitForAuthenticatedShell(page);
    const visibleContextSwitcher = page.locator('[data-tour="context-switcher"]:visible');
    await expect(visibleContextSwitcher).toContainText(firstCompany.name);

    await switchContextThroughUi(page, new RegExp(secondCompany.name, 'i'));

    await page.waitForLoadState('networkidle');
    await waitForAuthenticatedShell(page);
    await expect(page.getByText(new RegExp(`operating as ${secondCompany.name}`, 'i'))).toBeVisible();
    await expect(page.getByRole('link', { name: /^companies$|^società$/i })).toHaveAttribute(
      'href',
      expect.stringContaining(`id=${secondCompany.id}`),
    );
  } finally {
    for (const companyId of companyIds) {
      await cleanupCompanyGraph(companyId);
    }
    await cleanupQaUser(user.id, user.email);
  }
});