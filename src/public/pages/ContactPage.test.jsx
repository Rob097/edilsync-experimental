/** @vitest-environment jsdom */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const invokeMock = vi.hoisted(() => vi.fn());

vi.mock('@/api/appClient', () => ({
  supabase: {
    functions: {
      invoke: invokeMock,
    },
  },
}));

vi.mock('@/public/hooks/usePublicSeo', () => ({ default: () => {} }));
vi.mock('@/public/hooks/usePublicGsap', () => ({ default: () => {} }));

import ContactPage from './ContactPage';

function renderContactPage(locale = 'it', route = '/contatti') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  window.history.pushState({}, '', route);

  return render(
    <MemoryRouter initialEntries={[route]}>
      <QueryClientProvider client={queryClient}>
        <ContactPage locale={locale} />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('ContactPage', () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('keeps the submit button disabled until the required fields are valid', () => {
    renderContactPage();

    expect(screen.getByRole('button', { name: 'Invia richiesta' }).hasAttribute('disabled')).toBe(true);
  });

  it('submits a valid demo request with locale and source path', async () => {
    const user = userEvent.setup();
    invokeMock.mockResolvedValue({ error: null });

    const { container } = renderContactPage('it', '/contatti');
    const [fullNameInput, emailInput] = container.querySelectorAll('input');
    const messageInput = container.querySelector('textarea');

    await user.type(fullNameInput, 'Mario Rossi');
    await user.type(emailInput, 'mario@impresa.test');
    await user.type(messageInput, 'Vorrei una demo per coordinare meglio il cantiere.');
    await user.click(screen.getByRole('button', { name: 'Invia richiesta' }));

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('submitDemoRequest', {
        body: expect.objectContaining({
          full_name: 'Mario Rossi',
          email: 'mario@impresa.test',
          locale: 'it',
          source_path: '/contatti',
        }),
      });
    });
    expect(screen.getByText('Richiesta inviata. Ti contatteremo al più presto.')).toBeTruthy();
    expect(fullNameInput.value).toBe('');
    expect(emailInput.value).toBe('');
    expect(messageInput.value).toBe('');
  });

  it('shows an error message when the edge function returns an error', async () => {
    const user = userEvent.setup();
    invokeMock.mockResolvedValue({ error: new Error('boom') });

    const { container } = renderContactPage('it', '/contatti');
    const [fullNameInput, emailInput] = container.querySelectorAll('input');
    const messageInput = container.querySelector('textarea');

    await user.type(fullNameInput, 'Mario Rossi');
    await user.type(emailInput, 'mario@impresa.test');
    await user.type(messageInput, 'Vorrei una demo per coordinare meglio il cantiere.');
    await user.click(screen.getByRole('button', { name: 'Invia richiesta' }));

    await waitFor(() => {
      expect(screen.getByText('Errore durante l\'invio. Riprova tra poco.')).toBeTruthy();
    });
  });

  it('uses localized english labels and submission copy when rendered in english', async () => {
    const user = userEvent.setup();
    invokeMock.mockResolvedValue({ error: null });

    const { container } = renderContactPage('en', '/en/contatti');
    const [fullNameInput, emailInput] = container.querySelectorAll('input');
    const messageInput = container.querySelector('textarea');

    await user.type(fullNameInput, 'John Smith');
    await user.type(emailInput, 'john@contractor.test');
    await user.type(messageInput, 'We need a role-based worksite coordination demo for our team.');
    await user.click(screen.getByRole('button', { name: 'Send request' }));

    await waitFor(() => {
      expect(screen.getByText('Request sent. We will get back to you soon.')).toBeTruthy();
    });
  });
});