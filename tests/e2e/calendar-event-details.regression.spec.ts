import { expect, test } from '@playwright/test';
import {
  addActiveCompanyMember,
  cleanupCompanyGraph,
  cleanupEvent,
  cleanupQaUser,
  createCompanyViaApi,
  createConfirmedQaUser,
  createEventParticipantRecord,
  createEventRecord,
  getEventRecord,
  hasRemoteQaEnv,
  setUserContext,
  signInForAccessToken,
  signInThroughUi,
  waitForAuthenticatedShell,
} from './helpers/qa-auth';

// Scenario IDs: calendar.detail-display-names, calendar.company-member-response-controls, calendar.event-update, calendar.event-cancel

test.skip(!hasRemoteQaEnv, 'Remote QA browser tests require Supabase branch credentials.');

test('calendar event detail shows resolved display names instead of raw emails', async ({ page }) => {
  const creator = await createConfirmedQaUser('calendar-creator');
  const invitee = await createConfirmedQaUser('calendar-guest');
  let eventId: string | null = null;

  try {
    const event = await createEventRecord({
      title: `QA Calendar Display ${Date.now()}`,
      creatorEmail: creator.email,
      creatorName: 'Carlo Verdi',
      ownerType: 'personal',
      ownerUserId: creator.id,
    });
    eventId = event.id;

    await createEventParticipantRecord({
      eventId: event.id,
      participantType: 'user',
      userId: invitee.id,
      userEmail: invitee.email,
      status: 'pending',
      createdByEmail: creator.email,
    });

    await setUserContext({
      email: creator.email,
      activeContext: 'personal',
      activeCompanyId: null,
      companyIds: [],
      adminCompanyIds: [],
      projectIds: [],
    });

    await signInThroughUi(page, creator.email, creator.password);
    await waitForAuthenticatedShell(page);
    await page.goto('/app/Calendar');
    await page.waitForLoadState('networkidle');

    await page.getByText(event.title).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Carlo Verdi')).toBeVisible();
    await expect(dialog.getByText(invitee.email)).toBeVisible();
    await expect(dialog.getByText(/pending|in attesa/i)).toBeVisible();
    await expect(dialog.getByText(creator.email)).toHaveCount(0);
  } finally {
    if (eventId) {
      await cleanupEvent(eventId);
    }
    await cleanupQaUser(invitee.id, invitee.email);
    await cleanupQaUser(creator.id, creator.email);
  }
});

test('a company member can open a company-owned event and see pending response controls in the detail dialog', async ({ page }) => {
  const creator = await createConfirmedQaUser('calendar-accept-creator');
  const invitee = await createConfirmedQaUser('calendar-accept-guest');
  let eventId: string | null = null;
  let companyId: string | null = null;

  try {
    const creatorAccessToken = await signInForAccessToken(creator.email, creator.password);
    const company = await createCompanyViaApi({
      accessToken: creatorAccessToken,
      label: 'Calendar Accept',
      email: creator.email,
    });
    companyId = company.id;

    await addActiveCompanyMember({
      companyId: company.id,
      userId: invitee.id,
      email: invitee.email,
      role: 'member',
      profession: 'worker',
      companyMemberRole: 'worker',
    });

    const event = await createEventRecord({
      title: `QA Calendar Accept ${Date.now()}`,
      creatorEmail: creator.email,
      creatorName: 'QA Event Owner',
      ownerType: 'company',
      ownerCompanyId: company.id,
    });
    eventId = event.id;

    await createEventParticipantRecord({
      eventId: event.id,
      participantType: 'company',
      companyId: company.id,
      status: 'pending',
      createdByEmail: creator.email,
    });

    await setUserContext({
      email: invitee.email,
      activeContext: 'company',
      activeCompanyId: company.id,
      companyIds: [company.id],
      adminCompanyIds: [],
      projectIds: [],
    });

    await signInThroughUi(page, invitee.email, invitee.password);
    await waitForAuthenticatedShell(page);
    await page.goto('/app/Calendar');
    await page.waitForLoadState('networkidle');

    await page.getByText(event.title).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(company.name)).toBeVisible();
    await expect(dialog.getByText(/pending|in attesa/i)).toBeVisible();
    await expect(dialog.getByRole('button', { name: /accept|accetta/i })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /reject|rifiuta/i })).toBeVisible();
  } finally {
    if (eventId) {
      await cleanupEvent(eventId);
    }
    if (companyId) {
      await cleanupCompanyGraph(companyId);
    }
    await cleanupQaUser(invitee.id, invitee.email);
    await cleanupQaUser(creator.id, creator.email);
  }
});

test('the event creator can edit an existing calendar event from the detail dialog', async ({ page }) => {
  const creator = await createConfirmedQaUser('calendar-edit');
  let eventId: string | null = null;

  try {
    const event = await createEventRecord({
      title: `QA Calendar Edit ${Date.now()}`,
      creatorEmail: creator.email,
      creatorName: 'QA Calendar Editor',
      ownerType: 'personal',
      ownerUserId: creator.id,
    });
    eventId = event.id;

    await setUserContext({
      email: creator.email,
      activeContext: 'personal',
      activeCompanyId: null,
      companyIds: [],
      adminCompanyIds: [],
      projectIds: [],
    });

    await signInThroughUi(page, creator.email, creator.password);
    await waitForAuthenticatedShell(page);
    await page.goto('/app/Calendar');
    await page.waitForLoadState('networkidle');

    await page.getByRole('main').getByText(event.title).first().click();

    const detailDialog = page.getByRole('dialog');
    await expect(detailDialog.getByRole('button', { name: /edit event|modifica evento/i })).toBeVisible();
    await detailDialog.getByRole('button', { name: /edit event|modifica evento/i }).click();

    const editDialog = page.getByRole('dialog');
    await expect(editDialog.getByRole('heading', { name: /edit event|modifica evento/i })).toBeVisible();

    const updatedTitle = `${event.title} Updated`;
    const updatedLocation = 'Updated QA meeting room';
    const eventDate = event.start_datetime.slice(0, 10);
    const expectedStoredStart = new Date(`${eventDate}T14:15`).toISOString().slice(11, 16);
    const expectedStoredEnd = new Date(`${eventDate}T15:45`).toISOString().slice(11, 16);

    await editDialog.locator('#title').fill(updatedTitle);
    await editDialog.locator('#location').fill(updatedLocation);
    await editDialog.locator('#description').fill('Updated through browser regression flow.');
    await editDialog.locator('#start_time').fill('14:15');
    await editDialog.locator('#end_time').fill('15:45');
    await editDialog.getByRole('button', { name: /save|salva/i }).click();

    await expect.poll(async () => {
      const updatedEvent = await getEventRecord(event.id);
      return {
        title: updatedEvent.title,
        location: updatedEvent.location,
        start: new Date(updatedEvent.start_datetime).toISOString().slice(11, 16),
        end: new Date(updatedEvent.end_datetime).toISOString().slice(11, 16),
      };
    }).toEqual({
      title: updatedTitle,
      location: updatedLocation,
      start: expectedStoredStart,
      end: expectedStoredEnd,
    });

    await expect(page.getByRole('main').getByText(updatedTitle).first()).toBeVisible();
  } finally {
    if (eventId) {
      await cleanupEvent(eventId);
    }
    await cleanupQaUser(creator.id, creator.email);
  }
});

test('the event creator can cancel a scheduled calendar event from the detail dialog', async ({ page }) => {
  const creator = await createConfirmedQaUser('calendar-cancel');
  let eventId: string | null = null;

  try {
    const event = await createEventRecord({
      title: `QA Calendar Cancel ${Date.now()}`,
      creatorEmail: creator.email,
      creatorName: 'QA Calendar Canceller',
      ownerType: 'personal',
      ownerUserId: creator.id,
    });
    eventId = event.id;

    await setUserContext({
      email: creator.email,
      activeContext: 'personal',
      activeCompanyId: null,
      companyIds: [],
      adminCompanyIds: [],
      projectIds: [],
    });

    await signInThroughUi(page, creator.email, creator.password);
    await waitForAuthenticatedShell(page);
    await page.goto('/app/Calendar');
    await page.waitForLoadState('networkidle');

    await page.getByRole('main').getByText(event.title).first().click();

    const detailDialog = page.getByRole('dialog');
    await expect(detailDialog.getByRole('button', { name: /cancel event|cancella evento/i })).toBeVisible();
    await detailDialog.getByRole('button', { name: /cancel event|cancella evento/i }).click();

    await expect.poll(async () => {
      const cancelledEvent = await getEventRecord(event.id);
      return cancelledEvent.status;
    }).toBe('cancelled');

    await expect(page.getByRole('main').getByText(event.title)).toHaveCount(0);
  } finally {
    if (eventId) {
      await cleanupEvent(eventId);
    }
    await cleanupQaUser(creator.id, creator.email);
  }
});