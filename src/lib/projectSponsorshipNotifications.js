import { appClient } from '@/api/appClient';

const dedupeRecipients = (recipients) => {
  const unique = new Map();
  recipients.forEach((recipient) => {
    if (!recipient?.email) return;
    const existing = unique.get(recipient.email);
    if (!existing) {
      unique.set(recipient.email, recipient);
      return;
    }

    if (existing.context_type !== 'personal' && recipient.context_type === 'personal') {
      unique.set(recipient.email, recipient);
    }
  });
  return Array.from(unique.values());
};

const resolveProjectRecipients = async (projectId) => {
  const participants = await appClient.entities.ProjectParticipant.filter({ project_id: projectId, status: 'active' });

  const companyIds = Array.from(new Set(
    participants
      .filter((participant) => participant.participant_type === 'company' && participant.company_id)
      .map((participant) => participant.company_id),
  ));

  const companyAdminsByCompany = new Map();
  await Promise.all(companyIds.map(async (companyId) => {
    const members = await appClient.entities.CompanyMember.filter({ company_id: companyId, status: 'active', role: 'admin' });
    companyAdminsByCompany.set(companyId, members);
  }));

  const recipients = [];

  participants.forEach((participant) => {
    if (participant.participant_type === 'personal' && participant.user_email) {
      recipients.push({
        email: participant.user_email,
        context_type: 'personal',
        context_company_id: null,
      });
      return;
    }

    if (participant.participant_type === 'company' && participant.company_id) {
      const admins = companyAdminsByCompany.get(participant.company_id) || [];
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
    const recipients = await resolveProjectRecipients(projectId);

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
  } catch (error) {
    console.error('Unable to send project sponsorship notifications', error);
  }
};