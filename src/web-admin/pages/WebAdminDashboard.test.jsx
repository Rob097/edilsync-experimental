/** @vitest-environment jsdom */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const queryState = vi.hoisted(() => ({
  counts: [],
}));

vi.mock('@/api/appClient', () => ({
  supabase: {
    from: vi.fn((table) => ({
      select: vi.fn(() => ({
        then: undefined,
      })),
    })),
  },
}));

const { supabase } = await import('@/api/appClient');

supabase.from.mockImplementation((table) => ({
  select: vi.fn(async () => {
    const nextCount = queryState.counts.shift();
    return { count: nextCount, error: null, table };
  }),
}));

import WebAdminDashboard from './WebAdminDashboard';

function renderDashboard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <WebAdminDashboard />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('WebAdminDashboard', () => {
  beforeEach(() => {
    queryState.counts = [12, 4, 3];
    supabase.from.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('loads and renders the editorial counters', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Web Admin')).toBeTruthy();
    });
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });
});