import React from 'react';
import { appClient } from '@/api/appClient';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Play,
  DollarSign,
  Flag,
  Calendar
} from "lucide-react";
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import { useLanguage } from '@/components/i18n/useLanguage';

export default function ProjectOverview({ projectId, onNavigate }) {
  const { t, currentLanguage } = useLanguage();
  const tx = (key, options) => t(`completeScoped.components_project_ProjectOverview.${key}`, options);
  const dateLocale = currentLanguage === 'it' ? it : enUS;

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => appClient.entities.Task.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: changeRequests = [], isLoading: crLoading } = useQuery({
    queryKey: ['changeRequests', projectId],
    queryFn: () => appClient.entities.ChangeRequest.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: milestones = [], isLoading: milestonesLoading } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => appClient.entities.Milestone.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const taskStats = {
    total: tasks.length,
    not_started: tasks.filter(t => t.status === 'not_started').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
  };

  const changeStats = {
    total: changeRequests.length,
    pending: changeRequests.filter(cr => cr.status === 'pending').length,
    approved: changeRequests.filter(cr => cr.status === 'approved').length,
    rejected: changeRequests.filter(cr => cr.status === 'rejected').length,
  };

  const upcomingMilestones = milestones
    .filter(m => m.status !== 'completed' && m.target_date)
    .sort((a, b) => new Date(a.target_date) - new Date(b.target_date))
    .slice(0, 3);

  const blockedTasks = tasks.filter(t => t.status === 'blocked');
  const pendingChanges = changeRequests.filter(cr => cr.status === 'pending');
  const overdueTasks = tasks.filter(t => 
    t.due_date && 
    new Date(t.due_date) < new Date() && 
    t.status !== 'completed'
  );

  const needsAttention = [
    ...blockedTasks.map(t => ({
      type: 'task_blocked',
      title: t.title,
      description: `${tx('k1')}: ${t.blocked_reason || tx('k2')}`,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      data: t,
    })),
    ...pendingChanges.map(cr => ({
      type: 'change_pending',
      title: cr.title,
      description: `${tx('k3')}${cr.cost_impact ? ` • €${cr.cost_impact}` : ''}`,
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      data: cr,
    })),
    ...overdueTasks.map(t => ({
      type: 'task_overdue',
      title: t.title,
      description: `${tx('k4')}: ${format(new Date(t.due_date), 'dd MMM yyyy', { locale: dateLocale })}`,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      data: t,
    })),
  ];

  const isLoading = tasksLoading || crLoading || milestonesLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-tour="project-overview-panel">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tasks Card */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate?.('lavori', 'tasks')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700">{tx('k5')}</h3>
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{taskStats.total}</span>
                <span className="text-sm text-gray-500">{tx('k6')}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {taskStats.in_progress > 0 && (
                  <Badge className="bg-blue-100 text-blue-700 flex items-center gap-1">
                    <Play className="h-3 w-3" />
                    {taskStats.in_progress} {t('project.status.in_progress')}
                  </Badge>
                )}
                {taskStats.blocked > 0 && (
                  <Badge className="bg-red-100 text-red-700 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {taskStats.blocked} {tx('k7')}
                  </Badge>
                )}
                {taskStats.completed > 0 && (
                  <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {taskStats.completed} {tx('k8')}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Requests Card */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate?.('lavori', 'changes')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700">{t('projectDetail.sections.changesExtras')}</h3>
              <DollarSign className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{changeStats.total}</span>
                <span className="text-sm text-gray-500">{tx('k9')}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {changeStats.pending > 0 && (
                  <Badge className="bg-yellow-100 text-yellow-700">
                    {changeStats.pending} {tx('k10')}
                  </Badge>
                )}
                {changeStats.approved > 0 && (
                  <Badge className="bg-green-100 text-green-700">
                    {changeStats.approved} {tx('k11')}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Milestones Card */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate?.('lavori', 'milestones')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700">{tx('k12')}</h3>
              <Flag className="h-5 w-5 text-purple-600" />
            </div>
            {upcomingMilestones.length > 0 ? (
              <div className="space-y-2">
                {upcomingMilestones.map(milestone => (
                  <div key={milestone.id} className="text-sm">
                    <p className="font-medium truncate">{milestone.title}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(milestone.target_date), 'dd MMM yyyy', { locale: dateLocale })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">{tx('k13')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Needs Attention Section */}
      {needsAttention.length > 0 && (
        <Card className={`border-2 ${needsAttention[0].borderColor}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold text-gray-900">{tx('k14')}</h3>
              <Badge className="bg-red-100 text-red-700">{needsAttention.length}</Badge>
            </div>
            <div className="space-y-2">
              {needsAttention.slice(0, 5).map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (item.type === 'task_blocked' || item.type === 'task_overdue') {
                        onNavigate?.('lavori', 'tasks', `task-${item.data.id}`);
                      } else if (item.type === 'change_pending') {
                        onNavigate?.('lavori', 'changes', `change-${item.data.id}`);
                      }
                    }}
                    className={`p-3 rounded-lg border ${item.borderColor} ${item.bgColor} hover:opacity-80 transition-opacity cursor-pointer`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 ${item.color} flex-shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{item.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {needsAttention.length > 5 && (
                <p className="text-xs text-gray-500 text-center pt-2">
                  +{needsAttention.length - 5} {tx('k15')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}