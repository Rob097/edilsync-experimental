import React from 'react';
import { Building2, User } from "lucide-react";
import { useLanguage } from '@/components/i18n/useLanguage';

export default function ContextBadge({ context, companyName }) {
  const { currentLanguage } = useLanguage();
  const tr = (itText, enText) => (currentLanguage === 'it' ? itText : enText);
  const isPersonal = context === 'personal';

  return (
    <div className={`app-context-chip ${isPersonal ? 'app-context-chip--personal' : 'app-context-chip--company'}`}>
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