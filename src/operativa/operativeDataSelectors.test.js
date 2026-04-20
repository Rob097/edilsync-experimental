import { describe, expect, it } from 'vitest';
import {
  filterCompanyParticipations,
  filterOperativeCompanies,
  filterProjectsForParticipations,
  getContextProjectIds,
  getCurrentOperativeCompany,
  resolveOperativeContextEvents,
} from './operativeDataSelectors';

// Scenario IDs: operative.selectors.company-membership-filter, operative.selectors.project-participation-filter, operative.selectors.event-context-resolution

describe('operativeDataSelectors', () => {
  it('filters companies based on active company memberships and resolves the active company', () => {
    const companies = [
      { id: 'company-a', name: 'Alpha' },
      { id: 'company-b', name: 'Beta' },
      { id: 'company-c', name: 'Gamma' },
    ];
    const companyMemberships = [
      { company_id: 'company-a' },
      { company_id: 'company-c' },
    ];

    const filtered = filterOperativeCompanies({ allCompanies: companies, companyMemberships });

    expect(filtered.map(({ id }) => id)).toEqual(['company-a', 'company-c']);
    expect(getCurrentOperativeCompany({ companies: filtered, activeCompanyId: 'company-c' })).toEqual({
      id: 'company-c',
      name: 'Gamma',
    });
  });

  it('keeps only invited or active company participations and the corresponding projects', () => {
    const participations = [
      { project_id: 'project-1', status: 'active', participant_type: 'company', company_id: 'company-a' },
      { project_id: 'project-2', status: 'invited', participant_type: 'company', company_id: 'company-a' },
      { project_id: 'project-3', status: 'inactive', participant_type: 'company', company_id: 'company-a' },
      { project_id: 'project-4', status: 'active', participant_type: 'personal', company_id: 'company-a' },
      { project_id: 'project-5', status: 'active', participant_type: 'company', company_id: 'company-b' },
    ];
    const projects = [
      { id: 'project-1' },
      { id: 'project-2' },
      { id: 'project-5' },
    ];

    const filteredParticipations = filterCompanyParticipations({ participations, activeCompanyId: 'company-a' });
    const filteredProjects = filterProjectsForParticipations({ projects, participations: filteredParticipations });

    expect(filteredParticipations.map(({ project_id }) => project_id)).toEqual(['project-1', 'project-2']);
    expect(getContextProjectIds({ projects: filteredProjects })).toEqual(['project-1', 'project-2']);
  });

  it('resolves operative events from owned company events and participant links', () => {
    const events = [
      { id: 'event-owned', owner_type: 'company', owner_company_id: 'company-a' },
      { id: 'event-linked', owner_type: 'personal', owner_company_id: null },
      { id: 'event-other', owner_type: 'company', owner_company_id: 'company-b' },
    ];
    const eventParticipants = [
      { event_id: 'event-linked', participant_type: 'company', company_id: 'company-a' },
      { event_id: 'event-other', participant_type: 'company', company_id: 'company-b' },
    ];

    const contextEvents = resolveOperativeContextEvents({
      events,
      eventParticipants,
      activeCompanyId: 'company-a',
    });

    expect(contextEvents.map(({ id }) => id)).toEqual(['event-owned', 'event-linked']);
    expect(resolveOperativeContextEvents({ events, eventParticipants, activeCompanyId: null })).toEqual([]);
  });
});