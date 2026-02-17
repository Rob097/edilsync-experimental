import { useTranslation } from 'react-i18next';

export const useLanguage = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const currentLanguage = i18n.language || 'it';

  const formatDate = (date, format = 'short') => {
    if (!date) return '';

    const d = new Date(date);
    const locale = currentLanguage === 'it' ? 'it-IT' : 'en-US';

    if (format === 'short') {
      return d.toLocaleDateString(locale);
    } else if (format === 'long') {
      return d.toLocaleDateString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } else if (format === 'time') {
      return d.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (format === 'datetime') {
      return d.toLocaleDateString(locale) + ' ' + d.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    
    return d.toLocaleDateString(locale);
  };

  return {
    t,
    i18n,
    currentLanguage,
    changeLanguage,
    formatDate,
  };
};