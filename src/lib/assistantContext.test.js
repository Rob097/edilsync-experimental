import { describe, expect, it } from 'vitest';

import { describeAssistantContext, resolveAssistantChatScope, resolveAssistantContext, resolveAssistantUiMode } from './assistantContext';

describe('assistantContext', () => {
  it('returns null when the current user is unavailable', () => {
    expect(resolveAssistantContext({ pathname: '/app/Dashboard', search: '', user: null })).toBeNull();
  });

  it('derives the assistant chat scope from the active user context', () => {
    expect(resolveAssistantChatScope({ user: { id: 'user-1', active_context: 'company', active_company_id: 'company-1' } })).toEqual({
      type: 'company',
      id: 'company-1',
    });

    expect(resolveAssistantChatScope({ user: { id: 'user-1', active_context: 'personal', active_company_id: 'company-1' } })).toEqual({
      type: 'personal',
      id: 'user-1',
    });
  });

  it('uses the project route id on project detail pages', () => {
    expect(resolveAssistantContext({
      pathname: '/app/ProjectDetail',
      search: '?id=project-123&tab=info',
      user: { id: 'user-1', active_context: 'company', active_company_id: 'company-1' },
    })).toEqual({
      type: 'project',
      id: 'project-123',
    });
  });

  it('uses the operational project route id in operational mode', () => {
    expect(resolveAssistantContext({
      pathname: '/app/operativa/progetto/project-789',
      search: '',
      user: { id: 'user-1', active_context: 'company', active_company_id: 'company-1' },
    })).toEqual({
      type: 'project',
      id: 'project-789',
    });
  });

  it('falls back to the active company on non-project pages in company mode', () => {
    expect(resolveAssistantContext({
      pathname: '/app/Dashboard',
      search: '',
      user: { id: 'user-1', active_context: 'company', active_company_id: 'company-1' },
    })).toEqual({
      type: 'company',
      id: 'company-1',
    });
  });

  it('falls back to the personal user scope outside company mode', () => {
    expect(resolveAssistantContext({
      pathname: '/app/CompanyDetail',
      search: '?id=company-9',
      user: { id: 'user-1', active_context: 'personal', active_company_id: 'company-9' },
    })).toEqual({
      type: 'personal',
      id: 'user-1',
    });
  });

  it('describes assistant context labels in the current language', () => {
    expect(describeAssistantContext({ type: 'project' }, 'it')).toBe('Cantiere');
    expect(describeAssistantContext({ type: 'company' }, 'en')).toBe('Company');
  });

  it('resolves the assistant UI mode from the current route', () => {
    expect(resolveAssistantUiMode({ pathname: '/app/Dashboard' })).toBe('normal');
    expect(resolveAssistantUiMode({ pathname: '/app/operativa/progetto/project-789' })).toBe('operational');
  });
});