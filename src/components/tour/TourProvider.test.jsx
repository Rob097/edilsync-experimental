/** @vitest-environment jsdom */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const tourAuthState = vi.hoisted(() => ({
  me: vi.fn(),
  updateMe: vi.fn(),
}));

vi.mock('@/api/appClient', () => ({
  appClient: {
    auth: {
      me: tourAuthState.me,
      updateMe: tourAuthState.updateMe,
    },
  },
}));

import TourProvider, { useTour } from './TourProvider';

function TourHarness({ firstSteps, secondSteps }) {
  const { activeTour, currentStep, startTour, nextStep, prevStep } = useTour();

  return (
    <div>
      <div data-testid="active-tour">{activeTour?.id || 'none'}</div>
      <div data-testid="current-step">{String(currentStep)}</div>
      <button type="button" onClick={() => startTour('tour-a', firstSteps)}>
        Start A
      </button>
      <button type="button" onClick={() => startTour('tour-b', secondSteps)}>
        Start B
      </button>
      <button type="button" onClick={() => nextStep()}>
        Next
      </button>
      <button type="button" onClick={() => prevStep()}>
        Prev
      </button>
    </div>
  );
}

function renderTourProvider(firstSteps, secondSteps = []) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/app/Dashboard']}>
        <TourProvider>
          <TourHarness firstSteps={firstSteps} secondSteps={secondSteps} />
        </TourProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TourProvider', () => {
  beforeEach(() => {
    tourAuthState.me.mockReset();
    tourAuthState.updateMe.mockReset();
    tourAuthState.me.mockResolvedValue({
      id: 'user-1',
      tour_state: {
        onboarding_completed: false,
        onboarding_dismissed: false,
        projects_completed: false,
        projects_dismissed: false,
        companies_completed: false,
        companies_dismissed: false,
      },
    });
    tourAuthState.updateMe.mockResolvedValue({});
  });

  afterEach(() => {
    cleanup();
  });

  it('runs onEnter for the current step when a tour starts and when the step changes', async () => {
    const user = userEvent.setup();
    const firstEnter = vi.fn();
    const secondEnter = vi.fn();
    const steps = [
      { title: 'Step 1', onEnter: firstEnter },
      { title: 'Step 2', onEnter: secondEnter },
    ];

    renderTourProvider(steps);

    await user.click(screen.getByRole('button', { name: 'Start A' }));

    await waitFor(() => {
      expect(firstEnter).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByTestId('active-tour').textContent).toBe('tour-a');
    expect(screen.getByTestId('current-step').textContent).toBe('0');

    await user.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      expect(secondEnter).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByTestId('current-step').textContent).toBe('1');

    await user.click(screen.getByRole('button', { name: 'Prev' }));

    await waitFor(() => {
      expect(firstEnter).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByTestId('current-step').textContent).toBe('0');
  });

  it('does not allow a second automatic tour to replace the active one', async () => {
    const user = userEvent.setup();
    const firstEnter = vi.fn();
    const secondEnter = vi.fn();

    renderTourProvider(
      [{ title: 'Step 1', onEnter: firstEnter }],
      [{ title: 'Other step', onEnter: secondEnter }],
    );

    await user.click(screen.getByRole('button', { name: 'Start A' }));

    await waitFor(() => {
      expect(firstEnter).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByTestId('active-tour').textContent).toBe('tour-a');

    await user.click(screen.getByRole('button', { name: 'Start B' }));

    expect(screen.getByTestId('active-tour').textContent).toBe('tour-a');
    expect(secondEnter).not.toHaveBeenCalled();
  });
});