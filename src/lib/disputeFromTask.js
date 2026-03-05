import { appClient } from '@/api/appClient';
import { sendDisputeNotifications } from '@/lib/disputeNotifications';

export const createDisputeFromTask = async ({
  projectId,
  task,
  openerParticipantId,
  title,
  summary,
  category = 'delay',
  amountImpact,
  timeImpactDays,
  t,
}) => {
  const created = await appClient.entities.DisputeCase.create({
    project_id: projectId,
    task_id: task?.id || null,
    opened_by_participant_id: openerParticipantId || null,
    category,
    status: 'open',
    title: title?.trim() || '',
    summary: summary?.trim() || '',
    amount_impact: typeof amountImpact === 'number' ? amountImpact : null,
    time_impact_days: typeof timeImpactDays === 'number' ? timeImpactDays : null,
  });

  await appClient.entities.DisputeEvent.create({
    dispute_case_id: created.id,
    project_id: projectId,
    actor_participant_id: openerParticipantId || null,
    event_type: 'opened',
    note: summary?.trim() || null,
  });

  if (task?.id) {
    await appClient.entities.DisputeEvidenceItem.create({
      dispute_case_id: created.id,
      project_id: projectId,
      source_type: 'task',
      source_id: task.id,
      snapshot: {
        title: task.title,
        status: task.status,
        due_date: task.due_date || null,
        blocked_reason: task.blocked_reason || null,
      },
      note: t('disputes.autoEvidenceFromTask'),
    });
  }

  await sendDisputeNotifications({
    projectId,
    actorParticipantId: openerParticipantId || null,
    actionType: 'dispute_opened',
    notificationType: 'dispute_opened',
    title: t('disputes.notifications.openedTitle'),
    message: t('disputes.notifications.openedMessage', { title: title?.trim() || '' }),
    emailSubject: t('disputes.notifications.openedEmailSubject'),
    emailBody: t('disputes.notifications.openedEmailBody', { title: title?.trim() || '' }),
  });

  return created;
};
