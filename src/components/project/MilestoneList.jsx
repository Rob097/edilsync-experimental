import React, { useState } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Flag, Calendar, CheckCircle2, Clock, AlertTriangle, List, BarChart3 } from "lucide-react";
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import EmptyState from '@/components/ui/EmptyState';
import MilestoneDialog from './MilestoneDialog';
import MilestoneBoard from './MilestoneBoard';
import { useLanguage } from '@/components/i18n/useLanguage';

export default function MilestoneList({ projectId, project, canEdit, onNavigateToTasks }) {
  const { currentLanguage } = useLanguage();
  const tr = (itText, enText) => currentLanguage === 'it' ? itText : enText;
  const dateLocale = currentLanguage === 'it' ? it : enUS;
  const statusConfig = {
    pending: { label: tr('In attesa', 'Pending'), color: 'bg-gray-100 text-gray-700', icon: Clock },
    in_progress: { label: tr('In corso', 'In progress'), color: 'bg-blue-100 text-blue-700', icon: Clock },
    completed: { label: tr('Completato', 'Completed'), color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    delayed: { label: tr('Ritardo', 'Delayed'), color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  };
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [viewMode, setViewMode] = useState('timeline');

  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => appClient.entities.Milestone.filter({ project_id: projectId }, 'order_index'),
    enabled: !!projectId,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => appClient.entities.Task.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const handleEdit = (milestone) => {
    setEditingMilestone(milestone);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingMilestone(null);
  };

  const handleMilestoneClick = (milestone) => {
    handleEdit(milestone);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Flag className="h-5 w-5 text-[#ef6144]" />
              {tr('Milestone', 'Milestones')}
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-[#ef6144] hover:bg-[#d9553a] h-8 w-8' : 'h-8 w-8'}
                title={tr('Vista lista', 'List view')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'timeline' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('timeline')}
                className={viewMode === 'timeline' ? 'bg-[#ef6144] hover:bg-[#d9553a] h-8 w-8' : 'h-8 w-8'}
                title={tr('Vista timeline', 'Timeline view')}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {canEdit && (
            <Button 
              onClick={() => setDialogOpen(true)}
              size="sm"
              className="bg-[#ef6144] hover:bg-[#d9553a]"
            >
              <Plus className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">{tr('Aggiungi', 'Add')}</span>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {viewMode === 'timeline' ? (
            <MilestoneBoard 
              projectId={projectId}
              project={project}
              canEdit={canEdit}
              onMilestoneClick={handleMilestoneClick}
            />
          ) : milestones.length > 0 ? (
            <div className="space-y-4">
              {milestones.map((milestone, index) => {
                const status = statusConfig[milestone.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                const isOverdue = milestone.status !== 'completed' && 
                  milestone.target_date && 
                  new Date(milestone.target_date) < new Date();
                const milestoneTasks = tasks.filter(t => t.milestone_id === milestone.id);
                const completedTasks = milestoneTasks.filter(t => t.status === 'completed').length;

                return (
                  <div 
                    key={milestone.id}
                    onClick={() => handleMilestoneClick(milestone)}
                    className="p-4 rounded-lg border bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-[#ef6144]/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-[#ef6144]">{index + 1}</span>
                          </div>
                          <h4 className="font-semibold text-gray-900">{milestone.title}</h4>
                        </div>
                        {milestone.description && (
                          <p className="text-sm text-gray-600 mb-2 ml-11">{milestone.description}</p>
                        )}
                        {milestoneTasks.length > 0 && (
                          <div className="ml-11 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {currentLanguage !== 'it' ? `${completedTasks}/${milestoneTasks.length} tasks completed` : `${completedTasks}/${milestoneTasks.length} attività completate`}
                            </Badge>
                          </div>
                        )}
                        <div className="flex items-center gap-3 ml-11 text-sm">
                          {milestone.target_date && (
                            <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{format(new Date(milestone.target_date), 'd MMM yyyy', { locale: dateLocale })}</span>
                            </div>
                          )}
                          {milestone.completion_date && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>{tr('Completato', 'Completed')} {format(new Date(milestone.completion_date), 'd MMM yyyy', { locale: dateLocale })}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge className={status.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Flag}
              title={tr('Nessuna milestone', 'No milestones')}
              description={tr('Le milestone ti aiutano a tracciare i traguardi principali del cantiere.', 'Milestones help you track the key goals of the worksite.')}
              actionLabel={canEdit ? tr('Aggiungi milestone', 'Add milestone') : undefined}
              onAction={canEdit ? () => setDialogOpen(true) : undefined}
            />
          )}
        </CardContent>
      </Card>

      <MilestoneDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        projectId={projectId}
        milestone={editingMilestone}
        nextOrderIndex={milestones.length}
        onViewTasks={onNavigateToTasks}
      />
    </>
  );
}