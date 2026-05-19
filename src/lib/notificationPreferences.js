export const DEFAULT_NOTIFICATION_PREFERENCES = {
  project_invite: { notification: true, email: true },
  company_invite: { notification: true, email: true },
  company_plan_activated: { notification: true, email: true },
  company_plan_changed: { notification: true, email: true },
  company_plan_canceled: { notification: true, email: true },
  task_assigned: { notification: true, email: false },
  task_status_changed: { notification: true, email: false },
  change_request_assigned: { notification: true, email: true },
  change_request_status_changed: { notification: true, email: false },
  milestone_status_changed: { notification: true, email: false },
  event_invite: { notification: true, email: true },
  event_updated: { notification: true, email: true },
  event_cancelled: { notification: true, email: true },
  message_mention: { notification: true, email: false },
  document_comment: { notification: true, email: false },
  project_sponsorship_activated: { notification: true, email: true },
  project_sponsorship_revoked: { notification: true, email: true },
  dispute_opened: { notification: true, email: true },
  dispute_status_changed: { notification: true, email: true },
  dispute_commented: { notification: true, email: false },
};

export const NOTIFICATION_PREFERENCE_GROUPS = [
  {
    groupKey: 'worksiteManagement',
    actions: [
      { key: 'project_invite' },
      { key: 'task_assigned' },
      { key: 'task_status_changed' },
      { key: 'change_request_assigned' },
      { key: 'change_request_status_changed' },
      { key: 'milestone_status_changed' },
    ],
  },
  {
    groupKey: 'companyManagement',
    actions: [
      { key: 'company_invite' },
      { key: 'company_plan_activated' },
      { key: 'company_plan_changed' },
      { key: 'company_plan_canceled' },
    ],
  },
  {
    groupKey: 'worksitePlan',
    actions: [
      { key: 'project_sponsorship_activated' },
      { key: 'project_sponsorship_revoked' },
    ],
  },
  {
    groupKey: 'calendarAndEvents',
    actions: [
      { key: 'event_invite' },
      { key: 'event_updated' },
      { key: 'event_cancelled' },
    ],
  },
  {
    groupKey: 'communications',
    actions: [
      { key: 'message_mention' },
      { key: 'document_comment' },
    ],
  },
  {
    groupKey: 'disputeManagement',
    actions: [
      { key: 'dispute_opened' },
      { key: 'dispute_status_changed' },
      { key: 'dispute_commented' },
    ],
  },
];

export const mergeNotificationPreferences = (storedPreferences) => ({
  ...DEFAULT_NOTIFICATION_PREFERENCES,
  ...(storedPreferences || {}),
});

export const getNotificationPreferenceActionKeys = () =>
  Object.keys(DEFAULT_NOTIFICATION_PREFERENCES);
