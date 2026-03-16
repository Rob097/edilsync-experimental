import { describe, expect, it } from 'vitest';
import { computeLaborSyncCandidates, parseHours, pickRate, toDateOnly } from './financeUtils';

describe('financeUtils', () => {
  it('toDateOnly returns yyyy-mm-dd for valid dates', () => {
    expect(toDateOnly('2026-03-10T08:15:00.000Z')).toBe('2026-03-10');
    expect(toDateOnly('invalid')).toBeNull();
  });

  it('parseHours computes positive hours only', () => {
    expect(parseHours({ started_at: '2026-03-10T08:00:00.000Z', ended_at: '2026-03-10T11:30:00.000Z' })).toBe(3.5);
    expect(parseHours({ started_at: '2026-03-10T11:00:00.000Z', ended_at: '2026-03-10T10:00:00.000Z' })).toBe(0);
    expect(parseHours({ started_at: null, ended_at: '2026-03-10T10:00:00.000Z' })).toBe(0);
  });

  it('pickRate prioritizes user-specific and most recent valid_from', () => {
    const rates = [
      { company_id: 'c1', hourly_cost: 20, valid_from: '2026-01-01', valid_to: null },
      { company_id: 'c1', user_email: 'worker@acme.it', hourly_cost: 35, valid_from: '2026-02-01', valid_to: null },
      { company_id: 'c1', user_email: 'worker@acme.it', hourly_cost: 30, valid_from: '2026-01-15', valid_to: null },
    ];

    const picked = pickRate(rates, '2026-03-10T08:00:00.000Z', 'c1', 'worker@acme.it');
    expect(picked.hourly_cost).toBe(35);
  });

  it('computeLaborSyncCandidates creates only unsynced valid candidates', () => {
    const workSessions = [
      {
        id: 'ws1',
        company_id: 'c1',
        user_email: 'worker@acme.it',
        started_at: '2026-03-10T08:00:00.000Z',
        ended_at: '2026-03-10T10:00:00.000Z',
      },
      {
        id: 'ws2',
        company_id: 'c1',
        user_email: 'worker@acme.it',
        started_at: '2026-03-10T10:00:00.000Z',
        ended_at: null,
      },
    ];

    const costEntries = [
      { source_type: 'work_session', source_id: 'already-synced' },
    ];

    const laborRates = [
      { company_id: 'c1', user_email: 'worker@acme.it', hourly_cost: 32, valid_from: '2026-01-01', valid_to: null },
    ];

    const candidates = computeLaborSyncCandidates({
      workSessions,
      costEntries,
      laborRates,
      projectId: 'p1',
      description: 'Sync labor costs',
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      project_id: 'p1',
      source_type: 'work_session',
      source_id: 'ws1',
      amount: 64,
      quantity: 2,
      unit_cost: 32,
    });
  });
});
