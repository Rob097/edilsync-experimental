import { expect, test } from '@playwright/test';
import {
  cleanupCompanyGraph,
  cleanupEvent,
  cleanupQaUser,
  createCompanyViaApi,
  createConfirmedQaUser,
  getEventParticipantRecord,
  getEventRecordByTitle,
  hasRemoteQaEnv,
  setUserContext,
  signInForAccessToken,
  signInThroughUi,
  waitForAuthenticatedShell,
  waitForDialogToClose,
} from './helpers/qa-auth';

// Scenario IDs: calendar.event-create-with-participants

test.skip(!hasRemoteQaEnv, 'Remote QA browser tests require Supabase branch credentials.');

test('calendar creator can create an event with personal and company participants from the UI', async ({ page }) => {
  const creator = await createConfirmedQaUser('calendar-create-owner');
  const personalInvitee = await createConfirmedQaUser('calendar-create-guest');
  const companyOwner = await createConfirmedQaUser('calendar-create-company-owner');
  let companyId: string | null = null;
  let eventId: string | null = null;

  try {
    const companyOwnerAccessToken = await signInForAccessToken(companyOwner.email, companyOwner.password);
    const company = await createCompanyViaApi({
      accessToken: companyOwnerAccessToken,
      label: 'Calendar Invite Company',
      email: companyOwner.email,
    });
    companyId = company.id;

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

    const eventTitle = `QA Calendar Create ${Date.now()}`;
    const eventLocation = 'QA coordination room';
    const dialogDate = new Date();
    dialogDate.setDate(dialogDate.getDate() + 3);
    const eventDate = dialogDate.toISOString().slice(0, 10);

    await page.getByRole('button', { name: /new event|nuovo evento/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: /new event|nuovo evento/i })).toBeVisible();

    await dialog.locator('#title').fill(eventTitle);
    await dialog.locator('#start_date').fill(eventDate);
    await dialog.locator('#start_time').fill('14:00');
    await dialog.locator('#end_date').fill(eventDate);
    await dialog.locator('#end_time').fill('15:30');
    await dialog.locator('#location').fill(eventLocation);
    await dialog.locator('#description').fill('Event created from browser regression with multiple participants.');

    const personalInviteInput = dialog.getByPlaceholder(/email/i);
    await personalInviteInput.fill(personalInvitee.email);
    await personalInviteInput.locator('xpath=following-sibling::button').click();

    await dialog.getByRole('combobox').nth(1).click();
    await page.getByRole('option', { name: /^company$|^società$/i }).click();
    const companySelect = dialog.getByRole('combobox').nth(2);
    await companySelect.click();
    await page.getByRole('option', { name: new RegExp(company.name, 'i') }).click();
    await companySelect.locator('xpath=following-sibling::button').click();

    await expect(dialog.getByText(personalInvitee.email)).toBeVisible();
    await expect(dialog.getByText(company.name, { exact: true }).last()).toBeVisible();

    const createResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/rest/v1/events'),
    );

    await dialog.getByRole('button', { name: /create event|crea evento/i }).click();
    const createResponse = await createResponsePromise;
    expect(createResponse.ok()).toBeTruthy();
    await waitForDialogToClose(dialog);

    const eventRecord = await expect.poll(async () => {
      const createdEvent = await getEventRecordByTitle({ title: eventTitle, creatorEmail: creator.email });
      return {
        id: createdEvent.id,
        title: createdEvent.title,
        creatorEmail: createdEvent.creator_email,
        ownerType: createdEvent.owner_type,
        location: createdEvent.location,
        status: createdEvent.status,
      };
    }).toEqual({
      id: expect.any(String),
      title: eventTitle,
      creatorEmail: creator.email,
      ownerType: 'personal',
      location: eventLocation,
      status: 'scheduled',
    });

    const createdEvent = await getEventRecordByTitle({ title: eventTitle, creatorEmail: creator.email });
    eventId = createdEvent.id;

    await expect.poll(async () => {
      const personalParticipant = await getEventParticipantRecord({
        eventId: createdEvent.id,
        userEmail: personalInvitee.email,
      });
      const companyParticipant = await getEventParticipantRecord({
        eventId: createdEvent.id,
        companyId: company.id,
      });

      return {
        personalStatus: personalParticipant.status,
        personalConflict: personalParticipant.has_conflict,
        companyStatus: companyParticipant.status,
        companyConflict: companyParticipant.has_conflict,
      };
    }).toEqual({
      personalStatus: 'pending',
      personalConflict: false,
      companyStatus: 'pending',
      companyConflict: false,
    });

    await expect(page.getByText(eventTitle)).toBeVisible();
  } finally {
    if (eventId) {
      await cleanupEvent(eventId);
    }
    if (companyId) {
      await cleanupCompanyGraph(companyId);
    }
    await cleanupQaUser(companyOwner.id, companyOwner.email);
    await cleanupQaUser(personalInvitee.id, personalInvitee.email);
    await cleanupQaUser(creator.id, creator.email);
  }
});