import { expect, test } from '@playwright/test';
import { cleanupProjectGraph, cleanupQaUser, createConfirmedQaUser, hasRemoteQaEnv, signInThroughUi } from './helpers/qa-auth';

test.skip(!hasRemoteQaEnv, 'Remote QA browser tests require Supabase branch credentials.');

test('signed-in user can create a personal project from the UI', async ({ page }) => {
  const user = await createConfirmedQaUser('project');
  let projectId: string | null = null;

  try {
    await signInThroughUi(page, user.email, user.password);
    await page.goto('/app/NewProject');

    const projectName = `QA UI Project ${Date.now()}`;

    await page.locator('#name').fill(projectName);
    await page.locator('#address').fill('Via Browser Cantiere 14, Bergamo');
    await page.locator('#description').fill('Smoke project created through the browser QA flow.');
    const createResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/functions/v1/createProjectWithContext'),
    );
    await page.locator('button[type="submit"]').click();
    const createResponse = await createResponsePromise;
    expect(createResponse.ok()).toBeTruthy();

    await expect.poll(() => page.url()).toMatch(/\/app\/ProjectDetail\?id=/);
    const currentUrl = new URL(page.url());
    projectId = currentUrl.searchParams.get('id');

    await expect(page.getByRole('heading', { level: 1, name: projectName })).toBeVisible();
  } finally {
    if (projectId) {
      await cleanupProjectGraph(projectId);
    }
    await cleanupQaUser(user.id, user.email);
  }
});