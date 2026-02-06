import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, CheckCircle2, Clock, AlertCircle, Play, List, Grid3x3 } from "lucide-react";
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import EmptyState from '@/components/ui/EmptyState';
import TaskDialog from './TaskDialog';
import TaskBoard from './TaskBoard';

const statusConfig = {
  not_started: { label: 'Non iniziato', color: 'bg-gray-100 text-gray-700', icon: Clock },
  in_progress: { label: 'In corso', color: 'bg-blue-100 text-blue-700', icon: Play },
  completed: { label: 'Completato', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  blocked: { label: 'Bloccato', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

export default function TaskList({ projectId, canEdit }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [viewMode, setViewMode] = useState('board'); // 'list' or 'board'

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => base44.entities.Task.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const handleEdit = (task) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedTask(null);
    setDialogOpen(true);
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const statusOrder = { blocked: 0, in_progress: 1, not_started: 2, completed: 3 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-3">
            <CardTitle>Attività</CardTitle>
            <div className="flex gap-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-[#ef6144] hover:bg-[#d9553a] h-8 w-8' : 'h-8 w-8'}
                title="Vista lista"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'board' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('board')}
                className={viewMode === 'board' ? 'bg-[#ef6144] hover:bg-[#d9553a] h-8 w-8' : 'h-8 w-8'}
                title="Vista board"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {canEdit && (
            <Button onClick={handleCreate} size="sm" className="bg-[#ef6144] hover:bg-[#d9553a]">
              <Plus className="h-4 w-4 mr-1" />
              Nuova Attività
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {viewMode === 'board' ? (
            <TaskBoard 
              projectId={projectId} 
              canEdit={canEdit}
              onTaskCreate={handleCreate}
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
                return (
                  <div
                    key={task.id}
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
                            <span>• Scadenza: {format(new Date(task.due_date), 'dd MMM yyyy', { locale: it })}</span>
                          )}
                        </div>
                        {task.status === 'blocked' && task.blocked_reason && (
                          <div className="mt-2 p-2 rounded bg-red-50 border border-red-200">
                            <p className="text-sm text-red-700">
                              <strong>Bloccato:</strong> {task.blocked_reason}
                              {task.blocked_by_name && ` (da ${task.blocked_by_name})`}
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
              title="Nessuna attività"
              description="Non ci sono attività per questo progetto."
              actionLabel={canEdit ? "Crea attività" : undefined}
              onAction={canEdit ? handleCreate : undefined}
            />
          )}
        </CardContent>
      </Card>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={selectedTask}
        projectId={projectId}
      />
    </>
  );
}