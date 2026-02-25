import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';

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

  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ['operativeCompanies', companyMemberships],
    queryFn: async () => {
      if (companyMemberships.length === 0) return [];
      const companyIds = companyMemberships.map((membership) => membership.company_id);
      const allCompanies = await appClient.entities.Company.list();
      return allCompanies.filter((company) => companyIds.includes(company.id));
    },
    enabled: companyMemberships.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const currentContext = user?.active_context || 'personal';
  const activeCompanyId = user?.active_company_id || null;
  const currentCompany = companies.find((company) => company.id === activeCompanyId) || null;

  const { data: companyParticipations = [], isLoading: participationsLoading } = useQuery({
    queryKey: ['operativeCompanyParticipations', activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return [];
      const allParticipations = await appClient.entities.ProjectParticipant.list();
      return allParticipations.filter((participation) =>
        (participation.status === 'active' || participation.status === 'invited')
        && participation.participant_type === 'company'
        && participation.company_id === activeCompanyId,
      );
    },
    enabled: !!activeCompanyId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: contextProjects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['operativeProjects', companyParticipations],
    queryFn: async () => {
      if (companyParticipations.length === 0) return [];
      const projectIds = [...new Set(companyParticipations.map((participation) => participation.project_id))];
      const allProjects = await appClient.entities.Project.list('-created_date');
      return allProjects.filter((project) => projectIds.includes(project.id));
    },
    enabled: companyParticipations.length > 0,
    staleTime: 60 * 1000,
  });

  const contextProjectIds = useMemo(
    () => contextProjects.map((project) => project.id),
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
    if (!activeCompanyId) return [];

    const companyEvents = events.filter((event) => {
      if (event.owner_type === 'company' && event.owner_company_id === activeCompanyId) return true;
      return eventParticipants.some((participant) =>
        participant.event_id === event.id
        && participant.participant_type === 'company'
        && participant.company_id === activeCompanyId,
      );
    });

    return companyEvents;
  }, [events, eventParticipants, activeCompanyId]);

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
    isLoading: userLoading || companiesLoading || participationsLoading || projectsLoading || tasksLoading || eventsLoading || participantsLoading,
  };
}
