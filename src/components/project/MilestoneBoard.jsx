import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Flag, CheckCircle2, Clock, AlertCircle, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfYear, endOfYear, eachMonthOfInterval, differenceInDays, getMonth, getDaysInMonth, getDate, startOfMonth } from 'date-fns';
import { it } from 'date-fns/locale';
import EmptyState from '@/components/ui/EmptyState';
import MilestoneDialog from './MilestoneDialog';

const statusConfig = {
  pending: { color: 'bg-yellow-500', label: 'In Attesa', icon: Clock },
  in_progress: { color: 'bg-blue-500', label: 'In Corso', icon: Play },
  completed: { color: 'bg-green-500', label: 'Completata', icon: CheckCircle2 },
  delayed: { color: 'bg-red-500', label: 'In Ritardo', icon: AlertCircle },
};

export default function MilestoneBoard({ projectId, project, canEdit, onMilestoneClick }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

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

  const yearStart = startOfYear(new Date(currentYear, 0, 1));
  const yearEnd = endOfYear(new Date(currentYear, 0, 1));
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  const milestonesInYear = useMemo(() => {
    return sortedMilestones.map(milestone => {
      if (!milestone.start_date && !milestone.target_date) return null;
      
      const startDate = milestone.start_date ? new Date(milestone.start_date) : new Date(milestone.target_date);
      const endDate = new Date(milestone.target_date);
      
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      
      // Skip milestones not in current year range
      if (endYear < currentYear || startYear > currentYear) return null;
      
      const tasksForMilestone = tasks.filter(t => t.milestone_id === milestone.id);
      const completedTasks = tasksForMilestone.filter(t => t.status === 'completed').length;
      
      // Calculate display dates for current year
      let displayStartMonth, displayStartDay, displayEndMonth, displayEndDay;
      
      if (startYear === currentYear) {
        // Milestone starts this year
        displayStartMonth = getMonth(startDate);
        displayStartDay = getDate(startDate);
      } else {
        // Milestone started in a previous year
        displayStartMonth = 0; // January
        displayStartDay = 1;
      }
      
      if (endYear === currentYear) {
        // Milestone ends this year
        displayEndMonth = getMonth(endDate);
        displayEndDay = getDate(endDate);
      } else {
        // Milestone ends in a future year
        displayEndMonth = 11; // December
        displayEndDay = 31;
      }
      
      return {
        ...milestone,
        startDate,
        endDate,
        startMonth: displayStartMonth,
        endMonth: displayEndMonth,
        startDay: displayStartDay,
        endDay: displayEndDay,
        tasksCount: tasksForMilestone.length,
        completedTasksCount: completedTasks,
      };
    }).filter(Boolean);
  }, [sortedMilestones, tasks, currentYear]);

  const handleMilestoneClick = (milestone) => {
    if (onMilestoneClick) {
      onMilestoneClick(milestone);
    } else if (canEdit) {
      setSelectedMilestone(milestone);
      setDialogOpen(true);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
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

  return (
    <>
      <div className="space-y-4">
        {/* Year selector */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentYear(prev => prev - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-xl font-bold">{currentYear}</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentYear(prev => prev + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Gantt chart */}
        <div className="border rounded-lg overflow-x-auto bg-white">
          {/* Header with months */}
          <div className="flex">
            {months.map((month, idx) => (
              <div
                key={idx}
                className="flex-1 min-w-[60px] md:min-w-[80px] p-2 text-center text-xs md:text-sm font-medium border-r last:border-r-0 border-b bg-gray-50"
              >
                {format(month, 'MMM', { locale: it })}
              </div>
            ))}
          </div>

          {/* Milestones rows */}
          <div className="min-h-[200px] md:min-h-[300px] relative" style={{ width: 'max-content', minWidth: '100%' }}>
            {milestonesInYear.length > 0 ? (
              milestonesInYear.map((milestone, milestoneIdx) => {
                const Icon = statusConfig[milestone.status]?.icon || Flag;
                const startMonth = milestone.startMonth;
                const endMonth = milestone.endMonth;
                
                // Calculate position and width
                const monthWidth = 100 / 12; // Each month is 1/12 of the total width
                const daysInStartMonth = getDaysInMonth(milestone.startDate);
                const daysInEndMonth = getDaysInMonth(milestone.endDate);
                
                const startOffset = (startMonth * monthWidth) + ((milestone.startDay - 1) / daysInStartMonth * monthWidth);
                const endOffset = (endMonth * monthWidth) + (milestone.endDay / daysInEndMonth * monthWidth);
                const width = endOffset - startOffset;
                
                return (
                  <div
                    key={milestone.id}
                    className="flex relative"
                    style={{ minHeight: '60px' }}
                  >
                    {/* Month cells for borders */}
                    {months.map((month, monthIdx) => (
                      <div
                        key={monthIdx}
                        className="flex-1 min-w-[60px] md:min-w-[80px] border-r last:border-r-0"
                      />
                    ))}
                    
                    {/* Milestone bar */}
                    <div
                      className="absolute top-2 bottom-2 cursor-pointer"
                      style={{
                        left: `${startOffset}%`,
                        width: `${width}%`,
                        minWidth: '80px',
                      }}
                      onClick={() => handleMilestoneClick(milestone)}
                    >
                      <div className={`${statusConfig[milestone.status]?.color} text-white rounded-lg p-1.5 md:p-2 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col justify-center overflow-hidden`}>
                        <div className="flex items-center gap-1 mb-0.5">
                          <Icon className="h-2.5 w-2.5 md:h-3 md:w-3 flex-shrink-0" />
                          <span className="text-[10px] md:text-xs font-semibold truncate">
                            {milestone.title}
                          </span>
                        </div>
                        <div className="text-[9px] md:text-xs opacity-90 truncate overflow-clip">
                          {format(milestone.startDate, 'dd MMM', { locale: it })} - {format(milestone.endDate, 'dd MMM', { locale: it })}
                        </div>
                        {milestone.tasksCount > 0 && (
                          <div className="text-[9px] md:text-xs opacity-90 mt-0.5">
                            {milestone.completedTasksCount}/{milestone.tasksCount} ✓
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-500 text-sm absolute inset-0">
                Nessuna milestone per {currentYear}
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 pt-2">
          {Object.entries(statusConfig).map(([status, config]) => {
            const Icon = config.icon;
            return (
              <div key={status} className="flex items-center gap-2 text-sm">
                <div className={`w-3 h-3 rounded ${config.color}`} />
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
        onViewTasks={onMilestoneClick}
      />
    </>
  );
}