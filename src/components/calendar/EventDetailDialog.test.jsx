/** @vitest-environment jsdom */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

const eventDetailState = vi.hoisted(() => ({
  participants: [],
  companies: [],
  users: [],
}));

vi.mock('@/api/appClient', () => ({
  appClient: {
    entities: {
      EventParticipant: {
        filter: vi.fn(async () => eventDetailState.participants),
        update: vi.fn(async () => ({})),
        delete: vi.fn(async () => ({})),
      },
      Company: {
        list: vi.fn(async () => eventDetailState.companies),
      },
      User: {
        list: vi.fn(async () => eventDetailState.users),
      },
      Event: {
        update: vi.fn(async () => ({})),
      },
      Notification: {
        create: vi.fn(async () => ({})),
      },
    },
  },
}));

vi.mock('@/components/i18n/useLanguage', () => ({
  useLanguage: () => ({
    currentLanguage: 'it',
    t: (key, params) => ({
      'eventDetailDialog.statusPending': 'In attesa',
      'eventDetailDialog.statusAccepted': 'Accettato',
      'eventDetailDialog.statusDeclined': 'Rifiutato',
      'eventDetailDialog.createdBy': 'Creato da',
      'eventDetailDialog.participants': 'Partecipanti',
      'eventDetailDialog.companyFallback': 'Società',
      'eventDetailDialog.accept': 'Accetta',
      'eventDetailDialog.reject': 'Rifiuta',
      'eventDetailDialog.conflictNotice': 'Conflitto',
      'eventDetailDialog.eventCancelledTitle': 'Evento cancellato',
      'eventDetailDialog.eventCancelledMessage': `Evento cancellato: ${params?.title || ''}`,
      'eventDetailDialog.conflictResolvedTitle': 'Conflitto risolto',
      'eventDetailDialog.conflictResolvedMessage': 'Conflitto risolto',
      'eventDetailDialog.participantDeclinedTitle': 'Partecipante rifiutato',
      'eventDetailDialog.participantDeclinedMessage': 'Partecipante rifiutato',
    }[key] || key),
  }),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }) => <div>{children}</div>,
  DialogHeader: ({ children }) => <div>{children}</div>,
  DialogTitle: ({ children }) => <h1>{children}</h1>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }) => <button type="button" {...props}>{children}</button>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }) => <span>{children}</span>,
}));

vi.mock('@/components/ui/separator', () => ({
  Separator: () => <hr />,
}));

import EventDetailDialog from './EventDetailDialog';

function renderDialog(props) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <EventDetailDialog {...props} />
    </QueryClientProvider>,
  );
}

describe('EventDetailDialog', () => {
  beforeEach(() => {
    eventDetailState.participants = [
      {
        id: 'participant-1',
        event_id: 'event-1',
        participant_type: 'user',
        user_id: 'user-guest',
        user_email: 'guest@edilsync.test',
        status: 'pending',
        has_conflict: false,
      },
    ];
    eventDetailState.companies = [];
    eventDetailState.users = [
      {
        id: 'user-creator',
        email: 'creator@edilsync.test',
        full_name: 'Carlo Verdi',
      },
      {
        id: 'user-guest',
        email: 'guest@edilsync.test',
        display_name: 'Mario Bianchi',
      },
    ];
  });

  afterEach(() => {
    cleanup();
  });

  it('shows creator and invited users with their resolved display names instead of email', async () => {
    renderDialog({
      open: true,
      onOpenChange: vi.fn(),
      onEdit: vi.fn(),
      companyMemberships: [],
      user: {
        email: 'viewer@edilsync.test',
        active_context: 'personal',
      },
      event: {
        id: 'event-1',
        title: 'Riunione di cantiere',
        start_datetime: '2026-04-14T09:00:00.000Z',
        end_datetime: '2026-04-14T10:00:00.000Z',
        creator_email: 'creator@edilsync.test',
        creator_name: 'creator@edilsync.test',
        owner_type: 'personal',
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Carlo Verdi')).toBeTruthy();
    });

    expect(screen.getByText('Mario Bianchi')).toBeTruthy();
    expect(screen.queryByText('creator@edilsync.test')).toBeNull();
    expect(screen.queryByText('guest@edilsync.test')).toBeNull();
  });
});