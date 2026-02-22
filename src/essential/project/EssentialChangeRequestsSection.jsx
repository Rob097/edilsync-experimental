import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const statusLabel = {
  pending: 'In attesa',
  approved: 'Approvata',
  rejected: 'Rifiutata',
  clarification_needed: 'Chiarimenti richiesti',
};

export default function EssentialChangeRequestsSection({ projectId, currentUser, canCreate, canRespond }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [costImpact, setCostImpact] = useState('');
  const [timeImpactDays, setTimeImpactDays] = useState('');

  const { data: requests = [] } = useQuery({
    queryKey: ['essentialChangeRequests', projectId],
    queryFn: () => appClient.entities.ChangeRequest.filter({ project_id: projectId }, '-created_date'),
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });

  const createRequestMutation = useMutation({
    mutationFn: async () => appClient.entities.ChangeRequest.create({
      project_id: projectId,
      title: title.trim(),
      description: description.trim(),
      status: 'pending',
      cost_impact: Number(costImpact) || 0,
      time_impact_days: Number(timeImpactDays) || 0,
      requested_by_email: currentUser?.email,
      requested_by_name: currentUser?.display_name || currentUser?.full_name || currentUser?.email,
    }),
    onSuccess: async () => {
      setTitle('');
      setDescription('');
      setCostImpact('');
      setTimeImpactDays('');
      await queryClient.invalidateQueries({ queryKey: ['essentialChangeRequests', projectId] });
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ requestId, status }) => appClient.entities.ChangeRequest.update(requestId, {
      status,
      responded_at: new Date().toISOString(),
      response_note: status === 'approved' ? 'Approvata' : status === 'rejected' ? 'Rifiutata' : 'Richiesti chiarimenti',
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['essentialChangeRequests', projectId] });
    },
  });

  return (
    <div className="space-y-5">
      {canCreate ? (
        <Card className="border-[#ef6144]/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Nuova richiesta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titolo" />
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="Descrizione" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input type="number" value={costImpact} onChange={(event) => setCostImpact(event.target.value)} placeholder="Costo extra (€)" />
              <Input type="number" value={timeImpactDays} onChange={(event) => setTimeImpactDays(event.target.value)} placeholder="Giorni extra" />
            </div>
            <Button className="w-full bg-[#ef6144] hover:bg-[#d9553a] text-white" onClick={() => createRequestMutation.mutate()} disabled={createRequestMutation.isPending || !title.trim() || !description.trim()}>
              {createRequestMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Aggiungi richiesta
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {requests.map((request) => (
        <Card key={request.id} className="border-[#ef6144]/20 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-gray-900">{request.title}</p>
              <p className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">{statusLabel[request.status] || request.status}</p>
            </div>
            <p className="text-sm text-gray-700">{request.description}</p>
            <p className="text-sm text-gray-600">Costo: €{request.cost_impact || 0} · Giorni: {request.time_impact_days || 0}</p>
            {canRespond ? (
              <Select value={request.status} onValueChange={(value) => updateRequestMutation.mutate({ requestId: request.id, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">In attesa</SelectItem>
                  <SelectItem value="approved">Approvata</SelectItem>
                  <SelectItem value="rejected">Rifiutata</SelectItem>
                  <SelectItem value="clarification_needed">Chiarimenti richiesti</SelectItem>
                </SelectContent>
              </Select>
            ) : null}
          </CardContent>
        </Card>
      ))}

      {requests.length === 0 ? (
        <Card className="border-[#ef6144]/20 shadow-sm">
          <CardContent className="p-6 text-center text-gray-600">Nessuna richiesta presente.</CardContent>
        </Card>
      ) : null}
    </div>
  );
}
