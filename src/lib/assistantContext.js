import { UI_MODES, isOperationalPath } from './ui-mode';

const getOperationalProjectId = (pathname = '') => {
  const match = pathname.match(/^\/(?:app\/)?operativa\/progetto\/([^/?#]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
};

export function resolveAssistantChatScope({ user = null } = {}) {
  if (!user?.id) {
    return null;
  }

  if (user?.active_context === 'company' && user?.active_company_id) {
    return {
      type: 'company',
      id: user.active_company_id,
    };
  }

  return {
    type: 'personal',
    id: user.id,
  };
}

export function resolveAssistantContext({ pathname = '', search = '', user = null }) {
  const assistantChatScope = resolveAssistantChatScope({ user });
  if (!assistantChatScope) {
    return null;
  }

  const pageName = pathname.split('/').filter(Boolean).pop() || '';
  const params = new URLSearchParams(search || '');
  const projectId = getOperationalProjectId(pathname) || (pageName === 'ProjectDetail' ? params.get('id') : null);

  if (projectId) {
    return {
      type: 'project',
      id: projectId,
    };
  }

  return assistantChatScope;
}

export function resolveAssistantUiMode({ pathname = '' } = {}) {
  return isOperationalPath(pathname) ? UI_MODES.OPERATIONAL : UI_MODES.NORMAL;
}

export function describeAssistantContext(context, currentLanguage = 'it', metadata = {}) {
  if (!context?.type) {
    return currentLanguage === 'it' ? 'Contesto non disponibile' : 'Context unavailable';
  }

  if (context.type === 'company' && metadata?.companyName) {
    return metadata.companyName;
  }

  const dictionary = {
    personal: currentLanguage === 'it' ? 'Privato' : 'Private',
    company: currentLanguage === 'it' ? 'Societa' : 'Company',
    project: currentLanguage === 'it' ? 'Cantiere' : 'Worksite',
  };

  return dictionary[context.type] || context.type;
}