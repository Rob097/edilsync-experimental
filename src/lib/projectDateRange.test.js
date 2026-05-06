import { describe, expect, it } from 'vitest';

import { hasInvalidProjectDateRange } from './projectDateRange';

describe('hasInvalidProjectDateRange', () => {
  it('returns true only when end date is earlier than start date', () => {
    expect(hasInvalidProjectDateRange('2026-05-20', '2026-05-10')).toBe(true);
    expect(hasInvalidProjectDateRange('2026-05-20', '2026-05-20')).toBe(false);
    expect(hasInvalidProjectDateRange('2026-05-10', '2026-05-20')).toBe(false);
    expect(hasInvalidProjectDateRange('', '2026-05-20')).toBe(false);
    expect(hasInvalidProjectDateRange('2026-05-20', '')).toBe(false);
  });
});