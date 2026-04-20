export const getCurrentOperativeCompany = ({ companies = [], activeCompanyId = null }) =>
  companies.find((company) => company.id === activeCompanyId) || null;

export const filterOperativeCompanies = ({ allCompanies = [], companyMemberships = [] }) => {
  const companyIds = new Set(companyMemberships.map((membership) => membership.company_id));
  return allCompanies.filter((company) => companyIds.has(company.id));
};

export const filterCompanyParticipations = ({ participations = [], activeCompanyId = null }) => {
  if (!activeCompanyId) {
    return [];
  }

  return participations.filter((participation) =>
    (participation.status === 'active' || participation.status === 'invited') &&
    participation.participant_type === 'company' &&
    participation.company_id === activeCompanyId,
  );
};

export const filterProjectsForParticipations = ({ projects = [], participations = [] }) => {
  const projectIds = new Set(participations.map((participation) => participation.project_id));
  return projects.filter((project) => projectIds.has(project.id));
};

export const getContextProjectIds = ({ projects = [] }) => projects.map((project) => project.id);

export const resolveOperativeContextEvents = ({ events = [], eventParticipants = [], activeCompanyId = null }) => {
  if (!activeCompanyId) {
    return [];
  }

  return events.filter((event) => {
    if (event.owner_type === 'company' && event.owner_company_id === activeCompanyId) {
      return true;
    }

    return eventParticipants.some((participant) =>
      participant.event_id === event.id &&
      participant.participant_type === 'company' &&
      participant.company_id === activeCompanyId,
    );
  });
};
