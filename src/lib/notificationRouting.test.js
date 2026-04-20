import { describe, expect, it } from 'vitest';
import {
  filterNotificationsForContext,
  resolveNotificationProjectId,
  resolveNotificationProjectName,
  resolveNotificationTarget,
} from './notificationRouting';

// Scenario IDs: notifications.routing.filter-by-context, notifications.routing.resolve-project-context, notifications.routing.resolve-navigation-targets

const createPageUrl = (pageName) => `/app/${pageName}`;

describe('notificationRouting helpers', () => {
  it('filters notifications correctly for personal and company contexts', () => {
    const notifications = [
      { id: '1', context_type: 'personal' },
      { id: '2', context_type: 'company', context_company_id: 'company-a' },
      { id: '3', context_type: 'company', context_company_id: 'company-b' },
      { id: '4', context_type: null },
    ];

    expect(
      filterNotificationsForContext({
        notifications,
        currentContext: 'personal',
        activeCompanyId: 'company-a',
      }).map(({ id }) => id),
    ).toEqual(['1', '4']);

    expect(
      filterNotificationsForContext({
        notifications,
        currentContext: 'company',
        activeCompanyId: 'company-a',
      }).map(({ id }) => id),
    ).toEqual(['2']);
  });

  it('resolves project ids and names from direct, event-based, and mention notifications', () => {
    const eventsById = {
      'event-1': { project_id: 'project-event' },
    };
    const messagesById = {
      'message-1': { project_id: 'project-chat' },
    };
    const projectsById = {
      'project-event': { name: 'Event Project' },
      'project-chat': { name: 'Chat Project' },
      'project-direct': { name: 'Direct Project' },
    };

    expect(
      resolveNotificationProjectId({
        notification: { type: 'project_invite', related_event_id: 'project-direct' },
        eventsById,
        messagesById,
      }),
    ).toBe('project-direct');

    expect(
      resolveNotificationProjectId({
        notification: { type: 'event_updated', related_event_id: 'event-1' },
        eventsById,
        messagesById,
      }),
    ).toBe('project-event');

    expect(
      resolveNotificationProjectName({
        notification: { type: 'message_mention', related_event_id: 'message-1' },
        eventsById,
        messagesById,
        projectsById,
      }),
    ).toBe('Chat Project');
  });

  it('maps the main notification types to the expected app targets', () => {
    const messagesById = {
      'message-1': { project_id: 'project-chat' },
    };

    expect(
      resolveNotificationTarget({
        notification: { type: 'company_plan_changed', related_event_id: 'company-1', context_company_id: 'company-2' },
        createPageUrl,
        messagesById,
      }),
    ).toBe('/app/CompanyDetail?id=company-2&tab=billing');

    expect(
      resolveNotificationTarget({
        notification: { type: 'message_mention', related_event_id: 'message-1' },
        createPageUrl,
        messagesById,
      }),
    ).toBe('/app/ProjectDetail?id=project-chat&tab=info&section=chat');

    expect(
      resolveNotificationTarget({
        notification: { type: 'task_status_changed', related_event_id: 'project-44' },
        createPageUrl,
        messagesById,
      }),
    ).toBe('/app/ProjectDetail?id=project-44&tab=lavori&section=tasks');

    expect(
      resolveNotificationTarget({
        notification: { type: 'event_invite', related_event_id: 'event-7' },
        createPageUrl,
        messagesById,
      }),
    ).toBe('/app/Calendar');

    expect(
      resolveNotificationTarget({
        notification: { type: 'unknown_type', related_event_id: 'x' },
        createPageUrl,
        messagesById,
      }),
    ).toBeNull();
  });
});