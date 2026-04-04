import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { appClient } from '@/api/appClient';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { Plus, Search, FolderKanban } from "lucide-react";
import ProjectCard from '@/components/project/ProjectCard';
import EmptyState from '@/components/ui/EmptyState';
import ContextBadge from '@/components/context/ContextBadge';
import { useLanguage } from '@/components/i18n/useLanguage';

export default function Projects() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => appClient.auth.me(),
    staleTime: 60 * 1000,
  });

  const { data: companyMemberships = [] } = useQuery({
    queryKey: ['userCompanies', user?.email],
    queryFn: () => appClient.entities.CompanyMember.filter({ user_email: user?.email, status: 'active' }),
    enabled: !!user?.email,
    staleTime: 2 * 60 * 1000,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies', companyMemberships],
    queryFn: async () => {
      if (companyMemberships.length === 0) return [];
      const companyIds = companyMemberships.map(m => m.company_id);
      const allCompanies = await appClient.entities.Company.list();
      return allCompanies.filter(c => companyIds.includes(c.id));
    },
    enabled: companyMemberships.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const { data: projectParticipations = [] } = useQuery({
    queryKey: ['userProjectParticipations', user?.id, companyMemberships],
    queryFn: async () => {
      const allParticipations = await appClient.entities.ProjectParticipant.list();
      const companyIds = companyMemberships.map(m => m.company_id);
      
      return allParticipations.filter(p => 
        (p.status === 'active' || p.status === 'invited') &&
        (
          (p.participant_type === 'personal' && p.user_id === user?.id) ||
          (p.participant_type === 'company' && companyIds.includes(p.company_id))
        )
      );
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', projectParticipations],
    queryFn: async () => {
      if (projectParticipations.length === 0) return [];
      const projectIds = [...new Set(projectParticipations.map(p => p.project_id))];
      const allProjects = await appClient.entities.Project.list('-created_date');
      return allProjects.filter(p => projectIds.includes(p.id));
    },
    enabled: projectParticipations.length > 0,
    staleTime: 60 * 1000,
  });

  const { data: allParticipants = [] } = useQuery({
    queryKey: ['allParticipants'],
    queryFn: () => appClient.entities.ProjectParticipant.filter({ status: 'active' }),
    staleTime: 60 * 1000,
  });

  const isLoading = userLoading || projectsLoading;

  const currentContext = user?.active_context || 'personal';
  const currentCompany = companies.find(c => c.id === user?.active_company_id);

  // Filter projects based on context
  const contextProjects = projects.filter(project => {
    const participation = projectParticipations.find(p => {
      if (p.project_id !== project.id) return false;
      
      if (currentContext === 'personal') {
        return p.participant_type === 'personal' && p.user_id === user?.id;
      } else {
        return p.participant_type === 'company' && p.company_id === user?.active_company_id;
      }
    });
    
    return !!participation;
  });

  // Apply filters
  const filteredProjects = contextProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          project.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getProjectRole = (projectId) => {
    // Find the participation matching current context
    const participation = projectParticipations.find(p => {
      if (p.project_id !== projectId) return false;
      
      if (currentContext === 'personal') {
        return p.participant_type === 'personal' && p.user_id === user?.id;
      } else {
        return p.participant_type === 'company' && p.company_id === user?.active_company_id;
      }
    });
    
    return participation?.project_role;
  };

  const getParticipantCount = (projectId) => {
    return allParticipants.filter(p => p.project_id === projectId).length;
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="app-page-header">
          <span className="app-page-kicker">Project hub</span>
          <h1 className="app-page-title">{t('common.projects')}</h1>
          <p className="app-page-subtitle">
            Elenco filtrabile dei cantieri attivi, pianificati e completati nel contesto di lavoro corrente.
          </p>
          <div className="flex items-center gap-2">
            <ContextBadge context={currentContext} companyName={currentCompany?.name} />
          </div>
        </div>
        <Link to={createPageUrl('NewProject')}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t('common.newProject')}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="app-panel flex flex-col gap-4 rounded-[1.75rem] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9a867f]" />
          <Input
            placeholder={t('common.searchProjects')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">{t('common.all')}</TabsTrigger>
            <TabsTrigger value="planning">{t('project.status.planning')}</TabsTrigger>
            <TabsTrigger value="in_progress">{t('project.status.in_progress')}</TabsTrigger>
            <TabsTrigger value="completed">{t('project.status.completed')}</TabsTrigger>
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
          title={searchQuery || statusFilter !== 'all' ? t('common.noResults') : t('dashboard.noProjects')}
          description={
            searchQuery || statusFilter !== 'all'
              ? t('common.tryModifyingFilters')
              : currentContext === 'personal'
                ? t('dashboard.noPersonalProjects')
                : t('dashboard.noCompanyProjects')
          }
          actionLabel={!searchQuery && statusFilter === 'all' ? t('common.newProject') : undefined}
          onAction={!searchQuery && statusFilter === 'all' ? () => navigate(createPageUrl('NewProject')) : undefined}
        />
      )}
    </div>
  );
}