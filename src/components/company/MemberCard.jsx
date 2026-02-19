import React, { useState } from 'react';
import { appClient } from '@/api/appClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Clock, Shield, Trash2, Loader2 } from "lucide-react";
import { useLanguage } from '@/components/i18n/useLanguage';

export default function MemberCard({ member, displayName, isCurrentUser, isPending, isAdmin, companyId, canRemoveSelf = true }) {
  const { t, currentLanguage } = useLanguage();
  const tr = (itText, enText) => (currentLanguage === 'it' ? itText : enText);
  const queryClient = useQueryClient();
  const [confirmRemove, setConfirmRemove] = useState(false);

  const localizedRoleLabels = {
    admin: t('companies.admin'),
    member: t('companies.member'),
  };

  const localizedProfessionLabels = {
    general: tr('Generale', 'General'),
    architect: tr('Architetto', 'Architect'),
    engineer: tr('Ingegnere', 'Engineer'),
    surveyor: tr('Geometra', 'Surveyor'),
    designer: tr('Designer', 'Designer'),
    accountant: tr('Contabile', 'Accountant'),
    other: tr('Altro', 'Other'),
  };

  const resolvedDisplayName = displayName || member.user_email;

  const removeMutation = useMutation({
    mutationFn: () => appClient.entities.CompanyMember.delete(member.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['companyMembers', companyId]);
    },
  });

  // Admin can remove others but not themselves
  const canRemove = isAdmin && (!isCurrentUser || canRemoveSelf);

  return (
    <div className={`
      flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border
      ${isPending ? 'bg-gray-50 border-dashed' : 'bg-white border-gray-200'}
    `}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
          <User className="h-5 w-5 text-gray-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-gray-900 break-all">{resolvedDisplayName}</p>
            {isCurrentUser && (
              <Badge variant="outline" className="text-xs">{tr('Tu', 'You')}</Badge>
            )}
          </div>
          {resolvedDisplayName !== member.user_email && (
            <p className="text-sm text-gray-500 break-all">{member.user_email}</p>
          )}
          {member.profession && member.profession !== 'general' && (
            <p className="text-sm text-gray-500">
              {localizedProfessionLabels[member.profession] || member.profession}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {isPending && (
          <Badge variant="outline" className="text-gray-500">
            <Clock className="h-3 w-3 mr-1" />
            {tr('In attesa', 'Pending')}
          </Badge>
        )}
        <Badge 
          className={
            member.role === 'admin' 
              ? 'bg-[#ef6144]/10 text-[#ef6144]' 
              : 'bg-gray-100 text-gray-700'
          }
        >
          {member.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
          {localizedRoleLabels[member.role] || member.role}
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