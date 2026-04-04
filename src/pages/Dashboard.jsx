import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { appClient } from '@/api/appClient';
import { useQuery } from '@tanstack/react-query';
import TourLauncher from '@/components/tour/TourLauncher';
import { getOnboardingTour } from '@/components/tour/tours/onboardingTour';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton.jsx";
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
import { useLanguage } from '@/components/i18n/useLanguage';

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, currentLanguage } = useLanguage();
  
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => appClient.auth.me(),
    staleTime: 60 * 1000, // 1 minuto
  });

  const { data: companyMemberships = [] } = useQuery({
    queryKey: ['userCompanies', user?.email],
    queryFn: () => appClient.entities.CompanyMember.filter({ user_email: user?.email, status: 'active' }),
    enabled: !!user?.email,
    staleTime: 2 * 60 * 1000, // 2 minuti
  });

  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ['companies', companyMemberships],
    queryFn: async () => {
      if (companyMemberships.length === 0) return [];
      const companyIds = companyMemberships.map(m => m.company_id);
      const allCompanies = await appClient.entities.Company.list();
      return allCompanies.filter(c => companyIds.includes(c.id));
    },
    enabled: companyMemberships.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minuti
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
    staleTime: 2 * 60 * 1000, // 2 minuti
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
    staleTime: 60 * 1000, // 1 minuto
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

  const getMembershipRole = (companyId) => {
    const membership = companyMemberships.find(m => m.company_id === companyId);
    return membership?.role;
  };

  // Start onboarding tour if not completed/dismissed
  const shouldStartOnboarding = user && 
    !user.tour_state?.onboarding_completed && 
    !user.tour_state?.onboarding_dismissed;

  const { data: currentCompanyMembers = [] } = useQuery({
    queryKey: ['currentCompanyMembers', user?.active_company_id],
    queryFn: () => appClient.entities.CompanyMember.filter({ 
      company_id: user?.active_company_id, 
      status: 'active' 
    }),
    enabled: !!user?.active_company_id && currentContext === 'company',
    staleTime: 2 * 60 * 1000, // 2 minuti
  });

  return (
    <div className="space-y-8 min-w-0">
      {/* Launch onboarding tour */}
      <TourLauncher 
        tourId="onboarding" 
        steps={getOnboardingTour(currentLanguage).steps} 
        trigger={shouldStartOnboarding}
        delay={1500}
      />

      {/* Welcome section */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="app-page-header">
          <span className="app-page-kicker">Panoramica operativa</span>
          <h1 className="app-page-title">
            {t('dashboard.greetingPrefix')} {(user?.display_name || user?.full_name)?.split(' ')[0] || 'Utente'}
          </h1>
          <p className="app-page-subtitle">
            {t('dashboard.workingAs')} {currentContext === 'personal' ? t('dashboard.noPersonalProjects') : currentCompany?.name || t('common.companies')}
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="app-kpi-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="app-kpi-icon app-kpi-icon--accent">
                <FolderKanban className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-[-0.03em] text-[#231b18]">{contextProjects.length}</p>
                <p className="text-sm text-[#6d5c55]">{t('common.projects')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="app-kpi-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="app-kpi-icon app-kpi-icon--info">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-[-0.03em] text-[#231b18]">
                  {contextProjects.filter(p => p.status === 'in_progress').length}
                </p>
                <p className="text-sm text-[#6d5c55]">{t('project.status.in_progress')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="app-kpi-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="app-kpi-icon app-kpi-icon--success">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-[-0.03em] text-[#231b18]">
                  {contextProjects.filter(p => p.status === 'completed').length}
                </p>
                <p className="text-sm text-[#6d5c55]">{t('project.status.completed')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {currentContext === 'personal' ? (
          <Card className="app-kpi-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="app-kpi-icon app-kpi-icon--neutral">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-[-0.03em] text-[#231b18]">{companies.length}</p>
                  <p className="text-sm text-[#6d5c55]">{t('common.companies')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="app-kpi-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="app-kpi-icon app-kpi-icon--neutral">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-[-0.03em] text-[#231b18]">{currentCompanyMembers.length}</p>
                  <p className="text-sm text-[#6d5c55]">{t('common.members')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Projects */}
      <Card className="app-panel">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold text-[#231b18]">{t('dashboard.recentProjects')}</CardTitle>
          <Link to={createPageUrl('Projects')}>
            <Button variant="ghost" size="sm" className="app-section-link">
              {t('common.seeAll')}
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
              title={t('dashboard.noProjects')}
              description={
                currentContext === 'personal'
                  ? t('dashboard.noPersonalProjects')
                  : t('dashboard.noCompanyProjects')
              }
              actionLabel={t('common.newProject')}
              onAction={() => navigate(createPageUrl('NewProject'))}
            />
          )}
        </CardContent>
      </Card>

      {/* Companies */}
      {currentContext === 'personal' && (
        <Card className="app-panel">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold text-[#231b18]">{t('dashboard.yourCompanies')}</CardTitle>
            <Link to={createPageUrl('Companies')}>
              <Button variant="ghost" size="sm" className="app-section-link">
                {t('common.seeAll')}
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
                title={t('dashboard.noCompanies')}
                description={t('dashboard.noCompaniesDescription')}
                actionLabel={t('common.newCompany')}
                onAction={() => navigate(createPageUrl('NewCompany'))}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}