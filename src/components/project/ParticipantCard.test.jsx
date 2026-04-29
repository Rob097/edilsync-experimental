/** @vitest-environment jsdom */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const participantCardState = vi.hoisted(() => ({
  functionInvoke: vi.fn(),
  channelMemberFilter: vi.fn(),
  channelMemberDelete: vi.fn(),
  participantUpdate: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/api/appClient', () => ({
  appClient: {
    functions: {
      invoke: participantCardState.functionInvoke,
    },
    entities: {
      ChannelMember: {
        filter: participantCardState.channelMemberFilter,
        delete: participantCardState.channelMemberDelete,
      },
      ProjectParticipant: {
        update: participantCardState.participantUpdate,
      },
    },
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: participantCardState.toastError,
  },
}));

vi.mock('@/components/i18n/useLanguage', () => ({
  useLanguage: () => ({
    currentLanguage: 'it',
    t: (key) => ({
      'common.confirm': 'Conferma',
      'common.cancel': 'Annulla',
    }[key] || key),
  }),
}));

import ParticipantCard from './ParticipantCard';

function renderParticipantCard() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ParticipantCard
        participant={{
          id: 'participant-1',
          participant_type: 'company',
          company_id: 'company-1',
          user_email: 'contatto@impresa.test',
          project_role: 'contractor',
          status: 'invited',
        }}
        userDisplayName="Mario Rossi"
        companyName="Impresa QA"
        isPending
        canRemove
        projectId="project-1"
      />
    </QueryClientProvider>,
  );
}

describe('ParticipantCard removal', () => {
  beforeEach(() => {
    participantCardState.functionInvoke.mockReset();
    participantCardState.functionInvoke.mockResolvedValue({ success: true });
    participantCardState.channelMemberFilter.mockReset();
    participantCardState.channelMemberDelete.mockReset();
    participantCardState.participantUpdate.mockReset();
    participantCardState.toastError.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('removes a participant through the edge function instead of direct table patching', async () => {
    const user = userEvent.setup();

    renderParticipantCard();

    const [removeButton] = screen.getAllByRole('button');
    await user.click(removeButton);
    await user.click(screen.getByRole('button', { name: 'Conferma' }));

    await waitFor(() => {
      expect(participantCardState.functionInvoke).toHaveBeenCalledWith('removeProjectParticipant', {
        participant_id: 'participant-1',
      });
    });

    expect(participantCardState.channelMemberFilter).not.toHaveBeenCalled();
    expect(participantCardState.channelMemberDelete).not.toHaveBeenCalled();
    expect(participantCardState.participantUpdate).not.toHaveBeenCalled();
  });
});