import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';

export const DEFAULT_FEATURE_ACCESS = {
  feature_key: null,
  scope_type: null,
  plan_code: 'free',
  access_level: 'disabled',
  config: {},
};

export const DEFAULT_PROJECT_PRICING_STATUS = {
  project_id: null,
  status: 'unsponsored',
  is_sponsored: false,
  sponsor_company_id: null,
  has_sponsorship_history: false,
  has_other_unsponsored_owned_project: false,
  premium_visibility_mode: 'visible_locked',
  can_only_invite_companies: false,
  reason_code: null,
};

export const toFeatureMap = (featureKeys = [], results = []) => {
  const map = {};
  featureKeys.forEach((featureKey, index) => {
    map[featureKey] = results[index] || {
      ...DEFAULT_FEATURE_ACCESS,
      feature_key: featureKey,
    };
  });
  return map;
};

export const isFeatureAccessible = (featureAccess) => {
  const accessLevel = featureAccess?.access_level;
  return accessLevel === 'enabled' || accessLevel === 'limited';
};

export const isFeatureFullyEnabled = (featureAccess) => featureAccess?.access_level === 'enabled';

export const isFeatureLimited = (featureAccess) => featureAccess?.access_level === 'limited';

export const isProjectBlockedForSponsorLoss = (projectPricingStatus) => projectPricingStatus?.status === 'blocked_for_sponsor_loss';

const useScopedFeatureAccess = ({ scopeType, scopeId, featureKeys = [], enabled = true }) => {
  const normalizedFeatureKeys = useMemo(
    () => [...new Set(featureKeys.filter(Boolean))],
    [featureKeys],
  );

  const query = useQuery({
    queryKey: ['featureAccess', scopeType, scopeId, normalizedFeatureKeys],
    queryFn: async () => {
      if (!scopeId || normalizedFeatureKeys.length === 0) return [];

      const rpcName = scopeType === 'company'
        ? 'resolve_company_feature_access'
        : 'resolve_project_feature_access';

      return Promise.all(
        normalizedFeatureKeys.map((featureKey) => appClient.rpc(
          rpcName,
          scopeType === 'company'
            ? { target_company_id: scopeId, target_feature_key: featureKey }
            : { target_project_id: scopeId, target_feature_key: featureKey },
        )),
      );
    },
    enabled: enabled && !!scopeId && normalizedFeatureKeys.length > 0,
    staleTime: 60 * 1000,
  });

  return {
    ...query,
    featureMap: toFeatureMap(normalizedFeatureKeys, query.data || []),
  };
};

export const useProjectFeatureAccess = (projectId, featureKeys = [], options = {}) => useScopedFeatureAccess({
  scopeType: 'project',
  scopeId: projectId,
  featureKeys,
  enabled: options.enabled ?? true,
});

export const useCompanyFeatureAccess = (companyId, featureKeys = [], options = {}) => useScopedFeatureAccess({
  scopeType: 'company',
  scopeId: companyId,
  featureKeys,
  enabled: options.enabled ?? true,
});

export const useProjectPricingStatus = (projectId, options = {}) => {
  const query = useQuery({
    queryKey: ['projectPricingStatus', projectId],
    queryFn: async () => {
      if (!projectId) {
        return DEFAULT_PROJECT_PRICING_STATUS;
      }

      const result = await appClient.rpc('resolve_project_pricing_status', {
        target_project_id: projectId,
      });

      return {
        ...DEFAULT_PROJECT_PRICING_STATUS,
        ...(result || {}),
      };
    },
    enabled: (options.enabled ?? true) && !!projectId,
    staleTime: 60 * 1000,
  });

  return {
    ...query,
    projectPricingStatus: query.data || DEFAULT_PROJECT_PRICING_STATUS,
  };
};