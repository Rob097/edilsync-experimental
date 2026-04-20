/** @vitest-environment jsdom */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Scenario IDs: settings.profile-language-and-preferences-persist

const settingsState = vi.hoisted(() => ({
  user: null,
  updateMe: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('@/api/appClient', () => ({
  appClient: {
    auth: {
      me: vi.fn(async () => settingsState.user),
      updateMe: settingsState.updateMe,
    },
  },
}));

vi.mock('@/components/i18n/useLanguage', () => ({
  useLanguage: () => ({
    currentLanguage: 'en',
    t: (key) => ({
      'settings.kicker': 'Settings',
      'settings.title': 'Account settings',
      'settings.description': 'Profile and communication preferences.',
      'settings.profile': 'Profile',
      'settings.communications': 'Communications',
      'settings.fullName': 'Full name',
      'settings.fullNamePlaceholder': 'Enter your full name',
      'settings.email': 'Email',
      'settings.emailCannotBeChanged': 'Email cannot be changed here.',
      'settings.phone': 'Phone',
      'settings.saveChanges': 'Save changes',
      'settings.profileUpdated': 'Profile updated successfully',
      'notificationPreferences.saveSuccess': 'Preferences saved',
      'settings.notifications': 'Notifications',
    }[key] || key),
  }),
}));

vi.mock('@/components/settings/NotificationPreferences', () => ({
  default: ({ userEmail }) => <div>preferences-for:{userEmail}</div>,
}));

vi.mock('sonner', () => ({
  toast: {
    success: settingsState.toastSuccess,
  },
}));

import Settings from './Settings';

function renderSettings() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <Settings />
    </QueryClientProvider>,
  );
}

describe('Settings page', () => {
  beforeEach(() => {
    settingsState.user = {
      email: 'qa-settings@edilsync.test',
      full_name: 'QA Settings User',
      display_name: 'QA Display',
      phone: '+39 111 222 333',
    };
    settingsState.updateMe.mockReset();
    settingsState.updateMe.mockResolvedValue({});
    settingsState.toastSuccess.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('hydrates the profile form and saves edited profile fields', async () => {
    const user = userEvent.setup();

    renderSettings();

    const fullNameInput = await screen.findByLabelText('Full name');
    const phoneInput = screen.getByLabelText('Phone');
    const saveButton = screen.getByRole('button', { name: 'Save changes' });

    expect(fullNameInput.value).toBe('QA Display');
    expect(phoneInput.value).toBe('+39 111 222 333');
    expect(saveButton.hasAttribute('disabled')).toBe(true);

    await user.clear(phoneInput);
    await user.type(phoneInput, '+39 444 555 666');
    await user.click(saveButton);

    await waitFor(() => {
      expect(settingsState.updateMe).toHaveBeenCalledWith({
        display_name: 'QA Display',
        phone: '+39 444 555 666',
      });
    });
    expect(settingsState.toastSuccess).toHaveBeenCalledWith('Profile updated successfully');
  });

  it('opens the notifications tab and passes the current user email to preferences', async () => {
    const user = userEvent.setup();

    renderSettings();

    await user.click(await screen.findByRole('tab', { name: 'Communications' }));

    expect(await screen.findByText('preferences-for:qa-settings@edilsync.test')).toBeTruthy();
  });
});