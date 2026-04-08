import React, { useState } from 'react';
import { appClient } from '@/api/appClient';
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
import { useLanguage } from '@/components/i18n/useLanguage';

export default function CreateChannelDialog({ 
  open, 
  onOpenChange, 
  scopeType = 'project',
  projectId,
  companyId,
  participants,
  currentUserEmail,
  activeCompanyId
}) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const isCompanyScope = scopeType === 'company';
  const scopeId = isCompanyScope ? companyId : projectId;
  const minParticipants = isCompanyScope ? 1 : 2;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState([]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => appClient.auth.me(),
  });

  const { data: companyMemberships = [] } = useQuery({
    queryKey: ['userCompanyMemberships', user?.email],
    queryFn: () => appClient.entities.CompanyMember.filter({ user_email: user?.email, status: 'active' }),
    enabled: !!user?.email,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => appClient.entities.User.list(),
  });

  const { data: allCompanies = [] } = useQuery({
    queryKey: ['allCompanies'],
    queryFn: () => appClient.entities.Company.list(),
  });

  const createChannelMutation = useMutation({
    mutationFn: async (channelData) => {
      // Security check: for company-scoped channel, user must be admin of current company
      if (isCompanyScope) {
        const membership = companyMemberships.find((m) => m.company_id === companyId);
        if (!membership || membership.role !== 'admin') {
          throw new Error(t('createChannelDialog.permissionError'));
        }
      }

      const channel = await appClient.entities.Channel.create(channelData);
      
      // Add members
      for (const participantId of selectedParticipants) {
        const participant = participants.find(p => p.id === participantId);
        await appClient.entities.ChannelMember.create({
          channel_id: channel.id,
          project_id: isCompanyScope ? null : projectId,
          participant_id: participantId,
          user_email: participant.user_email,
          company_id: isCompanyScope ? companyId : (participant.company_id || null),
          last_read_at: new Date().toISOString()
        });
      }
      
      return channel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', scopeType, scopeId] });
      queryClient.invalidateQueries({ queryKey: ['channelMembers', scopeType, scopeId] });
      setName('');
      setDescription('');
      setSelectedParticipants([]);
      onOpenChange(false);
    },
  });

  const handleSubmit = () => {
    if (!name.trim() || selectedParticipants.length < minParticipants) return;

    createChannelMutation.mutate({
      project_id: isCompanyScope ? null : projectId,
      company_id: isCompanyScope ? companyId : null,
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
          <DialogTitle>{t('createChannelDialog.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">{t('createChannelDialog.channelName')}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('createChannelDialog.channelNamePlaceholder')}
            />
          </div>
          
          <div>
            <Label htmlFor="description">{t('createChannelDialog.description')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('createChannelDialog.descriptionPlaceholder')}
              rows={2}
            />
          </div>

          <div>
            <Label>{t('createChannelDialog.participantsMinimum', { count: minParticipants })}</Label>
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
              {participants.map(participant => {
                let displayName;
                if (participant.participant_type === 'company') {
                  const company = allCompanies.find(c => c.id === participant.company_id);
                  displayName = company?.name || t('createChannelDialog.companyFallback');
                } else {
                  const user = allUsers.find(u => u.email === participant.user_email);
                  displayName = user?.full_name || user?.display_name || participant.user_email;
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
              {t('createChannelDialog.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!name.trim() || selectedParticipants.length < minParticipants || createChannelMutation.isPending}
              className="bg-[#ef6144] hover:bg-[#d9553a]"
            >
              {t('createChannelDialog.create')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}