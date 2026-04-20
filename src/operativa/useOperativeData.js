import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import {
  filterCompanyParticipations,
  filterOperativeCompanies,
  filterProjectsForParticipations,
  getContextProjectIds,
  getCurrentOperativeCompany,
  resolveOperativeContextEvents,
} from './operativeDataSelectors';

export function useOperativeData() {
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

  const operativeCompanyIds = useMemo(
    () => [...new Set(companyMemberships.map((membership) => membership.company_id).filter(Boolean))],
    [companyMemberships],
  );

  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ['operativeCompanies', operativeCompanyIds],
    queryFn: async () => {
      if (operativeCompanyIds.length === 0) return [];
      const scopedCompanies = await appClient.entities.Company.filter({ id: operativeCompanyIds });
      return filterOperativeCompanies({ allCompanies: scopedCompanies, companyMemberships });
    },
    enabled: operativeCompanyIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const currentContext = user?.active_context || 'personal';
  const activeCompanyId = user?.active_company_id || null;
  const currentCompany = getCurrentOperativeCompany({ companies, activeCompanyId });

  const { data: companyParticipations = [], isLoading: participationsLoading } = useQuery({
    queryKey: ['operativeCompanyParticipations', activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return [];
      const scopedParticipations = await appClient.entities.ProjectParticipant.filter({
        company_id: activeCompanyId,
        participant_type: 'company',
      });
      return filterCompanyParticipations({ participations: scopedParticipations, activeCompanyId });
    },
    enabled: !!activeCompanyId,
    staleTime: 2 * 60 * 1000,
  });

  const participationProjectIds = useMemo(
    () => [...new Set(companyParticipations.map((participation) => participation.project_id).filter(Boolean))],
    [companyParticipations],
  );

  const { data: contextProjects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['operativeProjects', participationProjectIds],
    queryFn: async () => {
      if (participationProjectIds.length === 0) return [];
      const scopedProjects = await appClient.entities.Project.filter({ id: participationProjectIds }, '-created_date');
      return filterProjectsForParticipations({ projects: scopedProjects, participations: companyParticipations });
    },
    enabled: participationProjectIds.length > 0,
    staleTime: 60 * 1000,
  });

  const contextProjectIds = useMemo(
    () => getContextProjectIds({ projects: contextProjects }),
    [contextProjects],
  );

  const { data: contextTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['operativeContextTasks', contextProjectIds],
    queryFn: () => {
      if (contextProjectIds.length === 0) return [];
      return appClient.entities.Task.filter({ project_id: contextProjectIds }, '-created_date');
    },
    enabled: contextProjectIds.length > 0,
    staleTime: 60 * 1000,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['operativeEvents'],
    queryFn: () => appClient.entities.Event.filter({ status: 'scheduled' }),
    staleTime: 60 * 1000,
  });

  const { data: eventParticipants = [], isLoading: participantsLoading } = useQuery({
    queryKey: ['operativeEventParticipants'],
    queryFn: () => appClient.entities.EventParticipant.list(),
    enabled: events.length > 0,
    staleTime: 60 * 1000,
  });

  const contextEvents = useMemo(() => {
    return resolveOperativeContextEvents({ events, eventParticipants, activeCompanyId });
  }, [events, eventParticipants, activeCompanyId]);

  const isContextLoading = userLoading || companiesLoading || participationsLoading || projectsLoading;
  const isActivityLoading = tasksLoading || eventsLoading || participantsLoading;

  return {
    user,
    companies,
    companyMemberships,
    currentContext,
    activeCompanyId,
    currentCompany,
    contextProjects,
    contextProjectIds,
    contextTasks,
    contextEvents,
    isLoading: isContextLoading,
    isContextLoading,
    isActivityLoading,
  };
}
