import { describe, expect, it } from 'vitest';

import { assertQaSupabaseUrl, extractSupabaseProjectRef, MAIN_PROJECT_REF, QA_PROJECT_REF } from './qa-target';

describe('qa-target helper', () => {
  it('extracts the project ref from a Supabase url', () => {
    expect(extractSupabaseProjectRef(`https://${QA_PROJECT_REF}.supabase.co`)).toBe(QA_PROJECT_REF);
  });

  it('returns null for invalid Supabase urls', () => {
    expect(extractSupabaseProjectRef('https://example.com')).toBeNull();
  });

  it('accepts the configured QA project ref', () => {
    expect(() => assertQaSupabaseUrl(`https://${QA_PROJECT_REF}.supabase.co`)).not.toThrow();
  });

  it('rejects the main production project ref', () => {
    expect(() => assertQaSupabaseUrl(`https://${MAIN_PROJECT_REF}.supabase.co`)).toThrow(/production\/main/);
  });
});