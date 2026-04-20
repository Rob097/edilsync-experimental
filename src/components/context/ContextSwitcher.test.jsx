/** @vitest-environment jsdom */

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/components/i18n/useLanguage', () => ({
  useLanguage: () => ({
    currentLanguage: 'it',
    t: (key) => ({
      'common.cancel': 'Annulla',
      'common.confirm': 'Conferma',
    }[key] || key),
  }),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick, className }) => (
    <button type="button" className={className} onClick={onClick}>{children}</button>
  ),
  DropdownMenuSeparator: () => <hr />,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }) => <div>{children}</div>,
  DialogDescription: ({ children }) => <div>{children}</div>,
  DialogFooter: ({ children }) => <div>{children}</div>,
  DialogHeader: ({ children }) => <div>{children}</div>,
  DialogTitle: ({ children }) => <h2>{children}</h2>,
}));

import ContextSwitcher from './ContextSwitcher';

const companies = [
  { id: 'company-alpha', name: 'Impresa Alfa' },
  { id: 'company-beta', name: 'Impresa Beta' },
];

describe('ContextSwitcher', () => {
  const onContextChange = vi.fn();

  beforeEach(() => {
    onContextChange.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows the current personal context label', () => {
    render(
      <ContextSwitcher
        currentContext="personal"
        currentCompany={null}
        companies={companies}
        onContextChange={onContextChange}
      />,
    );

    expect(screen.getAllByText('Privato').length).toBeGreaterThan(0);
  });

  it('shows the active company name when the user is in company context', () => {
    render(
      <ContextSwitcher
        currentContext="company"
        currentCompany={companies[0]}
        companies={companies}
        onContextChange={onContextChange}
      />,
    );

    expect(screen.getAllByText('Impresa Alfa').length).toBeGreaterThan(0);
  });

  it('asks for confirmation before switching from personal to company context', async () => {
    const user = userEvent.setup();

    render(
      <ContextSwitcher
        currentContext="personal"
        currentCompany={null}
        companies={companies}
        onContextChange={onContextChange}
      />,
    );

    await user.click(screen.getAllByRole('button', { name: /Impresa Alfa/i })[0]);

    expect(screen.getByText('Cambiare contesto di lavoro?')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Conferma' }));

    expect(onContextChange).toHaveBeenCalledWith('company', companies[0]);
  });

  it('does not open the confirmation dialog when selecting the current context again', async () => {
    const user = userEvent.setup();

    render(
      <ContextSwitcher
        currentContext="company"
        currentCompany={companies[1]}
        companies={companies}
        onContextChange={onContextChange}
      />,
    );

    await user.click(screen.getAllByRole('button', { name: /Impresa Beta/i })[0]);

    expect(screen.queryByText('Cambiare contesto di lavoro?')).toBeNull();
    expect(onContextChange).not.toHaveBeenCalled();
  });
});