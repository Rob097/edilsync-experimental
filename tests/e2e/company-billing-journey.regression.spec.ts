import { expect, test, Page, Locator } from '@playwright/test';
import {
  cleanupCompanyGraph,
  cleanupQaUser,
  createCompanyViaApi,
  createConfirmedQaUser,
  getCompanySubscription,
  hasRemoteQaEnv,
  signInForAccessToken,
  signInThroughUi,
  upsertCompanySubscription,
  waitForAuthenticatedShell,
} from './helpers/qa-auth';

// Scenario IDs: company.billing.checkout-portal-sync-journey

test.skip(!hasRemoteQaEnv, 'Remote QA browser tests require Supabase branch credentials.');

async function openCompanyBillingTab(page: Page) {
  const billingTab = page.getByRole('tab', { name: /billing|fatturazione/i });
  await expect(billingTab).toBeVisible({ timeout: 20000 });
  await billingTab.click();
  await expect(page.getByText(/billing and plan|fatturazione e piano/i)).toBeVisible({ timeout: 20000 });
}

function getCompanyBillingPanel(page: Page): Locator {
  return page.getByRole('tabpanel', { name: /billing|fatturazione/i });
}

async function waitForStripeCheckoutRedirect(page: Page) {
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 45000 });
  await expect(page).toHaveURL(/checkout\.stripe\.com/);
}

function mockFunctionJson(page: Page, functionName: string, payload: Record<string, unknown>) {
  return page.route(`**/functions/v1/${functionName}`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(payload),
      });
    });
}

test('company admin can complete checkout, sync the plan, and open the Stripe billing portal', async ({ page }) => {
  test.setTimeout(240000);

  const owner = await createConfirmedQaUser('billing-journey');
  let companyId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const company = await createCompanyViaApi({ accessToken: ownerAccessToken, label: 'Billing Journey', email: owner.email });
    companyId = company.id;

    await signInThroughUi(page, owner.email, owner.password);
    await waitForAuthenticatedShell(page);
    await page.goto(`/app/CompanyDetail?id=${company.id}&tab=billing`);
    await page.waitForLoadState('networkidle');
    await openCompanyBillingTab(page);

    const checkoutResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/functions/v1/createStripeCheckoutSession'),
    );

    await page.getByRole('button', { name: /upgrade to pro|passa a pro/i }).click();
    const checkoutResponse = await checkoutResponsePromise;
    expect(checkoutResponse.ok()).toBeTruthy();

    await waitForStripeCheckoutRedirect(page);

    const checkoutSeed = await getCompanySubscription(company.id);
    expect(checkoutSeed?.stripe_customer_id).toBeTruthy();

    const currentPeriodStart = new Date().toISOString();
    const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await upsertCompanySubscription({
      companyId: company.id,
      planCode: 'paid',
      billingStatus: 'active',
      billingCycle: 'monthly',
      stripeCustomerId: checkoutSeed?.stripe_customer_id || null,
      stripeSubscriptionId: checkoutSeed?.stripe_subscription_id || null,
      stripeProductId: checkoutSeed?.stripe_product_id || null,
      stripePriceId: checkoutSeed?.stripe_price_id || null,
      currentPeriodStart,
      currentPeriodEnd,
    });

    await mockFunctionJson(page, 'syncStripeCompanySubscription', {
      success: true,
      synced: true,
      company_id: company.id,
      plan_code: 'paid',
      billing_status: 'active',
      billing_cycle: 'monthly',
      cancel_at_period_end: false,
      current_period_end: currentPeriodEnd,
    });

    const syncResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/functions/v1/syncStripeCompanySubscription'),
    );

    await page.goto(`/app/CompanyDetail?id=${company.id}&tab=billing&stripe_checkout=success`);
    await openCompanyBillingTab(page);
    const syncResponse = await syncResponsePromise;
    expect(syncResponse.ok()).toBeTruthy();
    await page.waitForLoadState('networkidle');
    await openCompanyBillingTab(page);
    const billingPanel = getCompanyBillingPanel(page);

    await expect.poll(async () => {
      const subscription = await getCompanySubscription(company.id);
      return `${subscription?.plan_code || 'none'}:${subscription?.billing_status || 'none'}:${Boolean(subscription?.stripe_customer_id)}`;
    }, { timeout: 30000, intervals: [1000, 2000, 4000] }).toBe('paid:active:true');

    await expect(billingPanel.getByRole('heading', { name: /pro plan active|piano pro attivo/i })).toBeVisible({ timeout: 30000 });

    await mockFunctionJson(page, 'createStripeBillingPortalSession', {
      success: true,
      url: 'https://billing.stripe.com/p/session/test_company_billing_journey',
    });

    const portalResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/functions/v1/createStripeBillingPortalSession'),
    );

    await billingPanel.getByRole('button', { name: /manage plan|modifica piano/i }).click();
    const portalResponse = await portalResponsePromise;
    expect(portalResponse.ok()).toBeTruthy();

    await page.waitForURL(/billing\.stripe\.com/, { timeout: 45000 });
  } finally {
    if (companyId) {
      await cleanupCompanyGraph(companyId);
    }
    await cleanupQaUser(owner.id, owner.email);
  }
});