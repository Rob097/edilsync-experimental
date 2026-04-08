import { appClient } from '@/api/appClient';

export const notifyTaskBlockedResponsible = async ({
  projectId,
  blockedReason,
  blockedByOption,
  actorName,
  t,
}) => {
  if (!blockedByOption || blockedByOption.value === 'other') return;

  await appClient.functions.invoke('notifyTaskBlockedResponsible', {
    project_id: projectId,
    blocked_by_type: blockedByOption.type,
    blocked_by_user_email: blockedByOption.user_email || null,
    blocked_by_company_id: blockedByOption.company_id || null,
    title: t('tasks.blockedNotificationTitle'),
    message: t('tasks.blockedNotificationMessage', {
      task: blockedByOption.taskTitle || '-',
      reason: blockedReason,
      actor: actorName || '-',
      project: blockedByOption.projectName || '-',
    }),
    email_subject: t('tasks.blockedNotificationEmailSubject'),
    email_body: t('tasks.blockedNotificationEmailBody', {
      task: blockedByOption.taskTitle || '-',
      reason: blockedReason,
      actor: actorName || '-',
      project: blockedByOption.projectName || '-',
    }),
  });
};
