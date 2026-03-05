import React, { useState } from 'react';
import { appClient } from '@/api/appClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/components/i18n/useLanguage';
import { sendDisputeNotifications } from '@/lib/disputeNotifications';

const categoryKeys = ['scope', 'cost', 'delay', 'quality', 'payment', 'other'];

export default function DisputeCreateDialog({
  open,
  onOpenChange,
  projectId,
  currentParticipant,
  taskContext,
}) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(taskContext?.title ? `${t('disputes.fromTaskPrefix')} ${taskContext.title}` : '');
  const [summary, setSummary] = useState(taskContext?.blocked_reason || '');
  const [category, setCategory] = useState(taskContext?.status === 'blocked' ? 'delay' : 'other');
  const [amountImpact, setAmountImpact] = useState('');
  const [timeImpact, setTimeImpact] = useState('');

  const createMutation = useMutation({
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
    },
    onSuccess: async () => {
      setTitle('');
      setSummary('');
      setCategory('other');
      setAmountImpact('');
      setTimeImpact('');
      onOpenChange(false);
      await queryClient.invalidateQueries({ queryKey: ['disputes', projectId] });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('disputes.newDispute')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t('disputes.titlePlaceholder')} />
          <Textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder={t('disputes.summaryPlaceholder')} rows={4} />
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
            <Input type="number" value={amountImpact} onChange={(event) => setAmountImpact(event.target.value)} placeholder={t('disputes.amountImpactPlaceholder')} />
            <Input type="number" value={timeImpact} onChange={(event) => setTimeImpact(event.target.value)} placeholder={t('disputes.timeImpactPlaceholder')} />
          </div>
          {taskContext?.title ? <p className="text-xs text-gray-500">{t('disputes.linkedTask', { title: taskContext.title })}</p> : null}
          <Button
            className="w-full bg-[#ef6144] hover:bg-[#d9553a]"
            disabled={createMutation.isPending || !title.trim() || !summary.trim()}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {t('disputes.openDispute')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
