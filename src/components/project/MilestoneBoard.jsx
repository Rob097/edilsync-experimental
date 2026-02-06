import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Flag, Calendar, CheckCircle2, Clock, AlertCircle, Play } from "lucide-react";
import { format, differenceInDays } from 'date-fns';
import { it } from 'date-fns/locale';
import EmptyState from '@/components/ui/EmptyState';
import MilestoneDialog from './MilestoneDialog';

const statusConfig = {
  pending: { color: 'bg-gray-500', label: 'In Attesa', icon: Clock },
  in_progress: { color: 'bg-blue-500', label: 'In Corso', icon: Play },
  completed: { color: 'bg-green-500', label: 'Completata', icon: CheckCircle2 },
  delayed: { color: 'bg-red-500', label: 'In Ritardo', icon: AlertCircle },
};

export default function MilestoneBoard({ projectId, project, canEdit, onMilestoneClick }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => base44.entities.Milestone.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => base44.entities.Task.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const sortedMilestones = useMemo(() => {
    return [...milestones]
      .filter(m => m.target_date)
      .sort((a, b) => new Date(a.target_date) - new Date(b.target_date));
  }, [milestones]);

  const timelineData = useMemo(() => {
    if (!project?.start_date || !project?.end_date || sortedMilestones.length === 0) {
      return null;
    }

    const projectStart = new Date(project.start_date);
    const projectEnd = new Date(project.end_date);
    const totalDays = differenceInDays(projectEnd, projectStart);

    if (totalDays <= 0) return null;

    return sortedMilestones.map(milestone => {
      const milestoneDate = new Date(milestone.target_date);
      const daysFromStart = differenceInDays(milestoneDate, projectStart);
      const position = Math.max(0, Math.min(100, (daysFromStart / totalDays) * 100));
      
      const tasksForMilestone = tasks.filter(t => t.milestone_id === milestone.id);
      const completedTasks = tasksForMilestone.filter(t => t.status === 'completed').length;
      
      return {
        ...milestone,
        position,
        tasksCount: tasksForMilestone.length,
        completedTasksCount: completedTasks,
      };
    });
  }, [project, sortedMilestones, tasks]);

  const handleMilestoneClick = (milestone) => {
    if (onMilestoneClick) {
      onMilestoneClick(milestone);
    } else if (canEdit) {
      setSelectedMilestone(milestone);
      setDialogOpen(true);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (sortedMilestones.length === 0) {
    return (
      <EmptyState
        icon={Flag}
        title="Nessuna milestone"
        description="Crea la prima milestone per tracciare i progressi del progetto."
      />
    );
  }

  if (!timelineData) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Configura le date di inizio e fine del progetto per visualizzare la timeline.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Timeline header */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(project.start_date), 'dd MMM yyyy', { locale: it })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(project.end_date), 'dd MMM yyyy', { locale: it })}</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Base line */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 rounded-full" />
          
          {/* Current date marker */}
          {(() => {
            const now = new Date();
            const projectStart = new Date(project.start_date);
            const projectEnd = new Date(project.end_date);
            const totalDays = differenceInDays(projectEnd, projectStart);
            const daysFromStart = differenceInDays(now, projectStart);
            const currentPosition = (daysFromStart / totalDays) * 100;
            
            if (currentPosition >= 0 && currentPosition <= 100) {
              return (
                <div 
                  className="absolute top-3 w-0.5 h-8 bg-[#ef6144] z-10"
                  style={{ left: `${currentPosition}%` }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-[#ef6144] font-medium whitespace-nowrap">
                    Oggi
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Milestones */}
          <div className="relative pt-12 pb-4">
            {timelineData.map((milestone, index) => {
              const Icon = statusConfig[milestone.status]?.icon || Flag;
              const isEven = index % 2 === 0;
              
              return (
                <div
                  key={milestone.id}
                  className="absolute"
                  style={{ left: `${milestone.position}%` }}
                >
                  {/* Marker */}
                  <div 
                    className={`absolute ${isEven ? '-top-12' : 'top-6'} left-1/2 -translate-x-1/2 cursor-pointer transition-transform hover:scale-110`}
                    onClick={() => handleMilestoneClick(milestone)}
                  >
                    <div className={`w-4 h-4 rounded-full ${statusConfig[milestone.status]?.color || 'bg-gray-500'} border-4 border-white shadow-md`} />
                    
                    {/* Card */}
                    <div className={`absolute ${isEven ? 'bottom-6' : 'top-6'} left-1/2 -translate-x-1/2 w-48`}>
                      <div className="bg-white rounded-lg border shadow-md p-3 hover:shadow-lg transition-shadow">
                        <div className="flex items-start gap-2 mb-2">
                          <Icon className={`h-4 w-4 ${statusConfig[milestone.status]?.color?.replace('bg-', 'text-')} flex-shrink-0 mt-0.5`} />
                          <h4 className="font-medium text-sm line-clamp-2">{milestone.title}</h4>
                        </div>
                        
                        <div className="text-xs text-gray-600 mb-2">
                          {format(new Date(milestone.target_date), 'dd MMM yyyy', { locale: it })}
                        </div>
                        
                        {milestone.tasksCount > 0 && (
                          <div className="flex items-center gap-1 text-xs">
                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                              {milestone.completedTasksCount}/{milestone.tasksCount} attività
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 pt-4 border-t">
          {Object.entries(statusConfig).map(([status, config]) => {
            const Icon = config.icon;
            return (
              <div key={status} className="flex items-center gap-2 text-sm">
                <div className={`w-3 h-3 rounded-full ${config.color}`} />
                <span className="text-gray-600">{config.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <MilestoneDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        milestone={selectedMilestone}
        projectId={projectId}
      />
    </>
  );
}