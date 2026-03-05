import React, { useState } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, User, Calendar, Loader2 } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import TaskDialog from './TaskDialog';
import EmptyState from '@/components/ui/EmptyState';
import { useLanguage } from '@/components/i18n/useLanguage';
import { getUserDisplayNameByEmail } from '@/lib/userDisplay';
import { createDisputeFromTask } from '@/lib/disputeFromTask';
import { notifyTaskBlockedResponsible } from '@/lib/taskBlockNotifications';

export default function TaskBoard({ projectId, canEdit, onTaskCreate, filteredTasks }) {
  const { currentLanguage, t } = useLanguage();
  const tr = (itText, enText) => currentLanguage === 'it' ? itText : enText;
  const dateLocale = currentLanguage === 'it' ? it : enUS;
  const columns = [
    { id: 'not_started', label: tr('Da Iniziare', 'To Do'), color: 'bg-gray-100' },
    { id: 'in_progress', label: tr('In Corso', 'In Progress'), color: 'bg-blue-100' },
    { id: 'completed', label: tr('Completato', 'Completed'), color: 'bg-green-100' },
    { id: 'blocked', label: tr('Bloccato', 'Blocked'), color: 'bg-red-100' },
  ];
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [taskToBlock, setTaskToBlock] = useState(null);
  const [blockedReason, setBlockedReason] = useState('');
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

  const { data: allTasks = [], isLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => appClient.entities.Task.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const tasks = filteredTasks || allTasks;

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => appClient.auth.me(),
    staleTime: 2 * 60 * 1000,
  });

  const { data: participants = [] } = useQuery({
    queryKey: ['projectParticipants', projectId],
    queryFn: () => appClient.entities.ProjectParticipant.filter({ project_id: projectId, status: 'active' }),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => appClient.entities.Company.list(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => appClient.entities.User.list(),
    enabled: !!user?.email,
    staleTime: 2 * 60 * 1000,
  });

  const openerParticipant = participants.find((participant) => {
    if (participant.participant_type === 'personal') {
      return participant.user_email === user?.email;
    }

    return user?.active_context === 'company' && participant.company_id === user?.active_company_id;
  }) || null;

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

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, status }) => appClient.entities.Task.update(taskId, {
      status,
      blocked_reason: status === 'blocked' ? undefined : null,
      blocked_by_email: status === 'blocked' ? undefined : null,
      blocked_by_name: status === 'blocked' ? undefined : null,
      blocked_date: status === 'blocked' ? undefined : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks', projectId]);
    },
  });

  const blockTaskMutation = useMutation({
    mutationFn: async () => {
      if (!taskToBlock) return;

      const blockedByOption = blockedBySelection === 'other'
        ? { value: 'other', type: 'other', label: blockedByOtherName }
        : selectedBlockedByOption;

      const updatedTask = await appClient.entities.Task.update(taskToBlock.id, {
        status: 'blocked',
        blocked_reason: blockedReason.trim(),
        blocked_by_email: blockedBySelection === 'other' ? null : selectedBlockedByOption?.user_email || null,
        blocked_by_name: blockedBySelection === 'other' ? blockedByOtherName.trim() : selectedBlockedByOption?.label || null,
        blocked_date: new Date().toISOString(),
      });

      await notifyTaskBlockedResponsible({
        projectId,
        task: updatedTask,
        blockedReason: blockedReason.trim(),
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
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries(['tasks', projectId]);
      await queryClient.invalidateQueries({ queryKey: ['disputes', projectId] });
      setBlockDialogOpen(false);
      setTaskToBlock(null);
      setBlockedReason('');
      setBlockedBySelection('');
      setBlockedByOtherName('');
      setCreateLinkedDispute(false);
      setDisputeData({ title: '', summary: '', category: 'delay', amountImpact: '', timeImpactDays: '' });
    },
  });

  const handleDragEnd = (result) => {
    if (!result.destination || !canEdit) return;
    
    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId;
    const sourceStatus = result.source.droppableId;
    if (sourceStatus === newStatus) return;

    const draggedTask = tasks.find((task) => task.id === taskId);
    if (!draggedTask) return;

    if (newStatus === 'blocked') {
      setTaskToBlock(draggedTask);
      setBlockedReason(draggedTask.blocked_reason || '');
      setBlockedBySelection('');
      setBlockedByOtherName('');
      setCreateLinkedDispute(false);
      setDisputeData({
        title: `${t('disputes.fromTaskPrefix')} ${draggedTask.title}`,
        summary: draggedTask.blocked_reason || '',
        category: 'delay',
        amountImpact: '',
        timeImpactDays: '',
      });
      setBlockDialogOpen(true);
      return;
    }

    updateTaskMutation.mutate({ taskId, status: newStatus });
  };

  const handleTaskClick = (task) => {
    if (!canEdit) return;
    setSelectedTask(task);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedTask(null);
    setDialogOpen(true);
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  const blockFormValid = !!blockedReason.trim()
    && !!blockedBySelection
    && (blockedBySelection !== 'other' || !!blockedByOtherName.trim())
    && (!createLinkedDispute || (!!disputeData.title.trim() && !!disputeData.summary.trim()));

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-96 w-full" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title={tr('Nessuna attività', 'No tasks')}
        description={tr('Crea la prima attività per iniziare a organizzare il lavoro.', 'Create the first task to start organizing the work.')}
        actionLabel={canEdit ? tr('Crea attività', 'Create task') : undefined}
        onAction={canEdit ? onTaskCreate || handleCreate : undefined}
      />
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map(column => {
            const columnTasks = getTasksByStatus(column.id);
            return (
              <div key={column.id} className="flex flex-col">
                <div className={`p-3 rounded-t-lg ${column.color} border-b-2 border-gray-300`}>
                  <h3 className="font-semibold text-gray-900 flex items-center justify-between">
                    <span>{column.label}</span>
                    <Badge variant="secondary" className="bg-white">
                      {columnTasks.length}
                    </Badge>
                  </h3>
                </div>
                
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-2 bg-gray-50 rounded-b-lg min-h-[400px] space-y-2 ${
                        snapshot.isDraggingOver ? 'bg-gray-100' : ''
                      }`}
                    >
                      {columnTasks.map((task, index) => {
                        const blockedByLabel = task.blocked_by_name || task.blocked_by_email;
                        return (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                          isDragDisabled={!canEdit}
                        >
                          {(provided, snapshot) => (
                            <div
                              id={`task-${task.id}`}
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => handleTaskClick(task)}
                              className={`p-3 bg-white rounded-lg border shadow-sm ${
                                canEdit ? 'cursor-pointer hover:shadow-md' : ''
                              } transition-shadow ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              }`}
                            >
                              <h4 className="font-medium text-sm mb-2 line-clamp-2">
                                {task.title}
                              </h4>
                              
                              {task.description && (
                                <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                              
                              {task.room_area && (
                                <Badge variant="outline" className="text-xs mb-2">
                                  {task.room_area}
                                </Badge>
                              )}

                              {task.status === 'blocked' && blockedByLabel ? (
                                <Badge variant="outline" className="text-xs mb-2 text-red-700 border-red-200 bg-red-50">
                                  {tr('Bloccato da', 'Blocked by')}: {blockedByLabel}
                                </Badge>
                              ) : null}
                              
                              <div className="space-y-1">
                                {task.assigned_to_name && (
                                  <div className="flex items-center gap-1 text-xs text-gray-600">
                                    <User className="h-3 w-3" />
                                    <span className="truncate">{task.assigned_to_name}</span>
                                  </div>
                                )}
                                
                                {task.due_date && (
                                  <div className="flex items-center gap-1 text-xs text-gray-600">
                                    <Calendar className="h-3 w-3" />
                                    <span>{format(new Date(task.due_date), 'dd MMM', { locale: dateLocale })}</span>
                                  </div>
                                )}
                              </div>
                              
                              {task.status === 'blocked' && task.blocked_reason && (
                                <div className="mt-2 p-1.5 rounded bg-red-50 border border-red-200">
                                  <p className="text-xs text-red-700 line-clamp-2">
                                    {task.blocked_reason}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                        );
                      })}
                      {provided.placeholder}
                      
                      {columnTasks.length === 0 && (
                        <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                          {tr('Nessuna attività', 'No tasks')}
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={selectedTask}
        projectId={projectId}
      />

      <Dialog open={blockDialogOpen} onOpenChange={(open) => {
        setBlockDialogOpen(open);
        if (!open) {
          setTaskToBlock(null);
        }
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('taskDialog.blockTaskTitle')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm text-gray-600">{taskToBlock?.title || '-'}</p>

            <div className="space-y-2">
              <Label>{t('taskDialog.blockedReason')} *</Label>
              <Textarea
                value={blockedReason}
                onChange={(event) => setBlockedReason(event.target.value)}
                placeholder={t('taskDialog.blockedReasonPlaceholder')}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('taskDialog.blockedBy')} *</Label>
              <Select value={blockedBySelection} onValueChange={setBlockedBySelection}>
                <SelectTrigger>
                  <SelectValue placeholder={t('taskDialog.blockedBySelectPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {blockedByOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                  <SelectItem value="other">{t('taskDialog.someoneElse')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {blockedBySelection === 'other' ? (
              <div className="space-y-2">
                <Label>{t('taskDialog.blockedBy')} *</Label>
                <Input
                  value={blockedByOtherName}
                  onChange={(event) => setBlockedByOtherName(event.target.value)}
                  placeholder={t('taskDialog.blockedByPlaceholder')}
                />
              </div>
            ) : null}

            <div className="flex items-start space-x-2 rounded-lg border p-3">
              <Checkbox
                id="board_create_linked_dispute"
                checked={createLinkedDispute}
                onCheckedChange={(checked) => {
                  const nextValue = !!checked;
                  setCreateLinkedDispute(nextValue);
                  if (nextValue) {
                    setDisputeData((prev) => ({
                      ...prev,
                      summary: prev.summary || blockedReason,
                    }));
                  }
                }}
              />
              <div className="space-y-1 leading-none">
                <Label htmlFor="board_create_linked_dispute">{t('taskDialog.createLinkedDispute')}</Label>
                <p className="text-xs text-gray-500">{t('taskDialog.createLinkedDisputeDescription')}</p>
              </div>
            </div>

            {createLinkedDispute ? (
              <div className="space-y-3 rounded-lg border p-3">
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

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => {
                setBlockDialogOpen(false);
                setTaskToBlock(null);
              }}>
                {t('common.cancel')}
              </Button>
              <Button
                className="flex-1 bg-[#ef6144] hover:bg-[#d9553a]"
                disabled={!blockFormValid || blockTaskMutation.isPending}
                onClick={() => blockTaskMutation.mutate()}
              >
                {blockTaskMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {t('taskDialog.confirmBlock')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}