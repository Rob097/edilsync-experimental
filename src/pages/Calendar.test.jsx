/** @vitest-environment jsdom */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

// Scenario IDs: calendar.personal-context-filters-items-by-user, calendar.company-context-filters-items-by-company

const calendarState = vi.hoisted(() => ({
  user: null,
  memberships: [],
  companies: [],
  participations: [],
  projects: [],
  events: [],
  eventParticipants: [],
  tasks: [],
}));

vi.mock('@/api/appClient', () => ({
  appClient: {
    auth: {
      me: vi.fn(async () => calendarState.user),
    },
    entities: {
      CompanyMember: {
        filter: vi.fn(async () => calendarState.memberships),
      },
      Company: {
        list: vi.fn(async () => calendarState.companies),
      },
      ProjectParticipant: {
        list: vi.fn(async () => calendarState.participations),
      },
      Project: {
        list: vi.fn(async () => calendarState.projects),
      },
      Event: {
        filter: vi.fn(async () => calendarState.events),
      },
      EventParticipant: {
        list: vi.fn(async () => calendarState.eventParticipants),
      },
      Task: {
        filter: vi.fn(async ({ project_id }) => {
          const projectIds = Array.isArray(project_id) ? project_id : [project_id];
          return calendarState.tasks.filter((task) => projectIds.includes(task.project_id));
        }),
      },
    },
  },
}));

vi.mock('@/components/i18n/useLanguage', () => ({
  useLanguage: () => ({
    currentLanguage: 'en',
    t: (key) => ({
      'calendar.kicker': 'Calendar',
      'calendar.title': 'Calendar',
      'calendar.subtitle': 'Events and assigned tasks for the active context.',
      'calendar.newEvent': 'New event',
      'calendar.today': 'Today',
    }[key] || key),
  }),
}));

vi.mock('@/components/context/ContextBadge', () => ({
  default: ({ context, companyName }) => <div>context:{context}:{companyName || 'personal'}</div>,
}));

vi.mock('@/components/calendar/CalendarDayView', () => ({
  default: ({ date, events }) => (
    <div>
      <div>day-view:{date.toISOString().slice(0, 10)}</div>
      <div>day-view-count:{events.length}</div>
      {events.map((event) => (
        <div key={event.id}>{event.title}</div>
      ))}
    </div>
  ),
}));

vi.mock('@/components/calendar/EventDialog', () => ({
  default: ({ open }) => (open ? <div>event-dialog-open</div> : null),
}));

vi.mock('@/components/calendar/EventDetailDialog', () => ({
  default: ({ open, event }) => (open ? <div>event-detail:{event?.title}</div> : null),
}));

vi.mock('@/components/calendar/TaskDetailDialog', () => ({
  default: ({ open, task }) => (open ? <div>task-detail:{task?.title}</div> : null),
}));

import Calendar from './Calendar';

function renderCalendar() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <Calendar />
    </QueryClientProvider>,
  );
}

describe('Calendar page', () => {
  beforeEach(() => {
    calendarState.user = {
      id: 'user-1',
      email: 'qa-calendar@edilsync.test',
      active_context: 'personal',
      active_company_id: 'company-a',
    };
    calendarState.memberships = [
      { id: 'membership-a', company_id: 'company-a', user_email: 'qa-calendar@edilsync.test', status: 'active' },
    ];
    calendarState.companies = [
      { id: 'company-a', name: 'Acme Restoration' },
    ];
    calendarState.participations = [
      { id: 'participation-personal', project_id: 'project-personal', participant_type: 'personal', user_id: 'user-1', status: 'active' },
      { id: 'participation-company', project_id: 'project-company', participant_type: 'company', company_id: 'company-a', status: 'active' },
    ];
    calendarState.projects = [
      { id: 'project-personal', name: 'Loft Renovation' },
      { id: 'project-company', name: 'Office Fit-out' },
    ];
    calendarState.events = [];
    calendarState.eventParticipants = [];
    calendarState.tasks = [];
  });

  afterEach(() => {
    cleanup();
  });

  it('shows only personal-context items and opens the selected task details', async () => {
    const today = new Date();
    const todayIsoDate = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');
    const dayOfMonth = String(today.getDate());

    calendarState.events = [
      {
        id: 'event-personal',
        title: 'Personal standup',
        creator_email: 'qa-calendar@edilsync.test',
        owner_type: 'personal',
        owner_user_id: 'user-1',
        start_datetime: `${todayIsoDate}T08:00:00`,
        end_datetime: `${todayIsoDate}T09:00:00`,
      },
      {
        id: 'event-company-hidden',
        title: 'Company-only coordination',
        creator_email: 'lead@acme.test',
        owner_type: 'company',
        owner_company_id: 'company-a',
        start_datetime: `${todayIsoDate}T10:00:00`,
        end_datetime: `${todayIsoDate}T11:00:00`,
      },
    ];
    calendarState.tasks = [
      {
        id: 'task-personal',
        title: 'Review drawings',
        due_date: todayIsoDate,
        assigned_user_email: 'qa-calendar@edilsync.test',
        project_id: 'project-personal',
        status: 'in_progress',
      },
      {
        id: 'task-company',
        title: 'Company inspection',
        due_date: todayIsoDate,
        assigned_company_id: 'company-a',
        project_id: 'project-company',
        status: 'not_started',
      },
    ];

    renderCalendar();

    expect(await screen.findByText(/Task: Review drawings/)).toBeTruthy();
    expect(screen.getByText('context:personal:Acme Restoration')).toBeTruthy();
    expect(screen.getByText('08:00 Personal standup')).toBeTruthy();
    expect(screen.queryByText(/Company inspection/)).toBeNull();
    expect(screen.queryByText(/Company-only coordination/)).toBeNull();

    const dayLabel = screen.getAllByText(dayOfMonth)[0];
    fireEvent.click(dayLabel.parentElement);

    expect(await screen.findByText(`day-view:${todayIsoDate}`)).toBeTruthy();
    expect(screen.getByText('day-view-count:2')).toBeTruthy();

    fireEvent.click(screen.getByText(/Task: Review drawings/));

    expect(await screen.findByText('task-detail:Review drawings')).toBeTruthy();
  });

  it('shows company-context items and opens event details from the month grid', async () => {
    const today = new Date();
    const todayIsoDate = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');

    calendarState.user = {
      ...calendarState.user,
      active_context: 'company',
      active_company_id: 'company-a',
    };
    calendarState.events = [
      {
        id: 'event-company',
        title: 'Site briefing',
        creator_email: 'lead@acme.test',
        owner_type: 'company',
        owner_company_id: 'company-a',
        start_datetime: `${todayIsoDate}T08:30:00`,
        end_datetime: `${todayIsoDate}T09:30:00`,
      },
      {
        id: 'event-personal-hidden',
        title: 'Personal-only event',
        creator_email: 'qa-calendar@edilsync.test',
        owner_type: 'personal',
        owner_user_id: 'user-1',
        start_datetime: `${todayIsoDate}T12:00:00`,
        end_datetime: `${todayIsoDate}T13:00:00`,
      },
    ];
    calendarState.tasks = [
      {
        id: 'task-company',
        title: 'Company inspection',
        due_date: todayIsoDate,
        assigned_company_id: 'company-a',
        project_id: 'project-company',
        status: 'not_started',
      },
      {
        id: 'task-personal-hidden',
        title: 'Personal follow-up',
        due_date: todayIsoDate,
        assigned_user_email: 'qa-calendar@edilsync.test',
        project_id: 'project-personal',
        status: 'in_progress',
      },
    ];

    renderCalendar();

    await waitFor(() => {
      expect(screen.getByText('context:company:Acme Restoration')).toBeTruthy();
    });
    expect(screen.getByText(/Task: Company inspection/)).toBeTruthy();
    expect(screen.getByText('08:30 Site briefing')).toBeTruthy();
    expect(screen.queryByText(/Personal follow-up/)).toBeNull();
    expect(screen.queryByText(/Personal-only event/)).toBeNull();

    fireEvent.click(screen.getByText('08:30 Site briefing'));

    expect(await screen.findByText('event-detail:Site briefing')).toBeTruthy();
  });
});