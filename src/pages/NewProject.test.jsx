/** @vitest-environment jsdom */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// Scenario IDs: project.new-worksite-blocks-invalid-date-range

const newProjectState = vi.hoisted(() => ({
  currentUser: null,
  companyMemberships: [],
  companies: [],
  invoke: vi.fn(),
  toastError: vi.fn(),
  navigate: vi.fn(),
}));

const projectDateRangeState = vi.hoisted(() => ({
  invalid: true,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => newProjectState.navigate,
  };
});

vi.mock('@/api/appClient', () => ({
  appClient: {
    auth: {
      me: vi.fn(async () => newProjectState.currentUser),
    },
    entities: {
      CompanyMember: {
        filter: vi.fn(async () => newProjectState.companyMemberships),
      },
      Company: {
        list: vi.fn(async () => newProjectState.companies),
      },
    },
    functions: {
      invoke: newProjectState.invoke,
    },
  },
}));

vi.mock('@/components/i18n/useLanguage', () => ({
  useLanguage: () => ({
    t: (key) => ({
      'common.back': 'Back',
      'newProject.title': 'New Worksite',
      'newProject.creating': 'You are creating a worksite as',
      'newProject.projectName': 'Worksite name',
      'newProject.projectNamePlaceholder': 'Worksite name placeholder',
      'newProject.siteAddress': 'Site address',
      'newProject.siteAddressPlaceholder': 'Site address placeholder',
      'newProject.description': 'Description',
      'newProject.descriptionPlaceholder': 'Description placeholder',
      'newProject.yourRole': 'Your role in the worksite',
      'newProject.homeowner': 'Homeowner',
      'newProject.contractor': 'Contractor',
      'newProject.personalNote': 'Personal note',
      'newProject.status': 'Status',
      'newProject.planning': 'Planning',
      'newProject.inProgress': 'In progress',
      'newProject.onHold': 'On hold',
      'newProject.startDate': 'Planned start date',
      'newProject.endDate': 'Planned end date',
      'newProject.invalidDateRange': 'End date cannot be earlier than start date.',
      'newProject.cancel': 'Cancel',
      'newProject.create': 'Create Worksite',
      'newProject.createError': 'Unable to create the worksite',
    }[key] || key),
  }),
}));

vi.mock('@/lib/projectDateRange', () => ({
  hasInvalidProjectDateRange: () => projectDateRangeState.invalid,
}));

vi.mock('@/components/context/ContextBadge', () => ({
  default: () => <div>context-badge</div>,
}));

vi.mock('sonner', () => ({
  toast: {
    error: newProjectState.toastError,
  },
}));

import NewProject from './NewProject';

function renderNewProject() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <NewProject />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('NewProject page', () => {
  beforeEach(() => {
    newProjectState.currentUser = {
      email: 'qa-new-project@edilsync.test',
      active_context: 'personal',
      active_company_id: null,
    };
    newProjectState.companyMemberships = [];
    newProjectState.companies = [];
    newProjectState.invoke.mockReset();
    newProjectState.toastError.mockReset();
    newProjectState.navigate.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('blocks submission when end date is earlier than start date', async () => {
    const user = userEvent.setup();

    renderNewProject();

    await user.type(await screen.findByLabelText('Worksite name *'), 'QA Worksite');
    await user.type(screen.getByLabelText('Site address *'), 'Via QA 12');
    await user.click(screen.getByRole('button', { name: 'Create Worksite' }));

    expect(newProjectState.invoke).not.toHaveBeenCalled();
    expect(newProjectState.toastError).toHaveBeenCalledWith('End date cannot be earlier than start date.');
    expect(screen.getByText('End date cannot be earlier than start date.')).toBeTruthy();
  });
});