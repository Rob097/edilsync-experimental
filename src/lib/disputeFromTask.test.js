import { beforeEach, describe, expect, it, vi } from 'vitest';

// Scenario IDs: disputes.from-task.creates-case-event-and-evidence, disputes.from-task.omits-task-evidence-without-task

const { mockEntities, sendDisputeNotificationsMock } = vi.hoisted(() => {
  const mockEntities = {
    DisputeCase: { create: vi.fn() },
    DisputeEvent: { create: vi.fn() },
    DisputeEvidenceItem: { create: vi.fn() },
  };

  return {
    mockEntities,
    sendDisputeNotificationsMock: vi.fn(),
  };
});

vi.mock('@/api/appClient', () => ({
  appClient: {
    entities: mockEntities,
  },
}));

vi.mock('@/lib/disputeNotifications', () => ({
  sendDisputeNotifications: sendDisputeNotificationsMock,
}));

const { createDisputeFromTask } = await import('./disputeFromTask');

describe('createDisputeFromTask', () => {
  beforeEach(() => {
    Object.values(mockEntities).forEach(({ create }) => create.mockReset());
    sendDisputeNotificationsMock.mockReset();
    mockEntities.DisputeCase.create.mockResolvedValue({ id: 'dispute-1' });
    mockEntities.DisputeEvent.create.mockResolvedValue({ id: 'event-1' });
    mockEntities.DisputeEvidenceItem.create.mockResolvedValue({ id: 'evidence-1' });
    sendDisputeNotificationsMock.mockResolvedValue(undefined);
  });

  it('creates the dispute case, opening event, task evidence, and notifications', async () => {
    const t = vi.fn((key, params) => {
      if (params?.title) {
        return `${key}:${params.title}`;
      }

      return key;
    });

    const created = await createDisputeFromTask({
      projectId: 'project-123',
      openerParticipantId: 'participant-456',
      task: {
        id: 'task-789',
        title: ' Late inspection ',
        status: 'blocked',
        due_date: '2026-04-11',
        blocked_reason: 'Missing documents',
      },
      title: '  Delay on inspection  ',
      summary: '  Waiting for revised drawings  ',
      category: 'delay',
      amountImpact: 1250,
      timeImpactDays: 3,
      t,
    });

    expect(created).toEqual({ id: 'dispute-1' });
    expect(mockEntities.DisputeCase.create).toHaveBeenCalledWith({
      project_id: 'project-123',
      task_id: 'task-789',
      opened_by_participant_id: 'participant-456',
      category: 'delay',
      status: 'open',
      title: 'Delay on inspection',
      summary: 'Waiting for revised drawings',
      amount_impact: 1250,
      time_impact_days: 3,
    });
    expect(mockEntities.DisputeEvent.create).toHaveBeenCalledWith({
      dispute_case_id: 'dispute-1',
      project_id: 'project-123',
      actor_participant_id: 'participant-456',
      event_type: 'opened',
      note: 'Waiting for revised drawings',
    });
    expect(mockEntities.DisputeEvidenceItem.create).toHaveBeenCalledWith({
      dispute_case_id: 'dispute-1',
      project_id: 'project-123',
      source_type: 'task',
      source_id: 'task-789',
      snapshot: {
        title: ' Late inspection ',
        status: 'blocked',
        due_date: '2026-04-11',
        blocked_reason: 'Missing documents',
      },
      note: 'disputes.autoEvidenceFromTask',
    });
    expect(sendDisputeNotificationsMock).toHaveBeenCalledWith({
      projectId: 'project-123',
      actorParticipantId: 'participant-456',
      actionType: 'dispute_opened',
      notificationType: 'dispute_opened',
      title: 'disputes.notifications.openedTitle',
      message: 'disputes.notifications.openedMessage:Delay on inspection',
      emailSubject: 'disputes.notifications.openedEmailSubject',
      emailBody: 'disputes.notifications.openedEmailBody:Delay on inspection',
    });
  });

  it('omits task evidence and normalizes nullable values when no task is attached', async () => {
    const t = vi.fn((key) => key);

    await createDisputeFromTask({
      projectId: 'project-999',
      openerParticipantId: null,
      task: null,
      title: '   ',
      summary: '',
      amountImpact: '1250',
      timeImpactDays: undefined,
      t,
    });

    expect(mockEntities.DisputeCase.create).toHaveBeenCalledWith({
      project_id: 'project-999',
      task_id: null,
      opened_by_participant_id: null,
      category: 'delay',
      status: 'open',
      title: '',
      summary: '',
      amount_impact: null,
      time_impact_days: null,
    });
    expect(mockEntities.DisputeEvent.create).toHaveBeenCalledWith({
      dispute_case_id: 'dispute-1',
      project_id: 'project-999',
      actor_participant_id: null,
      event_type: 'opened',
      note: null,
    });
    expect(mockEntities.DisputeEvidenceItem.create).not.toHaveBeenCalled();
  });
});
