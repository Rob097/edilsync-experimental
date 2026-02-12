import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Bell, 
  Calendar, 
  Check,
  CheckCheck,
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
};

const typeColors = {
  event_invite: 'bg-blue-100 text-blue-700',
  event_cancelled: 'bg-red-100 text-red-700',
  event_updated: 'bg-yellow-100 text-yellow-700',
  conflict_resolved: 'bg-green-100 text-green-700',
  participant_declined: 'bg-orange-100 text-orange-700',
};

export default function Notifications() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: companyMemberships = [] } = useQuery({
    queryKey: ['userCompanies', user?.email],
    queryFn: () => base44.entities.CompanyMember.filter({ user_email: user?.email, status: 'active' }),
    enabled: !!user?.email,
  });

  const { data: allNotifications = [], isLoading } = useQuery({
    queryKey: ['allNotifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const currentContext = user?.active_context || 'personal';

  // Filter notifications based on context
  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list(),
  });

  const { data: eventParticipants = [] } = useQuery({
    queryKey: ['eventParticipants'],
    queryFn: () => base44.entities.EventParticipant.list(),
  });

  const notifications = allNotifications.filter(notif => {
    // If no related event, show in all contexts
    if (!notif.related_event_id) return true;

    const relatedEvent = events.find(e => e.id === notif.related_event_id);
    if (!relatedEvent) return true;

    if (currentContext === 'personal') {
      // Show if event is personal or user is personally invited
      return relatedEvent.owner_type === 'personal' ||
             eventParticipants.some(p => 
               p.event_id === relatedEvent.id && 
               p.participant_type === 'user' && 
               p.user_email === user?.email
             );
    } else {
      // Show if event belongs to current company or company is invited
      return relatedEvent.owner_company_id === user?.active_company_id ||
             eventParticipants.some(p => 
               p.event_id === relatedEvent.id && 
               p.participant_type === 'company' && 
               p.company_id === user?.active_company_id
             );
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['allNotifications']);
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      for (const n of unread) {
        await base44.entities.Notification.update(n.id, { is_read: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['allNotifications']);
    },
  });

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.is_read) {
      await markAsReadMutation.mutateAsync(notification.id);
    }

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
        // Navigate to project detail (messages tab)
        navigate(createPageUrl('ProjectDetail') + `?id=${notification.related_event_id}`);
        break;
      
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
          <h1 className="text-2xl font-bold text-gray-900">Notifiche</h1>
          <p className="text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} non lette` : 'Tutte lette'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Segna tutte come lette
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
                title="Nessuna notifica"
                description="Non hai ancora ricevuto notifiche."
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}