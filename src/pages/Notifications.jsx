import React from 'react';
import { appClient } from '@/api/appClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/i18n/useLanguage';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Bell, 
  Calendar, 
  Check,
  CheckCheck,
  CreditCard,
  ShieldCheck,
  X,
  AlertTriangle
} from "lucide-react";
import { format } from 'date-fns';
import { enUS, it } from 'date-fns/locale';
import EmptyState from '@/components/ui/EmptyState';
import {
  filterNotificationsForContext,
  resolveNotificationProjectName,
  resolveNotificationTarget,
} from '@/lib/notificationRouting';

const typeIcons = {
  event_invite: Calendar,
  event_cancelled: X,
  event_updated: Calendar,
  conflict_resolved: Check,
  participant_declined: AlertTriangle,
  task_status_changed: AlertTriangle,
  dispute_opened: AlertTriangle,
  dispute_status_changed: AlertTriangle,
  dispute_commented: AlertTriangle,
  company_plan_activated: CreditCard,
  company_plan_changed: CreditCard,
  company_plan_canceled: CreditCard,
  project_sponsorship_activated: ShieldCheck,
  project_sponsorship_revoked: ShieldCheck,
};

const typeColors = {
  event_invite: 'bg-blue-100 text-blue-700',
  event_cancelled: 'bg-red-100 text-red-700',
  event_updated: 'bg-yellow-100 text-yellow-700',
  conflict_resolved: 'bg-green-100 text-green-700',
  participant_declined: 'bg-orange-100 text-orange-700',
  task_status_changed: 'bg-red-100 text-red-700',
  dispute_opened: 'bg-red-100 text-red-700',
  dispute_status_changed: 'bg-purple-100 text-purple-700',
  dispute_commented: 'bg-orange-100 text-orange-700',
  company_plan_activated: 'bg-emerald-100 text-emerald-700',
  company_plan_changed: 'bg-blue-100 text-blue-700',
  company_plan_canceled: 'bg-amber-100 text-amber-700',
  project_sponsorship_activated: 'bg-emerald-100 text-emerald-700',
  project_sponsorship_revoked: 'bg-red-100 text-red-700',
};

export default function Notifications() {
  const { t, currentLanguage } = useLanguage();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const dateLocale = currentLanguage === 'it' ? it : enUS;

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => appClient.auth.me(),
  });

  const { data: companyMemberships = [] } = useQuery({
    queryKey: ['userCompanies', user?.email],
    queryFn: () => appClient.entities.CompanyMember.filter({ user_email: user?.email, status: 'active' }),
    enabled: !!user?.email,
  });

  const { data: allNotifications = [], isLoading } = useQuery({
    queryKey: ['allNotifications', user?.email],
    queryFn: () => appClient.entities.Notification.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projectsForNotifications'],
    queryFn: () => appClient.entities.Project.list(),
    enabled: !!user?.email,
    staleTime: 2 * 60 * 1000,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['eventsForNotifications'],
    queryFn: () => appClient.entities.Event.list(),
    enabled: !!user?.email,
    staleTime: 2 * 60 * 1000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messagesForNotifications'],
    queryFn: () => appClient.entities.Message.list('-created_date', 500),
    enabled: !!user?.email,
    staleTime: 2 * 60 * 1000,
  });

  const currentContext = user?.active_context || 'personal';
  const allNotificationsQueryKey = ['allNotifications', user?.email];

  // Filter notifications based on current context
  const notifications = filterNotificationsForContext({
    notifications: allNotifications,
    currentContext,
    activeCompanyId: user?.active_company_id,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => appClient.entities.Notification.update(id, { is_read: true }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: allNotificationsQueryKey });
      const previousNotifications = queryClient.getQueryData(allNotificationsQueryKey);

      queryClient.setQueryData(allNotificationsQueryKey, (currentNotifications) => {
        if (!Array.isArray(currentNotifications)) {
          return currentNotifications;
        }

        return currentNotifications.map((notification) => (
          notification.id === id
            ? { ...notification, is_read: true }
            : notification
        ));
      });

      return { previousNotifications };
    },
    onError: (_error, _id, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(allNotificationsQueryKey, context.previousNotifications);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: allNotificationsQueryKey });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      for (const n of unread) {
        await appClient.entities.Notification.update(n.id, { is_read: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: allNotificationsQueryKey });
    },
  });

  const eventsById = React.useMemo(() => {
    return events.reduce((map, event) => {
      map[event.id] = event;
      return map;
    }, {});
  }, [events]);

  const projectsById = React.useMemo(() => {
    return projects.reduce((map, project) => {
      map[project.id] = project;
      return map;
    }, {});
  }, [projects]);

  const messagesById = React.useMemo(() => {
    return messages.reduce((map, message) => {
      map[message.id] = message;
      return map;
    }, {});
  }, [messages]);

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await markAsReadMutation.mutateAsync(notification.id);
      } catch {
        // Keep navigation available even if the read-state update fails.
      }
    }

    const target = resolveNotificationTarget({
      notification,
      createPageUrl,
      messagesById,
    });

    if (target) {
      navigate(target);
    }
  };

  const sortedNotifications = [...notifications].sort((a, b) => 
    new Date(b.created_date) - new Date(a.created_date)
  );

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between" data-tour="notifications-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('notificationsPage.title')}</h1>
          <p className="text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} ${t('notificationsPage.unread')}` : t('notificationsPage.allRead')}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            {t('notificationsPage.markAllAsRead')}
          </Button>
        )}
      </div>

      {/* Notifications list */}
      <Card data-tour="notifications-list">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : sortedNotifications.length > 0 ? (
            <div className="divide-y">
              {sortedNotifications.map(notification => {
                const Icon = typeIcons[notification.type] || Bell;
                const colorClass = typeColors[notification.type] || 'bg-gray-100 text-gray-700';
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 flex items-start gap-4 ${!notification.is_read ? 'bg-[#ef6144]/5' : ''} hover:bg-gray-50 cursor-pointer transition-colors`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {notification.message}
                          </p>
                          {resolveNotificationProjectName({ notification, eventsById, messagesById, projectsById }) ? (
                            <p className="text-xs text-gray-500 mt-1">
                              {t('notificationsPage.projectContext', {
                                project: resolveNotificationProjectName({ notification, eventsById, messagesById, projectsById }),
                              })}
                            </p>
                          ) : null}
                        </div>
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsReadMutation.mutate(notification.id);
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {format(new Date(notification.created_date), "d MMM yyyy, HH:mm", { locale: dateLocale })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8">
              <EmptyState
                icon={Bell}
                title={t('notificationsPage.noNotifications')}
                description={t('notificationsPage.noNotificationsDescription')}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}