import React, { useState } from 'react';
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Building2, User, Trash2, Plus, Loader2, Users } from "lucide-react";
import { useLanguage } from '@/components/i18n/useLanguage';

export default function ChannelMembersDialog({
  open,
  onOpenChange,
  channelId,
  projectId,
  canManage,
}) {
  const { currentLanguage } = useLanguage();
  const tr = (it, en) => currentLanguage === 'it' ? it : en;
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState([]);

  const { data: channel } = useQuery({
    queryKey: ['channel', channelId],
    queryFn: async () => {
      const channels = await base44.entities.Channel.filter({ id: channelId });
      return channels[0];
    },
    enabled: !!channelId,
  });

  const { data: channelMembers = [] } = useQuery({
    queryKey: ['channelMembers', projectId],
    queryFn: () => base44.entities.ChannelMember.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: participants = [] } = useQuery({
    queryKey: ['projectParticipants', projectId],
    queryFn: () => base44.entities.ProjectParticipant.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['allCompanies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: userProfiles = [] } = useQuery({
    queryKey: ['userPublicProfiles'],
    queryFn: () => base44.entities.UserPublicProfile.list(),
  });

  const currentMembers = channelMembers.filter(m => m.channel_id === channelId);
  const activeParticipants = participants.filter(p => p.status === 'active');

  // Participants not yet in this channel
  const availableToAdd = activeParticipants.filter(p => {
    return !currentMembers.some(m => m.participant_id === p.id);
  });

  const getDisplayName = (participant) => {
    if (participant.participant_type === 'company') {
      return companies.find(c => c.id === participant.company_id)?.name || tr('Società', 'Company');
    }
    const u = userProfiles.find(u => u.user_email === participant.user_email);
    return u?.display_name || u?.full_name || participant.user_email || tr('Utente', 'User');
  };

  const getMemberParticipant = (member) => {
    return participants.find(p => p.id === member.participant_id);
  };

  const removeMemberMutation = useMutation({
    mutationFn: (memberId) => base44.entities.ChannelMember.delete(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries(['channelMembers', projectId]);
    },
  });

  const addMembersMutation = useMutation({
    mutationFn: async () => {
      for (const participantId of selectedToAdd) {
        const participant = activeParticipants.find(p => p.id === participantId);
        if (participant) {
          await base44.entities.ChannelMember.create({
            channel_id: channelId,
            project_id: projectId,
            participant_id: participantId,
            user_email: participant.user_email || null,
            company_id: participant.company_id || null,
            last_read_at: new Date().toISOString(),
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['channelMembers', projectId]);
      setSelectedToAdd([]);
      setShowAddForm(false);
    },
  });

  const isGeneralChannel = channel?.type === 'general';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {tr('Membri del canale', 'Channel members')}
          </DialogTitle>
          <DialogDescription>
            {channel?.name} • {currentMembers.length} {tr('membri', 'members')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {currentMembers.map(member => {
            const participant = getMemberParticipant(member);
            if (!participant) return null;
            const isCompany = participant.participant_type === 'company';
            const displayName = getDisplayName(participant);

            return (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCompany ? 'bg-[#ef6144]/10' : 'bg-gray-200'}`}>
                    {isCompany ? <Building2 className="h-4 w-4 text-[#ef6144]" /> : <User className="h-4 w-4 text-gray-500" />}
                  </div>
                  <span className="text-sm font-medium">{displayName}</span>
                </div>
                {canManage && !isGeneralChannel && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-red-500"
                    onClick={() => removeMemberMutation.mutate(member.id)}
                    disabled={removeMemberMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {canManage && !isGeneralChannel && availableToAdd.length > 0 && (
          <>
            <Separator />
            {showAddForm ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">{tr('Aggiungi partecipanti', 'Add participants')}</p>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {availableToAdd.map(p => (
                    <div key={p.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedToAdd.includes(p.id)}
                        onCheckedChange={(checked) => {
                          setSelectedToAdd(prev =>
                            checked ? [...prev, p.id] : prev.filter(id => id !== p.id)
                          );
                        }}
                      />
                      <span className="text-sm">{getDisplayName(p)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setShowAddForm(false); setSelectedToAdd([]); }}>
                    {tr('Annulla', 'Cancel')}
                  </Button>
                  <Button
                    size="sm"
                    className="bg-[#ef6144] hover:bg-[#d9553a]"
                    onClick={() => addMembersMutation.mutate()}
                    disabled={selectedToAdd.length === 0 || addMembersMutation.isPending}
                  >
                    {addMembersMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    {tr('Aggiungi', 'Add')}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {tr('Aggiungi Membri', 'Add Members')}
              </Button>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}