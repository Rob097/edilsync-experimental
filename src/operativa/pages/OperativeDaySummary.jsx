import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOperativeData } from '@/operativa/useOperativeData';
import { useLanguage } from '@/components/i18n/useLanguage';

export default function OperativeDaySummary() {
  const navigate = useNavigate();
  const { currentLanguage, t } = useLanguage();
  const dateLocale = currentLanguage === 'it' ? it : enUS;
  const {
    user,
    activeCompanyId,
    contextProjects,
    contextTasks,
    contextEvents,
    isLoading,
  } = useOperativeData();

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const projectNameById = useMemo(
    () => Object.fromEntries(contextProjects.map((project) => [project.id, project.name])),
    [contextProjects],
  );

  const todayTasks = contextTasks.filter((task) => {
    const assignedToUser = task.assigned_user_email === user?.email;
    const assignedToCompany = task.assigned_company_id === activeCompanyId;
    const unassigned = !task.assigned_participant_id;
    const isRelevant = assignedToUser || assignedToCompany || unassigned;
    return isRelevant && (task.due_date === todayKey || task.status === 'in_progress');
  });

  const todayEvents = contextEvents.filter((event) =>
    format(new Date(event.start_datetime), 'yyyy-MM-dd') === todayKey,
  );

  if (isLoading) {
    return <div className="text-sm text-gray-600">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-16 z-20 bg-gray-100 pb-2">
        <Button variant="outline" className="w-full" onClick={() => navigate('/app/operativa')}>
          Torna alla home
        </Button>
      </div>

      <Card className="border-[#ef6144]/20">
        <CardHeader>
          <CardTitle className="text-base">{t('operational.daySummary')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{t('operational.todayTasks')}</span>
            <Badge className="bg-[#ef6144]/10 text-[#ef6144]">{todayTasks.length}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{t('operational.todayEvents')}</span>
            <Badge className="bg-[#ef6144]/10 text-[#ef6144]">{todayEvents.length}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#ef6144]/20">
        <CardHeader>
          <CardTitle className="text-base">{t('operational.todayTasks')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[38vh] overflow-y-auto">
          {todayTasks.length > 0 ? (
            todayTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => navigate(`/app/operativa/progetto/${task.project_id}`)}
                className="w-full text-left rounded-lg border border-[#ef6144]/20 p-3"
              >
                <p className="font-medium text-gray-900">{task.title}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {projectNameById[task.project_id] || t('common.projects')}
                  {task.due_date ? ` • ${format(new Date(`${task.due_date}T00:00:00`), 'dd MMM', { locale: dateLocale })}` : ''}
                </p>
              </button>
            ))
          ) : (
            <p className="text-sm text-gray-600">{t('operational.noTodayItems')}</p>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
