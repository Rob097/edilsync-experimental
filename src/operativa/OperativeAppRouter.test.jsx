/** @vitest-environment jsdom */

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('./OperativeLayout', async () => {
  const { Outlet } = await import('react-router-dom');
  return {
    default: () => (
      <div>
        <span>operative-layout</span>
        <Outlet />
      </div>
    ),
  };
});
vi.mock('./pages/OperativeEntry', () => ({ default: () => <div>operative-entry</div> }));
vi.mock('./pages/OperativeDaySummary', () => ({ default: () => <div>operative-day-summary</div> }));
vi.mock('./pages/OperativeProjectWorkspace', () => ({ default: () => <div>operative-project-workspace</div> }));
vi.mock('./pages/OperativeCompanyWorkspace', () => ({ default: () => <div>operative-company-workspace</div> }));

import OperativeAppRouter from './OperativeAppRouter';

const renderRouter = (entry) => render(
  <MemoryRouter initialEntries={[entry]}>
    <Routes>
      <Route path="/app/operativa/*" element={<OperativeAppRouter />} />
    </Routes>
  </MemoryRouter>,
);

describe('OperativeAppRouter', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the operative entry page on the root operative route', () => {
    renderRouter('/app/operativa');

    expect(screen.getByText('operative-entry')).toBeTruthy();
  });

  it('renders the day summary route', () => {
    renderRouter('/app/operativa/riepilogo');

    expect(screen.getByText('operative-day-summary')).toBeTruthy();
  });

  it('renders the company workspace route', () => {
    renderRouter('/app/operativa/societa');

    expect(screen.getByText('operative-company-workspace')).toBeTruthy();
  });

  it('redirects unknown routes back to the operative root', async () => {
    renderRouter('/app/operativa/unexpected');

    await waitFor(() => {
      expect(screen.getByText('operative-entry')).toBeTruthy();
    });
  });
});