import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, 
  MapPin, 
  User, 
  Building2, 
  Check, 
  X,
  Trash2,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const statusLabels = {
  pending: { label: 'In attesa', color: 'bg-yellow-100 text-yellow-700' },
  accepted: { label: 'Accettato', color: 'bg-green-100 text-green-700' },
  declined: { label: 'Rifiutato', color: 'bg-red-100 text-red-700' },
};

export default function EventDetailDialog({ open, onOpenChange, event, user, companyMemberships, onEdit }) {
  const queryClient = useQueryClient();

  const { data: participants = [] } = useQuery({
    queryKey: ['eventParticipants', event?.id],
    queryFn: () => base44.entities.EventParticipant.filter({ event_id: event?.id }),
    enabled: !!event?.id,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['participantCompanies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: userProfiles = [] } = useQuery({
    queryKey: ['userPublicProfiles'],
    queryFn: () => base44.entities.UserPublicProfile.list(),
    staleTime: 5 * 60 * 1000,
  });

  const currentContext = user?.active_context || 'personal';
  const isCreator = event?.creator_email === user?.email;
  const companyIds = companyMemberships?.map(m => m.company_id) || [];
  const canManageEvent = isCreator || 
    (event?.owner_type === 'company' && companyIds.includes(event?.owner_company_id));
  
  // Find participation matching current context
  const userParticipation = participants.find(p => {
    if (currentContext === 'personal') {
      return p.participant_type === 'user' && p.user_email === user?.email;
    } else {
      return p.participant_type === 'company' && p.company_id === user?.active_company_id;
    }
  });

  const respondMutation = useMutation({
    mutationFn: async (status) => {
      await base44.entities.EventParticipant.update(userParticipation.id, { status });

      if (status === 'accepted' && userParticipation.conflict_event_id) {
        // Cancel conflicting event for this user
        await base44.entities.Event.update(userParticipation.conflict_event_id, { status: 'cancelled' });
        
        // Notify about conflict resolution
        await base44.entities.Notification.create({
          user_email: event.creator_email,
          type: 'conflict_resolved',
          title: 'Conflitto risolto',
          message: `${user?.full_name} ha accettato l'invito a "${event.title}", cancellando l'evento in conflitto.`,
          related_event_id: event.id,
          is_read: false,
        });
      }

      if (status === 'declined') {
        await base44.entities.Notification.create({
          user_email: event.creator_email,
          type: 'participant_declined',
          title: 'Invito rifiutato',
          message: `${user?.full_name} ha rifiutato l'invito a "${event.title}".`,
          related_event_id: event.id,
          is_read: false,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['eventParticipants']);
      queryClient.invalidateQueries(['events']);
      queryClient.invalidateQueries(['notifications']);
    },
  });

  const cancelEventMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Event.update(event.id, { status: 'cancelled' });
      
      // Notify all participants
      for (const p of participants) {
        if (p.user_email) {
          await base44.entities.Notification.create({
            user_email: p.user_email,
            type: 'event_cancelled',
            title: 'Evento cancellato',
            message: `L'evento "${event.title}" è stato cancellato.`,
            related_event_id: event.id,
            is_read: false,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['events']);
      queryClient.invalidateQueries(['notifications']);
      onOpenChange(false);
    },
  });

  const removeMyself = useMutation({
    mutationFn: async () => {
      await base44.entities.EventParticipant.delete(userParticipation.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['eventParticipants']);
      onOpenChange(false);
    },
  });

  if (!event) return null;

  const getCompanyName = (companyId) => {
    return companies.find(c => c.id === companyId)?.name || 'Società';
  };

  const getUserDisplayName = (userEmail) => {
    const userProfile = userProfiles.find((profile) => profile.user_email === userEmail);
    return userProfile?.display_name || userProfile?.full_name || userEmail;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Date/Time */}
          <div className="flex items-center gap-3 text-gray-600">
            <Clock className="h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium">
                {format(new Date(event.start_datetime), "EEEE d MMMM yyyy", { locale: it })}
              </p>
              <p className="text-sm">
                {format(new Date(event.start_datetime), 'HH:mm')} - {format(new Date(event.end_datetime), 'HH:mm')}
              </p>
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-3 text-gray-600">
              <MapPin className="h-5 w-5 text-gray-400" />
              <span>{event.location}</span>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <p className="text-gray-600">{event.description}</p>
          )}

          {/* Creator */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Creato da</span>
            <Badge variant="outline">{event.creator_name || event.creator_email}</Badge>
          </div>

          {/* Participants */}
          {participants.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Partecipanti</h4>
                <div className="space-y-2">
                  {participants.map(p => {
                    const status = statusLabels[p.status] || statusLabels.pending;
                    return (
                      <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-2">
                          {p.participant_type === 'user' ? (
                            <User className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Building2 className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-sm">
                            {p.participant_type === 'user' 
                              ? getUserDisplayName(p.user_email)
                              : getCompanyName(p.company_id)}
                          </span>
                          {p.has_conflict && (
                            <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                          )}
                        </div>
                        <Badge className={status.color}>{status.label}</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <Separator />
          
          {/* Response buttons for invited user */}
          {userParticipation && userParticipation.status === 'pending' && (
            <div className="space-y-2">
              {userParticipation.has_conflict && (
                <p className="text-sm text-yellow-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Accettando, l'evento in conflitto verrà cancellato.
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={() => respondMutation.mutate('accepted')}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={respondMutation.isPending}
                >
                  {respondMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Accetta
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => respondMutation.mutate('declined')}
                  className="flex-1"
                  disabled={respondMutation.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Rifiuta
                </Button>
              </div>
            </div>
          )}

          {/* Creator/manager actions */}
          {canManageEvent && (
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(event);
                }}
                className="w-full"
              >
                Modifica evento
              </Button>
              <Button
                variant="destructive"
                onClick={() => cancelEventMutation.mutate()}
                disabled={cancelEventMutation.isPending}
                className="w-full"
              >
                {cancelEventMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Cancella evento
              </Button>
            </div>
          )}

          {/* Remove myself (if participant, not creator) */}
          {!isCreator && userParticipation && userParticipation.status !== 'pending' && (
            <Button
              variant="outline"
              onClick={() => removeMyself.mutate()}
              disabled={removeMyself.isPending}
              className="w-full"
            >
              Rimuovimi dall'evento
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}