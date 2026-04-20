import { describe, expect, it } from 'vitest';

// Scenario IDs: project.participant.enforces-company-type-role-compatibility

import {
  APPLICATION_ROLES,
  COMPANY_MEMBER_ROLES,
  COMPANY_TYPES,
  PROJECT_PARTICIPATION_ROLES,
  getCompanyMemberRoleLabel,
  getCompanyMemberRoleOptions,
  getCompanyTypeLabel,
  getCompanyTypeOptions,
  getCompatibleProjectRolesForCompanyType,
  getProjectRoleLabel,
  getProjectRoleOptions,
  isCompanyTypeCompatibleWithProjectRole,
} from './domainRoles';

describe('domainRoles', () => {
  it('exposes the expected role catalogs', () => {
    expect(APPLICATION_ROLES).toEqual(['admin', 'normal']);
    expect(COMPANY_TYPES).toContain('general_contractor');
    expect(COMPANY_TYPES).toContain('plumbing_hvac');
    expect(COMPANY_MEMBER_ROLES).toContain('owner_admin');
    expect(COMPANY_MEMBER_ROLES).toContain('worker');
    expect(PROJECT_PARTICIPATION_ROLES).toContain('homeowner');
    expect(PROJECT_PARTICIPATION_ROLES).toContain('supplier');
  });

  it('returns localized labels and falls back safely for unknown values', () => {
    expect(getCompanyTypeLabel('general_contractor', 'it')).toBe('Impresa generale di costruzioni');
    expect(getCompanyTypeLabel('general_contractor', 'en')).toBe('General contractor');
    expect(getCompanyTypeLabel('general_contractor', 'fr')).toBe('General contractor');
    expect(getCompanyTypeLabel('unknown_type', 'it')).toBe('unknown_type');

    expect(getCompanyMemberRoleLabel('owner_admin', 'it')).toBe('Titolare / Amministratore');
    expect(getCompanyMemberRoleLabel('worker', 'en')).toBe('Worker');
    expect(getCompanyMemberRoleLabel('unknown_role', 'it')).toBe('unknown_role');

    expect(getProjectRoleLabel('homeowner', 'it')).toBe('Committente');
    expect(getProjectRoleLabel('architect', 'en')).toBe('Architect');
    expect(getProjectRoleLabel('unknown_project_role', 'en')).toBe('unknown_project_role');
  });

  it('builds options from the canonical catalogs', () => {
    const companyTypeOptions = getCompanyTypeOptions('it');
    const memberRoleOptions = getCompanyMemberRoleOptions('en');
    const projectRoleOptions = getProjectRoleOptions('it');

    expect(companyTypeOptions).toHaveLength(COMPANY_TYPES.length);
    expect(companyTypeOptions[0]).toEqual({
      value: COMPANY_TYPES[0],
      label: getCompanyTypeLabel(COMPANY_TYPES[0], 'it'),
    });

    expect(memberRoleOptions).toHaveLength(COMPANY_MEMBER_ROLES.length);
    expect(memberRoleOptions.at(-1)).toEqual({
      value: COMPANY_MEMBER_ROLES.at(-1),
      label: getCompanyMemberRoleLabel(COMPANY_MEMBER_ROLES.at(-1), 'en'),
    });

    expect(projectRoleOptions).toHaveLength(PROJECT_PARTICIPATION_ROLES.length);
    expect(projectRoleOptions.find((option) => option.value === 'homeowner')).toEqual({
      value: 'homeowner',
      label: 'Committente',
    });
  });

  it('resolves compatible project roles by company type', () => {
    expect(getCompatibleProjectRolesForCompanyType()).toEqual(PROJECT_PARTICIPATION_ROLES);
    expect(getCompatibleProjectRolesForCompanyType('unknown')).toEqual(PROJECT_PARTICIPATION_ROLES);
    expect(getCompatibleProjectRolesForCompanyType('plumbing_hvac')).toEqual(['subcontractor']);
    expect(getCompatibleProjectRolesForCompanyType('restoration')).toEqual(['subcontractor', 'consultant']);
    expect(getCompatibleProjectRolesForCompanyType('architecture_studio')).toEqual(['architect', 'consultant']);
    expect(getCompatibleProjectRolesForCompanyType('supplier')).toEqual(['supplier']);
  });

  it('checks company type and project role compatibility correctly', () => {
    expect(isCompanyTypeCompatibleWithProjectRole('architecture_studio', 'architect')).toBe(true);
    expect(isCompanyTypeCompatibleWithProjectRole('architecture_studio', 'consultant')).toBe(true);
    expect(isCompanyTypeCompatibleWithProjectRole('architecture_studio', 'contractor')).toBe(false);
    expect(isCompanyTypeCompatibleWithProjectRole('supplier', 'supplier')).toBe(true);
    expect(isCompanyTypeCompatibleWithProjectRole('supplier', 'subcontractor')).toBe(false);
    expect(isCompanyTypeCompatibleWithProjectRole('other', 'engineer')).toBe(true);
  });
});