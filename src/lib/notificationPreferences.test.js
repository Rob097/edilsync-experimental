import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_PREFERENCE_GROUPS,
  getNotificationPreferenceActionKeys,
  mergeNotificationPreferences,
} from './notificationPreferences';

// Scenario IDs: notifications.preferences.defaults-match-entity-schema, notifications.preferences.groups-cover-all-actions, notifications.preferences.merge-preserves-defaults

const entitySchemaPath = path.resolve(import.meta.dirname, '../../entities/NotificationPreference.json');
const entitySchema = JSON.parse(fs.readFileSync(entitySchemaPath, 'utf8'));

describe('notificationPreferences helpers', () => {
  it('keeps default action keys aligned with the NotificationPreference entity schema', () => {
    const entityKeys = Object.keys(entitySchema.properties.preferences.properties);
    const defaultKeys = getNotificationPreferenceActionKeys();

    expect(defaultKeys.sort()).toEqual(entityKeys.sort());
    defaultKeys.forEach((key) => {
      expect(DEFAULT_NOTIFICATION_PREFERENCES[key]).toEqual({
        notification: expect.any(Boolean),
        email: expect.any(Boolean),
      });
    });
  });

  it('covers every default action inside the rendered preference groups', () => {
    const groupedKeys = NOTIFICATION_PREFERENCE_GROUPS.flatMap((group) =>
      group.actions.map((action) => action.key),
    );

    expect(new Set(groupedKeys)).toEqual(new Set(getNotificationPreferenceActionKeys()));
  });

  it('merges stored preferences over defaults without dropping missing actions', () => {
    const merged = mergeNotificationPreferences({
      event_invite: { notification: false, email: true },
      message_mention: { notification: false, email: false },
    });

    expect(merged.event_invite).toEqual({ notification: false, email: true });
    expect(merged.message_mention).toEqual({ notification: false, email: false });
    expect(merged.project_invite).toEqual(DEFAULT_NOTIFICATION_PREFERENCES.project_invite);
    expect(Object.keys(merged)).toHaveLength(Object.keys(DEFAULT_NOTIFICATION_PREFERENCES).length);
  });
});
