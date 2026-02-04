import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MessageSquare,
  Image,
  Calendar,
  DollarSign
} from "lucide-react";
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import EmptyState from '@/components/ui/EmptyState';

export default function ActivityFeed({ projectId, onItemClick }) {
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => base44.entities.Task.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: changeRequests = [] } = useQuery({
    queryKey: ['changeRequests', projectId],
    queryFn: () => base44.entities.ChangeRequest.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['projectMessages', projectId],
    queryFn: () => base44.entities.ProjectMessage.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['projectDocuments', projectId],
    queryFn: () => base44.entities.ProjectDocument.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['projectEvents', projectId],
    queryFn: () => base44.entities.Event.filter({ owner_project_id: projectId, status: 'scheduled' }),
    enabled: !!projectId,
  });

  // Combine all activities
  const activities = useMemo(() => {
    const items = [];

    tasks.forEach(task => {
      items.push({
        id: `task-${task.id}`,
        type: 'task',
        date: task.updated_date || task.created_date,
        icon: task.status === 'completed' ? CheckCircle2 : task.status === 'blocked' ? AlertCircle : Clock,
        color: task.status === 'completed' ? 'text-green-600' : task.status === 'blocked' ? 'text-red-600' : 'text-blue-600',
        title: task.title,
        description: `Stato: ${task.status}`,
        data: task,
      });
    });

    changeRequests.forEach(cr => {
      items.push({
        id: `cr-${cr.id}`,
        type: 'change_request',
        date: cr.updated_date || cr.created_date,
        icon: DollarSign,
        color: cr.status === 'approved' ? 'text-green-600' : cr.status === 'rejected' ? 'text-red-600' : 'text-yellow-600',
        title: `Richiesta Modifica: ${cr.title}`,
        description: cr.cost_impact ? `€${cr.cost_impact}` : 'Nessun costo aggiuntivo',
        data: cr,
      });
    });

    messages.forEach(msg => {
      items.push({
        id: `msg-${msg.id}`,
        type: 'message',
        date: msg.created_date,
        icon: MessageSquare,
        color: 'text-gray-600',
        title: `${msg.sender_name}: ${msg.message.substring(0, 50)}${msg.message.length > 50 ? '...' : ''}`,
        description: format(new Date(msg.created_date), 'HH:mm'),
        data: msg,
      });
    });

    documents.forEach(doc => {
      items.push({
        id: `doc-${doc.id}`,
        type: 'document',
        date: doc.created_date,
        icon: Image,
        color: 'text-purple-600',
        title: `Documento caricato: ${doc.name}`,
        description: `da ${doc.uploaded_by_name}`,
        data: doc,
      });
    });

    events.forEach(event => {
      items.push({
        id: `event-${event.id}`,
        type: 'event',
        date: event.created_date,
        icon: Calendar,
        color: 'text-indigo-600',
        title: `Appuntamento: ${event.title}`,
        description: format(new Date(event.start_datetime), 'dd MMM, HH:mm', { locale: it }),
        data: event,
      });
    });

    return items.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [tasks, changeRequests, messages, documents, events]);

  const isLoading = false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attività Progetto</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map(activity => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors">
                  <div className={`w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 ${activity.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{activity.title}</p>
                    <p className="text-sm text-gray-500">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(activity.date), 'dd MMM yyyy, HH:mm', { locale: it })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="Nessuna attività"
            description="Le attività del progetto appariranno qui."
          />
        )}
      </CardContent>
    </Card>
  );
}