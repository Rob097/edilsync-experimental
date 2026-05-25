import completeEn from '../../i18n/complete/en.json';
import completeDe from '../../i18n/complete/de.json';
import completeIt from '../../i18n/complete/it.json';
import { normalizeLocale } from '@/components/i18n/localeConfig';
import { UI_MODES, isOperationalPath } from './ui-mode';

const assistantContextCopyByLanguage = {
  it: completeIt.completeScoped.lib_assistantContext,
  en: completeEn.completeScoped.lib_assistantContext,
  de: completeDe.completeScoped?.lib_assistantContext || completeEn.completeScoped.lib_assistantContext,
};

const getAssistantContextCopy = (currentLanguage = 'it') => {
  const normalizedLanguage = normalizeLocale(currentLanguage);
  return assistantContextCopyByLanguage[normalizedLanguage] || assistantContextCopyByLanguage.en || assistantContextCopyByLanguage.it;
};

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
  const copy = getAssistantContextCopy(currentLanguage);

  if (!context?.type) {
    return copy.unavailable;
  }

  if (context.type === 'company' && metadata?.companyName) {
    return metadata.companyName;
  }

  const dictionary = {
    personal: copy.personal,
    company: copy.company,
    project: copy.project,
  };

  return dictionary[context.type] || context.type;
}