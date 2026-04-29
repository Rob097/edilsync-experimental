import React, { useState } from 'react';
import { appClient } from '@/api/appClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, User, Clock, Trash2, Loader2 } from "lucide-react";
import { toast } from 'sonner';
import { useLanguage } from '@/components/i18n/useLanguage';

const roleColors = {
  homeowner: 'bg-purple-100 text-purple-700',
  contractor: 'bg-[#ef6144]/10 text-[#ef6144]',
  subcontractor: 'bg-orange-100 text-orange-700',
  architect: 'bg-blue-100 text-blue-700',
  engineer: 'bg-indigo-100 text-indigo-700',
  surveyor: 'bg-teal-100 text-teal-700',
  designer: 'bg-pink-100 text-pink-700',
  consultant: 'bg-gray-100 text-gray-700',
  supplier: 'bg-amber-100 text-amber-700',
};

export default function ParticipantCard({ participant, userDisplayName, companyName, isPending, canRemove, projectId }) {
  const { t, currentLanguage } = useLanguage();
  const tr = (itText, enText) => (currentLanguage === 'it' ? itText : enText);
  const isCompany = participant.participant_type === 'company';
  const roleColor = roleColors[participant.project_role] || 'bg-gray-100 text-gray-700';
  const queryClient = useQueryClient();
  const [confirmRemove, setConfirmRemove] = useState(false);

  const localizedRoleLabels = {
    homeowner: tr('Committente', 'Homeowner'),
    contractor: tr('Contractor', 'Contractor'),
    subcontractor: tr('Subappaltatore', 'Subcontractor'),
    architect: tr('Architetto', 'Architect'),
    engineer: tr('Ingegnere', 'Engineer'),
    surveyor: tr('Geometra', 'Surveyor'),
    designer: tr('Designer', 'Designer'),
    consultant: tr('Consulente', 'Consultant'),
    supplier: tr('Fornitore', 'Supplier'),
  };

  const resolvedUserName = userDisplayName || participant.user_email;

  const removeMutation = useMutation({
    mutationFn: async () => appClient.functions.invoke('removeProjectParticipant', {
      participant_id: participant.id,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectParticipants', projectId] });
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['channelMembers', projectId] });
      }, 500);
    },
    onError: (error) => {
      toast.error(error?.message || tr('Impossibile rimuovere il partecipante.', 'Unable to remove participant.'));
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
            {isCompany ? companyName : resolvedUserName}
          </p>
          {isCompany && participant.user_email && (
            <p className="text-sm text-gray-500">{resolvedUserName}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isPending && (
          <Badge variant="outline" className="text-gray-500">
            <Clock className="h-3 w-3 mr-1" />
            {tr('In attesa', 'Pending')}
          </Badge>
        )}
        <Badge className={roleColor}>
          {localizedRoleLabels[participant.project_role] || participant.project_role}
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
                {removeMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : t('common.confirm')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmRemove(false)}
              >
                {t('common.cancel')}
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