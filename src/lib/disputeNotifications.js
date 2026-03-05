import { appClient } from '@/api/appClient';

const dedupeRecipients = (recipients) => {
  const unique = new Map();
  recipients.forEach((recipient) => {
    if (!recipient?.email) return;
    const key = `${recipient.email}::${recipient.context_type}::${recipient.context_company_id || ''}`;
    if (!unique.has(key)) {
      unique.set(key, recipient);
    }
  });
  return Array.from(unique.values());
};

const resolveRecipients = async ({ projectId, actorParticipantId }) => {
  const participants = await appClient.entities.ProjectParticipant.filter({ project_id: projectId, status: 'active' });

  const targetParticipants = participants.filter((participant) => participant.id !== actorParticipantId);
  const companyIds = Array.from(new Set(targetParticipants
    .filter((participant) => participant.participant_type === 'company' && participant.company_id)
    .map((participant) => participant.company_id)));

  const companyMembersByCompany = new Map();
  await Promise.all(companyIds.map(async (companyId) => {
    const members = await appClient.entities.CompanyMember.filter({ company_id: companyId, status: 'active', role: 'admin' });
    companyMembersByCompany.set(companyId, members);
  }));

  const recipients = [];

  targetParticipants.forEach((participant) => {
    if (participant.participant_type === 'personal' && participant.user_email) {
      recipients.push({
        email: participant.user_email,
        context_type: 'personal',
        context_company_id: null,
      });
      return;
    }

    if (participant.participant_type === 'company' && participant.company_id) {
      const admins = companyMembersByCompany.get(participant.company_id) || [];
      admins.forEach((admin) => {
        if (!admin.user_email) return;
        recipients.push({
          email: admin.user_email,
          context_type: 'company',
          context_company_id: participant.company_id,
        });
      });
    }
  });

  return dedupeRecipients(recipients);
};

export const sendDisputeNotifications = async ({
  projectId,
  actorParticipantId,
  actionType,
  notificationType,
  title,
  message,
  emailSubject,
  emailBody,
}) => {
  if (!projectId || !actionType || !notificationType) return;

  const recipients = await resolveRecipients({ projectId, actorParticipantId });

  await Promise.allSettled(
    recipients.map((recipient) => appClient.functions.invoke('sendNotificationOrEmail', {
      action_type: actionType,
      recipient_email: recipient.email,
      context_type: recipient.context_type,
      context_company_id: recipient.context_company_id,
      notification_data: {
        type: notificationType,
        title,
        message,
        related_event_id: projectId,
      },
      email_data: emailSubject && emailBody
        ? {
          subject: emailSubject,
          body: emailBody,
        }
        : null,
    })),
  );
};
