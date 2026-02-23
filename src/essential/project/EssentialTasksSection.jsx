import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, User, Building2 } from 'lucide-react';
import { getUserDisplayNameByEmail } from '@/lib/userDisplay';

const statusLabel = {
  not_started: 'Non iniziata',
  in_progress: 'In corso',
  completed: 'Completata',
  blocked: 'Bloccata',
};

export default function EssentialTasksSection({ projectId, participants, userParticipation, canEdit }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignedId, setAssignedId] = useState(userParticipation?.id || '');

  const activeParticipants = useMemo(() => participants.filter((entry) => entry.status === 'active'), [participants]);

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => appClient.entities.User.list(),
    enabled: activeParticipants.some((participant) => participant.participant_type === 'personal' && !!participant.user_email),
    staleTime: 2 * 60 * 1000,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => appClient.entities.Company.list(),
    enabled: activeParticipants.some((participant) => participant.participant_type === 'company' && !!participant.company_id),
    staleTime: 5 * 60 * 1000,
  });

  const selectedAssignee = useMemo(
    () => activeParticipants.find((participant) => participant.id === assignedId) || null,
    [activeParticipants, assignedId],
  );

  const getAssigneeName = (participant) => {
    if (!participant) return '';
    if (participant.participant_type === 'company') {
      const company = companies.find((entry) => entry.id === participant.company_id);
      return participant.company_name || company?.name || 'Società';
    }
    return participant.user_display_name || getUserDisplayNameByEmail(participant.user_email, allUsers) || participant.user_email || 'Utente';
  };

  const { data: tasks = [] } = useQuery({
    queryKey: ['essentialTasks', projectId],
    queryFn: () => appClient.entities.Task.filter({ project_id: projectId }, '-created_date'),
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      const assignee = activeParticipants.find((entry) => entry.id === assignedId);
      if (!assignee) return;
      await appClient.entities.Task.create({
        project_id: projectId,
        title: title.trim(),
        status: 'not_started',
        due_date: dueDate || null,
        assigned_participant_id: assignee.id,
        assigned_participant_type: assignee.participant_type,
        assigned_user_email: assignee.user_email || null,
        assigned_user_name: assignee.user_display_name || assignee.user_email || null,
        assigned_company_id: assignee.company_id || null,
        assigned_company_name: assignee.company_name || null,
      });
    },
    onSuccess: async () => {
      setTitle('');
      setDueDate('');
      await queryClient.invalidateQueries({ queryKey: ['essentialTasks', projectId] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }) => appClient.entities.Task.update(taskId, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['essentialTasks', projectId] });
    },
  });

  return (
    <div className="space-y-5">
      {canEdit ? (
        <Card className="border-[#ef6144]/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Nuova attività</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titolo attività" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              <Select value={assignedId} onValueChange={setAssignedId}>
                <SelectTrigger>
                  <SelectValue placeholder="Assegna a" />
                </SelectTrigger>
                <SelectContent>
                  {activeParticipants.map((participant) => (
                    <SelectItem key={participant.id} value={participant.id}>
                      <div className="flex items-center gap-2">
                        {participant.participant_type === 'company' ? (
                          <Building2 className="h-4 w-4 text-gray-500" />
                        ) : (
                          <User className="h-4 w-4 text-gray-500" />
                        )}
                        <span>{getAssigneeName(participant)}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                          {participant.participant_type === 'company' ? 'Società' : 'Utente'}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedAssignee ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {selectedAssignee.participant_type === 'company' ? (
                  <Building2 className="h-4 w-4 text-gray-500" />
                ) : (
                  <User className="h-4 w-4 text-gray-500" />
                )}
                <span>{getAssigneeName(selectedAssignee)}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                  {selectedAssignee.participant_type === 'company' ? 'Società' : 'Utente'}
                </Badge>
              </div>
            ) : null}
            <Button
              className="w-full bg-[#ef6144] hover:bg-[#d9553a] text-white"
              onClick={() => createTaskMutation.mutate()}
              disabled={createTaskMutation.isPending || !title.trim() || !assignedId}
            >
              {createTaskMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Aggiungi attività
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {tasks.map((task) => (
        <Card key={task.id} className="border-[#ef6144]/20 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-gray-900">{task.title}</p>
              <p className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">{statusLabel[task.status] || task.status}</p>
            </div>
            {task.due_date ? <p className="text-sm text-gray-600">Scadenza: {task.due_date}</p> : null}
            <Select value={task.status} onValueChange={(value) => updateTaskMutation.mutate({ taskId: task.id, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Non iniziata</SelectItem>
                <SelectItem value="in_progress">In corso</SelectItem>
                <SelectItem value="completed">Completata</SelectItem>
                <SelectItem value="blocked">Bloccata</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      ))}

      {tasks.length === 0 ? (
        <Card className="border-[#ef6144]/20 shadow-sm">
          <CardContent className="p-6 text-center text-gray-600">Nessuna attività presente.</CardContent>
        </Card>
      ) : null}
    </div>
  );
}
