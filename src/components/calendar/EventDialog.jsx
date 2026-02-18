import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, Plus, X } from "lucide-react";
import { format } from 'date-fns';
import ParticipantSelector from './ParticipantSelector';
import { useLanguage } from '@/components/i18n/useLanguage';

export default function EventDialog({ 
  open, 
  onOpenChange, 
  event, 
  defaultDate,
  currentContext,
  currentCompany,
  user 
}) {
  const { currentLanguage } = useLanguage();
  const tr = (itText, enText) => currentLanguage === 'it' ? itText : enText;
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    start_date: '',
    start_time: '09:00',
    end_date: '',
    end_time: '10:00',
    owner_type: 'personal',
  });
  const [participants, setParticipants] = useState([]);
  const [conflicts, setConflicts] = useState({ creator: null, participants: [] });
  const [showConflictWarning, setShowConflictWarning] = useState(false);

  const { data: allEvents = [] } = useQuery({
    queryKey: ['allEvents'],
    queryFn: () => base44.entities.Event.filter({ status: 'scheduled' }),
  });

  const { data: allParticipants = [] } = useQuery({
    queryKey: ['allEventParticipants'],
    queryFn: () => base44.entities.EventParticipant.list(),
  });

  useEffect(() => {
    if (open) {
      if (event) {
        const startDt = new Date(event.start_datetime);
        const endDt = new Date(event.end_datetime);
        setFormData({
          title: event.title || '',
          description: event.description || '',
          location: event.location || '',
          start_date: format(startDt, 'yyyy-MM-dd'),
          start_time: format(startDt, 'HH:mm'),
          end_date: format(endDt, 'yyyy-MM-dd'),
          end_time: format(endDt, 'HH:mm'),
          owner_type: event.owner_type || 'personal',
        });
      } else {
        const dateStr = defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
        setFormData({
          title: '',
          description: '',
          location: '',
          start_date: dateStr,
          start_time: '09:00',
          end_date: dateStr,
          end_time: '10:00',
          owner_type: currentContext === 'company' ? 'company' : 'personal',
        });
        setParticipants([]);
      }
      setConflicts({ creator: null, participants: [] });
      setShowConflictWarning(false);
    }
  }, [open, event, defaultDate, currentContext]);

  // Check for conflicts
  const checkConflicts = () => {
    const startDt = new Date(`${formData.start_date}T${formData.start_time}`);
    const endDt = new Date(`${formData.end_date}T${formData.end_time}`);
    
    const newConflicts = { creator: null, participants: [] };

    // Check creator conflicts
    const creatorConflict = allEvents.find(e => {
      if (event && e.id === event.id) return false;
      if (e.creator_email !== user?.email) return false;
      
      const eStart = new Date(e.start_datetime);
      const eEnd = new Date(e.end_datetime);
      return (startDt < eEnd && endDt > eStart);
    });

    if (creatorConflict) {
      newConflicts.creator = creatorConflict;
    }

    // Check participant conflicts
    participants.forEach(p => {
      const participantEvents = allEvents.filter(e => {
        if (event && e.id === event.id) return false;
        
        const isInvolved = allParticipants.some(ap => 
          ap.event_id === e.id && 
          ((p.type === 'user' && ap.user_email === p.email) ||
           (p.type === 'company' && ap.company_id === p.company_id))
        ) || (p.type === 'user' && e.creator_email === p.email);

        if (!isInvolved) return false;

        const eStart = new Date(e.start_datetime);
        const eEnd = new Date(e.end_datetime);
        return (startDt < eEnd && endDt > eStart);
      });

      if (participantEvents.length > 0) {
        newConflicts.participants.push({
          participant: p,
          conflictingEvents: participantEvents
        });
      }
    });

    setConflicts(newConflicts);
    return newConflicts.creator || newConflicts.participants.length > 0;
  };

  const createEventMutation = useMutation({
    mutationFn: async ({ cancelConflicting }) => {
      const startDt = new Date(`${formData.start_date}T${formData.start_time}`);
      const endDt = new Date(`${formData.end_date}T${formData.end_time}`);

      // Cancel creator's conflicting event if confirmed
      if (cancelConflicting && conflicts.creator) {
        await base44.entities.Event.update(conflicts.creator.id, { status: 'cancelled' });
        
        // Notify participants of cancelled event
        const cancelledParticipants = allParticipants.filter(p => p.event_id === conflicts.creator.id);
        for (const p of cancelledParticipants) {
          if (p.user_email) {
            await base44.entities.Notification.create({
              user_email: p.user_email,
              type: 'event_cancelled',
              title: 'Evento cancellato',
              message: `L'evento "${conflicts.creator.title}" è stato cancellato per un conflitto di orario.`,
              related_event_id: conflicts.creator.id,
              is_read: false,
            });
          }
        }
      }

      // Create event
      const eventData = {
        title: formData.title,
        description: formData.description || null,
        location: formData.location || null,
        start_datetime: startDt.toISOString(),
        end_datetime: endDt.toISOString(),
        owner_type: formData.owner_type,
        owner_user_id: formData.owner_type === 'personal' ? user?.id : null,
        owner_company_id: formData.owner_type === 'company' ? currentCompany?.id : null,
        status: 'scheduled',
        creator_email: user?.email,
        creator_name: user?.full_name,
      };

      const newEvent = event 
        ? await base44.entities.Event.update(event.id, eventData)
        : await base44.entities.Event.create(eventData);

      const eventId = event ? event.id : newEvent.id;

      // If updating event, notify participants
      if (event) {
        const existingParticipants = allParticipants.filter(p => p.event_id === event.id);
        for (const p of existingParticipants) {
          if (p.user_email) {
            await base44.entities.Notification.create({
              user_email: p.user_email,
              type: 'event_updated',
              title: 'Evento modificato',
              message: `L'evento "${formData.title}" è stato modificato.`,
              related_event_id: eventId,
              is_read: false,
            });
          }
        }
      }

      // Create participants
      if (!event) {
        for (const p of participants) {
          const conflict = conflicts.participants.find(c => 
            (p.type === 'user' && c.participant.email === p.email) ||
            (p.type === 'company' && c.participant.company_id === p.company_id)
          );

          await base44.entities.EventParticipant.create({
            event_id: eventId,
            participant_type: p.type,
            user_id: p.type === 'user' ? p.user_id : null,
            user_email: p.type === 'user' ? p.email : null,
            company_id: p.type === 'company' ? p.company_id : null,
            status: 'pending',
            has_conflict: !!conflict,
            conflict_event_id: conflict?.conflictingEvents[0]?.id || null,
          });

          // Send notification
          if (p.type === 'user' && p.email) {
            await base44.entities.Notification.create({
              user_email: p.email,
              type: 'event_invite',
              title: 'Nuovo invito evento',
              message: conflict 
                ? `Sei stato invitato a "${formData.title}". ATTENZIONE: hai un conflitto con "${conflict.conflictingEvents[0]?.title}".`
                : `Sei stato invitato a "${formData.title}".`,
              related_event_id: eventId,
              is_read: false,
            });
          }
        }
      }

      return newEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['events']);
      queryClient.invalidateQueries(['eventParticipants']);
      queryClient.invalidateQueries(['notifications']);
      onOpenChange(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const hasConflicts = checkConflicts();
    
    if (hasConflicts && !showConflictWarning) {
      setShowConflictWarning(true);
      return;
    }

    createEventMutation.mutate({ cancelConflicting: showConflictWarning && conflicts.creator });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setShowConflictWarning(false);
  };

  const isValid = formData.title && formData.start_date && formData.start_time && formData.end_date && formData.end_time;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-w-[97%] max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-lg">
        <DialogHeader>
          <DialogTitle>{event ? tr('Modifica Evento', 'Edit Event') : tr('Nuovo Evento', 'New Event')}</DialogTitle>
          <DialogDescription>
            {event ? tr('Modifica i dettagli dell\'evento.', 'Edit event details.') : tr('Crea un nuovo evento nel calendario.', 'Create a new event in the calendar.')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">{tr('Titolo', 'Title')} *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder={tr('Es. Riunione di cantiere', 'e.g. Site meeting')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{tr('Contesto', 'Context')}</Label>
            <Select value={formData.owner_type} onValueChange={(v) => handleChange('owner_type', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">{tr('Personale', 'Personal')}</SelectItem>
                {currentCompany && (
                  <SelectItem value="company">{currentCompany.name}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">{tr('Data inizio', 'Start date')} *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange('start_date', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_time">{tr('Ora inizio', 'Start time')} *</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => handleChange('start_time', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="end_date">{tr('Data fine', 'End date')} *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleChange('end_date', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">{tr('Ora fine', 'End time')} *</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => handleChange('end_time', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">{tr('Luogo', 'Location')}</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder={tr('Es. Cantiere Via Roma 15', 'e.g. Site at 15 Rome Street')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{tr('Descrizione', 'Description')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder={tr('Descrizione opzionale...', 'Optional description...')}
              rows={2}
            />
          </div>

          {!event && (
            <ParticipantSelector
              participants={participants}
              onChange={setParticipants}
            />
          )}

          {/* Conflict warnings */}
          {showConflictWarning && conflicts.creator && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {tr(
                  `Hai già un evento "${conflicts.creator.title}" in questo orario. Continuando, l'evento esistente verrà cancellato.`,
                  `You already have an event "${conflicts.creator.title}" at this time. Continuing will delete the existing event.`
                )}
              </AlertDescription>
            </Alert>
          )}

          {showConflictWarning && conflicts.participants.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {tr('I seguenti partecipanti hanno conflitti:', 'The following participants have conflicts:')}
                <ul className="mt-1 list-disc list-inside">
                  {conflicts.participants.map((c, idx) => (
                    <li key={idx}>
                      {c.participant.name || c.participant.email} - "{c.conflictingEvents[0]?.title}"
                    </li>
                  ))}
                </ul>
                {tr('Gli inviti verranno comunque inviati con avviso di conflitto.', 'Invitations will still be sent with a conflict warning.')}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              {tr('Annulla', 'Cancel')}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#ef6144] hover:bg-[#d9553a]"
              disabled={!isValid || createEventMutation.isPending}
            >
              {createEventMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {showConflictWarning ? tr('Conferma', 'Confirm') : (event ? tr('Salva', 'Save') : tr('Crea', 'Create'))}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}