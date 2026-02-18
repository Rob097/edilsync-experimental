import React from 'react';
import { Building2, User } from "lucide-react";
import { useLanguage } from '@/components/i18n/useLanguage';

export default function ContextBadge({ context, companyName }) {
  const { currentLanguage } = useLanguage();
  const tr = (itText, enText) => (currentLanguage === 'it' ? itText : enText);
  const isPersonal = context === 'personal';

  return (
    <div className={`
      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
      ${isPersonal 
        ? 'bg-gray-100 text-gray-700' 
        : 'bg-[#ef6144]/10 text-[#ef6144]'
      }
    `}>
      {isPersonal ? (
        <>
          <User className="h-3 w-3" />
          <span>{tr('Privato', 'Private')}</span>
        </>
      ) : (
        <>
          <Building2 className="h-3 w-3" />
          <span className="truncate max-w-[100px]">{companyName}</span>
        </>
      )}
    </div>
  );
}