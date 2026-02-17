import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, User, Clock, Trash2, Loader2 } from "lucide-react";

const roleLabels = {
  homeowner: 'Committente',
  contractor: 'Contractor',
  subcontractor: 'Subappaltatore',
  architect: 'Architetto',
  engineer: 'Ingegnere',
  surveyor: 'Geometra',
  designer: 'Designer',
  consultant: 'Consulente',
};

const roleColors = {
  homeowner: 'bg-purple-100 text-purple-700',
  contractor: 'bg-[#ef6144]/10 text-[#ef6144]',
  subcontractor: 'bg-orange-100 text-orange-700',
  architect: 'bg-blue-100 text-blue-700',
  engineer: 'bg-indigo-100 text-indigo-700',
  surveyor: 'bg-teal-100 text-teal-700',
  designer: 'bg-pink-100 text-pink-700',
  consultant: 'bg-gray-100 text-gray-700',
};

export default function ParticipantCard({ participant, companyName, isPending, canRemove, projectId }) {
  const isCompany = participant.participant_type === 'company';
  const roleColor = roleColors[participant.project_role] || 'bg-gray-100 text-gray-700';
  const queryClient = useQueryClient();
  const [confirmRemove, setConfirmRemove] = useState(false);

  const removeMutation = useMutation({
    mutationFn: async () => {
      // Remove from all channels first
      const channelMembers = await base44.entities.ChannelMember.filter({ project_id: projectId });
      const memberEntries = channelMembers.filter(m => m.participant_id === participant.id);
      for (const m of memberEntries) {
        await base44.entities.ChannelMember.delete(m.id);
      }
      // Then remove/decline the participant
      await base44.entities.ProjectParticipant.update(participant.id, { status: 'removed' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectParticipants', projectId] });
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['channelMembers', projectId] });
      }, 500);
    },
  });

  return (
    <div className={`
      flex items-center justify-between p-4 rounded-lg border flex-col gap-3 md:flex-row md:gap-0
      ${isPending ? 'bg-gray-50 border-dashed' : 'bg-white border-gray-200'}
    `}>
      <div className="flex items-center gap-3">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          ${isCompany ? 'bg-[#ef6144]/10' : 'bg-gray-100'}
        `}>
          {isCompany ? (
            <Building2 className="h-5 w-5 text-[#ef6144]" />
          ) : (
            <User className="h-5 w-5 text-gray-500" />
          )}
        </div>
        <div>
          <p className="font-medium text-gray-900">
            {isCompany ? companyName : participant.user_email}
          </p>
          {isCompany && participant.user_email && (
            <p className="text-sm text-gray-500">{participant.user_email}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isPending && (
          <Badge variant="outline" className="text-gray-500">
            <Clock className="h-3 w-3 mr-1" />
            In attesa
          </Badge>
        )}
        <Badge className={roleColor}>
          {roleLabels[participant.project_role] || participant.project_role}
        </Badge>
        {canRemove && (
          confirmRemove ? (
            <div className="flex items-center gap-1">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeMutation.mutate()}
                disabled={removeMutation.isPending}
              >
                {removeMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Conferma'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmRemove(false)}
              >
                Annulla
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-red-500"
              onClick={() => setConfirmRemove(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )
        )}
      </div>
    </div>
  );
}