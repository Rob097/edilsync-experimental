import { expect, test } from '@playwright/test';
import {
  addProjectCompanyParticipant,
  cleanupCompanyGraph,
  cleanupEvent,
  cleanupNotificationsForUser,
  cleanupProjectGraph,
  cleanupQaUser,
  createCompanyViaApi,
  createConfirmedQaUser,
  createEventRecord,
  createNotificationRecord,
  createProjectViaApi,
  hasRemoteQaEnv,
  setUserContext,
  signInForAccessToken,
  signInThroughUi,
  waitForAuthenticatedShell,
} from './helpers/qa-auth';

// Scenario IDs: notifications.targets.company-plan-project-sponsorship-event

test.skip(!hasRemoteQaEnv, 'Remote QA browser tests require Supabase branch credentials.');

test('company-context notifications route billing and sponsorship alerts to the correct targets', async ({ page }) => {
  const user = await createConfirmedQaUser('notifications-company-targets');
  let companyId: string | null = null;
  let projectId: string | null = null;

  try {
    const accessToken = await signInForAccessToken(user.email, user.password);
    const company = await createCompanyViaApi({ accessToken, label: 'Notifications Billing', email: user.email });
    const project = await createProjectViaApi({ accessToken, label: 'Notifications Sponsorship' });
    companyId = company.id;
    projectId = project.id;

    await addProjectCompanyParticipant({
      projectId: project.id,
      companyId: company.id,
      projectRole: 'contractor',
      canInvite: true,
    });

    await setUserContext({
      email: user.email,
      activeContext: 'company',
      activeCompanyId: company.id,
      companyIds: [company.id],
      adminCompanyIds: [company.id],
      projectIds: [project.id],
    });

    await createNotificationRecord({
      userEmail: user.email,
      contextType: 'company',
      contextCompanyId: company.id,
      type: 'company_plan_changed',
      title: 'QA company billing changed',
      message: 'The company plan changed.',
      relatedEventId: company.id,
    });

    await createNotificationRecord({
      userEmail: user.email,
      contextType: 'company',
      contextCompanyId: company.id,
      type: 'project_sponsorship_activated',
      title: 'QA sponsorship activated',
      message: 'The worksite sponsorship is now active.',
      relatedEventId: project.id,
    });

    await signInThroughUi(page, user.email, user.password);
    await waitForAuthenticatedShell(page);
    await page.goto('/app/Notifications');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('QA company billing changed')).toBeVisible();
    await expect(page.getByText('QA sponsorship activated')).toBeVisible();

    await page.getByText('QA company billing changed').click();
    await page.waitForURL((url) => (
      url.pathname === '/app/CompanyDetail'
      && url.searchParams.get('id') === company.id
      && url.searchParams.get('tab') === 'billing'
    ));
    await expect(page.getByText(/billing and plan|fatturazione e piano/i)).toBeVisible();

    await page.goto('/app/Notifications');
    await page.waitForLoadState('networkidle');
    await page.getByText('QA sponsorship activated').click();
    await page.waitForURL((url) => (
      url.pathname === '/app/ProjectDetail'
      && url.searchParams.get('id') === project.id
    ));
    await expect(page.getByRole('heading', { level: 1, name: project.name })).toBeVisible();
  } finally {
    await cleanupNotificationsForUser(user.email);
    if (projectId) {
      await cleanupProjectGraph(projectId);
    }
    if (companyId) {
      await cleanupCompanyGraph(companyId);
    }
    await cleanupQaUser(user.id, user.email);
  }
});

test('personal event notifications route to the calendar', async ({ page }) => {
  const user = await createConfirmedQaUser('notifications-event-target');
  let eventId: string | null = null;

  try {
    const event = await createEventRecord({
      title: `QA Event ${Date.now()}`,
      creatorEmail: user.email,
      creatorName: 'QA Event Owner',
      ownerType: 'personal',
    });
    eventId = event.id;

    await setUserContext({
      email: user.email,
      activeContext: 'personal',
      activeCompanyId: null,
      companyIds: [],
      adminCompanyIds: [],
      projectIds: [],
    });

    await createNotificationRecord({
      userEmail: user.email,
      contextType: 'personal',
      type: 'event_invite',
      title: 'QA event invite',
      message: 'You were invited to a QA event.',
      relatedEventId: event.id,
    });

    await signInThroughUi(page, user.email, user.password);
    await waitForAuthenticatedShell(page);
    await page.goto('/app/Notifications');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('QA event invite')).toBeVisible();
    await page.getByText('QA event invite').click();

    await page.waitForURL((url) => url.pathname === '/app/Calendar');
    await expect(page.locator('#signin-email')).toHaveCount(0);
  } finally {
    await cleanupNotificationsForUser(user.email);
    if (eventId) {
      await cleanupEvent(eventId);
    }
    await cleanupQaUser(user.id, user.email);
  }
});