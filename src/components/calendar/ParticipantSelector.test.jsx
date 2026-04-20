/** @vitest-environment jsdom */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const participantSelectorState = vi.hoisted(() => ({
  users: [],
  companies: [],
}));

vi.mock('@/api/appClient', () => ({
  appClient: {
    entities: {
      User: {
        list: vi.fn(async () => participantSelectorState.users),
      },
      Company: {
        list: vi.fn(async () => participantSelectorState.companies),
      },
    },
  },
}));

vi.mock('@/components/i18n/useLanguage', () => ({
  useLanguage: () => ({
    currentLanguage: 'it',
  }),
}));

import ParticipantSelector from './ParticipantSelector';

beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Object.defineProperty(Element.prototype, 'hasPointerCapture', {
      configurable: true,
      value: () => false,
    });
  }

  if (!Element.prototype.setPointerCapture) {
    Object.defineProperty(Element.prototype, 'setPointerCapture', {
      configurable: true,
      value: () => {},
    });
  }

  if (!Element.prototype.releasePointerCapture) {
    Object.defineProperty(Element.prototype, 'releasePointerCapture', {
      configurable: true,
      value: () => {},
    });
  }

  if (!Element.prototype.scrollIntoView) {
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: () => {},
    });
  }
});

afterAll(() => {
  delete Element.prototype.hasPointerCapture;
  delete Element.prototype.setPointerCapture;
  delete Element.prototype.releasePointerCapture;
  delete Element.prototype.scrollIntoView;
});

function renderParticipantSelector(props = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ParticipantSelector participants={[]} onChange={vi.fn()} {...props} />
    </QueryClientProvider>,
  );
}

describe('ParticipantSelector', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows the resolved display name for selectable users and for added participants', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    participantSelectorState.users = [
      {
        id: 'user-1',
        email: 'mario.rossi@edilsync.test',
        display_name: 'Mario Rossi',
        full_name: '',
      },
    ];
    participantSelectorState.companies = [];

    renderParticipantSelector({ onChange });

    await waitFor(() => {
      expect(screen.getAllByRole('combobox')).toHaveLength(2);
    });

    const userSelectTrigger = screen.getAllByRole('combobox')[1];
    await user.click(userSelectTrigger);

    expect(await screen.findByRole('option', { name: 'Mario Rossi' })).toBeTruthy();
    expect(screen.queryByText('mario.rossi@edilsync.test')).toBeNull();

    await user.click(screen.getByText('Mario Rossi'));
    expect(screen.getByText('Mario Rossi')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /aggiungi/i }));

    expect(onChange).toHaveBeenCalledWith([
      {
        type: 'user',
        user_id: 'user-1',
        email: 'mario.rossi@edilsync.test',
        name: 'Mario Rossi',
      },
    ]);
  });
});