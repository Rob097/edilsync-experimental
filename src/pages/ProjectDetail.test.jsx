/** @vitest-environment jsdom */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const navigateMock = vi.fn();

const projectDetailState = vi.hoisted(() => ({
  user: null,
  project: null,
  participants: [],
  allUsers: [],
  companies: [],
  companyMemberships: [],
  functionInvoke: vi.fn(),
  participantUpdate: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => ({ search: '?id=project-1' }),
  };
});

vi.mock('@/utils', () => ({
  createPageUrl: (pageName) => `/app/${pageName}`,
}));

vi.mock('@/api/appClient', () => ({
  appClient: {
    auth: {
      me: vi.fn(async () => projectDetailState.user),
    },
    functions: {
      invoke: projectDetailState.functionInvoke,
    },
    entities: {
      Project: {
        filter: vi.fn(async () => [projectDetailState.project]),
      },
      ProjectParticipant: {
        filter: vi.fn(async () => projectDetailState.participants),
        update: projectDetailState.participantUpdate,
      },
      User: {
        list: vi.fn(async () => projectDetailState.allUsers),
      },
      Company: {
        list: vi.fn(async () => projectDetailState.companies),
      },
      CompanyMember: {
        filter: vi.fn(async () => projectDetailState.companyMemberships),
      },
    },
  },
}));

vi.mock('@/components/i18n/useLanguage', () => ({
  useLanguage: () => ({
    currentLanguage: 'it',
    t: (key) => ({
      'projectDetail.youAreInvited': 'Sei stato invitato',
      'projectDetail.acceptInviteDescription': 'Accetta l\'invito per partecipare alle attivita del cantiere',
      'projectDetail.decline': 'Rifiuta',
      'projectDetail.accept': 'Accetta',
      'projectDetail.quickActions.uploadAttachment': 'Carica Allegato',
      'projectDetail.quickActions.openChat': 'Apri Chat',
      'projectDetail.quickActions.newTask': 'Nuova Attività',
      'projectDetail.quickActions.newChange': 'Nuova Modifica',
      'projectDetail.quickActions.newDispute': 'Nuova Disputa',
      'projectDetail.quickActions.inviteParticipant': 'Invita Partecipante',
      'projectDetail.quickActions.openFinance': 'Apri Economia',
      'projectDetail.kicker': 'Cantiere',
      'common.projects': 'Cantieri',
      'project.status.planning': 'In pianificazione',
      'projectDetail.participants': 'Partecipanti',
      'projectDetail.projectNotFound': 'Cantiere non trovato',
      'projectDetail.projectNotFoundDescription': 'Il cantiere richiesto non e disponibile.',
      'projectDetail.backToProjects': 'Torna ai cantieri',
    }[key] || key),
  }),
}));

vi.mock('@/components/tour/TourLauncher', () => ({ default: () => null }));
vi.mock('@/components/tour/tours/projectTour', () => ({ getProjectTour: () => ({ steps: [] }) }));
vi.mock('@/components/project/InviteParticipantDialog', () => ({ default: () => null }));
vi.mock('@/components/project/ParticipantCard', () => ({ default: () => null }));
vi.mock('@/components/project/DocumentList', () => ({ default: () => null }));
vi.mock('@/components/project/ActivityFeed', () => ({ default: () => null }));
vi.mock('@/components/project/TaskList', () => ({ default: () => null }));
vi.mock('@/components/project/ChangeRequestList', () => ({ default: () => null }));
vi.mock('@/components/project/DisputeCaseList', () => ({ default: () => null }));
vi.mock('@/components/messaging/ProjectMessaging', () => ({ default: () => null }));
vi.mock('@/components/project/EditProjectDialog', () => ({ default: () => null }));
vi.mock('@/components/project/MilestoneList', () => ({ default: () => null }));
vi.mock('@/components/project/ProjectOverview', () => ({ default: () => null }));
vi.mock('@/components/project/ProjectFinancialSection', () => ({ default: () => null }));
vi.mock('@/components/project/ProjectSponsorshipCard', () => ({ default: () => null }));
vi.mock('@/components/ui/FeatureGateCard', () => ({ default: () => null }));
vi.mock('@/components/tour/TourProvider', () => ({ useTour: () => ({ startTour: vi.fn() }) }));
vi.mock('@/components/tour/tours/financeTour', () => ({ getFinanceSectionTour: () => ({ steps: [] }) }));
vi.mock('@/lib/financePermissions', () => ({
  getProjectFinancialPermissions: () => ({ canViewSection: false }),
}));
vi.mock('@/hooks/useFeatureAccess', () => ({
  useProjectFeatureAccess: () => ({
    featureMap: {
      project_milestones: { access_level: 'disabled' },
      project_chat: { access_level: 'disabled' },
      project_documents: { access_level: 'disabled' },
      project_finance: { access_level: 'disabled' },
    },
  }),
  useProjectPricingStatus: () => ({ projectPricingStatus: null }),
  isFeatureAccessible: () => false,
  isFeatureFullyEnabled: () => false,
  isProjectBlockedForSponsorLoss: () => false,
}));

import ProjectDetail from './ProjectDetail';

function renderProjectDetail() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ProjectDetail />
    </QueryClientProvider>,
  );
}

describe('ProjectDetail invite response', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    projectDetailState.functionInvoke.mockReset();
    projectDetailState.functionInvoke.mockResolvedValue({ success: true, participant: { id: 'invite-1', status: 'active' } });
    projectDetailState.participantUpdate.mockReset();
    projectDetailState.user = {
      id: 'user-1',
      email: 'company-admin@edilsync.test',
      active_context: 'company',
      active_company_id: 'company-1',
    };
    projectDetailState.project = {
      id: 'project-1',
      name: 'Cantiere QA',
      address: 'Via Roma 1',
      status: 'planning',
    };
    projectDetailState.participants = [
      {
        id: 'invite-1',
        project_id: 'project-1',
        participant_type: 'company',
        company_id: 'company-1',
        project_role: 'contractor',
        status: 'invited',
      },
    ];
    projectDetailState.companyMemberships = [
      {
        id: 'membership-1',
        company_id: 'company-1',
        user_email: 'company-admin@edilsync.test',
        status: 'active',
        role: 'admin',
      },
    ];
    projectDetailState.allUsers = [];
    projectDetailState.companies = [
      { id: 'company-1', name: 'Impresa QA' },
    ];
  });

  afterEach(() => {
    cleanup();
  });

  it('accepts a company invite through the edge function instead of direct table update', async () => {
    const user = userEvent.setup();

    renderProjectDetail();

    expect(await screen.findByText('Sei stato invitato')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Accetta' }));

    await waitFor(() => {
      expect(projectDetailState.functionInvoke).toHaveBeenCalledWith('respondProjectParticipantInvite', {
        participant_id: 'invite-1',
        status: 'active',
      });
    });
    expect(projectDetailState.participantUpdate).not.toHaveBeenCalled();
  });

  it('declines a company invite through the same edge function', async () => {
    const user = userEvent.setup();

    renderProjectDetail();

    expect(await screen.findByText('Sei stato invitato')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Rifiuta' }));

    await waitFor(() => {
      expect(projectDetailState.functionInvoke).toHaveBeenCalledWith('respondProjectParticipantInvite', {
        participant_id: 'invite-1',
        status: 'declined',
      });
    });
    expect(projectDetailState.participantUpdate).not.toHaveBeenCalled();
  });

  it('shows the aligned quick actions for an active participant based on current project capabilities', async () => {
    const user = userEvent.setup();

    projectDetailState.user = {
      id: 'user-1',
      email: 'homeowner@edilsync.test',
      active_context: 'personal',
      active_company_id: null,
    };
    projectDetailState.participants = [
      {
        id: 'participant-active',
        project_id: 'project-1',
        participant_type: 'personal',
        user_id: 'user-1',
        user_email: 'homeowner@edilsync.test',
        project_role: 'homeowner',
        status: 'active',
        can_invite: true,
      },
    ];
    projectDetailState.companyMemberships = [];

    renderProjectDetail();

    await user.click(await screen.findByRole('button', { name: 'Apri azioni rapide' }));

    expect(await screen.findByText('Carica Allegato')).toBeTruthy();
    expect(await screen.findByText('Apri Chat')).toBeTruthy();
    expect(await screen.findByText('Nuova Attività')).toBeTruthy();
    expect(await screen.findByText('Nuova Modifica')).toBeTruthy();
    expect(await screen.findByText('Nuova Disputa')).toBeTruthy();
    expect(await screen.findByText('Invita Partecipante')).toBeTruthy();
    expect(await screen.findByText('Apri Economia')).toBeTruthy();
  });
});