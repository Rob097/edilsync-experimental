/** @vitest-environment jsdom */

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

// Scenario IDs: operativa.day-summary-shows-today-tasks-and-events

const navigateMock = vi.fn();

const operativeState = vi.hoisted(() => ({
  value: {
    user: null,
    activeCompanyId: null,
    contextProjects: [],
    contextTasks: [],
    contextEvents: [],
    isLoading: false,
  },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@/operativa/useOperativeData', () => ({
  useOperativeData: () => operativeState.value,
}));

vi.mock('@/components/i18n/useLanguage', () => ({
  useLanguage: () => ({
    currentLanguage: 'en',
    t: (key) => ({
      'common.loading': 'Loading',
      'common.projects': 'Projects',
      'operational.daySummary': 'Day summary',
      'operational.todayTasks': 'Today tasks',
      'operational.todayEvents': 'Today events',
      'operational.noTodayItems': 'No items for today.',
    }[key] || key),
  }),
}));

import OperativeDaySummary from './OperativeDaySummary';

describe('OperativeDaySummary', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-14T09:00:00.000Z'));
    navigateMock.mockReset();
    operativeState.value = {
      user: { email: 'worker@edilsync.test' },
      activeCompanyId: 'company-a',
      contextProjects: [
        { id: 'project-1', name: 'Tower Renovation' },
        { id: 'project-2', name: 'Mall Refit' },
      ],
      contextTasks: [
        {
          id: 'task-user-today',
          title: 'Inspect scaffolding',
          project_id: 'project-1',
          assigned_user_email: 'worker@edilsync.test',
          assigned_company_id: null,
          assigned_participant_id: 'participant-1',
          due_date: '2026-04-14',
          status: 'todo',
        },
        {
          id: 'task-company-progress',
          title: 'Coordinate supplier delivery',
          project_id: 'project-2',
          assigned_user_email: null,
          assigned_company_id: 'company-a',
          assigned_participant_id: 'participant-2',
          due_date: '2026-04-16',
          status: 'in_progress',
        },
        {
          id: 'task-irrelevant',
          title: 'Hidden unrelated task',
          project_id: 'project-2',
          assigned_user_email: 'other@edilsync.test',
          assigned_company_id: 'company-b',
          assigned_participant_id: 'participant-3',
          due_date: '2026-04-14',
          status: 'todo',
        },
      ],
      contextEvents: [
        { id: 'event-today', start_datetime: '2026-04-14T12:00:00.000Z' },
        { id: 'event-tomorrow', start_datetime: '2026-04-15T09:00:00.000Z' },
      ],
      isLoading: false,
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('shows only today-relevant tasks and today events, and opens the project workspace on click', async () => {
    render(<OperativeDaySummary />);

    expect(screen.getByText('Inspect scaffolding')).toBeTruthy();
    expect(screen.getByText('Coordinate supplier delivery')).toBeTruthy();
    expect(screen.queryByText('Hidden unrelated task')).toBeNull();
    expect(screen.getAllByText('Today tasks').length).toBe(2);
    expect(screen.getByText('Today events')).toBeTruthy();

    fireEvent.click(screen.getByText('Inspect scaffolding'));

    expect(navigateMock).toHaveBeenCalledWith('/app/operativa/progetto/project-1');
  });

  it('renders the empty state when there are no relevant tasks for today', () => {
    operativeState.value = {
      ...operativeState.value,
      contextTasks: [],
      contextEvents: [],
    };

    render(<OperativeDaySummary />);

    expect(screen.getByText('No items for today.')).toBeTruthy();
  });
});