/** @vitest-environment jsdom */

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

const authState = vi.hoisted(() => ({
  value: {
    user: null,
    isAuthenticated: false,
    isLoadingAuth: false,
    isLoadingPublicSettings: false,
  },
}));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => authState.value,
}));

import WebAdminGuard from './WebAdminGuard';

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={['/web-admin']}>
      <Routes>
        <Route path="/app" element={<LocationProbe />} />
        <Route
          path="/web-admin"
          element={(
            <>
              <WebAdminGuard>
                <div>Hidden admin area</div>
              </WebAdminGuard>
              <LocationProbe />
            </>
          )}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('WebAdminGuard', () => {
  beforeEach(() => {
    authState.value = {
      user: null,
      isAuthenticated: false,
      isLoadingAuth: false,
      isLoadingPublicSettings: false,
    };
  });

  afterEach(() => {
    cleanup();
  });

  it('shows a loading spinner while auth state is still loading', () => {
    authState.value = {
      user: null,
      isAuthenticated: false,
      isLoadingAuth: true,
      isLoadingPublicSettings: false,
    };

    const { container } = renderGuard();

    expect(container.querySelector('.animate-spin')).not.toBeNull();
    expect(screen.queryByText('Hidden admin area')).toBeNull();
  });

  it('redirects unauthenticated users back to /app', async () => {
    renderGuard();

    await waitFor(() => {
      expect(screen.getByTestId('location').textContent).toBe('/app');
    });
  });

  it('redirects authenticated non-admin users back to /app', async () => {
    authState.value = {
      user: { role: 'normal' },
      isAuthenticated: true,
      isLoadingAuth: false,
      isLoadingPublicSettings: false,
    };

    renderGuard();

    await waitFor(() => {
      expect(screen.getByTestId('location').textContent).toBe('/app');
    });
  });

  it('renders the admin content for authenticated platform admins', async () => {
    authState.value = {
      user: { role: 'admin' },
      isAuthenticated: true,
      isLoadingAuth: false,
      isLoadingPublicSettings: false,
    };

    renderGuard();

    await waitFor(() => {
      expect(screen.getByText('Hidden admin area')).toBeTruthy();
    });
    expect(screen.getByTestId('location').textContent).toBe('/web-admin');
  });
});