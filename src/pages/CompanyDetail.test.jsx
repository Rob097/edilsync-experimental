/** @vitest-environment jsdom */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// Scenario IDs: company.billing-visible-only-to-admin, company.operations-premium-gates-remain-visible

const navigateMock = vi.fn();

const companyDetailState = vi.hoisted(() => ({
  user: null,
  company: null,
  members: [],
  allUsers: [],
  workSessions: [],
  featureMap: {},
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/api/appClient', () => ({
  appClient: {
    auth: {
      me: vi.fn(async () => companyDetailState.user),
    },
    entities: {
      Company: {
        filter: vi.fn(async () => (companyDetailState.company ? [companyDetailState.company] : [])),
      },
      CompanyMember: {
        filter: vi.fn(async () => companyDetailState.members),
      },
      User: {
        list: vi.fn(async () => companyDetailState.allUsers),
      },
      WorkSession: {
        filter: vi.fn(async () => companyDetailState.workSessions),
      },
    },
  },
}));

vi.mock('@/components/i18n/useLanguage', () => ({
  useLanguage: () => ({
    currentLanguage: 'en',
    t: (key) => ({
      'common.companies': 'Companies',
      'companyDetail.edit': 'Edit',
      'companyDetail.address': 'Address',
      'companyDetail.phone': 'Phone',
      'companyDetail.email': 'Email',
      'companyDetail.members': 'Members',
      'companyDetail.invite': 'Invite member',
      'companyDetail.noMembers': 'No members yet',
      'companyDetail.inviteMembersDescription': 'Invite your first teammate.',
      'companyDetail.pendingConfirmation': 'Pending confirmation',
      'companyDetail.companyNotFound': 'Company not found',
      'companyDetail.companyNotFoundDescription': 'The requested company is not available.',
      'companyDetail.backToCompanies': 'Back to companies',
    }[key] || key),
  }),
}));

vi.mock('@/components/tour/TourLauncher', () => ({
  default: () => null,
}));

vi.mock('@/components/tour/tours/companyTour', () => ({
  getCompanyTour: () => ({ steps: [] }),
}));

vi.mock('@/utils', () => ({
  createPageUrl: (pageName) => `/app/${pageName}`,
}));

vi.mock('@/components/company/InviteMemberDialog', () => ({
  default: ({ open }) => (open ? <div>invite-member-dialog</div> : null),
}));

vi.mock('@/components/company/EditCompanyDialog', () => ({
  default: ({ open }) => (open ? <div>edit-company-dialog</div> : null),
}));

vi.mock('@/components/company/CompanyTimeTrackingSection', () => ({
  default: ({ companyId, isAdmin }) => <div>time-tracking:{companyId}:{String(isAdmin)}</div>,
}));

vi.mock('@/components/company/CompanyBillingSection', () => ({
  default: ({ companyId, isAdmin }) => <div>billing-section:{companyId}:{String(isAdmin)}</div>,
}));

vi.mock('@/components/messaging/ProjectMessaging', () => ({
  default: ({ channelAccessMode, canCreateChannels }) => (
    <div>chat-mode:{channelAccessMode}:{String(canCreateChannels)}</div>
  ),
}));

vi.mock('@/components/project/DocumentList', () => ({
  default: ({ canUpload, featureAccess }) => (
    <div>documents:{String(canUpload)}:{featureAccess?.access_level || 'none'}</div>
  ),
}));

vi.mock('@/components/ui/FeatureGateCard', () => ({
  default: ({ title, description, badgeLabel }) => (
    <div>
      <div>{title}</div>
      <div>{description}</div>
      <div>{badgeLabel}</div>
    </div>
  ),
}));

vi.mock('@/components/company/MemberCard', () => ({
  default: ({ member, displayName, isPending }) => (
    <div>
      member:{displayName || member.user_email}:{isPending ? 'pending' : member.status}
    </div>
  ),
}));

vi.mock('@/components/ui/EmptyState', () => ({
  default: ({ title }) => <div>{title}</div>,
}));

vi.mock('@/lib/userDisplay', () => ({
  getUserDisplayNameByEmail: (email, users) => users.find((user) => user.email === email)?.display_name || email,
}));

vi.mock('@/hooks/useFeatureAccess', () => ({
  useCompanyFeatureAccess: () => ({ featureMap: companyDetailState.featureMap }),
  isFeatureAccessible: (featureAccess) => ['enabled', 'limited'].includes(featureAccess?.access_level),
  isFeatureFullyEnabled: (featureAccess) => featureAccess?.access_level === 'enabled',
}));

import CompanyDetail from './CompanyDetail';

function renderCompanyDetail() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <CompanyDetail />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('CompanyDetail page', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    window.scrollTo = vi.fn();

    companyDetailState.user = {
      email: 'qa-company@edilsync.test',
      active_context: 'company',
      active_company_id: 'company-1',
      tour_state: {},
    };
    companyDetailState.company = {
      id: 'company-1',
      name: 'QA Builders',
      vat_number: 'IT12345678901',
      address: 'Via QA 9, Milano',
      phone: '+39 02 555 111',
      email: 'team@qabuilders.test',
      description: 'Company fixture for billing and gating coverage.',
    };
    companyDetailState.members = [
      { id: 'member-admin', company_id: 'company-1', user_email: 'qa-company@edilsync.test', role: 'admin', status: 'active' },
      { id: 'member-worker', company_id: 'company-1', user_email: 'worker@qabuilders.test', role: 'member', status: 'active' },
      { id: 'member-invite', company_id: 'company-1', user_email: 'invite@qabuilders.test', role: 'member', status: 'invited' },
    ];
    companyDetailState.allUsers = [
      { email: 'qa-company@edilsync.test', display_name: 'QA Company Admin' },
      { email: 'worker@qabuilders.test', display_name: 'Site Worker' },
      { email: 'invite@qabuilders.test', display_name: 'Pending Invite' },
    ];
    companyDetailState.workSessions = [
      { id: 'session-open', company_id: 'company-1', ended_at: null },
      { id: 'session-closed', company_id: 'company-1', ended_at: '2026-04-13T17:00:00.000Z' },
    ];
    companyDetailState.featureMap = {
      company_billing: { access_level: 'enabled', config: { can_upgrade: true, can_manage_subscription: true } },
      company_time_tracking: { access_level: 'enabled', config: {} },
      company_chat: { access_level: 'enabled', config: {} },
      company_documents: { access_level: 'enabled', config: {} },
    };
  });

  afterEach(() => {
    cleanup();
  });

  it('hides billing for non-admin deep links and falls back to the overview tab', async () => {
    companyDetailState.members = [
      { id: 'member-current', company_id: 'company-1', user_email: 'qa-company@edilsync.test', role: 'member', status: 'active' },
    ];
    window.history.replaceState({}, '', '/app/CompanyDetail?id=company-1&tab=billing');

    renderCompanyDetail();

    await waitFor(() => {
      expect(screen.getByText('Active members')).toBeTruthy();
    });
    expect(screen.queryByRole('tab', { name: 'Billing' })).toBeNull();
    expect(screen.queryByText('billing-section:company-1:true')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Go to billing' })).toBeNull();
  });

  it('lets admins open billing from the upgrade banner and renders the billing section', async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, '', '/app/CompanyDetail?id=company-1');

    renderCompanyDetail();

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Billing' })).toBeTruthy();
    });
    expect(screen.getByText('Unlock the Pro plan')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Go to billing' }));

    expect(await screen.findByText('billing-section:company-1:true')).toBeTruthy();
  });

  it('keeps operations visible while locking premium time tracking and restricting chat/documents', async () => {
    const user = userEvent.setup();
    companyDetailState.featureMap = {
      company_billing: { access_level: 'limited', config: { can_upgrade: false, can_manage_subscription: false } },
      company_time_tracking: { access_level: 'disabled', config: {} },
      company_chat: { access_level: 'limited', config: {} },
      company_documents: { access_level: 'limited', config: {} },
    };
    window.history.replaceState({}, '', '/app/CompanyDetail?id=company-1&tab=operativita&section=all');

    renderCompanyDetail();

    await waitFor(() => {
      expect(screen.getByText('Premium time tracking')).toBeTruthy();
    });
    expect(screen.getByText('chat-mode:general_only:false')).toBeTruthy();
    expect(screen.queryByText('time-tracking:company-1:true')).toBeNull();

    await user.click(screen.getByRole('tab', { name: 'Info' }));

    expect(await screen.findByText('documents:true:limited')).toBeTruthy();
  });
});