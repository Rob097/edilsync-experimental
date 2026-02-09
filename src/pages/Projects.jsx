import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, FolderKanban } from "lucide-react";
import ProjectCard from '@/components/project/ProjectCard';
import EmptyState from '@/components/ui/EmptyState';
import ContextBadge from '@/components/context/ContextBadge';

export default function Projects() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: companyMemberships = [] } = useQuery({
    queryKey: ['userCompanies', user?.email],
    queryFn: () => base44.entities.CompanyMember.filter({ user_email: user?.email, status: 'active' }),
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const companyIds = companyMemberships.map(m => m.company_id);

  const { data: companies = [] } = useQuery({
    queryKey: ['companies', companyIds],
    queryFn: () => base44.entities.Company.filter({ id: { $in: companyIds } }),
    enabled: companyIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const currentContext = user?.active_context || 'personal';
  const currentCompany = companies.find(c => c.id === user?.active_company_id);

  const { data: projectParticipations = [] } = useQuery({
    queryKey: ['userProjectParticipations', user?.id, currentContext, currentCompany?.id],
    queryFn: () => {
      const query = { status: { $in: ['active', 'invited'] } };
      if (currentContext === 'personal') {
        query.participant_type = 'personal';
        query.user_id = user?.id;
      } else if (currentContext === 'company' && currentCompany?.id) {
        query.participant_type = 'company';
        query.company_id = currentCompany.id;
      } else {
        return [];
      }
      return base44.entities.ProjectParticipant.filter(query);
    },
    enabled: !!user?.id && (currentContext === 'personal' || (currentContext === 'company' && !!currentCompany?.id)),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const projectIds = [...new Set(projectParticipations.map(p => p.project_id))];

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', projectIds],
    queryFn: () => base44.entities.Project.filter({ id: { $in: projectIds } }, '-created_date'),
    enabled: projectIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: allParticipants = [] } = useQuery({
    queryKey: ['allParticipants', projectIds],
    queryFn: () => base44.entities.ProjectParticipant.filter({ project_id: { $in: projectIds }, status: 'active' }),
    enabled: projectIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Apply filters
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          project.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getProjectRole = (projectId) => {
    const participation = projectParticipations.find(p => p.project_id === projectId);
    return participation?.project_role;
  };

  const getParticipantCount = (projectId) => {
    return allParticipants.filter(p => p.project_id === projectId).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Progetti</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-gray-500">Visualizzazione</span>
            <ContextBadge context={currentContext} companyName={currentCompany?.name} />
          </div>
        </div>
        <Link to={createPageUrl('NewProject')}>
          <Button className="bg-[#ef6144] hover:bg-[#d9553a]">
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Progetto
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cerca progetti..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">Tutti</TabsTrigger>
            <TabsTrigger value="planning">Pianificazione</TabsTrigger>
            <TabsTrigger value="in_progress">In corso</TabsTrigger>
            <TabsTrigger value="completed">Completati</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Project list */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              userRole={getProjectRole(project.id)}
              participantCount={getParticipantCount(project.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderKanban}
          title={searchQuery || statusFilter !== 'all' ? "Nessun risultato" : "Nessun progetto"}
          description={
            searchQuery || statusFilter !== 'all'
              ? "Prova a modificare i filtri di ricerca."
              : currentContext === 'personal'
                ? "Non hai ancora progetti personali. Crea il tuo primo cantiere."
                : "Questa società non ha ancora progetti."
          }
          actionLabel={!searchQuery && statusFilter === 'all' ? "Nuovo Progetto" : undefined}
          onAction={!searchQuery && statusFilter === 'all' ? () => window.location.href = createPageUrl('NewProject') : undefined}
        />
      )}
    </div>
  );
}