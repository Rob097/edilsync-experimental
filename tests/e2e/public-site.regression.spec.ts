import { expect, test } from '@playwright/test';

test('public root serves the italian home page', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('link', { name: /accedi|entra|log in|sign in/i })).toBeVisible();
});

test('localized english pricing route renders the marketing page', async ({ page }) => {
  await page.goto('/en/prezzi');

  await expect(page).toHaveURL(/\/en\/prezzi$/);
  await expect(page.getByText('Clear pricing for companies and worksites.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Request a demo' })).toHaveAttribute('href', '/en/contatti');
});

test('italian pricing route renders the marketing page with the real pricing model copy', async ({ page }) => {
  await page.goto('/prezzi');

  await expect(page).toHaveURL(/\/prezzi$/);
  await expect(page.getByText('Prezzi chiari per società e cantieri.')).toBeVisible();
  await expect(page.getByText('EdilSync Pro per società')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Crea account società' })).toHaveAttribute('href', '/app');
});

test('italian contact form validates required fields and sends the demo request payload', async ({ page }) => {
  let submittedBody: Record<string, unknown> | null = null;

  await page.route('**/functions/v1/submitDemoRequest', async (route) => {
    submittedBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.goto('/contatti');

  const submitButton = page.getByRole('button', { name: /invia richiesta/i });
  await expect(submitButton).toBeDisabled();

  await page.locator('input').nth(0).fill('Mario Rossi');
  await page.locator('input[type="email"]').fill('mario@impresa.test');
  await page.locator('textarea').fill('Vorrei una demo per coordinare meglio dispute, task e documenti di cantiere.');

  await expect(submitButton).toBeEnabled();
  await submitButton.click();

  await expect(page.getByText('Richiesta inviata. Ti contatteremo al più presto.')).toBeVisible();
  expect(submittedBody).toMatchObject({
    full_name: 'Mario Rossi',
    email: 'mario@impresa.test',
    locale: 'it',
    source_path: '/contatti',
  });
});

test('english demo request form validates required fields and sends the localized payload', async ({ page }) => {
  let submittedBody: Record<string, unknown> | null = null;

  await page.route('**/functions/v1/submitDemoRequest', async (route) => {
    submittedBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.goto('/en/contatti');

  const submitButton = page.getByRole('button', { name: /send request/i });
  await expect(submitButton).toBeDisabled();

  await page.locator('input').nth(0).fill('John Smith');
  await page.locator('input[type="email"]').fill('john@contractor.test');
  await page.locator('textarea').fill('We need a demo to validate dispute prevention and operational coordination for our team.');

  await expect(submitButton).toBeEnabled();
  await submitButton.click();

  await expect(page.getByText('Request sent. We will get back to you soon.')).toBeVisible();
  expect(submittedBody).toMatchObject({
    full_name: 'John Smith',
    email: 'john@contractor.test',
    locale: 'en',
    source_path: '/en/contatti',
  });
});

test('legacy public legal paths redirect to the localized canonical pages', async ({ page }) => {
  await page.goto('/PrivacyPolicy');

  await page.waitForURL(/\/privacy$/);
  await expect(page.getByRole('heading', { name: /privacy policy|informativa sulla privacy/i })).toBeVisible();
});

test('role alias routes resolve to the contractors page', async ({ page }) => {
  await page.goto('/per-imprese');

  await page.waitForURL(/\/contractors$/);
  await expect(page.getByRole('heading', { name: /protect your margins|proteggi i tuoi margini/i })).toBeVisible();
});

test('unknown localized routes fall back to the localized home page', async ({ page }) => {
  await page.goto('/en/unknown-path');

  await page.waitForURL(/\/en$/);
  await expect(page.getByRole('link', { name: /log in|sign in|accedi|entra/i })).toBeVisible();
});