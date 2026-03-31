import React from 'react';
import { appClient } from '@/api/appClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/i18n/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { it } from 'date-fns/locale';
import EmptyState from '@/components/ui/EmptyState';

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

const DIRECT_PROJECT_NOTIFICATION_TYPES = new Set([
  'project_invite',
  'dispute_opened',
  'dispute_status_changed',
  'dispute_commented',
  'task_status_changed',
  'project_sponsorship_activated',
  'project_sponsorship_revoked',
]);

const EVENT_BASED_NOTIFICATION_TYPES = new Set([
  'event_invite',
  'event_cancelled',
  'event_updated',
  'conflict_resolved',
]);

export default function Notifications() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

  // Filter notifications based on current context
  const notifications = allNotifications.filter(notif => {
    if (currentContext === 'personal') {
      // Show personal notifications or notifications without a specific company context
      return notif.context_type === 'personal' || !notif.context_type;
    } else {
      // Show company notifications matching the active company
      return notif.context_type === 'company' && notif.context_company_id === user?.active_company_id;
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => appClient.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['allNotifications']);
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
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['allNotifications']);
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

  const resolveNotificationProjectId = (notification) => {
    if (!notification?.related_event_id) return null;

    if (DIRECT_PROJECT_NOTIFICATION_TYPES.has(notification.type)) {
      return notification.related_event_id;
    }

    if (EVENT_BASED_NOTIFICATION_TYPES.has(notification.type)) {
      return eventsById[notification.related_event_id]?.project_id || null;
    }

    if (notification.type === 'message_mention') {
      return messagesById[notification.related_event_id]?.project_id || null;
    }

    return null;
  };

  const resolveNotificationProjectName = (notification) => {
    const projectId = resolveNotificationProjectId(notification);
    if (!projectId) return null;
    return projectsById[projectId]?.name || null;
  };

  const handleNotificationClick = (notification) => {
    // Navigate based on notification type
    if (!notification.related_event_id) return;

    switch (notification.type) {
      case 'project_invite':
        // Navigate to project detail page
        navigate(createPageUrl('ProjectDetail') + `?id=${notification.related_event_id}`);
        break;
      
      case 'event_invite':
      case 'event_cancelled':
      case 'event_updated':
      case 'conflict_resolved':
        // Navigate to calendar
        navigate(createPageUrl('Calendar'));
        break;
      
      case 'message_mention':
        // Navigate to project detail using message project if available
        if (messagesById[notification.related_event_id]?.project_id) {
          navigate(createPageUrl('ProjectDetail') + `?id=${messagesById[notification.related_event_id].project_id}&tab=info&section=chat`);
        }
        break;

      case 'task_status_changed':
        navigate(createPageUrl('ProjectDetail') + `?id=${notification.related_event_id}&tab=lavori&section=tasks`);
        break;

      case 'dispute_opened':
      case 'dispute_status_changed':
      case 'dispute_commented':
        navigate(createPageUrl('ProjectDetail') + `?id=${notification.related_event_id}&tab=lavori&section=disputes`);
        break;

      case 'project_sponsorship_activated':
      case 'project_sponsorship_revoked':
        navigate(createPageUrl('ProjectDetail') + `?id=${notification.related_event_id}`);
        break;

      case 'company_plan_activated':
      case 'company_plan_changed':
      case 'company_plan_canceled': {
        const companyId = notification.context_company_id || notification.related_event_id;
        if (companyId) {
          navigate(createPageUrl('CompanyDetail') + `?id=${companyId}&tab=billing`);
        }
        break;
      }
      
      default:
        // No specific navigation
        break;
    }
  };

  const sortedNotifications = [...notifications].sort((a, b) => 
    new Date(b.created_date) - new Date(a.created_date)
  );

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
      <Card>
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
                          {resolveNotificationProjectName(notification) ? (
                            <p className="text-xs text-gray-500 mt-1">
                              {t('notificationsPage.projectContext', { project: resolveNotificationProjectName(notification) })}
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
                        {format(new Date(notification.created_date), "d MMM yyyy, HH:mm", { locale: it })}
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