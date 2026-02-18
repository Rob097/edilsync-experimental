import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, DollarSign, Clock, CheckCircle2, XCircle, AlertTriangle, List, Grid3x3 } from "lucide-react";
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import EmptyState from '@/components/ui/EmptyState';
import ChangeRequestDialog from './ChangeRequestDialog';
import ChangeRequestBoard from './ChangeRequestBoard';
import { useLanguage } from '@/components/i18n/useLanguage';

export default function ChangeRequestList({ projectId, canCreate, canRespond, createDialogOpen, onCreateDialogChange, currentUserEmail }) {
  const { currentLanguage } = useLanguage();
  const tr = (itText, enText) => currentLanguage === 'it' ? itText : enText;
  const dateLocale = currentLanguage === 'it' ? it : enUS;
  const statusConfig = {
    pending: { label: tr('In attesa', 'Pending'), color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    approved: { label: tr('Approvato', 'Approved'), color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    rejected: { label: tr('Rifiutato', 'Rejected'), color: 'bg-red-100 text-red-700', icon: XCircle },
    clarification_needed: { label: tr('Chiarimenti', 'Clarification'), color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
  };
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewMode, setViewMode] = useState('board');

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
          <div className="flex items-center gap-3">
            <CardTitle>{tr('Richieste di Modifica & Extra', 'Change Requests & Extras')}</CardTitle>
            <div className="flex gap-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-[#ef6144] hover:bg-[#d9553a] h-8 w-8' : 'h-8 w-8'}
                title={tr('Vista lista', 'List view')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'board' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('board')}
                className={viewMode === 'board' ? 'bg-[#ef6144] hover:bg-[#d9553a] h-8 w-8' : 'h-8 w-8'}
                title={tr('Vista board', 'Board view')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {canCreate && (
            <Button onClick={handleCreate} size="sm" className="bg-[#ef6144] hover:bg-[#d9553a]">
              <Plus className="h-4 w-4 md:mr-1" />
              <span className="hidden md:inline">{tr('Nuova Richiesta', 'New Request')}</span>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {viewMode === 'board' ? (
            <ChangeRequestBoard 
              projectId={projectId}
              canCreateOrRespond={canCreate || canRespond}
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
                          <span>{`+${request.time_impact_days} ${tr('giorni', 'days')}`}</span>
                        </div>
                      )}
                      <span className="text-gray-500">
                        {format(new Date(request.created_date), 'dd MMM yyyy', { locale: dateLocale })}
                      </span>
                      {request.requested_by_name && (
                        <span className="text-gray-500">{tr('da', 'by')} {request.requested_by_name}</span>
                      )}
                    </div>
                    {request.response_note && (
                      <div className="mt-3 p-2 rounded bg-gray-50 border">
                        <p className="text-sm text-gray-600">
                          <strong>{tr('Risposta:', 'Response:')}</strong> {request.response_note}
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
              title={tr('Nessuna richiesta', 'No requests')}
              description={tr('Non ci sono richieste di modifica per questo progetto.', 'There are no change requests for this project.')}
              actionLabel={canCreate ? tr('Crea richiesta', 'Create request') : undefined}
              onAction={canCreate ? handleCreate : undefined}
            />
          )}
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