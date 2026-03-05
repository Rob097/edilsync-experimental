import React, { useState, useEffect } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/components/i18n/useLanguage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import AssigneeSelector from './AssigneeSelector';
import { getUserDisplayNameByEmail } from '@/lib/userDisplay';
import { createDisputeFromTask } from '@/lib/disputeFromTask';
import { notifyTaskBlockedResponsible } from '@/lib/taskBlockNotifications';

export default function TaskDialog({ open, onOpenChange, task, projectId }) {
  const { t, currentLanguage } = useLanguage();
  const tr = (itText, enText) => currentLanguage === 'it' ? itText : enText;
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'not_started',
    assigned_participant_id: '',
    room_area: '',
    due_date: '',
    milestone_id: '',
    blocked_reason: '',
    blocked_by_email: '',
    blocked_by_name: '',
  });
  const [blockedBySelection, setBlockedBySelection] = useState('');
  const [blockedByOtherName, setBlockedByOtherName] = useState('');
  const [createLinkedDispute, setCreateLinkedDispute] = useState(false);
  const [disputeData, setDisputeData] = useState({
    title: '',
    summary: '',
    category: 'delay',
    amountImpact: '',
    timeImpactDays: '',
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => appClient.auth.me(),
  });

  const { data: participants = [] } = useQuery({
    queryKey: ['projectParticipants', projectId],
    queryFn: () => appClient.entities.ProjectParticipant.filter({ project_id: projectId, status: 'active' }),
    enabled: !!projectId,
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => appClient.entities.Milestone.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => appClient.entities.Company.list(),
  });

  const { data: linkedDisputes = [] } = useQuery({
    queryKey: ['taskDisputes', task?.id],
    queryFn: () => appClient.entities.DisputeCase.filter({ task_id: task.id }),
    enabled: !!task?.id,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => appClient.entities.User.list(),
    enabled: !!user?.email,
  });

  useEffect(() => {
    const resolveBlockedBySelection = (sourceTask) => {
      if (!sourceTask) return { selection: '', otherName: '' };

      if (sourceTask.blocked_by_email) {
        const personalParticipant = participants.find((participant) =>
          participant.participant_type === 'personal' && participant.user_email === sourceTask.blocked_by_email);

        if (personalParticipant) {
          return {
            selection: `participant:${personalParticipant.id}`,
            otherName: '',
          };
        }
      }

      if (sourceTask.blocked_by_name) {
        const companyMatch = participants.find((participant) => {
          if (participant.participant_type !== 'company') return false;
          const companyName = companies.find((company) => company.id === participant.company_id)?.name || participant.company_name;
          return companyName === sourceTask.blocked_by_name;
        });

        if (companyMatch) {
          return {
            selection: `participant:${companyMatch.id}`,
            otherName: '',
          };
        }

        return {
          selection: 'other',
          otherName: sourceTask.blocked_by_name,
        };
      }

      return { selection: '', otherName: '' };
    };

    if (task) {
      const blockedState = resolveBlockedBySelection(task);
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'not_started',
        assigned_participant_id: task.assigned_participant_id || '',
        room_area: task.room_area || '',
        due_date: task.due_date || '',
        milestone_id: task.milestone_id || '',
        blocked_reason: task.blocked_reason || '',
        blocked_by_email: task.blocked_by_email || '',
        blocked_by_name: task.blocked_by_name || '',
      });
      setBlockedBySelection(blockedState.selection);
      setBlockedByOtherName(blockedState.otherName);
      setCreateLinkedDispute(false);
      setDisputeData({
        title: task.title ? `${t('disputes.fromTaskPrefix')} ${task.title}` : '',
        summary: task.blocked_reason || '',
        category: 'delay',
        amountImpact: '',
        timeImpactDays: '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'not_started',
        assigned_participant_id: '',
        room_area: '',
        due_date: '',
        milestone_id: '',
        blocked_reason: '',
        blocked_by_email: '',
        blocked_by_name: '',
      });
      setBlockedBySelection('');
      setBlockedByOtherName('');
      setCreateLinkedDispute(false);
      setDisputeData({
        title: '',
        summary: '',
        category: 'delay',
        amountImpact: '',
        timeImpactDays: '',
      });
    }
  }, [task, open, user, participants, companies, t]);

  const blockedByOptions = participants.map((participant) => {
    if (participant.participant_type === 'personal') {
      return {
        value: `participant:${participant.id}`,
        type: 'personal',
        participant_id: participant.id,
        label: getUserDisplayNameByEmail(participant.user_email, allUsers),
        user_email: participant.user_email,
      };
    }

    return {
      value: `participant:${participant.id}`,
      type: 'company',
      participant_id: participant.id,
      label: companies.find((company) => company.id === participant.company_id)?.name || participant.company_name || t('companies.title'),
      company_id: participant.company_id,
    };
  });

  const selectedBlockedByOption = blockedByOptions.find((option) => option.value === blockedBySelection) || null;

  const saveMutation = useMutation({
    mutationFn: async ({ data, blockedByOption }) => {
      if (task) {
        const updatedTask = await appClient.entities.Task.update(task.id, data);

        if (data.status === 'blocked') {
          await notifyTaskBlockedResponsible({
            projectId,
            task: updatedTask,
            blockedReason: data.blocked_reason,
            blockedByOption,
            actorName: user?.display_name || user?.full_name || user?.email,
            t,
          });

          if (createLinkedDispute) {
            await createDisputeFromTask({
              projectId,
              task: updatedTask,
              openerParticipantId: openerParticipant?.id || null,
              title: disputeData.title,
              summary: disputeData.summary,
              category: disputeData.category,
              amountImpact: disputeData.amountImpact ? Number(disputeData.amountImpact) : undefined,
              timeImpactDays: disputeData.timeImpactDays ? Number(disputeData.timeImpactDays) : undefined,
              t,
            });
          }
        }

        return updatedTask;
      } else {
        const createdTask = await appClient.entities.Task.create(data);

        if (data.status === 'blocked') {
          await notifyTaskBlockedResponsible({
            projectId,
            task: createdTask,
            blockedReason: data.blocked_reason,
            blockedByOption,
            actorName: user?.display_name || user?.full_name || user?.email,
            t,
          });

          if (createLinkedDispute) {
            await createDisputeFromTask({
              projectId,
              task: createdTask,
              openerParticipantId: openerParticipant?.id || null,
              title: disputeData.title,
              summary: disputeData.summary,
              category: disputeData.category,
              amountImpact: disputeData.amountImpact ? Number(disputeData.amountImpact) : undefined,
              timeImpactDays: disputeData.timeImpactDays ? Number(disputeData.timeImpactDays) : undefined,
              t,
            });
          }
        }

        return createdTask;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries({ queryKey: ['disputes', projectId] });
      onOpenChange(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => appClient.entities.Task.delete(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      onOpenChange(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Find assignee details
    const assignee = participants.find(p => p.id === formData.assigned_participant_id);
    const assignedUserName = assignee?.participant_type === 'personal'
      ? getUserDisplayNameByEmail(assignee.user_email, allUsers)
      : null;
    
    const isBlocked = formData.status === 'blocked';

    const data = {
      project_id: projectId,
      title: formData.title,
      description: formData.description,
      status: formData.status,
      assigned_participant_id: formData.assigned_participant_id || null,
      assigned_participant_type: assignee?.participant_type || null,
      assigned_user_email: assignee?.participant_type === 'personal' ? assignee.user_email : null,
      assigned_user_name: assignedUserName,
      assigned_company_id: assignee?.participant_type === 'company' ? assignee.company_id : null,
      assigned_company_name: assignee?.participant_type === 'company' ? companies.find(c => c.id === assignee.company_id)?.name : null,
      room_area: formData.room_area,
      due_date: formData.due_date || null,
      milestone_id: formData.milestone_id || null,
      blocked_reason: isBlocked ? formData.blocked_reason : null,
      blocked_by_email: isBlocked
        ? (blockedBySelection === 'other' ? null : selectedBlockedByOption?.user_email || null)
        : null,
      blocked_by_name: isBlocked
        ? (blockedBySelection === 'other' ? blockedByOtherName : selectedBlockedByOption?.label || null)
        : null,
      blocked_date: isBlocked ? new Date().toISOString() : null,
    };

    const blockedByOption = blockedBySelection === 'other'
      ? { value: 'other', type: 'other', label: blockedByOtherName }
      : selectedBlockedByOption;

    saveMutation.mutate({ data, blockedByOption });
  };

  const isBlockedState = formData.status === 'blocked';
  const isBlockedInfoValid = !isBlockedState
    || (
      !!formData.blocked_reason?.trim()
      && !!blockedBySelection
      && (blockedBySelection !== 'other' || !!blockedByOtherName?.trim())
      && (!createLinkedDispute || (!!disputeData.title?.trim() && !!disputeData.summary?.trim()))
    );

  const isValid = !!formData.title?.trim() && isBlockedInfoValid;
  const openerParticipant = participants.find((participant) => {
    if (participant.participant_type === 'personal') {
      return participant.user_email === user?.email;
    }

    return user?.active_context === 'company' && participant.company_id === user?.active_company_id;
  }) || null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? t('taskDialog.editTitle') : t('taskDialog.newTitle')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="rounded-lg border p-4 space-y-4">
            <h4 className="text-sm font-semibold text-gray-900">{tr('Dettagli attività', 'Task details')}</h4>

            <div className="space-y-2">
              <Label htmlFor="title">{t('taskDialog.title')} *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder={t('taskDialog.titlePlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('taskDialog.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('taskDialog.descriptionPlaceholder')}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">{t('taskDialog.status')}</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">{t('taskDialog.notStarted')}</SelectItem>
                    <SelectItem value="in_progress">{t('taskDialog.inProgress')}</SelectItem>
                    <SelectItem value="completed">{t('taskDialog.completed')}</SelectItem>
                    <SelectItem value="blocked">{t('taskDialog.blocked')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="room_area">{t('taskDialog.roomArea')}</Label>
                <Input
                  id="room_area"
                  value={formData.room_area}
                  onChange={(e) => setFormData(prev => ({ ...prev, room_area: e.target.value }))}
                  placeholder={t('taskDialog.roomAreaPlaceholder')}
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-4">
            <h4 className="text-sm font-semibold text-gray-900">{tr('Pianificazione e assegnazione', 'Planning and assignment')}</h4>

            <AssigneeSelector
              participants={participants}
              companies={companies}
              allUsers={allUsers}
              value={formData.assigned_participant_id}
              onChange={(option) => setFormData(prev => ({ ...prev, assigned_participant_id: option?.id || '' }))}
            />

            <div className="space-y-2">
              <Label htmlFor="due_date">{t('taskDialog.dueDate')}</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="milestone">{t('taskDialog.milestone')}</Label>
              <Select
                value={formData.milestone_id || 'none'}
                onValueChange={(v) => setFormData(prev => ({ ...prev, milestone_id: v === 'none' ? null : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('taskDialog.selectMilestone')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('taskDialog.noMilestone')}</SelectItem>
                  {milestones.map(milestone => (
                    <SelectItem key={milestone.id} value={milestone.id}>
                      {milestone.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {task ? (
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-900">{t('taskDialog.linkedDisputes')}</h4>
              {linkedDisputes.length ? (
                <div className="space-y-2">
                  {linkedDisputes.map((dispute) => (
                    <div key={dispute.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900">{dispute.title}</p>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                          {t(`disputes.status.${dispute.status}`)}
                        </span>
                      </div>
                      {dispute.summary ? <p className="text-xs text-gray-600 mt-1 line-clamp-2">{dispute.summary}</p> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">{t('taskDialog.noLinkedDisputes')}</p>
              )}
            </div>
          ) : null}

          {formData.status === 'blocked' ? (
            <div className="rounded-lg border border-red-200 bg-red-50/40 p-4 space-y-4">
              <h4 className="text-sm font-semibold text-red-800">{tr('Dettagli blocco', 'Blocking details')}</h4>

              <div className="space-y-2">
                <Label htmlFor="blocked_reason">{t('taskDialog.blockedReason')} *</Label>
                <Textarea
                  id="blocked_reason"
                  value={formData.blocked_reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, blocked_reason: e.target.value }))}
                  placeholder={t('taskDialog.blockedReasonPlaceholder')}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="blocked_by_select">{t('taskDialog.blockedBy')} *</Label>
                <Select value={blockedBySelection} onValueChange={setBlockedBySelection}>
                  <SelectTrigger id="blocked_by_select">
                    <SelectValue placeholder={t('taskDialog.blockedBySelectPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {blockedByOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="other">{t('taskDialog.someoneElse')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {blockedBySelection === 'other' ? (
                <div className="space-y-2">
                  <Label htmlFor="blocked_by_other">{t('taskDialog.blockedBy')} *</Label>
                  <Input
                    id="blocked_by_other"
                    value={blockedByOtherName}
                    onChange={(e) => setBlockedByOtherName(e.target.value)}
                    placeholder={t('taskDialog.blockedByPlaceholder')}
                  />
                </div>
              ) : null}

              <Separator />

              <div className="flex items-start space-x-2 rounded-lg border bg-white p-3">
                <Checkbox
                  id="create_linked_dispute"
                  checked={createLinkedDispute}
                  onCheckedChange={(checked) => {
                    const nextValue = !!checked;
                    setCreateLinkedDispute(nextValue);
                    if (nextValue) {
                      setDisputeData((prev) => ({
                        ...prev,
                        title: prev.title || (formData.title ? `${t('disputes.fromTaskPrefix')} ${formData.title}` : ''),
                        summary: prev.summary || formData.blocked_reason || '',
                      }));
                    }
                  }}
                />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="create_linked_dispute">{t('taskDialog.createLinkedDispute')}</Label>
                  <p className="text-xs text-gray-500">{t('taskDialog.createLinkedDisputeDescription')}</p>
                </div>
              </div>

              {createLinkedDispute ? (
                <div className="space-y-3 rounded-lg border bg-white p-3">
                  <div className="space-y-2">
                    <Label>{t('disputes.titlePlaceholder')} *</Label>
                    <Input
                      value={disputeData.title}
                      onChange={(event) => setDisputeData((prev) => ({ ...prev, title: event.target.value }))}
                      placeholder={t('disputes.titlePlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('disputes.summaryPlaceholder')} *</Label>
                    <Textarea
                      value={disputeData.summary}
                      onChange={(event) => setDisputeData((prev) => ({ ...prev, summary: event.target.value }))}
                      placeholder={t('disputes.summaryPlaceholder')}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('disputes.categoryLabel')}</Label>
                    <Select value={disputeData.category} onValueChange={(value) => setDisputeData((prev) => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scope">{t('disputes.category.scope')}</SelectItem>
                        <SelectItem value="cost">{t('disputes.category.cost')}</SelectItem>
                        <SelectItem value="delay">{t('disputes.category.delay')}</SelectItem>
                        <SelectItem value="quality">{t('disputes.category.quality')}</SelectItem>
                        <SelectItem value="payment">{t('disputes.category.payment')}</SelectItem>
                        <SelectItem value="other">{t('disputes.category.other')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      value={disputeData.amountImpact}
                      onChange={(event) => setDisputeData((prev) => ({ ...prev, amountImpact: event.target.value }))}
                      placeholder={t('disputes.amountImpactPlaceholder')}
                    />
                    <Input
                      type="number"
                      value={disputeData.timeImpactDays}
                      onChange={(event) => setDisputeData((prev) => ({ ...prev, timeImpactDays: event.target.value }))}
                      placeholder={t('disputes.timeImpactPlaceholder')}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <Separator />

          <div className="flex gap-3 pt-1">
             {task && task.created_by === user?.email && (
               <Button
                 type="button"
                 variant="destructive"
                 onClick={() => deleteMutation.mutate()}
                 disabled={deleteMutation.isPending}
               >
                 {t('taskDialog.delete')}
               </Button>
             )}
             <div className="flex-1" />
             <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
               {t('taskDialog.cancel')}
             </Button>
             <Button
               type="submit"
               className="bg-[#ef6144] hover:bg-[#d9553a]"
               disabled={!isValid || saveMutation.isPending}
             >
               {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
               {task ? t('taskDialog.save') : t('taskDialog.create')}
             </Button>
           </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}