import { appClient } from '@/api/appClient';

export const sendProjectSponsorshipNotifications = async ({
  projectId,
  actionType,
  notificationType,
  title,
  message,
  emailSubject,
  emailBody,
}) => {
  if (!projectId || !actionType || !notificationType) return;

  try {
    await appClient.functions.invoke('notifyProjectSponsorshipParticipants', {
      project_id: projectId,
      action_type: actionType,
      notification_type: notificationType,
      title,
      message,
      email_subject: emailSubject || null,
      email_body: emailBody || null,
    });
  } catch (error) {
    console.error('Unable to send project sponsorship notifications', error);
  }
};