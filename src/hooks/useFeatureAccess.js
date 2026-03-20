import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';

const DEFAULT_FEATURE_ACCESS = {
  feature_key: null,
  scope_type: null,
  plan_code: 'free',
  access_level: 'disabled',
  config: {},
};

const toFeatureMap = (featureKeys = [], results = []) => {
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