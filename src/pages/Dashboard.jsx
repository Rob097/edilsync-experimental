import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FolderKanban, 
  Building2, 
  Plus, 
  ArrowRight,
  Briefcase,
  Clock
} from "lucide-react";
import ProjectCard from '@/components/project/ProjectCard';
import CompanyCard from '@/components/company/CompanyCard';
import EmptyState from '@/components/ui/EmptyState';
import ContextBadge from '@/components/context/ContextBadge';

export default function Dashboard() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: companyMemberships = [] } = useQuery({
    queryKey: ['userCompanies', user?.email],
    queryFn: () => base44.entities.CompanyMember.filter({ user_email: user?.email, status: 'active' }),
    enabled: !!user?.email,
  });

  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ['companies', companyMemberships],
    queryFn: async () => {
      if (companyMemberships.length === 0) return [];
      const companyIds = companyMemberships.map(m => m.company_id);
      const allCompanies = await base44.entities.Company.list();
      return allCompanies.filter(c => companyIds.includes(c.id));
    },
    enabled: companyMemberships.length > 0,
  });

  const { data: projectParticipations = [] } = useQuery({
    queryKey: ['userProjectParticipations', user?.id, companyMemberships],
    queryFn: async () => {
      const allParticipations = await base44.entities.ProjectParticipant.list();
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
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', projectParticipations],
    queryFn: async () => {
      if (projectParticipations.length === 0) return [];
      const projectIds = [...new Set(projectParticipations.map(p => p.project_id))];
      const allProjects = await base44.entities.Project.list('-created_date');
      return allProjects.filter(p => projectIds.includes(p.id));
    },
    enabled: projectParticipations.length > 0,
  });

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

  const recentProjects = contextProjects.slice(0, 3);

  const getProjectRole = (projectId) => {
    const participation = projectParticipations.find(p => p.project_id === projectId);
    return participation?.project_role;
  };

  const getMembershipRole = (companyId) => {
    const membership = companyMemberships.find(m => m.company_id === companyId);
    return membership?.role;
  };

  const { data: currentCompanyMembers = [] } = useQuery({
    queryKey: ['currentCompanyMembers', user?.active_company_id],
    queryFn: () => base44.entities.CompanyMember.filter({ 
      company_id: user?.active_company_id, 
      status: 'active' 
    }),
    enabled: !!user?.active_company_id && currentContext === 'company',
  });

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Ciao, {user?.full_name?.split(' ')[0] || 'Utente'}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-gray-500">Stai operando come</span>
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#ef6144]/10 flex items-center justify-center">
                <FolderKanban className="h-5 w-5 text-[#ef6144]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{contextProjects.length}</p>
                <p className="text-sm text-gray-500">Progetti</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {contextProjects.filter(p => p.status === 'in_progress').length}
                </p>
                <p className="text-sm text-gray-500">In corso</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {contextProjects.filter(p => p.status === 'completed').length}
                </p>
                <p className="text-sm text-gray-500">Completati</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {currentContext === 'personal' ? (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{companies.length}</p>
                  <p className="text-sm text-gray-500">Società</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{currentCompanyMembers.length}</p>
                  <p className="text-sm text-gray-500">Membri</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold">Progetti Recenti</CardTitle>
          <Link to={createPageUrl('Projects')}>
            <Button variant="ghost" size="sm" className="text-[#ef6144]">
              Vedi tutti
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {projectsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : recentProjects.length > 0 ? (
            <div className="space-y-3">
              {recentProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  userRole={getProjectRole(project.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FolderKanban}
              title="Nessun progetto"
              description={
                currentContext === 'personal'
                  ? "Non hai ancora progetti personali. Crea il tuo primo cantiere."
                  : "Questa società non ha ancora progetti. Crea il primo cantiere."
              }
              actionLabel="Nuovo Progetto"
              onAction={() => window.location.href = createPageUrl('NewProject')}
            />
          )}
        </CardContent>
      </Card>

      {/* Companies */}
      {currentContext === 'personal' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold">Le tue Società</CardTitle>
            <Link to={createPageUrl('Companies')}>
              <Button variant="ghost" size="sm" className="text-[#ef6144]">
                Vedi tutte
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {companiesLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : companies.length > 0 ? (
              <div className="space-y-3">
                {companies.slice(0, 3).map(company => (
                  <CompanyCard
                    key={company.id}
                    company={company}
                    userRole={getMembershipRole(company.id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Building2}
                title="Nessuna società"
                description="Non fai parte di nessuna società. Creane una o attendi un invito."
                actionLabel="Crea Società"
                onAction={() => window.location.href = createPageUrl('NewCompany')}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}