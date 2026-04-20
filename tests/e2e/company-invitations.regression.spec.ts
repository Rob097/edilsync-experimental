import { expect, test } from '@playwright/test';
import {
  cleanupCompanyGraph,
  cleanupQaUser,
  createCompanyViaApi,
  createConfirmedQaUser,
  hasRemoteQaEnv,
  invokeFunctionAsUser,
  signInForAccessToken,
  signInThroughUi,
  updateCompanyMemberStatus,
  waitForAuthenticatedShell,
} from './helpers/qa-auth';

// Scenario IDs: company.members.invite-from-ui, company.members.invited-user-sees-company-after-activation

test.skip(!hasRemoteQaEnv, 'Remote QA browser tests require Supabase branch credentials.');

test('company admin can invite a member from the UI and see the pending membership', async ({ page }) => {
  const owner = await createConfirmedQaUser('company-invite-owner');
  const invitee = await createConfirmedQaUser('company-invitee');
  let companyId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const company = await createCompanyViaApi({ accessToken: ownerAccessToken, label: 'Company Invite', email: owner.email });
    companyId = company.id;

    await signInThroughUi(page, owner.email, owner.password);
    await waitForAuthenticatedShell(page);
    await page.goto(`/app/CompanyDetail?id=${company.id}`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /invita|invite/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/invita membro|invite member/i)).toBeVisible();
    await dialog.locator('#email').fill(invitee.email);

    const inviteResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/functions/v1/inviteCompanyMemberWithValidation'),
    );

    await dialog.getByRole('button', { name: /invita|invite/i }).click();
    const inviteResponse = await inviteResponsePromise;

    expect(inviteResponse.ok()).toBeTruthy();
    await expect(page.getByText('1').first()).toBeVisible();
    await page.getByRole('tab', { name: /info/i }).click();
    await page.getByRole('button', { name: /membri e inviti|members and invites/i }).click();
    await expect(page.getByText(/in attesa di conferma|awaiting confirmation/i)).toBeVisible();
    await expect(page.getByText(invitee.email)).toBeVisible();
  } finally {
    if (companyId) {
      await cleanupCompanyGraph(companyId);
    }
    await cleanupQaUser(invitee.id, invitee.email);
    await cleanupQaUser(owner.id, owner.email);
  }
});

test('an invited company user sees the company in the personal workspace after activation', async ({ page }) => {
  const owner = await createConfirmedQaUser('company-activation-owner');
  const invitee = await createConfirmedQaUser('company-activation-invitee');
  let companyId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const company = await createCompanyViaApi({ accessToken: ownerAccessToken, label: 'Company Activation', email: owner.email });
    companyId = company.id;

    await invokeFunctionAsUser('inviteCompanyMemberWithValidation', ownerAccessToken, {
      company_id: company.id,
      user_email: invitee.email,
      role: 'member',
      company_member_role: 'worker',
      profession: 'worker',
    });

    await updateCompanyMemberStatus({
      companyId: company.id,
      email: invitee.email,
      status: 'active',
      userId: invitee.id,
    });

    await signInThroughUi(page, invitee.email, invitee.password);
    await waitForAuthenticatedShell(page);
    await page.goto('/app/Companies');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { level: 1, name: /your companies|le tue societa/i })).toBeVisible();
    await expect(page.getByText(company.name)).toBeVisible();
  } finally {
    if (companyId) {
      await cleanupCompanyGraph(companyId);
    }
    await cleanupQaUser(invitee.id, invitee.email);
    await cleanupQaUser(owner.id, owner.email);
  }
});