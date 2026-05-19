import React from 'react';
import { Building2, User } from "lucide-react";
import { useLanguage } from '@/components/i18n/useLanguage';

export default function ContextBadge({ context, companyName }) {
  const { t, currentLanguage } = useLanguage();
  const tx = (key, options) => t(`completeScoped.components_context_ContextBadge.${key}`, options);
  const isPersonal = context === 'personal';

  return (
    <div className={`app-context-chip ${isPersonal ? 'app-context-chip--personal' : 'app-context-chip--company'}`}>
      {isPersonal ? (
        <>
          <User className="h-3 w-3" />
          <span>{tx('k1')}</span>
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