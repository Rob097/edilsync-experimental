import { describe, expect, it } from 'vitest';
import { canManageProjectFinancials, getProjectFinancialPermissions } from './financePermissions';

describe('canManageProjectFinancials', () => {
  it('returns false for inactive participants', () => {
    expect(canManageProjectFinancials({
      isActiveParticipant: false,
      participantType: 'personal',
      projectRole: 'homeowner',
    })).toBe(false);
  });

  it('returns read-only viewer permissions for active homeowner', () => {
    const permissions = getProjectFinancialPermissions({
      isActiveParticipant: true,
      participantType: 'personal',
      projectRole: 'homeowner',
    });

    expect(permissions.scope).toBe('viewer');
    expect(permissions.canViewSection).toBe(true);
    expect(permissions.canViewBudget).toBe(true);
    expect(permissions.canViewCosts).toBe(true);
    expect(permissions.canViewProgress).toBe(true);
    expect(permissions.canViewRates).toBe(false);
    expect(canManageProjectFinancials({
      isActiveParticipant: true,
      projectRole: 'contractor',
      participantType: 'personal',
    })).toBe(true);
  });

  it('returns full manager permissions for contractor admins', () => {
    const permissions = getProjectFinancialPermissions({
      isActiveParticipant: true,
      participantType: 'company',
      companyRole: 'admin',
      projectRole: 'contractor',
    });

    expect(permissions.scope).toBe('manager');
    expect(permissions.canManageBudget).toBe(true);
    expect(permissions.canManageRates).toBe(true);
    expect(permissions.canManageProgress).toBe(true);
    expect(permissions.canManageSettings).toBe(true);
  });

  it('returns contributor permissions for contractor company members', () => {
    const permissions = getProjectFinancialPermissions({
      isActiveParticipant: true,
      participantType: 'company',
      companyRole: 'member',
      projectRole: 'contractor',
    });

    expect(permissions.scope).toBe('contributor');
    expect(permissions.canViewSection).toBe(true);
    expect(permissions.canRecordCosts).toBe(true);
    expect(permissions.canSyncLabor).toBe(true);
    expect(permissions.canManageBudget).toBe(false);
    expect(permissions.canManageRates).toBe(false);
    expect(permissions.canManageSettings).toBe(false);
  });

  it('returns no finance access for unsupported external roles', () => {
    const permissions = getProjectFinancialPermissions({
      isActiveParticipant: true,
      participantType: 'company',
      companyRole: 'admin',
      projectRole: 'subcontractor',
    });

    expect(permissions.canViewSection).toBe(false);
    expect(canManageProjectFinancials({
      isActiveParticipant: true,
      participantType: 'company',
      companyRole: 'admin',
      projectRole: 'subcontractor',
    })).toBe(false);
  });
});
