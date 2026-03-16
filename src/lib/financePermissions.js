const emptyPermissions = {
  scope: 'none',
  canViewSection: false,
  canViewBudget: false,
  canViewCosts: false,
  canViewRates: false,
  canViewProgress: false,
  canViewSettings: false,
  canManageBudget: false,
  canRecordCosts: false,
  canManageRates: false,
  canSyncLabor: false,
  canManageProgress: false,
  canManageSettings: false,
};

export const getProjectFinancialPermissions = ({
  isActiveParticipant,
  participantType,
  projectRole,
  companyRole,
}) => {
  if (!isActiveParticipant) return emptyPermissions;

  if (projectRole === 'homeowner') {
    return {
      ...emptyPermissions,
      scope: 'viewer',
      canViewSection: true,
      canViewBudget: true,
      canViewCosts: true,
      canViewProgress: true,
    };
  }

  if (projectRole !== 'contractor') {
    return emptyPermissions;
  }

  if (participantType === 'company' && companyRole === 'member') {
    return {
      ...emptyPermissions,
      scope: 'contributor',
      canViewSection: true,
      canViewBudget: true,
      canViewCosts: true,
      canViewRates: true,
      canViewProgress: true,
      canRecordCosts: true,
      canSyncLabor: true,
    };
  }

  return {
    scope: 'manager',
    canViewSection: true,
    canViewBudget: true,
    canViewCosts: true,
    canViewRates: true,
    canViewProgress: true,
    canViewSettings: true,
    canManageBudget: true,
    canRecordCosts: true,
    canManageRates: true,
    canSyncLabor: true,
    canManageProgress: true,
    canManageSettings: true,
  };
};

export const canManageProjectFinancials = (context) => {
  const permissions = getProjectFinancialPermissions(context);
  return Boolean(
    permissions.canManageBudget
    || permissions.canRecordCosts
    || permissions.canManageRates
    || permissions.canManageProgress
    || permissions.canManageSettings,
  );
};
