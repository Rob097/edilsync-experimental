import { describe, expect, it } from 'vitest';

import { buildEventNotificationPayload, getEventNotificationContext } from './eventNotifications';

describe('eventNotifications', () => {
  it('builds personal event notification payloads with personal context', () => {
    expect(
      buildEventNotificationPayload({
        ownerType: 'personal',
        userEmail: 'invitee@edilsync.test',
        type: 'event_invite',
        title: 'New event',
        message: 'You were invited',
        relatedEventId: 'event-1',
      }),
    ).toEqual({
      user_email: 'invitee@edilsync.test',
      context_type: 'personal',
      context_company_id: null,
      type: 'event_invite',
      title: 'New event',
      message: 'You were invited',
      related_event_id: 'event-1',
      is_read: false,
    });
  });

  it('builds company event notification payloads with company context', () => {
    expect(getEventNotificationContext({ ownerType: 'company', ownerCompanyId: 'company-1' })).toEqual({
      context_type: 'company',
      context_company_id: 'company-1',
    });
  });

  it('allows user participant notifications to override company events into personal context', () => {
    expect(
      buildEventNotificationPayload({
        ownerType: 'company',
        ownerCompanyId: 'company-1',
        contextType: 'personal',
        userEmail: 'invitee@edilsync.test',
        type: 'event_invite',
        title: 'Company event',
        message: 'You were invited personally',
        relatedEventId: 'event-2',
      }),
    ).toEqual({
      user_email: 'invitee@edilsync.test',
      context_type: 'personal',
      context_company_id: null,
      type: 'event_invite',
      title: 'Company event',
      message: 'You were invited personally',
      related_event_id: 'event-2',
      is_read: false,
    });
  });
});