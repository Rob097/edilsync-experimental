import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Users } from "lucide-react";
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const statusConfig = {
  planning: { label: 'Pianificazione', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'In corso', color: 'bg-[#ef6144]/10 text-[#ef6144]' },
  completed: { label: 'Completato', color: 'bg-green-100 text-green-700' },
  on_hold: { label: 'In pausa', color: 'bg-yellow-100 text-yellow-700' }
};

const roleLabels = {
  homeowner: 'Committente',
  contractor: 'Contractor',
  subcontractor: 'Subappaltatore',
  architect: 'Architetto',
  engineer: 'Ingegnere',
  surveyor: 'Geometra',
  designer: 'Designer',
  consultant: 'Consulente'
};

export default function ProjectCard({ project, userRole, participantCount }) {
  const status = statusConfig[project.status] || statusConfig.planning;

  return (
    <Link to={createPageUrl('ProjectDetail') + `?id=${project.id}`}>
      <Card className="my-2 bg-card text-card-foreground rounded-xl border shadow hover:shadow-md transition-all duration-200 border-gray-200 hover:border-[#ef6144]/30 cursor-pointer">
        <CardContent className="p-5">
          <div className="mb-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-gray-900">{project.name}</h3>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{project.address}</span>
              </div>
              <Badge className={`${status.color} font-medium w-fit`}>
                {status.label}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {userRole &&
            <span className="text-[#ef6144] font-medium">
                {roleLabels[userRole] || userRole}
              </span>
            }
            {project.start_date &&
            <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{format(new Date(project.start_date), 'd MMM yyyy', { locale: it })}</span>
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