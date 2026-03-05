import { appClient } from '@/api/appClient';

export const notifyTaskBlockedResponsible = async ({
  projectId,
  task,
  blockedReason,
  blockedByOption,
  actorName,
  t,
}) => {
  if (!blockedByOption || blockedByOption.value === 'other') return;

  let projectName = null;
  if (projectId) {
    const projects = await appClient.entities.Project.filter({ id: projectId });
    projectName = projects[0]?.name || null;
  }

  const recipients = [];

  if (blockedByOption.type === 'personal' && blockedByOption.user_email) {
    recipients.push({
      email: blockedByOption.user_email,
      context_type: 'personal',
      context_company_id: null,
    });
  }

  if (blockedByOption.type === 'company' && blockedByOption.company_id) {
    const admins = await appClient.entities.CompanyMember.filter({
      company_id: blockedByOption.company_id,
      status: 'active',
      role: 'admin',
    });

    admins.forEach((admin) => {
      if (!admin.user_email) return;
      recipients.push({
        email: admin.user_email,
        context_type: 'company',
        context_company_id: blockedByOption.company_id,
      });
    });
  }

  await Promise.allSettled(
    recipients.map((recipient) => appClient.functions.invoke('sendNotificationOrEmail', {
      action_type: 'task_status_changed',
      recipient_email: recipient.email,
      context_type: recipient.context_type,
      context_company_id: recipient.context_company_id,
      notification_data: {
        type: 'task_status_changed',
        title: t('tasks.blockedNotificationTitle'),
        message: t('tasks.blockedNotificationMessage', {
          task: task?.title || '-',
          reason: blockedReason,
          actor: actorName || '-',
          project: projectName || '-',
        }),
        related_event_id: projectId,
      },
      email_data: {
        subject: t('tasks.blockedNotificationEmailSubject'),
        body: t('tasks.blockedNotificationEmailBody', {
          task: task?.title || '-',
          reason: blockedReason,
          actor: actorName || '-',
          project: projectName || '-',
        }),
      },
    })),
  );
};
