/** @vitest-environment jsdom */

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const {
  authState,
  resetAuthState,
} = vi.hoisted(() => {
  const authState = {
    me: vi.fn(),
    signInWithPassword: vi.fn(),
    signUpWithPassword: vi.fn(),
    logout: vi.fn(),
    redirectToLogin: vi.fn(),
    onAuthStateChange: vi.fn(),
    authCallback: null,
    unsubscribe: vi.fn(),
  };

  const resetAuthState = () => {
    authState.me.mockReset();
    authState.signInWithPassword.mockReset();
    authState.signUpWithPassword.mockReset();
    authState.logout.mockReset();
    authState.redirectToLogin.mockReset();
    authState.unsubscribe.mockReset();
    authState.authCallback = null;
    authState.onAuthStateChange.mockImplementation((callback) => {
      authState.authCallback = callback;
      return authState.unsubscribe;
    });
  };

  return { authState, resetAuthState };
});

vi.mock('@/api/appClient', () => ({
  appClient: {
    auth: {
      me: authState.me,
      signInWithPassword: authState.signInWithPassword,
      signUpWithPassword: authState.signUpWithPassword,
      logout: authState.logout,
      redirectToLogin: authState.redirectToLogin,
      onAuthStateChange: authState.onAuthStateChange,
    },
  },
}));

import { AuthProvider, useAuth } from './AuthContext';

function AuthConsumer() {
  const auth = useAuth();

  return (
    <div>
      <div data-testid="is-authenticated">{auth.isAuthenticated ? 'yes' : 'no'}</div>
      <div data-testid="user-email">{auth.user?.email || 'none'}</div>
      <div data-testid="error-type">{auth.authError?.type || 'none'}</div>
      <div data-testid="loading-auth">{auth.isLoadingAuth ? 'yes' : 'no'}</div>
      <button type="button" onClick={() => auth.signInWithPassword({ email: 'qa-login@edilsync.test', password: 'EdilSync!123' })}>
        Sign in
      </button>
      <button type="button" onClick={() => auth.signUpWithPassword({ email: 'qa-signup@edilsync.test', password: 'EdilSync!123' })}>
        Sign up
      </button>
      <button type="button" onClick={() => auth.logout()}>
        Logout
      </button>
      <button type="button" onClick={() => auth.navigateToLogin()}>
        Navigate login
      </button>
    </div>
  );
}

const renderAuthProvider = () => render(
  <AuthProvider>
    <AuthConsumer />
  </AuthProvider>,
);

const createDeferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return { promise, resolve, reject };
};

describe('AuthContext', () => {
  beforeEach(() => {
    resetAuthState();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('bootstraps the authenticated user on mount when appClient.auth.me succeeds', async () => {
    authState.me.mockResolvedValue({ email: 'qa-authenticated@edilsync.test' });

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated').textContent).toBe('yes');
    });
    expect(screen.getByTestId('user-email').textContent).toBe('qa-authenticated@edilsync.test');
    expect(screen.getByTestId('error-type').textContent).toBe('none');
  });

  it('marks the session as unauthenticated when the initial auth check fails', async () => {
    authState.me.mockRejectedValue(new Error('auth required'));

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated').textContent).toBe('no');
    });
    expect(screen.getByTestId('error-type').textContent).toBe('auth_required');
  });

  it('updates user state after sign in with password', async () => {
    const user = userEvent.setup();
    authState.me.mockRejectedValueOnce(new Error('auth required'));
    authState.signInWithPassword.mockResolvedValue({ email: 'qa-login@edilsync.test' });

    renderAuthProvider();

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated').textContent).toBe('yes');
    });
    expect(screen.getByTestId('user-email').textContent).toBe('qa-login@edilsync.test');
    expect(authState.signInWithPassword).toHaveBeenCalledWith({
      email: 'qa-login@edilsync.test',
      password: 'EdilSync!123',
    });
  });

  it('hydrates the user after sign up when email confirmation is not required', async () => {
    const user = userEvent.setup();
    authState.me.mockRejectedValueOnce(new Error('auth required'));
    authState.signUpWithPassword.mockResolvedValue({ requiresEmailConfirmation: false });
    authState.me.mockResolvedValueOnce({ email: 'qa-signup@edilsync.test' });

    renderAuthProvider();

    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated').textContent).toBe('yes');
    });
    expect(screen.getByTestId('user-email').textContent).toBe('qa-signup@edilsync.test');
  });

  it('keeps the user unauthenticated after sign up when email confirmation is required', async () => {
    const user = userEvent.setup();
    authState.me.mockRejectedValueOnce(new Error('auth required'));
    authState.signUpWithPassword.mockResolvedValue({ requiresEmailConfirmation: true });

    renderAuthProvider();

    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    await waitFor(() => {
      expect(authState.signUpWithPassword).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByTestId('is-authenticated').textContent).toBe('no');
  });

  it('clears local auth state and delegates logout with redirect url', async () => {
    const user = userEvent.setup();
    authState.me.mockResolvedValue({ email: 'qa-authenticated@edilsync.test' });

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated').textContent).toBe('yes');
    });

    await user.click(screen.getByRole('button', { name: 'Logout' }));

    expect(screen.getByTestId('is-authenticated').textContent).toBe('no');
    expect(screen.getByTestId('user-email').textContent).toBe('none');
    expect(authState.logout).toHaveBeenCalledWith(window.location.href);
  });

  it('reacts to SIGNED_OUT auth events by resetting the session state', async () => {
    authState.me.mockResolvedValue({ email: 'qa-authenticated@edilsync.test' });

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated').textContent).toBe('yes');
    });

    authState.authCallback?.('SIGNED_OUT', null);

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated').textContent).toBe('no');
    });
    expect(screen.getByTestId('error-type').textContent).toBe('auth_required');
  });

  it('does not let a stale initial auth failure override a later successful sign in', async () => {
    const user = userEvent.setup();
    const initialAuthCheck = createDeferred();

    authState.me.mockImplementationOnce(() => initialAuthCheck.promise);
    authState.signInWithPassword.mockResolvedValue({ email: 'qa-login@edilsync.test' });

    renderAuthProvider();

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated').textContent).toBe('yes');
    });

    initialAuthCheck.reject(new Error('auth required'));

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated').textContent).toBe('yes');
    });
    expect(screen.getByTestId('user-email').textContent).toBe('qa-login@edilsync.test');
    expect(screen.getByTestId('error-type').textContent).toBe('none');
  });

  it('preserves the active session when a silent auth refresh fails', async () => {
    authState.me.mockResolvedValueOnce({ email: 'qa-authenticated@edilsync.test' });

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated').textContent).toBe('yes');
    });

    authState.me.mockRejectedValueOnce(new Error('temporary auth lookup failure'));
    authState.authCallback?.('USER_UPDATED', { user: { id: 'qa-user-id' } });

    await waitFor(() => {
      expect(authState.me).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByTestId('is-authenticated').textContent).toBe('yes');
    expect(screen.getByTestId('user-email').textContent).toBe('qa-authenticated@edilsync.test');
    expect(screen.getByTestId('error-type').textContent).toBe('none');
  });
});