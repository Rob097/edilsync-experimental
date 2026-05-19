import React, { useState, useEffect } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, CheckCircle2, Clock, AlertCircle, Play, List, Grid3x3, Flag, X } from "lucide-react";
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import EmptyState from '@/components/ui/EmptyState';
import TaskDialog from './TaskDialog';
import TaskBoard from './TaskBoard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from '@/components/i18n/useLanguage';

export default function TaskList({ projectId, canEdit, filterMilestoneId, showMilestoneFilter = true, createDialogOpen, onCreateDialogChange }) {
  const { t, currentLanguage } = useLanguage();
  const tx = (key, options) => t(`completeScoped.components_project_TaskList.${key}`, options);
  const dateLocale = currentLanguage === 'it' ? it : enUS;
  const statusConfig = {
    not_started: { label: tx('k1'), color: 'bg-gray-100 text-gray-700', icon: Clock },
    in_progress: { label: tx('k2'), color: 'bg-blue-100 text-blue-700', icon: Play },
    completed: { label: tx('k3'), color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    blocked: { label: tx('k4'), color: 'bg-red-100 text-red-700', icon: AlertCircle },
  };
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [viewMode, setViewMode] = useState('board'); // 'list' or 'board'
  const [selectedMilestoneId, setSelectedMilestoneId] = useState(filterMilestoneId || 'all');

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => appClient.entities.Task.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => appClient.entities.Milestone.filter({ project_id: projectId }),
    enabled: !!projectId && showMilestoneFilter,
  });

  useEffect(() => {
    if (filterMilestoneId) {
      setSelectedMilestoneId(filterMilestoneId);
    }
  }, [filterMilestoneId]);

  const handleEdit = (task) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedTask(null);
    if (typeof onCreateDialogChange === 'function') {
      onCreateDialogChange(true);
      return;
    }
    setDialogOpen(true);
  };

  const effectiveDialogOpen = dialogOpen || Boolean(createDialogOpen);

  const filteredTasks = selectedMilestoneId === 'all' 
    ? tasks 
    : selectedMilestoneId === 'none'
    ? tasks.filter(t => !t.milestone_id)
    : tasks.filter(t => t.milestone_id === selectedMilestoneId);

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const statusOrder = { blocked: 0, in_progress: 1, not_started: 2, completed: 3 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-3 flex-1">
            <CardTitle>{tx('k5')}</CardTitle>
            <div className="flex gap-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-[#ef6144] hover:bg-[#d9553a] h-8 w-8' : 'h-8 w-8'}
                title={tx('k6')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'board' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('board')}
                className={viewMode === 'board' ? 'bg-[#ef6144] hover:bg-[#d9553a] h-8 w-8' : 'h-8 w-8'}
                title={tx('k7')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {canEdit && (
            <Button onClick={handleCreate} size="sm" className="bg-[#ef6144] hover:bg-[#d9553a]">
              <Plus className="h-4 w-4 md:mr-1" />
              <span className="hidden md:inline">{tx('k8')}</span>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {/* Milestone Filter */}
          {showMilestoneFilter && milestones.length > 0 && (
            <div className="mb-4 flex items-center gap-2">
              <Flag className="h-4 w-4 text-gray-500" />
              <Select value={selectedMilestoneId} onValueChange={setSelectedMilestoneId}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder={tx('k9')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tx('k10')}</SelectItem>
                  <SelectItem value="none">{tx('k11')}</SelectItem>
                  {milestones.map(milestone => (
                    <SelectItem key={milestone.id} value={milestone.id}>
                      {milestone.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedMilestoneId !== 'all' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedMilestoneId('all')}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          {viewMode === 'board' ? (
            <TaskBoard 
              projectId={projectId} 
              canEdit={canEdit}
              onTaskCreate={handleCreate}
              filteredTasks={sortedTasks}
              showMilestoneField={showMilestoneFilter}
            />
          ) : isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : sortedTasks.length > 0 ? (
            <div className="space-y-3">
              {sortedTasks.map(task => {
                const config = statusConfig[task.status];
                const Icon = config.icon;
                const blockedByLabel = task.blocked_by_name || task.blocked_by_email;
                return (
                  <div
                    key={task.id}
                    id={`task-${task.id}`}
                    onClick={() => canEdit && handleEdit(task)}
                    className={`p-4 rounded-lg border ${canEdit ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{task.title}</h4>
                          <Badge className={`${config.color} flex items-center gap-1`}>
                            <Icon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                          {task.status === 'blocked' && blockedByLabel ? (
                            <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50">
                              {tx('k12')}: {blockedByLabel}
                            </Badge>
                          ) : null}
                        </div>
                        {task.description && (
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          {task.assigned_to_name && (
                            <span>Assegnato a: {task.assigned_to_name}</span>
                          )}
                          {task.room_area && (
                            <span>• {task.room_area}</span>
                          )}
                          {task.due_date && (
                            <span>• {tx('k13')}: {format(new Date(task.due_date), 'dd MMM yyyy', { locale: dateLocale })}</span>
                          )}
                        </div>
                        {task.status === 'blocked' && task.blocked_reason && (
                          <div className="mt-2 p-2 rounded bg-red-50 border border-red-200">
                            <p className="text-sm text-red-700">
                              <strong>{tx('k14')}</strong> {task.blocked_reason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title={tx('k15')}
              description={tx('k16')}
              actionLabel={canEdit ? tx('k17') : undefined}
              onAction={canEdit ? handleCreate : undefined}
            />
          )}
        </CardContent>
      </Card>

      <TaskDialog
        open={effectiveDialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open && !!selectedTask);
          if (!open) {
            setSelectedTask(null);
          }
          onCreateDialogChange?.(open);
        }}
        task={selectedTask}
        projectId={projectId}
        showMilestoneField={showMilestoneFilter}
      />
    </>
  );
}