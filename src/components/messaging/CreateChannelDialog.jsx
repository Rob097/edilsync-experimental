import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export default function CreateChannelDialog({ 
  open, 
  onOpenChange, 
  projectId,
  participants,
  currentUserEmail,
  activeCompanyId
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState([]);

  const createChannelMutation = useMutation({
    mutationFn: async (channelData) => {
      const channel = await base44.entities.Channel.create(channelData);
      
      // Add members
      for (const participantId of selectedParticipants) {
        const participant = participants.find(p => p.id === participantId);
        await base44.entities.ChannelMember.create({
          channel_id: channel.id,
          project_id: projectId,
          participant_id: participantId,
          user_email: participant.user_email,
          company_id: participant.company_id || null,
          last_read_at: new Date().toISOString()
        });
      }
      
      return channel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['channels', projectId]);
      queryClient.invalidateQueries(['channelMembers', projectId]);
      setName('');
      setDescription('');
      setSelectedParticipants([]);
      onOpenChange(false);
    },
  });

  const handleSubmit = () => {
    if (!name.trim() || selectedParticipants.length < 2) return;

    createChannelMutation.mutate({
      project_id: projectId,
      name: name.trim(),
      description: description.trim(),
      type: 'custom',
      created_by_email: currentUserEmail,
    });
  };

  const toggleParticipant = (participantId) => {
    setSelectedParticipants(prev =>
      prev.includes(participantId)
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crea Nuovo Canale</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome Canale</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="es. Problemi e Richieste"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Descrizione (opzionale)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrivi lo scopo del canale..."
              rows={2}
            />
          </div>

          <div>
            <Label>Partecipanti (minimo 2)</Label>
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
              {participants.map(participant => (
                <div key={participant.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedParticipants.includes(participant.id)}
                    onCheckedChange={() => toggleParticipant(participant.id)}
                  />
                  <span className="text-sm">{participant.user_email}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!name.trim() || selectedParticipants.length < 2 || createChannelMutation.isPending}
              className="bg-[#ef6144] hover:bg-[#d9553a]"
            >
              Crea Canale
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}