import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Clock, AlertCircle, User, Calendar } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import TaskDialog from './TaskDialog';
import EmptyState from '@/components/ui/EmptyState';

const columns = [
  { id: 'not_started', label: 'Da Iniziare', color: 'bg-gray-100' },
  { id: 'in_progress', label: 'In Corso', color: 'bg-blue-100' },
  { id: 'completed', label: 'Completato', color: 'bg-green-100' },
  { id: 'blocked', label: 'Bloccato', color: 'bg-red-100' },
];

export default function TaskBoard({ projectId, canEdit, onTaskCreate, filteredTasks }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const { data: allTasks = [], isLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => base44.entities.Task.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const tasks = filteredTasks || allTasks;

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, status }) => base44.entities.Task.update(taskId, { 
      status,
      blocked_date: status === 'blocked' ? new Date().toISOString() : null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks', projectId]);
    },
  });

  const handleDragEnd = (result) => {
    if (!result.destination || !canEdit) return;
    
    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId;
    
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
        title="Nessuna attività"
        description="Crea la prima attività per iniziare a organizzare il lavoro."
        actionLabel={canEdit ? "Crea attività" : undefined}
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
                      {columnTasks.map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                          isDragDisabled={!canEdit}
                        >
                          {(provided, snapshot) => (
                            <div
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
                                    <span>{format(new Date(task.due_date), 'dd MMM', { locale: it })}</span>
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
                      ))}
                      {provided.placeholder}
                      
                      {columnTasks.length === 0 && (
                        <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                          Nessuna attività
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
    </>
  );
}