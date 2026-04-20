import { expect, test } from '@playwright/test';
import {
  addActiveCompanyMember,
  addProjectPersonalParticipant,
  cleanupCompanyGraph,
  cleanupProjectGraph,
  cleanupQaUser,
  cleanupUserRecordByEmail,
  createCompanyViaApi,
  createConfirmedQaUser,
  createProjectDocumentDirect,
  createProjectViaApi,
  getChannelRecord,
  getMessageRecordByContent,
  hasRemoteQaEnv,
  listChannelMembers,
  setUserContext,
  signInForAccessToken,
  signInThroughUi,
  upsertCompanySubscription,
  waitForAuthenticatedShell,
  waitForDialogToClose,
} from './helpers/qa-auth';

// Scenario IDs: messaging.project-channel.create, messaging.company-channel.create, messaging.send, messaging.mention-artifact

test.skip(!hasRemoteQaEnv, 'Remote QA browser tests require Supabase branch credentials.');

test('project participant can create a custom project channel from the UI', async ({ page }) => {
  const owner = await createConfirmedQaUser('project-channel-owner');
  const collaborator = await createConfirmedQaUser('project-channel-collaborator');
  const homeownerEmail = `qa-project-channel-homeowner-${Date.now()}@edilsync.test`;
  let companyId: string | null = null;
  let projectId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const sponsorCompany = await createCompanyViaApi({
      accessToken: ownerAccessToken,
      label: 'Project Channel',
      email: owner.email,
    });
    companyId = sponsorCompany.id;

    await upsertCompanySubscription({
      companyId: sponsorCompany.id,
      planCode: 'paid',
      billingStatus: 'active',
      billingCycle: 'monthly',
    });

    await setUserContext({
      email: owner.email,
      activeContext: 'company',
      activeCompanyId: sponsorCompany.id,
      companyIds: [sponsorCompany.id],
      adminCompanyIds: [sponsorCompany.id],
      projectIds: [],
    });

    const project = await createProjectViaApi({
      accessToken: ownerAccessToken,
      label: 'Project Channel',
      myRole: 'contractor',
      homeownerEmail,
    });
    projectId = project.id;
    await addProjectPersonalParticipant({
      projectId: project.id,
      userId: collaborator.id,
      email: collaborator.email,
      projectRole: 'consultant',
    });

    await setUserContext({
      email: owner.email,
      activeContext: 'company',
      activeCompanyId: sponsorCompany.id,
      companyIds: [sponsorCompany.id],
      adminCompanyIds: [sponsorCompany.id],
      projectIds: [project.id],
    });

    await signInThroughUi(page, owner.email, owner.password);
    await waitForAuthenticatedShell(page);
    await page.goto(`/app/ProjectDetail?id=${project.id}&tab=info&section=chat`);
    await page.waitForLoadState('networkidle');

    const chatSection = page.locator('#section-chat');
    const channelName = `QA Project Channel ${Date.now()}`;

    await expect(chatSection.locator('textarea')).toBeVisible();
    await chatSection.getByRole('button', { name: /create channel|crea canale/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: /create.*channel|crea.*canale/i })).toBeVisible();
    await dialog.locator('#name').fill(channelName);
    await dialog.locator('#description').fill('Project channel created from browser regression.');
    const participantCheckboxes = dialog.getByRole('checkbox');
    const firstParticipantCheckbox = participantCheckboxes.nth(0);
    const secondParticipantCheckbox = participantCheckboxes.nth(1);
    await expect(secondParticipantCheckbox).toBeVisible();
    await firstParticipantCheckbox.click();
    await secondParticipantCheckbox.click();
    await expect(firstParticipantCheckbox).toHaveAttribute('data-state', 'checked');
    await expect(secondParticipantCheckbox).toHaveAttribute('data-state', 'checked');

    const createButton = dialog.getByRole('button', { name: /create.*channel|crea.*canale/i });
    await expect(createButton).toBeEnabled();
    const createChannelResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/rest/v1/channels'),
    );
    await createButton.click();
    const createChannelResponse = await createChannelResponsePromise;
    expect(createChannelResponse.ok()).toBeTruthy();
    await waitForDialogToClose(dialog);

    await expect.poll(async () => {
      const channel = await getChannelRecord({ projectId: project.id, name: channelName, type: 'custom' });
      const members = await listChannelMembers(channel.id);
      return members.length;
    }, { timeout: 20000 }).toBe(2);

    await expect(chatSection.getByText(channelName).first()).toBeVisible();
  } finally {
    if (projectId) {
      await cleanupProjectGraph(projectId);
    }
    if (companyId) {
      await cleanupCompanyGraph(companyId);
    }
    await cleanupQaUser(collaborator.id, collaborator.email);
    await cleanupUserRecordByEmail(homeownerEmail);
    await cleanupQaUser(owner.id, owner.email);
  }
});

test('company admin can create an internal company channel from the UI', async ({ page }) => {
  const owner = await createConfirmedQaUser('company-channel-owner');
  const teammate = await createConfirmedQaUser('company-channel-member');
  let companyId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const company = await createCompanyViaApi({
      accessToken: ownerAccessToken,
      label: 'Company Channel',
      email: owner.email,
    });
    companyId = company.id;

    await upsertCompanySubscription({
      companyId: company.id,
      planCode: 'paid',
      billingStatus: 'active',
      billingCycle: 'monthly',
    });
    await addActiveCompanyMember({
      companyId: company.id,
      userId: teammate.id,
      email: teammate.email,
      role: 'member',
      profession: 'worker',
      companyMemberRole: 'worker',
    });

    await setUserContext({
      email: owner.email,
      activeContext: 'company',
      activeCompanyId: company.id,
      companyIds: [company.id],
      adminCompanyIds: [company.id],
      projectIds: [],
    });

    await signInThroughUi(page, owner.email, owner.password);
    await waitForAuthenticatedShell(page);
    await page.goto(`/app/CompanyDetail?id=${company.id}&tab=operativita&section=chat`);
    await page.waitForLoadState('networkidle');

    const chatSection = page.locator('#section-chat-operativita');
    const channelName = `QA Company Channel ${Date.now()}`;

    await expect(chatSection.locator('textarea')).toBeVisible();
    await chatSection.getByRole('button', { name: /create channel|crea canale/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: /create.*channel|crea.*canale/i })).toBeVisible();
    await dialog.locator('#name').fill(channelName);
    await dialog.locator('#description').fill('Company channel created from browser regression.');
    const participantCheckbox = dialog.getByRole('checkbox').first();
    await expect(participantCheckbox).toBeVisible();
    await participantCheckbox.click();
    await expect(participantCheckbox).toHaveAttribute('data-state', 'checked');

    const createButton = dialog.getByRole('button', { name: /create.*channel|crea.*canale/i });
    await expect(createButton).toBeEnabled();
    const createChannelResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/rest/v1/channels'),
    );
    await createButton.click();
    const createChannelResponse = await createChannelResponsePromise;
    expect(createChannelResponse.ok()).toBeTruthy();
    await waitForDialogToClose(dialog);

    await expect.poll(async () => {
      const channel = await getChannelRecord({ companyId: company.id, name: channelName, type: 'custom' });
      const members = await listChannelMembers(channel.id);
      return members.length;
    }, { timeout: 20000 }).toBe(1);

    await expect(chatSection.getByText(channelName).first()).toBeVisible();
  } finally {
    if (companyId) {
      await cleanupCompanyGraph(companyId);
    }
    await cleanupQaUser(teammate.id, teammate.email);
    await cleanupQaUser(owner.id, owner.email);
  }
});

test('project participant can send a plain message in project chat', async ({ page }) => {
  const owner = await createConfirmedQaUser('message-send-owner');
  const homeownerEmail = `qa-message-send-homeowner-${Date.now()}@edilsync.test`;
  let companyId: string | null = null;
  let projectId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const sponsorCompany = await createCompanyViaApi({
      accessToken: ownerAccessToken,
      label: 'Message Send',
      email: owner.email,
    });
    companyId = sponsorCompany.id;

    await upsertCompanySubscription({
      companyId: sponsorCompany.id,
      planCode: 'paid',
      billingStatus: 'active',
      billingCycle: 'monthly',
    });

    await setUserContext({
      email: owner.email,
      activeContext: 'company',
      activeCompanyId: sponsorCompany.id,
      companyIds: [sponsorCompany.id],
      adminCompanyIds: [sponsorCompany.id],
      projectIds: [],
    });

    const project = await createProjectViaApi({
      accessToken: ownerAccessToken,
      label: 'Message Send',
      myRole: 'contractor',
      homeownerEmail,
    });
    projectId = project.id;
    await setUserContext({
      email: owner.email,
      activeContext: 'company',
      activeCompanyId: sponsorCompany.id,
      companyIds: [sponsorCompany.id],
      adminCompanyIds: [sponsorCompany.id],
      projectIds: [project.id],
    });

    await signInThroughUi(page, owner.email, owner.password);
    await waitForAuthenticatedShell(page);
    await page.goto(`/app/ProjectDetail?id=${project.id}&tab=info&section=chat`);
    await page.waitForLoadState('networkidle');

    const chatSection = page.locator('#section-chat');
    const textarea = chatSection.locator('textarea');
    const messageText = `QA plain message ${Date.now()}`;

    await expect(textarea).toBeVisible();
    const sendResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/rest/v1/messages'),
    );
    await textarea.fill(messageText);
    await textarea.press('Enter');
    const sendResponse = await sendResponsePromise;
    expect(sendResponse.ok()).toBeTruthy();

    await expect.poll(async () => {
      const message = await getMessageRecordByContent({ content: messageText, projectId: project.id });
      return {
        senderEmail: message.sender_email,
        content: message.content,
      };
    }).toEqual({
      senderEmail: owner.email,
      content: messageText,
    });

    await expect(chatSection.getByText(messageText)).toBeVisible();
  } finally {
    if (projectId) {
      await cleanupProjectGraph(projectId);
    }
    if (companyId) {
      await cleanupCompanyGraph(companyId);
    }
    await cleanupUserRecordByEmail(homeownerEmail);
    await cleanupQaUser(owner.id, owner.email);
  }
});

test('project participant can mention a user and link a document artifact in a message', async ({ page }) => {
  const owner = await createConfirmedQaUser('mention-owner');
  const collaborator = await createConfirmedQaUser('mention-collaborator');
  const homeownerEmail = `qa-mention-homeowner-${Date.now()}@edilsync.test`;
  const collaboratorNameOrEmailPattern = new RegExp(
    `QA E2E mention-collaborator|${collaborator.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
    'i',
  );
  let companyId: string | null = null;
  let projectId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const sponsorCompany = await createCompanyViaApi({
      accessToken: ownerAccessToken,
      label: 'Mention Artifact',
      email: owner.email,
    });
    companyId = sponsorCompany.id;

    await upsertCompanySubscription({
      companyId: sponsorCompany.id,
      planCode: 'paid',
      billingStatus: 'active',
      billingCycle: 'monthly',
    });

    await setUserContext({
      email: owner.email,
      activeContext: 'company',
      activeCompanyId: sponsorCompany.id,
      companyIds: [sponsorCompany.id],
      adminCompanyIds: [sponsorCompany.id],
      projectIds: [],
    });

    const project = await createProjectViaApi({
      accessToken: ownerAccessToken,
      label: 'Mention Artifact',
      myRole: 'contractor',
      homeownerEmail,
    });
    projectId = project.id;
    await addProjectPersonalParticipant({
      projectId: project.id,
      userId: collaborator.id,
      email: collaborator.email,
      projectRole: 'consultant',
    });

    const documentName = `QA Mention Artifact ${Date.now()}.png`;
    const document = await createProjectDocumentDirect({
      projectId: project.id,
      name: documentName,
      uploadedByEmail: owner.email,
      uploadedByName: 'QA E2E mention-owner',
      category: 'photo',
      fileType: 'png',
      fileUrl: '/images/hero-image.png',
      fileSize: 2048,
    });

    await setUserContext({
      email: owner.email,
      activeContext: 'company',
      activeCompanyId: sponsorCompany.id,
      companyIds: [sponsorCompany.id],
      adminCompanyIds: [sponsorCompany.id],
      projectIds: [project.id],
    });

    await signInThroughUi(page, owner.email, owner.password);
    await waitForAuthenticatedShell(page);
    await page.goto(`/app/ProjectDetail?id=${project.id}&tab=info&section=chat`);
    await page.waitForLoadState('networkidle');

    const chatSection = page.locator('#section-chat');
    const composer = chatSection.locator('div.border-t.p-4.bg-white').last();
    const toolbarButtons = composer.locator('div.flex.gap-2.mb-2 button');
    const textarea = composer.locator('textarea');

    await expect(textarea).toBeVisible();
    await toolbarButtons.nth(0).click();
  const mentionDialog = page.getByRole('dialog').last();
  await expect(mentionDialog.getByRole('button', { name: collaboratorNameOrEmailPattern })).toBeVisible();
  await mentionDialog.getByRole('button', { name: collaboratorNameOrEmailPattern }).click();

    await toolbarButtons.nth(4).click();
    const documentDialog = page.getByRole('dialog');
    await expect(documentDialog.getByRole('heading', { name: /select document to link|seleziona documento da linkare/i })).toBeVisible();
    await documentDialog.getByRole('button', { name: new RegExp(documentName, 'i') }).click();

    await textarea.type(`needs review ${Date.now()}`);
    const messageContent = await textarea.inputValue();
    const sendResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/rest/v1/messages'),
    );
    await textarea.press('Enter');
    const sendResponse = await sendResponsePromise;
    expect(sendResponse.ok()).toBeTruthy();

    await expect.poll(async () => {
      const message = await getMessageRecordByContent({ content: messageContent, projectId: project.id });
      return {
        mentionedUsers: message.mentioned_user_emails,
        contentHasDocument: message.content.includes(`document:${document.id}`),
      };
    }).toEqual({
      mentionedUsers: [collaborator.email],
      contentHasDocument: true,
    });

    await expect(chatSection.getByText(/needs review/i)).toBeVisible();
    await expect(chatSection.getByText(documentName)).toBeVisible();
  } finally {
    if (projectId) {
      await cleanupProjectGraph(projectId);
    }
    if (companyId) {
      await cleanupCompanyGraph(companyId);
    }
    await cleanupQaUser(collaborator.id, collaborator.email);
    await cleanupUserRecordByEmail(homeownerEmail);
    await cleanupQaUser(owner.id, owner.email);
  }
});