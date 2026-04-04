import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Users } from "lucide-react";
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import { useLanguage } from '@/components/i18n/useLanguage';

const statusConfig = {
  planning: { color: 'bg-blue-100 text-blue-700' },
  in_progress: { color: 'bg-[#ef6144]/10 text-[#ef6144]' },
  completed: { color: 'bg-green-100 text-green-700' },
  on_hold: { color: 'bg-yellow-100 text-yellow-700' }
};

export default function ProjectCard({ project, userRole, participantCount }) {
  const { t, currentLanguage } = useLanguage();
  const tr = (itText, enText) => (currentLanguage === 'it' ? itText : enText);
  const dateLocale = currentLanguage === 'it' ? it : enUS;
  const status = statusConfig[project.status] || statusConfig.planning;
  const statusLabel = project.status === 'on_hold'
    ? tr('In pausa', 'On hold')
    : t(`project.status.${project.status || 'planning'}`);

  const roleLabels = {
    homeowner: tr('Committente', 'Homeowner'),
    contractor: tr('Contractor', 'Contractor'),
    subcontractor: tr('Subappaltatore', 'Subcontractor'),
    architect: tr('Architetto', 'Architect'),
    engineer: tr('Ingegnere', 'Engineer'),
    surveyor: tr('Geometra', 'Surveyor'),
    designer: tr('Designer', 'Designer'),
    consultant: tr('Consulente', 'Consultant'),
    supplier: tr('Fornitore', 'Supplier')
  };

  return (
    <Link to={createPageUrl('ProjectDetail') + `?id=${project.id}`}>
      <Card className="app-panel my-2 cursor-pointer overflow-hidden border-[rgba(197,177,165,0.48)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(217,85,58,0.35)] hover:shadow-[0_26px_54px_rgba(86,62,52,0.12)]">
        <CardContent className="p-5">
          <div className="mb-4 h-px w-full bg-[linear-gradient(90deg,rgba(239,97,68,0.34),rgba(239,97,68,0))]" />
          <div className="flex items-start justify-between mb-3 flex-col gap-3 md:flex-row md:gap-0">
            <div>
              <h3 className="mb-1 text-lg font-semibold tracking-[-0.025em] text-[#231b18]">{project.name}</h3>
              <div className="flex items-center gap-1.5 text-sm text-[#6d5c55]">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate max-w-[200px]">{project.address}</span>
              </div>
            </div>
            <Badge className={`${status.color} font-medium`}>
              {statusLabel}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-[#6d5c55]">
            {userRole &&
            <span className="font-semibold text-[#d9553a]">
                {roleLabels[userRole] || userRole}
              </span>
            }
            {project.start_date &&
            <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{format(new Date(project.start_date), 'd MMM yyyy', { locale: dateLocale })}</span>
              </div>
            }
            {participantCount > 0 &&
            <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <span>{participantCount}</span>
              </div>
            }
          </div>
        </CardContent>
      </Card>
    </Link>);

}