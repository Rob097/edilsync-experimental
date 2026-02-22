import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const statusLabel = {
  pending: 'In attesa',
  in_progress: 'In corso',
  completed: 'Completata',
  delayed: 'In ritardo',
};

export default function EssentialMilestonesSection({ projectId, canEdit }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const { data: milestones = [] } = useQuery({
    queryKey: ['essentialMilestones', projectId],
    queryFn: () => appClient.entities.Milestone.filter({ project_id: projectId }, 'order_index'),
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });

  const createMilestoneMutation = useMutation({
    mutationFn: async () => appClient.entities.Milestone.create({
      project_id: projectId,
      title: title.trim(),
      target_date: targetDate || null,
      status: 'pending',
      order_index: milestones.length,
    }),
    onSuccess: async () => {
      setTitle('');
      setTargetDate('');
      await queryClient.invalidateQueries({ queryKey: ['essentialMilestones', projectId] });
    },
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: async ({ milestoneId, status }) => {
      const payload = {
        status,
        completion_date: status === 'completed' ? new Date().toISOString().slice(0, 10) : null,
      };
      return appClient.entities.Milestone.update(milestoneId, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['essentialMilestones', projectId] });
    },
  });

  return (
    <div className="space-y-5">
      {canEdit ? (
        <Card className="border-[#ef6144]/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Nuova milestone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titolo milestone" />
            <Input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} />
            <Button className="w-full bg-[#ef6144] hover:bg-[#d9553a] text-white" onClick={() => createMilestoneMutation.mutate()} disabled={createMilestoneMutation.isPending || !title.trim()}>
              {createMilestoneMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Aggiungi milestone
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {milestones.map((milestone) => (
        <Card key={milestone.id} className="border-[#ef6144]/20 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-gray-900">{milestone.title}</p>
              <p className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">{statusLabel[milestone.status] || milestone.status}</p>
            </div>
            {milestone.target_date ? <p className="text-sm text-gray-600">Data obiettivo: {milestone.target_date}</p> : null}
            {canEdit ? (
              <Select value={milestone.status} onValueChange={(value) => updateMilestoneMutation.mutate({ milestoneId: milestone.id, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">In attesa</SelectItem>
                  <SelectItem value="in_progress">In corso</SelectItem>
                  <SelectItem value="completed">Completata</SelectItem>
                  <SelectItem value="delayed">In ritardo</SelectItem>
                </SelectContent>
              </Select>
            ) : null}
          </CardContent>
        </Card>
      ))}

      {milestones.length === 0 ? (
        <Card className="border-[#ef6144]/20 shadow-sm">
          <CardContent className="p-6 text-center text-gray-600">Nessuna milestone presente.</CardContent>
        </Card>
      ) : null}
    </div>
  );
}
