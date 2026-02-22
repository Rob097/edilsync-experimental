import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';

export function useEssentialData() {
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
    queryKey: ['companies', companyMemberships],
    queryFn: async () => {
      if (companyMemberships.length === 0) return [];
      const companyIds = companyMemberships.map((membership) => membership.company_id);
      const allCompanies = await appClient.entities.Company.list();
      return allCompanies.filter((company) => companyIds.includes(company.id));
    },
    enabled: companyMemberships.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const { data: projectParticipations = [] } = useQuery({
    queryKey: ['userProjectParticipations', user?.id, companyMemberships],
    queryFn: async () => {
      const allParticipations = await appClient.entities.ProjectParticipant.list();
      const companyIds = companyMemberships.map((membership) => membership.company_id);

      return allParticipations.filter((participation) =>
        (participation.status === 'active' || participation.status === 'invited')
        && (
          (participation.participant_type === 'personal' && participation.user_id === user?.id)
          || (participation.participant_type === 'company' && companyIds.includes(participation.company_id))
        ));
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', projectParticipations],
    queryFn: async () => {
      if (projectParticipations.length === 0) return [];
      const projectIds = [...new Set(projectParticipations.map((participation) => participation.project_id))];
      const allProjects = await appClient.entities.Project.list('-created_date');
      return allProjects.filter((project) => projectIds.includes(project.id));
    },
    enabled: projectParticipations.length > 0,
    staleTime: 60 * 1000,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => appClient.entities.Event.filter({ status: 'scheduled' }),
    staleTime: 60 * 1000,
  });

  const { data: eventParticipants = [] } = useQuery({
    queryKey: ['eventParticipants'],
    queryFn: () => appClient.entities.EventParticipant.list(),
    enabled: events.length > 0,
    staleTime: 60 * 1000,
  });

  const currentContext = user?.active_context || 'personal';
  const currentCompany = companies.find((company) => company.id === user?.active_company_id);

  const contextProjects = useMemo(() => projects.filter((project) => {
    const participation = projectParticipations.find((entry) => {
      if (entry.project_id !== project.id) return false;
      if (currentContext === 'personal') {
        return entry.participant_type === 'personal' && entry.user_id === user?.id;
      }
      return entry.participant_type === 'company' && entry.company_id === user?.active_company_id;
    });
    return !!participation;
  }), [projects, projectParticipations, currentContext, user?.id, user?.active_company_id]);

  const contextProjectIds = useMemo(
    () => contextProjects.map((project) => project.id),
    [contextProjects],
  );

  const { data: contextTasks = [] } = useQuery({
    queryKey: ['essentialContextTasks', contextProjectIds],
    queryFn: () => {
      if (contextProjectIds.length === 0) return [];
      return appClient.entities.Task.filter({ project_id: contextProjectIds }, '-created_date');
    },
    enabled: contextProjectIds.length > 0,
    staleTime: 60 * 1000,
  });

  const contextEvents = useMemo(() => {
    const companyIds = companyMemberships.map((membership) => membership.company_id);

    const userEvents = events.filter((event) => {
      if (event.creator_email === user?.email) return true;
      if (event.owner_type === 'personal' && event.owner_user_id === user?.id) return true;
      if (event.owner_type === 'company' && companyIds.includes(event.owner_company_id)) return true;

      return eventParticipants.some((participant) =>
        participant.event_id === event.id
          && ((participant.participant_type === 'user' && participant.user_email === user?.email)
            || (participant.participant_type === 'company' && companyIds.includes(participant.company_id))));
    });

    if (currentContext === 'personal') {
      return userEvents.filter((event) =>
        event.owner_type === 'personal'
          || eventParticipants.some((participant) => participant.event_id === event.id && participant.user_email === user?.email));
    }

    return userEvents.filter((event) =>
      event.owner_company_id === user?.active_company_id
        || eventParticipants.some((participant) => participant.event_id === event.id && participant.company_id === user?.active_company_id));
  }, [events, eventParticipants, user?.email, user?.id, user?.active_company_id, currentContext, companyMemberships]);

  const nextEvent = useMemo(() => {
    const now = new Date();
    return [...contextEvents]
      .filter((event) => new Date(event.start_datetime) >= now)
      .sort((first, second) => new Date(first.start_datetime) - new Date(second.start_datetime))[0] || null;
  }, [contextEvents]);

  return {
    user,
    companyMemberships,
    companies,
    projectParticipations,
    projects,
    contextProjects,
    contextTasks,
    contextEvents,
    nextEvent,
    currentContext,
    currentCompany,
    isLoading: userLoading || companiesLoading || projectsLoading,
  };
}
