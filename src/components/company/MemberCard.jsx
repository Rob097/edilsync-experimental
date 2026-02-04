import React from 'react';
import { Badge } from "@/components/ui/badge";
import { User, Clock, Shield } from "lucide-react";

const roleLabels = {
  admin: 'Amministratore',
  member: 'Membro',
};

const professionLabels = {
  general: 'Generale',
  architect: 'Architetto',
  engineer: 'Ingegnere',
  surveyor: 'Geometra',
  designer: 'Designer',
  accountant: 'Contabile',
  other: 'Altro',
};

export default function MemberCard({ member, isCurrentUser, isPending }) {
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
            <p className="font-medium text-gray-900 break-all">{member.user_email}</p>
            {isCurrentUser && (
              <Badge variant="outline" className="text-xs">Tu</Badge>
            )}
          </div>
          {member.profession && member.profession !== 'general' && (
            <p className="text-sm text-gray-500">
              {professionLabels[member.profession] || member.profession}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {isPending && (
          <Badge variant="outline" className="text-gray-500">
            <Clock className="h-3 w-3 mr-1" />
            In attesa
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
          {roleLabels[member.role] || member.role}
        </Badge>
      </div>
    </div>
  );
}