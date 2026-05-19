import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, FolderKanban, MapPin, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import { useLanguage } from '@/components/i18n/useLanguage';

const statusConfig = {
  not_started: { key: 'not_started', color: 'bg-gray-100 text-gray-700' },
  in_progress: { key: 'in_progress', color: 'bg-blue-100 text-blue-700' },
  completed: { key: 'completed', color: 'bg-green-100 text-green-700' },
  blocked: { key: 'blocked', color: 'bg-red-100 text-red-700' },
};

export default function TaskDetailDialog({ open, onOpenChange, task }) {
  const navigate = useNavigate();
  const { t, currentLanguage } = useLanguage();
  const tx = (key, options) => t(`completeScoped.components_calendar_TaskDetailDialog.${key}`, options);
  const dateLocale = currentLanguage === 'it' ? it : enUS;

  if (!task) return null;

  const status = statusConfig[task.status] || statusConfig.not_started;

  const handleOpenTaskInProject = () => {
    const itemId = task.source_id ? `task-${task.source_id}` : undefined;
    const itemQuery = itemId ? `&itemId=${itemId}` : '';
    navigate(createPageUrl('ProjectDetail') + `?id=${task.project_id}&tab=lavori&section=tasks${itemQuery}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-gray-500">{tx('k1')}</span>
            <Badge className={status.color}>{t(`completeScoped.components_calendar_TaskDetailDialog.status.${status.key}`)}</Badge>
          </div>

          <div className="flex items-center gap-3 text-gray-600">
            <CalendarDays className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">{tx('k2')}</p>
              <p className="font-medium">{format(new Date(task.due_date), 'EEEE d MMMM yyyy', { locale: dateLocale })}</p>
            </div>
          </div>

          {task.project_name && (
            <div className="flex items-center gap-3 text-gray-600">
              <FolderKanban className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">{tx('k3')}</p>
                <p className="font-medium">{task.project_name}</p>
              </div>
            </div>
          )}

          {task.room_area && (
            <div className="flex items-center gap-3 text-gray-600">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">{tx('k4')}</p>
                <p className="font-medium">{task.room_area}</p>
              </div>
            </div>
          )}

          {task.description && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-gray-500 mb-1">{tx('k5')}</p>
                <p className="text-gray-700">{task.description}</p>
              </div>
            </>
          )}

          <Separator />
          <Button onClick={handleOpenTaskInProject} className="w-full bg-[#ef6144] hover:bg-[#d9553a]">
            <ArrowRight className="h-4 w-4 mr-2" />
            {tx('k6')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
