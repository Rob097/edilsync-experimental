import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users } from "lucide-react";
import { useLanguage } from '@/components/i18n/useLanguage';
import { getCompanyTypeLabel } from '@/lib/domainRoles';

export default function CompanyCard({ company, userRole, memberCount }) {
  const { t, currentLanguage } = useLanguage();
  const tx = (key, options) => t(`completeScoped.components_company_CompanyCard.${key}`, options);
  const roleLabels = {
    admin: t('companies.admin'),
    member: t('companies.member'),
  };

  return (
    <Link to={createPageUrl('CompanyDetail') + `?id=${company.id}`}>
      <Card className="app-panel cursor-pointer border-[rgba(197,177,165,0.48)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(217,85,58,0.35)] hover:shadow-[0_24px_48px_rgba(86,62,52,0.11)]">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[1rem] bg-[rgba(239,97,68,0.12)]">
              <Building2 className="h-6 w-6 text-[#d9553a]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1">
                <h3 className="truncate text-lg font-semibold tracking-[-0.025em] text-[#231b18]">{company.name}</h3>
                {userRole && (
                  <Badge variant="outline" className="ml-2 flex-shrink-0 border-[rgba(197,177,165,0.58)] bg-[rgba(255,250,247,0.88)] text-[#5e504b]">
                    {roleLabels[userRole] || userRole}
                  </Badge>
                )}
              </div>
              {company.vat_number && (
                <p className="mb-2 text-sm text-[#6d5c55]">{tx('k1')}: {company.vat_number}</p>
              )}
              {company.company_type && (
                <p className="mb-2 text-sm text-[#6d5c55]">{getCompanyTypeLabel(company.company_type, currentLanguage)}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-[#6d5c55]">
                {memberCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>{memberCount} {memberCount === 1 ? tx('k2') : tx('k3')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}