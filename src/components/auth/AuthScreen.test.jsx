/** @vitest-environment jsdom */

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

// Scenario IDs: auth.public-cta-opens-signup, auth.signup-confirmation-notice-persists

const authScreenState = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUpWithPassword: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({
    signInWithPassword: authScreenState.signInWithPassword,
    signUpWithPassword: authScreenState.signUpWithPassword,
  }),
}));

vi.mock('@/components/i18n/useLanguage', () => ({
  useLanguage: () => ({
    t: (key) => ({
      'authScreen.title': 'Sign in to EdilSync',
      'authScreen.description': 'Use email and password. Google sign-in will be available later.',
      'authScreen.signInTab': 'Sign in',
      'authScreen.signUpTab': 'Sign up',
      'authScreen.email': 'Email',
      'authScreen.password': 'Password',
      'authScreen.confirmPassword': 'Confirm password',
      'authScreen.signIn': 'Sign in',
      'authScreen.signUp': 'Create account',
      'authScreen.googleComingSoon': 'Continue with Google (coming soon)',
      'authScreen.signInSuccess': 'Signed in successfully',
      'authScreen.invalidCredentials': 'Invalid credentials',
      'authScreen.passwordMismatch': 'Passwords do not match',
      'authScreen.confirmationNoticeTitle': 'Check your email',
      'authScreen.confirmationNoticeHint': 'We sent you a link to confirm the account.',
      'authScreen.confirmationNoticeFollowUp': 'After confirming, come back here and sign in with your email and password.',
      'authScreen.signUpConfirmationRequired': 'Registration complete. Check your email to confirm the account.',
      'authScreen.signUpSuccess': 'Account created successfully',
      'authScreen.signUpError': 'Unable to complete registration',
      'authScreen.googleUnavailable': 'Google sign-in is not available yet',
    }[key] || key),
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: authScreenState.toastSuccess,
    error: authScreenState.toastError,
    info: vi.fn(),
  },
}));

import AuthScreen from './AuthScreen';

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location-search">{location.search}</div>;
}

function renderAuthScreen(initialEntry = '/app') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/app"
          element={(
            <>
              <AuthScreen />
              <LocationProbe />
            </>
          )}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AuthScreen', () => {
  beforeEach(() => {
    authScreenState.signInWithPassword.mockReset();
    authScreenState.signUpWithPassword.mockReset();
    authScreenState.toastSuccess.mockReset();
    authScreenState.toastError.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('opens the sign up tab when the route requests signup intent', async () => {
    renderAuthScreen('/app?auth=signup');

    expect(await screen.findByLabelText('Confirm password')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Sign up' }).getAttribute('data-state')).toBe('active');
  });

  it('returns to sign in with a persistent confirmation notice after sign up', async () => {
    const user = userEvent.setup();
    authScreenState.signUpWithPassword.mockResolvedValue({ requiresEmailConfirmation: true });

    renderAuthScreen('/app?auth=signup');

    await user.type(await screen.findByLabelText('Email'), 'qa-signup@edilsync.test');
    await user.type(screen.getByLabelText('Password'), 'EdilSync!123');
    await user.type(screen.getByLabelText('Confirm password'), 'EdilSync!123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(authScreenState.signUpWithPassword).toHaveBeenCalledWith({
        email: 'qa-signup@edilsync.test',
        password: 'EdilSync!123',
      });
    });

    expect(await screen.findByText('Check your email')).toBeTruthy();
    expect(screen.getByText('qa-signup@edilsync.test')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Sign in' }).getAttribute('data-state')).toBe('active');
    expect(screen.getByLabelText('Email').value).toBe('qa-signup@edilsync.test');
    expect(screen.getByTestId('location-search').textContent).toBe('?notice=confirm-email&email=qa-signup%40edilsync.test');
    expect(authScreenState.toastSuccess).toHaveBeenCalledWith('Registration complete. Check your email to confirm the account.');
  });
});