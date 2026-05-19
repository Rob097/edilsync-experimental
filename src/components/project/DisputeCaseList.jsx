import React, { useMemo, useState } from 'react';
import { appClient } from '@/api/appClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import { useLanguage } from '@/components/i18n/useLanguage';
import EmptyState from '@/components/ui/EmptyState';
import { sendDisputeNotifications } from '@/lib/disputeNotifications';
import DisputeCommentComposer from './DisputeCommentComposer';
import { isFeatureAccessible, useProjectFeatureAccess } from '@/hooks/useFeatureAccess';

const categoryKeys = ['scope', 'cost', 'delay', 'quality', 'payment', 'other'];
const statusKeys = ['open', 'awaiting_response', 'in_review', 'resolved', 'closed_no_agreement', 'escalated'];

export default function DisputeCaseList({
  projectId,
  currentUser,
  currentParticipant,
  canCreate,
  canRespond,
  taskContext,
  createDialogOpen,
  onCreateDialogChange,
  compact = false,
  emptyStateText,
}) {
  const { t, currentLanguage } = useLanguage();
  const tx = (key, options) => t(`completeScoped.components_project_DisputeCaseList.${key}`, options);
  const dateLocale = currentLanguage === 'it' ? it : enUS;
  const queryClient = useQueryClient();
  const { featureMap: projectFeatureMap } = useProjectFeatureAccess(projectId, ['project_milestones'], { enabled: !!projectId });
  const canMentionMilestones = isFeatureAccessible(projectFeatureMap.project_milestones);

  const [internalCreateOpen, setInternalCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('other');
  const [amountImpact, setAmountImpact] = useState('');
  const [timeImpact, setTimeImpact] = useState('');
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const createOpen = createDialogOpen ?? internalCreateOpen;
  const setCreateOpen = (value) => {
    if (typeof createDialogOpen === 'boolean') {
      onCreateDialogChange?.(value);
      return;
    }
    setInternalCreateOpen(value);
  };

  const { data: disputes = [], isLoading } = useQuery({
    queryKey: ['disputes', projectId],
    queryFn: () => appClient.entities.DisputeCase.filter({ project_id: projectId }, '-created_date'),
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });

  const { data: participants = [] } = useQuery({
    queryKey: ['projectParticipants', projectId],
    queryFn: () => appClient.entities.ProjectParticipant.filter({ project_id: projectId, status: 'active' }),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => appClient.entities.User.list(),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => appClient.entities.Company.list(),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => appClient.entities.Task.filter({ project_id: projectId }),
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });

  const createDisputeMutation = useMutation({
    mutationFn: async () => {
      const created = await appClient.entities.DisputeCase.create({
        project_id: projectId,
        task_id: taskContext?.id || null,
        opened_by_participant_id: currentParticipant?.id || null,
        category,
        status: 'open',
        title: title.trim(),
        summary: summary.trim(),
        amount_impact: amountImpact ? Number(amountImpact) : null,
        time_impact_days: timeImpact ? Number(timeImpact) : null,
      });

      await appClient.entities.DisputeEvent.create({
        dispute_case_id: created.id,
        project_id: projectId,
        actor_participant_id: currentParticipant?.id || null,
        event_type: 'opened',
        note: summary.trim(),
      });

      if (taskContext?.id) {
        await appClient.entities.DisputeEvidenceItem.create({
          dispute_case_id: created.id,
          project_id: projectId,
          source_type: 'task',
          source_id: taskContext.id,
          snapshot: {
            title: taskContext.title,
            status: taskContext.status,
            due_date: taskContext.due_date || null,
            blocked_reason: taskContext.blocked_reason || null,
          },
          note: t('disputes.autoEvidenceFromTask'),
        });
      }

      await sendDisputeNotifications({
        projectId,
        actorParticipantId: currentParticipant?.id || null,
        actionType: 'dispute_opened',
        notificationType: 'dispute_opened',
        title: t('disputes.notifications.openedTitle'),
        message: t('disputes.notifications.openedMessage', { title: title.trim() }),
        emailSubject: t('disputes.notifications.openedEmailSubject'),
        emailBody: t('disputes.notifications.openedEmailBody', { title: title.trim() }),
      });

      return created;
    },
    onSuccess: async () => {
      setTitle('');
      setSummary('');
      setCategory('other');
      setAmountImpact('');
      setTimeImpact('');
      setCreateOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['disputes', projectId] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ disputeId, status }) => {
      const updated = await appClient.entities.DisputeCase.update(disputeId, {
        status,
        resolved_at: status === 'resolved' ? new Date().toISOString() : null,
      });

      await appClient.entities.DisputeEvent.create({
        dispute_case_id: disputeId,
        project_id: projectId,
        actor_participant_id: currentParticipant?.id || null,
        event_type: status === 'resolved' ? 'resolved' : 'status_changed',
        note: status,
      });

      await sendDisputeNotifications({
        projectId,
        actorParticipantId: currentParticipant?.id || null,
        actionType: 'dispute_status_changed',
        notificationType: 'dispute_status_changed',
        title: t('disputes.notifications.statusChangedTitle'),
        message: t('disputes.notifications.statusChangedMessage', {
          title: updated.title,
          status: t(`disputes.status.${status}`),
        }),
        emailSubject: t('disputes.notifications.statusChangedEmailSubject'),
        emailBody: t('disputes.notifications.statusChangedEmailBody', {
          title: updated.title,
          status: t(`disputes.status.${status}`),
        }),
      });

      return updated;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['disputes', projectId] });
    },
  });

  const { data: disputeEvents = [] } = useQuery({
    queryKey: ['disputeEvents', selectedDispute?.id],
    queryFn: () => appClient.entities.DisputeEvent.filter({ dispute_case_id: selectedDispute?.id }, '-created_date'),
    enabled: !!selectedDispute?.id,
    staleTime: 15 * 1000,
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ text, mentions, attachments }) => {
      if (!selectedDispute?.id || !text?.trim()) return;

      await appClient.entities.DisputeEvent.create({
        dispute_case_id: selectedDispute.id,
        project_id: projectId,
        actor_participant_id: currentParticipant?.id || null,
        event_type: 'commented',
        note: text.trim(),
        payload: {
          mentions: mentions || {},
          attachments: attachments || [],
        },
      });

      await sendDisputeNotifications({
        projectId,
        actorParticipantId: currentParticipant?.id || null,
        actionType: 'dispute_commented',
        notificationType: 'dispute_commented',
        title: t('disputes.notifications.commentedTitle'),
        message: t('disputes.notifications.commentedMessage', { title: selectedDispute.title }),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['disputeEvents', selectedDispute?.id] });
    },
  });

  const formatEventNote = (note) => {
    if (!note) return '';

    return note
      .replace(/@\[([^\]]+)\]\(([^:]+):([^)]+)\)/g, '@$1')
      .replace(/#\[([^\]]+)\]\(([^:]+):([^)]+)\)/g, '#$1');
  };

  const eventTypeLabel = (eventType) => {
    const map = {
      opened: t('disputes.eventType.opened'),
      commented: t('disputes.eventType.commented'),
      status_changed: t('disputes.eventType.statusChanged'),
      resolved: t('disputes.eventType.resolved'),
      escalated: t('disputes.eventType.escalated'),
    };
    return map[eventType] || eventType;
  };

  const taskById = useMemo(() => {
    return tasks.reduce((accumulator, task) => {
      accumulator[task.id] = task;
      return accumulator;
    }, {});
  }, [tasks]);

  const participantById = useMemo(() => {
    return participants.reduce((accumulator, participant) => {
      accumulator[participant.id] = participant;
      return accumulator;
    }, {});
  }, [participants]);

  const actorLabelFromParticipant = (participant) => {
    if (!participant) return t('disputes.unknownActor');

    if (participant.participant_type === 'personal') {
      const matchedUser = allUsers.find((user) => user.email === participant.user_email);
      return matchedUser?.display_name || matchedUser?.full_name || participant.user_email || t('disputes.unknownActor');
    }

    const matchedCompany = companies.find((company) => company.id === participant.company_id);
    return matchedCompany?.name || participant.company_name || t('disputes.unknownActor');
  };

  const actorLabelFromEvent = (event) => {
    const participant = participantById[event.actor_participant_id];

    if (participant) {
      return actorLabelFromParticipant(participant);
    }

    if (event.event_type === 'opened' && selectedDispute?.opened_by_participant_id) {
      const openedByParticipant = participantById[selectedDispute.opened_by_participant_id];
      if (openedByParticipant) {
        return actorLabelFromParticipant(openedByParticipant);
      }
    }

    return t('disputes.unknownActor');
  };

  const openDisputeDetail = (dispute) => {
    setSelectedDispute(dispute);
    setDetailOpen(true);
  };

  const statusMeta = useMemo(() => ({
    open: 'bg-red-100 text-red-700',
    awaiting_response: 'bg-yellow-100 text-yellow-700',
    in_review: 'bg-blue-100 text-blue-700',
    resolved: 'bg-green-100 text-green-700',
    closed_no_agreement: 'bg-gray-100 text-gray-700',
    escalated: 'bg-purple-100 text-purple-700',
  }), []);

  const canCreateDispute = Boolean(title.trim() && summary.trim());
  const resolvedEmptyStateText = emptyStateText || tx('k1');

  const listContent = isLoading ? (
    <p className="text-sm text-gray-600">{t('common.loading')}</p>
  ) : disputes.length === 0 ? (
    compact ? (
      <p className="text-sm text-gray-600">{resolvedEmptyStateText}</p>
    ) : (
      <EmptyState
        icon={AlertTriangle}
        title={t('disputes.emptyTitle')}
        description={t('disputes.emptyDescription')}
        actionLabel={canCreate ? t('disputes.newDispute') : undefined}
        onAction={canCreate ? () => setCreateOpen(true) : undefined}
      />
    )
  ) : (
    <div className="space-y-3">
      {disputes.map((dispute) => (
        <div key={dispute.id} id={`dispute-${dispute.id}`} className="w-full text-left rounded-lg border p-3 space-y-2 hover:bg-gray-50 cursor-pointer" onClick={() => openDisputeDetail(dispute)}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-gray-900">{dispute.title}</p>
              <p className="text-sm text-gray-600 mt-1">{dispute.summary}</p>
            </div>
            <Badge className={statusMeta[dispute.status] || statusMeta.open}>
              {t(`disputes.status.${dispute.status}`)}
            </Badge>
          </div>
          <div className="text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
            <span>{t(`disputes.category.${dispute.category}`)}</span>
            {typeof dispute.amount_impact === 'number' ? <span>€{dispute.amount_impact}</span> : null}
            {typeof dispute.time_impact_days === 'number' ? <span>{t('disputes.days', { count: dispute.time_impact_days })}</span> : null}
            <span>{format(new Date(dispute.created_date), 'dd MMM yyyy', { locale: dateLocale })}</span>
          </div>
          {canRespond ? (
            <div onClick={(event) => event.stopPropagation()}>
              <Select value={dispute.status} onValueChange={(value) => updateStatusMutation.mutate({ disputeId: dispute.id, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusKeys.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`disputes.status.${status}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );

  if (compact) {
    return (
      <>
        {listContent}

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{taskContext?.id ? t('disputes.openFromTask') : t('disputes.newDispute')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {taskContext?.id ? (
                <div className="rounded-lg border border-[#ef6144]/20 bg-[#ef6144]/5 p-3 text-sm text-[#231b18]">
                  {t('disputes.linkedTask', { title: taskContext.title })}
                </div>
              ) : null}
              <div className="space-y-2">
                <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t('disputes.titlePlaceholder')} />
                <Textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder={t('disputes.summaryPlaceholder')} rows={4} />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">{t('disputes.categoryLabel')}</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryKeys.map((value) => (
                        <SelectItem key={value} value={value}>{t(`disputes.category.${value}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input type="number" min="0" value={amountImpact} onChange={(event) => setAmountImpact(event.target.value)} placeholder={t('disputes.amountImpactPlaceholder')} />
                <Input type="number" min="0" value={timeImpact} onChange={(event) => setTimeImpact(event.target.value)} placeholder={t('disputes.timeImpactPlaceholder')} />
              </div>
              <Button className="w-full bg-[#ef6144] hover:bg-[#d9553a]" onClick={() => createDisputeMutation.mutate()} disabled={!canCreateDispute || createDisputeMutation.isPending}>
                {createDisputeMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                {t('disputes.newDispute')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedDispute?.title || t('disputes.detailTitle')}</DialogTitle>
            </DialogHeader>
            {selectedDispute ? renderDisputeDetail(selectedDispute) : null}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle>{t('disputes.title')}</CardTitle>
        {canCreate ? (
          <Button size="sm" className="bg-[#ef6144] hover:bg-[#d9553a]" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {t('disputes.newDispute')}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>{listContent}</CardContent>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('disputes.newDispute')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t('disputes.titlePlaceholder')}
            />
            <Textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder={t('disputes.summaryPlaceholder')}
              rows={4}
            />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryKeys.map((categoryKey) => (
                  <SelectItem key={categoryKey} value={categoryKey}>
                    {t(`disputes.category.${categoryKey}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                type="number"
                value={amountImpact}
                onChange={(event) => setAmountImpact(event.target.value)}
                placeholder={t('disputes.amountImpactPlaceholder')}
              />
              <Input
                type="number"
                value={timeImpact}
                onChange={(event) => setTimeImpact(event.target.value)}
                placeholder={t('disputes.timeImpactPlaceholder')}
              />
            </div>
            {taskContext?.title ? (
              <p className="text-xs text-gray-500">{t('disputes.linkedTask', { title: taskContext.title })}</p>
            ) : null}
            <Button
              className="w-full bg-[#ef6144] hover:bg-[#d9553a]"
              disabled={createDisputeMutation.isPending || !title.trim() || !summary.trim()}
              onClick={() => createDisputeMutation.mutate()}
            >
              {createDisputeMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {t('disputes.openDispute')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDispute?.title || t('disputes.detailTitle')}</DialogTitle>
          </DialogHeader>

          {selectedDispute ? (
            <div className="space-y-5">
              <div className="rounded-lg border p-3 space-y-2">
                <p className="text-sm text-gray-600">{selectedDispute.summary}</p>
                <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                  <span>{t(`disputes.category.${selectedDispute.category}`)}</span>
                  <span>•</span>
                  <span>{t(`disputes.status.${selectedDispute.status}`)}</span>
                </div>
              </div>

              {selectedDispute.task_id ? (
                <div className="rounded-lg border p-3 space-y-2 bg-gray-50">
                  <h4 className="text-sm font-semibold text-gray-900">{t('disputes.linkedTaskInfoTitle')}</h4>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{t('disputes.linkedTaskLabel')}:</span>{' '}
                    {taskById[selectedDispute.task_id]?.title || selectedDispute.task_id}
                  </p>
                  {taskById[selectedDispute.task_id]?.blocked_reason ? (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{t('disputes.blockedReasonLabel')}:</span>{' '}
                      {taskById[selectedDispute.task_id].blocked_reason}
                    </p>
                  ) : null}
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{t('disputes.causedByLabel')}:</span>{' '}
                    {taskById[selectedDispute.task_id]?.blocked_by_name || taskById[selectedDispute.task_id]?.blocked_by_email || tx('k2')}
                  </p>
                </div>
              ) : null}

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">{t('disputes.timelineTitle')}</h4>
                {disputeEvents.length > 0 ? (
                  <div className="space-y-2">
                    {[...disputeEvents]
                      .sort((first, second) => new Date(first.created_date) - new Date(second.created_date))
                      .map((event) => (
                        <div key={event.id} className="rounded-lg border p-2">
                          <p className="text-sm font-medium text-gray-900">{eventTypeLabel(event.event_type)}</p>
                          <p className="text-xs text-gray-500 mt-1">{t('disputes.eventActor', { name: actorLabelFromEvent(event) })}</p>
                          {event.note ? <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{formatEventNote(event.note)}</p> : null}
                          {event.payload?.attachments?.length ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {event.payload.attachments.map((attachment) => (
                                <a
                                  key={`${event.id}-${attachment.id || attachment.name}`}
                                  href={attachment.file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs px-2 py-1 rounded border text-[#ef6144] border-[#ef6144]/30 hover:bg-[#ef6144]/5"
                                >
                                  {attachment.name}
                                </a>
                              ))}
                            </div>
                          ) : null}
                          <p className="text-xs text-gray-400 mt-1">{format(new Date(event.created_date), 'dd MMM yyyy HH:mm', { locale: dateLocale })}</p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">{t('disputes.noEvents')}</p>
                )}
              </div>

              <DisputeCommentComposer
                projectId={projectId}
                currentUser={currentUser}
                isPending={addCommentMutation.isPending}
                allowMilestoneMentions={canMentionMilestones}
                onSubmit={(payload) => addCommentMutation.mutate(payload)}
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
