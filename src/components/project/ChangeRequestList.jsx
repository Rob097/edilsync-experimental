import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, DollarSign, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import EmptyState from '@/components/ui/EmptyState';
import ChangeRequestDialog from './ChangeRequestDialog';

const statusConfig = {
  pending: { label: 'In attesa', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  approved: { label: 'Approvato', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  rejected: { label: 'Rifiutato', color: 'bg-red-100 text-red-700', icon: XCircle },
  clarification_needed: { label: 'Chiarimenti', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
};

export default function ChangeRequestList({ projectId, canCreate, canRespond, createDialogOpen, onCreateDialogChange }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const { data: changeRequests = [], isLoading } = useQuery({
    queryKey: ['changeRequests', projectId],
    queryFn: () => base44.entities.ChangeRequest.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const handleEdit = (request) => {
    setSelectedRequest(request);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedRequest(null);
    setDialogOpen(true);
    onCreateDialogChange?.(true);
  };

  const sortedRequests = [...changeRequests].sort((a, b) => 
    new Date(b.created_date) - new Date(a.created_date)
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>Richieste di Modifica</CardTitle>
          {canCreate && (
            <Button onClick={handleCreate} size="sm" className="bg-[#ef6144] hover:bg-[#d9553a]">
              <Plus className="h-4 w-4 mr-1" />
              Nuova Richiesta
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {viewMode === 'board' ? (
            <ChangeRequestBoard 
              projectId={projectId}
              canCreateOrRespond={canCreateOrRespond}
              currentUserEmail={currentUserEmail}
            />
          ) : isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : sortedRequests.length > 0 ? (
            <div className="space-y-3">
              {sortedRequests.map(request => {
                const config = statusConfig[request.status];
                const Icon = config.icon;
                return (
                  <div
                    key={request.id}
                    onClick={() => handleEdit(request)}
                    className="p-4 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{request.title}</h4>
                      <Badge className={`${config.color} flex items-center gap-1`}>
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{request.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      {request.cost_impact > 0 && (
                        <div className="flex items-center gap-1 text-gray-700">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-medium">€{request.cost_impact}</span>
                        </div>
                      )}
                      {request.time_impact_days > 0 && (
                        <div className="flex items-center gap-1 text-gray-700">
                          <Clock className="h-4 w-4" />
                          <span>+{request.time_impact_days} giorni</span>
                        </div>
                      )}
                      <span className="text-gray-500">
                        {format(new Date(request.created_date), 'dd MMM yyyy', { locale: it })}
                      </span>
                      {request.requested_by_name && (
                        <span className="text-gray-500">da {request.requested_by_name}</span>
                      )}
                    </div>
                    {request.response_note && (
                      <div className="mt-3 p-2 rounded bg-gray-50 border">
                        <p className="text-sm text-gray-600">
                          <strong>Risposta:</strong> {request.response_note}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={DollarSign}
              title="Nessuna richiesta"
              description="Non ci sono richieste di modifica per questo progetto."
              actionLabel={canCreate ? "Crea richiesta" : undefined}
              onAction={canCreate ? handleCreate : undefined}
            />
          ))}
        </CardContent>
      </Card>

      <ChangeRequestDialog
        open={createDialogOpen ?? dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setSelectedRequest(null);
          }
          onCreateDialogChange?.(open);
        }}
        request={selectedRequest}
        projectId={projectId}
        canRespond={canRespond}
      />
    </>
  );
}