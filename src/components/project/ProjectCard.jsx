import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Calendar } from "lucide-react";

const statusConfig = {
  planning: { label: 'Pianificazione', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'In corso', color: 'bg-green-100 text-green-800' },
  completed: { label: 'Completato', color: 'bg-gray-100 text-gray-800' },
  on_hold: { label: 'In pausa', color: 'bg-yellow-100 text-yellow-800' }
};

const roleConfig = {
  homeowner: { label: 'Proprietario', color: 'bg-purple-100 text-purple-800' },
  contractor: { label: 'Impresa', color: 'bg-[#ef6144]/10 text-[#ef6144]' },
  subcontractor: { label: 'Subappaltatore', color: 'bg-orange-100 text-orange-800' },
  architect: { label: 'Architetto', color: 'bg-indigo-100 text-indigo-800' },
  engineer: { label: 'Ingegnere', color: 'bg-cyan-100 text-cyan-800' },
  surveyor: { label: 'Geometra', color: 'bg-teal-100 text-teal-800' },
  designer: { label: 'Designer', color: 'bg-pink-100 text-pink-800' },
  consultant: { label: 'Consulente', color: 'bg-amber-100 text-amber-800' }
};

export default function ProjectCard({ project, userRole, participantCount }) {
  const status = statusConfig[project.status] || statusConfig.planning;
  const role = roleConfig[userRole] || null;

  return (
    <Link to={createPageUrl('ProjectDetail') + `?id=${project.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">{project.name}</h3>
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <MapPin className="h-3.5 w-3.5" />
                <span className="line-clamp-1">{project.address}</span>
              </div>
            </div>
            <Badge className={status.color}>
              {status.label}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {role && (
              <Badge variant="outline" className={role.color}>
                {role.label}
              </Badge>
            )}
            {participantCount !== undefined && (
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                <span>{participantCount} {participantCount === 1 ? 'partecipante' : 'partecipanti'}</span>
              </div>
            )}
            {project.start_date && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{new Date(project.start_date).toLocaleDateString('it-IT')}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}