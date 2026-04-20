import { describe, expect, it } from 'vitest';
import { assertNoFrontendSecrets } from './frontend-env';

// Scenario IDs: public.pricing-copy-matches-real-billing-model

describe('frontend-env', () => {
  it('accepts public Vite variables from the allowlist', () => {
    expect(() =>
      assertNoFrontendSecrets({
        VITE_SUPABASE_URL: 'https://example.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'anon-key',
        VITE_APP_BASE_URL: 'https://app.edilsync.test',
      })).not.toThrow();
  });

  it('ignores non-VITE keys and safe frontend keys', () => {
    expect(() =>
      assertNoFrontendSecrets({
        SUPABASE_SERVICE_ROLE_KEY: 'server-only',
        VITE_FUNCTIONS_VERSION: '2026-04-10',
        VITE_PUBLIC_THEME: 'construction',
      })).not.toThrow();
  });

  it('throws when secret-like Vite variables are exposed to the browser', () => {
    expect(() =>
      assertNoFrontendSecrets({
        VITE_SUPABASE_URL: 'https://example.supabase.co',
        VITE_SERVICE_ROLE: 'danger',
        VITE_INTERNAL_ACCESS_TOKEN: 'danger-too',
      })).toThrow(/VITE_SERVICE_ROLE, VITE_INTERNAL_ACCESS_TOKEN/);
  });
});