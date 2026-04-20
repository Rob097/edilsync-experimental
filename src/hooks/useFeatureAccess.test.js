import { describe, expect, it, vi } from 'vitest';

// Scenario IDs: pricing.feature-access.enabled-limited-disabled, pricing.sponsor-loss.transitions-to-blocked-state

vi.mock('@/api/appClient', () => ({
  appClient: {
    rpc: vi.fn(),
  },
}));

import {
  DEFAULT_FEATURE_ACCESS,
  DEFAULT_PROJECT_PRICING_STATUS,
  isFeatureAccessible,
  isFeatureFullyEnabled,
  isFeatureLimited,
  isProjectBlockedForSponsorLoss,
  toFeatureMap,
} from './useFeatureAccess';

describe('useFeatureAccess helpers', () => {
  it('builds a stable feature map and backfills missing results with disabled defaults', () => {
    const featureMap = toFeatureMap(
      ['company_chat', 'project_finance', 'missing_feature'],
      [
        {
          feature_key: 'company_chat',
          scope_type: 'company',
          plan_code: 'free',
          access_level: 'limited',
          config: { allowed_channels: ['general'] },
        },
        {
          feature_key: 'project_finance',
          scope_type: 'project',
          plan_code: 'paid',
          access_level: 'enabled',
          config: {},
        },
      ],
    );

    expect(featureMap.company_chat).toMatchObject({
      feature_key: 'company_chat',
      scope_type: 'company',
      plan_code: 'free',
      access_level: 'limited',
    });
    expect(featureMap.project_finance).toMatchObject({
      feature_key: 'project_finance',
      scope_type: 'project',
      plan_code: 'paid',
      access_level: 'enabled',
    });
    expect(featureMap.missing_feature).toEqual({
      ...DEFAULT_FEATURE_ACCESS,
      feature_key: 'missing_feature',
    });
  });

  it('classifies feature access levels consistently', () => {
    expect(isFeatureAccessible({ access_level: 'enabled' })).toBe(true);
    expect(isFeatureAccessible({ access_level: 'limited' })).toBe(true);
    expect(isFeatureAccessible({ access_level: 'disabled' })).toBe(false);
    expect(isFeatureAccessible(null)).toBe(false);

    expect(isFeatureFullyEnabled({ access_level: 'enabled' })).toBe(true);
    expect(isFeatureFullyEnabled({ access_level: 'limited' })).toBe(false);
    expect(isFeatureFullyEnabled(undefined)).toBe(false);

    expect(isFeatureLimited({ access_level: 'limited' })).toBe(true);
    expect(isFeatureLimited({ access_level: 'enabled' })).toBe(false);
    expect(isFeatureLimited(undefined)).toBe(false);
  });

  it('detects projects blocked for sponsor loss and keeps sane defaults', () => {
    expect(isProjectBlockedForSponsorLoss({ status: 'blocked_for_sponsor_loss' })).toBe(true);
    expect(isProjectBlockedForSponsorLoss({ status: 'sponsored' })).toBe(false);
    expect(isProjectBlockedForSponsorLoss(DEFAULT_PROJECT_PRICING_STATUS)).toBe(false);

    expect(DEFAULT_PROJECT_PRICING_STATUS).toMatchObject({
      status: 'unsponsored',
      is_sponsored: false,
      premium_visibility_mode: 'visible_locked',
      can_only_invite_companies: false,
    });
  });
});