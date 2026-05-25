import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getLocaleConfig, normalizeLocale } from '@/components/i18n/localeConfig';

export const useLanguage = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng) => {
    const normalized = normalizeLocale(lng);
    i18n.changeLanguage(normalized);
    localStorage.setItem('language', normalized);
    localStorage.setItem('i18nextLng', normalized);
  };

  const currentLanguage = normalizeLocale(i18n.resolvedLanguage || i18n.language);
  const localeConfig = getLocaleConfig(currentLanguage);

  useEffect(() => {
    const detected = localStorage.getItem('i18nextLng');
    if (!detected) {
      localStorage.setItem('i18nextLng', currentLanguage || 'it');
    }
  }, [currentLanguage]);

  const formatDate = (date, format = 'short') => {
    if (!date) return '';

    const d = new Date(date);
    const locale = localeConfig.appLocale;

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