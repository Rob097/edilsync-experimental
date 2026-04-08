import React, { useState } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import ChangeRequestDialog from './ChangeRequestDialog';
import EmptyState from '@/components/ui/EmptyState';
import { useLanguage } from '@/components/i18n/useLanguage';

export default function ChangeRequestBoard({ projectId, canCreateOrRespond, currentUserEmail }) {
  const { currentLanguage, t } = useLanguage();
  const tr = (itText, enText) => currentLanguage === 'it' ? itText : enText;
  const dateLocale = currentLanguage === 'it' ? it : enUS;
  const columns = [
    { id: 'pending', label: tr('In Attesa', 'Pending'), color: 'bg-yellow-100', icon: Clock },
    { id: 'approved', label: tr('Approvata', 'Approved'), color: 'bg-green-100', icon: CheckCircle2 },
    { id: 'clarification_needed', label: tr('Chiarimenti', 'Clarification'), color: 'bg-blue-100', icon: AlertCircle },
    { id: 'rejected', label: tr('Rifiutata', 'Rejected'), color: 'bg-red-100', icon: XCircle },
  ];
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const { data: changeRequests = [], isLoading } = useQuery({
    queryKey: ['changeRequests', projectId],
    queryFn: () => appClient.entities.ChangeRequest.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ requestId, status }) => appClient.entities.ChangeRequest.update(requestId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['changeRequests', projectId]);
    },
  });

  const handleDragEnd = (result) => {
    if (!result.destination || !canCreateOrRespond) return;
    
    const requestId = result.draggableId;
    const newStatus = result.destination.droppableId;
    
    updateRequestMutation.mutate({ requestId, status: newStatus });
  };

  const handleRequestClick = (request) => {
    if (!canCreateOrRespond) return;
    setSelectedRequest(request);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedRequest(null);
    setDialogOpen(true);
  };

  const getRequestsByStatus = (status) => {
    return changeRequests.filter(req => req.status === status);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-96 w-full" />
        ))}
      </div>
    );
  }

  if (changeRequests.length === 0) {
    return (
      <EmptyState
        icon={DollarSign}
        title={t('changeRequestBoard.emptyTitle')}
        description={t('changeRequestBoard.emptyDescription')}
      />
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map(column => {
            const columnRequests = getRequestsByStatus(column.id);
            const Icon = column.icon;
            return (
              <div key={column.id} className="flex flex-col">
                <div className={`p-3 rounded-t-lg ${column.color} border-b-2 border-gray-300`}>
                  <h3 className="font-semibold text-gray-900 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {column.label}
                    </span>
                    <Badge variant="secondary" className="bg-white">
                      {columnRequests.length}
                    </Badge>
                  </h3>
                </div>
                
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-2 bg-gray-50 rounded-b-lg min-h-[400px] space-y-2 ${
                        snapshot.isDraggingOver ? 'bg-gray-100' : ''
                      }`}
                    >
                      {columnRequests.map((request, index) => (
                        <Draggable
                          key={request.id}
                          draggableId={request.id}
                          index={index}
                          isDragDisabled={!canCreateOrRespond}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => handleRequestClick(request)}
                              className={`p-3 bg-white rounded-lg border shadow-sm ${
                                canCreateOrRespond ? 'cursor-pointer hover:shadow-md' : ''
                              } transition-shadow ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              }`}
                            >
                              <h4 className="font-medium text-sm mb-2 line-clamp-2">
                                {request.title}
                              </h4>
                              
                              {request.description && (
                                <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                                  {request.description}
                                </p>
                              )}
                              
                              <div className="space-y-1">
                                {request.cost_impact !== null && request.cost_impact !== undefined && (
                                  <div className="flex items-center gap-1 text-xs text-gray-600">
                                    <DollarSign className="h-3 w-3" />
                                    <span>€{request.cost_impact}</span>
                                  </div>
                                )}
                                
                                {request.time_impact_days && (
                                  <div className="flex items-center gap-1 text-xs text-gray-600">
                                    <Clock className="h-3 w-3" />
                                    <span>{`+${request.time_impact_days} ${tr('giorni', 'days')}`}</span>
                                  </div>
                                )}
                                
                                <div className="text-xs text-gray-500 mt-2">
                                  {format(new Date(request.created_date), 'dd MMM', { locale: dateLocale })}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {columnRequests.length === 0 && (
                        <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                          {t('changeRequestBoard.emptyColumn')}
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <ChangeRequestDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedRequest(null);
        }}
        request={selectedRequest}
        projectId={projectId}
        canRespond={canCreateOrRespond}
      />
    </>
  );
}