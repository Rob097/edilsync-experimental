import { expect, test } from '@playwright/test';
import {
  cleanupNotificationPreferencesForUser,
  cleanupQaUser,
  createConfirmedQaUser,
  getNotificationPreferenceByEmail,
  getUserRecordByEmail,
  hasRemoteQaEnv,
  openUserMenu,
  signInThroughUi,
  waitForAuthenticatedShell,
} from './helpers/qa-auth';

// Scenario IDs: settings.browser.profile-update, settings.browser.notification-preferences, settings.browser.language-switch

test.skip(!hasRemoteQaEnv, 'Remote QA browser tests require Supabase branch credentials.');

test('user can update profile fields from the settings page in the browser', async ({ page }) => {
  const user = await createConfirmedQaUser('settings-profile-browser');

  try {
    const updatedDisplayName = `QA Browser Profile ${Date.now()}`;
    const updatedPhone = '+39 333 111 2222';

    await signInThroughUi(page, user.email, user.password);
    await waitForAuthenticatedShell(page);
    await page.goto('/app/Settings');
    await page.waitForLoadState('networkidle');

    await page.locator('#display_name').fill(updatedDisplayName);
    await page.locator('#phone').fill(updatedPhone);
    await page.getByRole('button', { name: /save changes|salva modifiche/i }).click();

    await expect.poll(async () => {
      const record = await getUserRecordByEmail(user.email);
      return {
        displayName: record.display_name,
        phone: record.phone,
      };
    }).toEqual({
      displayName: updatedDisplayName,
      phone: updatedPhone,
    });
  } finally {
    await cleanupNotificationPreferencesForUser(user.email);
    await cleanupQaUser(user.id, user.email);
  }
});

test('user can enable email notification preferences from the browser settings', async ({ page }) => {
  const user = await createConfirmedQaUser('settings-notifications-browser');

  try {
    await signInThroughUi(page, user.email, user.password);
    await waitForAuthenticatedShell(page);
    await page.goto('/app/Settings');
    await page.waitForLoadState('networkidle');

    await page.getByRole('tab', { name: /communications|comunicazioni/i }).click();
    const notificationsPanel = page.getByRole('tabpanel');
    const savePreferencesButton = notificationsPanel.getByRole('button', { name: /save preferences|salva preferenze/i });

    await expect(savePreferencesButton).toBeDisabled();

    await notificationsPanel.getByRole('switch').nth(1).click();
    await savePreferencesButton.click();

    await expect.poll(async () => {
      try {
        const record = await getNotificationPreferenceByEmail(user.email);
        return {
          taskAssignedEmail: record.preferences.task_assigned.email,
          messageMentionEmail: record.preferences.message_mention.email,
          documentCommentEmail: record.preferences.document_comment.email,
        };
      } catch {
        return null;
      }
    }).toEqual({
      taskAssignedEmail: true,
      messageMentionEmail: true,
      documentCommentEmail: true,
    });
  } finally {
    await cleanupNotificationPreferencesForUser(user.email);
    await cleanupQaUser(user.id, user.email);
  }
});

test('user can switch the authenticated UI language from english to italian in the browser', async ({ page }) => {
  const user = await createConfirmedQaUser('settings-language-browser');

  try {
    await signInThroughUi(page, user.email, user.password);
    await waitForAuthenticatedShell(page);
    await page.goto('/app/Settings');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Manage your profile and preferences')).toBeVisible();

    await openUserMenu(page);
    await page.getByRole('combobox').last().click();
    await page.getByRole('option', { name: /italian|italiano/i }).click();
    await expect(page.getByText('Gestisci il tuo profilo e le tue preferenze')).toBeVisible();
  } finally {
    await cleanupQaUser(user.id, user.email);
  }
});