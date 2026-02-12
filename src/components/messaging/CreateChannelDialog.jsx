import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: companyMemberships = [] } = useQuery({
    queryKey: ['userCompanyMemberships', user?.email],
    queryFn: () => base44.entities.CompanyMember.filter({ user_email: user?.email, status: 'active' }),
    enabled: !!user?.email,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: allCompanies = [] } = useQuery({
    queryKey: ['allCompanies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const createChannelMutation = useMutation({
    mutationFn: async (channelData) => {
      // Security check: If creating as company (activeCompanyId set), user must be admin
      if (activeCompanyId) {
        const membership = companyMemberships.find(m => m.company_id === activeCompanyId);
        if (!membership || membership.role !== 'admin') {
          throw new Error('Solo gli amministratori della società possono creare canali a nome della società');
        }
      }

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
              {participants.map(participant => {
                let displayName;
                if (participant.participant_type === 'company') {
                  const company = allCompanies.find(c => c.id === participant.company_id);
                  displayName = company?.name || 'Società';
                } else {
                  const user = allUsers.find(u => u.email === participant.user_email);
                  displayName = user?.display_name || participant.user_email;
                }
                
                return (
                  <div key={participant.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedParticipants.includes(participant.id)}
                      onCheckedChange={() => toggleParticipant(participant.id)}
                    />
                    <span className="text-sm">{displayName}</span>
                  </div>
                );
              })}
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