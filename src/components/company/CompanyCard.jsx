import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Briefcase } from "lucide-react";

const roleLabels = {
  admin: 'Amministratore',
  member: 'Membro',
};

export default function CompanyCard({ company, userRole, memberCount }) {
  return (
    <Link to={createPageUrl('CompanyDetail') + `?id=${company.id}`}>
      <Card className="hover:shadow-md transition-all duration-200 border-gray-200 hover:border-[#ef6144]/30 cursor-pointer">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#ef6144]/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-6 w-6 text-[#ef6144]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-semibold text-gray-900 truncate">{company.name}</h3>
                {userRole && (
                  <Badge variant="outline" className="ml-2 flex-shrink-0">
                    {roleLabels[userRole] || userRole}
                  </Badge>
                )}
              </div>
              {company.vat_number && (
                <p className="text-sm text-gray-500 mb-2">P.IVA: {company.vat_number}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {memberCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>{memberCount} {memberCount === 1 ? 'membro' : 'membri'}</span>
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