/** @vitest-environment jsdom */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// Scenario IDs: notifications.routing.message-mention-targets-project-chat, notifications.routing.billing-targets-company-detail

const navigateMock = vi.fn();

const notificationsState = vi.hoisted(() => ({
  user: null,
  notifications: [],
  projects: [],
  events: [],
  messages: [],
  update: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/api/appClient', () => ({
  appClient: {
    auth: {
      me: vi.fn(async () => notificationsState.user),
    },
    entities: {
      CompanyMember: {
        filter: vi.fn(async () => []),
      },
      Notification: {
        filter: vi.fn(async () => notificationsState.notifications),
        update: notificationsState.update,
      },
      Project: {
        list: vi.fn(async () => notificationsState.projects),
      },
      Event: {
        list: vi.fn(async () => notificationsState.events),
      },
      Message: {
        list: vi.fn(async () => notificationsState.messages),
      },
    },
  },
}));

vi.mock('@/components/i18n/useLanguage', () => ({
  useLanguage: () => ({
    currentLanguage: 'en',
    t: (key, params) => ({
      'notificationsPage.title': 'Notifications',
      'notificationsPage.unread': 'unread',
      'notificationsPage.allRead': 'Everything is read',
      'notificationsPage.markAllAsRead': 'Mark all as read',
      'notificationsPage.noNotifications': 'No notifications',
      'notificationsPage.noNotificationsDescription': 'Nothing new for this context.',
      'notificationsPage.projectContext': `Project: ${params?.project || ''}`,
    }[key] || key),
  }),
}));

vi.mock('@/utils', () => ({
  createPageUrl: (pageName) => `/app/${pageName}`,
}));

import Notifications from './Notifications';

function renderNotifications() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <Notifications />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('Notifications page', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    notificationsState.update.mockReset();
    notificationsState.update.mockResolvedValue({});
    notificationsState.projects = [
      { id: 'project-1', name: 'Tower Renovation' },
    ];
    notificationsState.events = [
      { id: 'event-1', project_id: 'project-1' },
    ];
    notificationsState.messages = [
      { id: 'message-1', project_id: 'project-1' },
    ];
  });

  afterEach(() => {
    cleanup();
  });

  it('shows only personal-context notifications and routes mentions to the project chat', async () => {
    const user = userEvent.setup();

    notificationsState.user = {
      email: 'qa-user@edilsync.test',
      active_context: 'personal',
      active_company_id: 'company-a',
    };
    notificationsState.notifications = [
      {
        id: 'notif-personal',
        user_email: 'qa-user@edilsync.test',
        context_type: 'personal',
        type: 'message_mention',
        related_event_id: 'message-1',
        title: 'Mention from project chat',
        message: 'You were mentioned in a message.',
        is_read: false,
        created_date: '2026-04-14T10:00:00.000Z',
      },
      {
        id: 'notif-company',
        user_email: 'qa-user@edilsync.test',
        context_type: 'company',
        context_company_id: 'company-a',
        type: 'company_plan_changed',
        related_event_id: 'company-a',
        title: 'Company billing changed',
        message: 'Your company plan changed.',
        is_read: false,
        created_date: '2026-04-14T09:00:00.000Z',
      },
    ];

    renderNotifications();

    await waitFor(() => {
      expect(screen.getByText('Mention from project chat')).toBeTruthy();
    });
    expect(screen.queryByText('Company billing changed')).toBeNull();
    expect(screen.getByText('Project: Tower Renovation')).toBeTruthy();

    await user.click(screen.getByText('Mention from project chat'));

    await waitFor(() => {
      expect(notificationsState.update).toHaveBeenCalledWith('notif-personal', { is_read: true });
    });
    expect(navigateMock).toHaveBeenCalledWith('/app/ProjectDetail?id=project-1&tab=info&section=chat');
  });

  it('shows only active-company notifications and routes billing alerts to company detail', async () => {
    const user = userEvent.setup();

    notificationsState.user = {
      email: 'qa-user@edilsync.test',
      active_context: 'company',
      active_company_id: 'company-a',
    };
    notificationsState.notifications = [
      {
        id: 'notif-company-visible',
        user_email: 'qa-user@edilsync.test',
        context_type: 'company',
        context_company_id: 'company-a',
        type: 'company_plan_changed',
        related_event_id: 'company-a',
        title: 'Company billing changed',
        message: 'Your company plan changed.',
        is_read: false,
        created_date: '2026-04-14T11:00:00.000Z',
      },
      {
        id: 'notif-company-hidden',
        user_email: 'qa-user@edilsync.test',
        context_type: 'company',
        context_company_id: 'company-b',
        type: 'company_plan_changed',
        related_event_id: 'company-b',
        title: 'Other company billing changed',
        message: 'Another company changed.',
        is_read: false,
        created_date: '2026-04-14T10:00:00.000Z',
      },
    ];

    renderNotifications();

    await waitFor(() => {
      expect(screen.getByText('Company billing changed')).toBeTruthy();
    });
    expect(screen.queryByText('Other company billing changed')).toBeNull();

    await user.click(screen.getByText('Company billing changed'));

    await waitFor(() => {
      expect(notificationsState.update).toHaveBeenCalledWith('notif-company-visible', { is_read: true });
    });
    expect(navigateMock).toHaveBeenCalledWith('/app/CompanyDetail?id=company-a&tab=billing');
  });

  it('marks a notification as read even when it has no navigation target', async () => {
    const user = userEvent.setup();

    notificationsState.user = {
      email: 'qa-user@edilsync.test',
      active_context: 'personal',
      active_company_id: null,
    };
    notificationsState.notifications = [
      {
        id: 'notif-no-target',
        user_email: 'qa-user@edilsync.test',
        context_type: 'personal',
        type: 'participant_declined',
        related_event_id: null,
        title: 'Participant declined',
        message: 'A participant declined the invite.',
        is_read: false,
        created_date: '2026-04-14T12:00:00.000Z',
      },
    ];

    renderNotifications();

    await waitFor(() => {
      expect(screen.getByText('Participant declined')).toBeTruthy();
    });

    await user.click(screen.getByText('Participant declined'));

    await waitFor(() => {
      expect(notificationsState.update).toHaveBeenCalledWith('notif-no-target', { is_read: true });
    });
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('renders the empty state when the current context has no notifications', async () => {
    notificationsState.user = {
      email: 'qa-user@edilsync.test',
      active_context: 'personal',
      active_company_id: null,
    };
    notificationsState.notifications = [];

    renderNotifications();

    await waitFor(() => {
      expect(screen.getByText('No notifications')).toBeTruthy();
    });
    expect(screen.getByText('Nothing new for this context.')).toBeTruthy();
  });
});