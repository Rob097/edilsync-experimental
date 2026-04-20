import path from 'node:path';
import { expect, test } from '@playwright/test';
import {
  clearProjectSponsorships,
  cleanupCompanyGraph,
  cleanupProjectGraph,
  cleanupQaUser,
  cleanupUserRecordByEmail,
  createCompanyViaApi,
  createConfirmedQaUser,
  createProjectDocumentDirect,
  createProjectViaApi,
  getDocumentCommentRecord,
  getProjectDocumentRecordByName,
  hasRemoteQaEnv,
  setUserContext,
  signInForAccessToken,
  signInThroughUi,
  upsertCompanySubscription,
  waitForAuthenticatedShell,
} from './helpers/qa-auth';

// Scenario IDs: documents.upload, documents.preview, documents.comment, documents.bim-gate

const heroImagePath = path.resolve(process.cwd(), 'public/images/hero-image.png');

test.skip(!hasRemoteQaEnv, 'Remote QA browser tests require Supabase branch credentials.');

test('project participant can upload a document from the UI', async ({ page }) => {
  const owner = await createConfirmedQaUser('document-upload-owner');
  let projectId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const project = await createProjectViaApi({
      accessToken: ownerAccessToken,
      label: 'Document Upload',
    });
    projectId = project.id;

    await setUserContext({
      email: owner.email,
      activeContext: 'personal',
      activeCompanyId: null,
      companyIds: [],
      adminCompanyIds: [],
      projectIds: [project.id],
    });

    await signInThroughUi(page, owner.email, owner.password);
    await waitForAuthenticatedShell(page);
    await page.goto(`/app/ProjectDetail?id=${project.id}&tab=info&section=documents`);
    await page.waitForLoadState('networkidle');

    const documentsSection = page.locator('#section-documents');
    const documentName = `QA Upload Doc ${Date.now()}`;

    await documentsSection.getByRole('button', { name: /upload|carica/i }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: /new document|nuovo documento|upload/i })).toBeVisible();
    await dialog.locator('input[type="file"]').setInputFiles(heroImagePath);
    await dialog.locator('#name').fill(documentName);
    await dialog.locator('#description').fill('Uploaded from browser regression.');
    const uploadResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/rest/v1/project_documents'),
    );
    await dialog.getByRole('button', { name: /upload|carica/i }).click();
    const uploadResponse = await uploadResponsePromise;
    expect(uploadResponse.ok()).toBeTruthy();

    await expect.poll(async () => {
      const document = await getProjectDocumentRecordByName({ projectId: project.id, name: documentName });
      return {
        fileType: document.file_type,
        description: document.description,
      };
    }, { timeout: 15000 }).toEqual({
      fileType: 'png',
      description: 'Uploaded from browser regression.',
    });
  } finally {
    if (projectId) {
      await cleanupProjectGraph(projectId);
    }
    await cleanupQaUser(owner.id, owner.email);
  }
});

test('project participant can open the document preview dialog', async ({ page }) => {
  const owner = await createConfirmedQaUser('document-preview-owner');
  let projectId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const project = await createProjectViaApi({
      accessToken: ownerAccessToken,
      label: 'Document Preview',
    });
    projectId = project.id;

    const documentName = `QA Preview Doc ${Date.now()}.png`;
    await createProjectDocumentDirect({
      projectId: project.id,
      name: documentName,
      uploadedByEmail: owner.email,
      uploadedByName: 'QA E2E document-preview-owner',
      category: 'photo',
      fileType: 'png',
      fileUrl: '/images/hero-image.png',
      fileSize: 2048,
    });

    await setUserContext({
      email: owner.email,
      activeContext: 'personal',
      activeCompanyId: null,
      companyIds: [],
      adminCompanyIds: [],
      projectIds: [project.id],
    });

    await signInThroughUi(page, owner.email, owner.password);
    await waitForAuthenticatedShell(page);
    await page.goto(`/app/ProjectDetail?id=${project.id}&tab=info&section=documents`);
    await page.waitForLoadState('networkidle');

    const documentsSection = page.locator('#section-documents');
    await documentsSection.getByRole('button', { name: /preview|anteprima/i }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: new RegExp(documentName, 'i') })).toBeVisible();
    await expect(dialog.getByRole('img', { name: documentName })).toBeVisible();
  } finally {
    if (projectId) {
      await cleanupProjectGraph(projectId);
    }
    await cleanupQaUser(owner.id, owner.email);
  }
});

test('project participant can add a comment from the document preview dialog', async ({ page }) => {
  const owner = await createConfirmedQaUser('document-comment-owner');
  let projectId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const project = await createProjectViaApi({
      accessToken: ownerAccessToken,
      label: 'Document Comment',
    });
    projectId = project.id;

    const documentName = `QA Comment Doc ${Date.now()}.png`;
    const document = await createProjectDocumentDirect({
      projectId: project.id,
      name: documentName,
      uploadedByEmail: owner.email,
      uploadedByName: 'QA E2E document-comment-owner',
      category: 'photo',
      fileType: 'png',
      fileUrl: '/images/hero-image.png',
      fileSize: 2048,
    });

    await setUserContext({
      email: owner.email,
      activeContext: 'personal',
      activeCompanyId: null,
      companyIds: [],
      adminCompanyIds: [],
      projectIds: [project.id],
    });

    await signInThroughUi(page, owner.email, owner.password);
    await waitForAuthenticatedShell(page);
    await page.goto(`/app/ProjectDetail?id=${project.id}&tab=info&section=documents`);
    await page.waitForLoadState('networkidle');

    const documentsSection = page.locator('#section-documents');
    const commentText = `QA document comment ${Date.now()}`;

    await documentsSection.getByRole('button', { name: /preview|anteprima/i }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('tab', { name: /comments|commenti/i }).click();
    await dialog.locator('textarea').fill(commentText);
    const commentResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/rest/v1/document_comments'),
    );
    await dialog.getByRole('button', { name: /send|invia/i }).click();
    const commentResponse = await commentResponsePromise;
    expect(commentResponse.ok()).toBeTruthy();

    await expect.poll(async () => {
      const comment = await getDocumentCommentRecord({ documentId: document.id, comment: commentText });
      return {
        authorEmail: comment.author_email,
        comment: comment.comment,
      };
    }).toEqual({
      authorEmail: owner.email,
      comment: commentText,
    });

    await expect(dialog.getByText(commentText)).toBeVisible();
  } finally {
    if (projectId) {
      await cleanupProjectGraph(projectId);
    }
    await cleanupQaUser(owner.id, owner.email);
  }
});

test('a BIM document on a free project shows the premium gate in preview', async ({ page }) => {
  const owner = await createConfirmedQaUser('document-bim-owner');
  const homeownerEmail = `qa-bim-gate-homeowner-${Date.now()}@edilsync.test`;
  let companyId: string | null = null;
  let projectId: string | null = null;

  try {
    const ownerAccessToken = await signInForAccessToken(owner.email, owner.password);
    const sponsorCompany = await createCompanyViaApi({
      accessToken: ownerAccessToken,
      label: 'Document BIM Gate',
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
      label: 'Document BIM Gate',
      myRole: 'contractor',
      homeownerEmail,
    });
    projectId = project.id;

    const documentName = `QA BIM Gate ${Date.now()}.ifc`;
    await createProjectDocumentDirect({
      projectId: project.id,
      name: documentName,
      uploadedByEmail: owner.email,
      uploadedByName: 'QA E2E document-bim-owner',
      category: 'technical',
      fileType: 'ifc',
      fileUrl: '/images/hero-image.png',
      fileSize: 4096,
      modelFormat: 'ifc',
    });
    await clearProjectSponsorships(project.id);

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
    await page.goto(`/app/ProjectDetail?id=${project.id}&tab=info&section=documents`);
    await page.waitForLoadState('networkidle');

    const documentsSection = page.locator('#section-documents');
    await documentsSection.getByRole('button', { name: /preview|anteprima/i }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/preview bim disponibile solo/i)).toBeVisible();
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