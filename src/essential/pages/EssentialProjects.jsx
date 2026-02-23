import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, MapPin, ArrowRight } from 'lucide-react';
import { useEssentialData } from '@/essential/useEssentialData';

function ProjectTile({ project }) {
  return (
    <Link to={`/essenziale/progetti/${project.id}`} className="block">
      <Card className="border-[#ef6144]/20 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xl font-semibold text-gray-900">{project.name}</p>
              <p className="text-gray-600 mt-2 flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>{project.address}</span>
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-[#ef6144]" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function EssentialProjects() {
  const navigate = useNavigate();
  const { contextProjects } = useEssentialData();

  return (
    <div className="space-y-5">
      <Button className="w-full bg-[#ef6144] hover:bg-[#d9553a] text-white" onClick={() => navigate('/essenziale/progetti/nuovo')}>
        <Plus className="h-4 w-4 mr-2" />
        Crea nuovo progetto
      </Button>

      <div className="border-t border-[#ef6144]/20" />

      {contextProjects.map((project) => (
        <ProjectTile key={project.id} project={project} />
      ))}

      {contextProjects.length === 0 ? (
        <Card className="border-[#ef6144]/20 shadow-sm">
          <CardContent className="p-6 text-center text-gray-600">
            Nessun progetto disponibile in questo contesto.
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
