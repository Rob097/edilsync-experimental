export const DIRECT_PROJECT_NOTIFICATION_TYPES = new Set([
  'project_invite',
  'dispute_opened',
  'dispute_status_changed',
  'dispute_commented',
  'task_status_changed',
  'project_sponsorship_activated',
  'project_sponsorship_revoked',
]);

export const EVENT_BASED_NOTIFICATION_TYPES = new Set([
  'event_invite',
  'event_cancelled',
  'event_updated',
  'conflict_resolved',
]);

export const filterNotificationsForContext = ({ notifications = [], currentContext, activeCompanyId }) => {
  return notifications.filter((notification) => {
    if (currentContext === 'personal') {
      return notification.context_type === 'personal' || !notification.context_type;
    }

    return (
      notification.context_type === 'company' &&
      notification.context_company_id === activeCompanyId
    );
  });
};

export const resolveNotificationProjectId = ({ notification, eventsById = {}, messagesById = {} }) => {
  if (!notification?.related_event_id) {
    return null;
  }

  if (DIRECT_PROJECT_NOTIFICATION_TYPES.has(notification.type)) {
    return notification.related_event_id;
  }

  if (EVENT_BASED_NOTIFICATION_TYPES.has(notification.type)) {
    return eventsById[notification.related_event_id]?.project_id || null;
  }

  if (notification.type === 'message_mention') {
    return messagesById[notification.related_event_id]?.project_id || null;
  }

  return null;
};

export const resolveNotificationProjectName = ({ notification, eventsById = {}, messagesById = {}, projectsById = {} }) => {
  const projectId = resolveNotificationProjectId({ notification, eventsById, messagesById });
  return projectId ? projectsById[projectId]?.name || null : null;
};

export const resolveNotificationTarget = ({ notification, createPageUrl, messagesById = {} }) => {
  if (!notification?.related_event_id) {
    return null;
  }

  switch (notification.type) {
    case 'project_invite':
    case 'project_sponsorship_activated':
    case 'project_sponsorship_revoked':
      return `${createPageUrl('ProjectDetail')}?id=${notification.related_event_id}`;
    case 'event_invite':
    case 'event_cancelled':
    case 'event_updated':
    case 'conflict_resolved':
      return createPageUrl('Calendar');
    case 'message_mention': {
      const projectId = messagesById[notification.related_event_id]?.project_id;
      return projectId
        ? `${createPageUrl('ProjectDetail')}?id=${projectId}&tab=info&section=chat`
        : null;
    }
    case 'task_status_changed':
      return `${createPageUrl('ProjectDetail')}?id=${notification.related_event_id}&tab=lavori&section=tasks`;
    case 'dispute_opened':
    case 'dispute_status_changed':
    case 'dispute_commented':
      return `${createPageUrl('ProjectDetail')}?id=${notification.related_event_id}&tab=lavori&section=disputes`;
    case 'company_plan_activated':
    case 'company_plan_changed':
    case 'company_plan_canceled': {
      const companyId = notification.context_company_id || notification.related_event_id;
      return companyId
        ? `${createPageUrl('CompanyDetail')}?id=${companyId}&tab=billing`
        : null;
    }
    default:
      return null;
  }
};