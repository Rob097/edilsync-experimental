import { appClient } from '@/api/appClient';

export const sendDisputeNotifications = async ({
  projectId,
  actionType,
  notificationType,
  title,
  message,
  emailSubject,
  emailBody,
}) => {
  if (!projectId || !actionType || !notificationType) return;

  await appClient.functions.invoke('notifyDisputeParticipants', {
    project_id: projectId,
    action_type: actionType,
    notification_type: notificationType,
    title,
    message,
    email_subject: emailSubject || null,
    email_body: emailBody || null,
  });
};
