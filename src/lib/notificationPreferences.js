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
    group: { it: 'Gestione Cantieri', en: 'Worksite Management' },
    actions: [
      { key: 'project_invite', label: { it: 'Invito a nuovo cantiere', en: 'Invitation to a new worksite' } },
      { key: 'task_assigned', label: { it: 'Assegnazione task', en: 'Task assignment' } },
      { key: 'task_status_changed', label: { it: 'Cambio stato task', en: 'Task status change' } },
      { key: 'change_request_assigned', label: { it: 'Assegnazione richiesta di modifica', en: 'Change request assignment' } },
      { key: 'change_request_status_changed', label: { it: 'Cambio stato richiesta di modifica', en: 'Change request status change' } },
      { key: 'milestone_status_changed', label: { it: 'Cambio stato milestone', en: 'Milestone status change' } },
    ],
  },
  {
    group: { it: 'Gestione Società', en: 'Company Management' },
    actions: [
      { key: 'company_invite', label: { it: 'Invito a nuova società', en: 'Invitation to a new company' } },
      { key: 'company_plan_activated', label: { it: 'Piano società attivato', en: 'Company plan activated' } },
      { key: 'company_plan_changed', label: { it: 'Piano società modificato', en: 'Company plan changed' } },
      { key: 'company_plan_canceled', label: { it: 'Abbonamento società disdetto', en: 'Company subscription canceled' } },
    ],
  },
  {
    group: { it: 'Piano Cantiere', en: 'Worksite Plan' },
    actions: [
      { key: 'project_sponsorship_activated', label: { it: 'Sponsorship cantiere attivata', en: 'Worksite sponsorship activated' } },
      { key: 'project_sponsorship_revoked', label: { it: 'Sponsorship cantiere revocata', en: 'Worksite sponsorship revoked' } },
    ],
  },
  {
    group: { it: 'Calendario ed Eventi', en: 'Calendar and Events' },
    actions: [
      { key: 'event_invite', label: { it: 'Invito ad evento', en: 'Invitation to event' } },
      { key: 'event_updated', label: { it: 'Evento aggiornato', en: 'Event updated' } },
      { key: 'event_cancelled', label: { it: 'Evento cancellato', en: 'Event cancelled' } },
    ],
  },
  {
    group: { it: 'Comunicazioni', en: 'Communications' },
    actions: [
      { key: 'message_mention', label: { it: 'Menzione in un messaggio', en: 'Mention in a message' } },
      { key: 'document_comment', label: { it: 'Commento su documento', en: 'Comment on a document' } },
    ],
  },
  {
    group: { it: 'Gestione Dispute', en: 'Dispute Management' },
    actions: [
      { key: 'dispute_opened', label: { it: 'Nuova disputa aperta', en: 'New dispute opened' } },
      { key: 'dispute_status_changed', label: { it: 'Cambio stato disputa', en: 'Dispute status changed' } },
      { key: 'dispute_commented', label: { it: 'Nuovo commento in disputa', en: 'New dispute comment' } },
    ],
  },
];

export const mergeNotificationPreferences = (storedPreferences) => ({
  ...DEFAULT_NOTIFICATION_PREFERENCES,
  ...(storedPreferences || {}),
});

export const getNotificationPreferenceActionKeys = () =>
  Object.keys(DEFAULT_NOTIFICATION_PREFERENCES);
