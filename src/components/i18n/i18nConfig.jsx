import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import completeIt from '../../../i18n/complete/it.json';
import completeEn from '../../../i18n/complete/en.json';
import completeDe from '../../../i18n/complete/de.json';
import operationalIt from '../../../i18n/operational/it.json';
import operationalEn from '../../../i18n/operational/en.json';
import operationalDe from '../../../i18n/operational/de.json';
import publicIt from '../../../i18n/public/it.json';
import publicEn from '../../../i18n/public/en.json';
import publicDe from '../../../i18n/public/de.json';
import { getFallbackLocales, SUPPORTED_LOCALE_CODES } from '@/components/i18n/localeConfig';

const mergeTranslationResources = (...parts) => Object.assign({}, ...parts);

const composeLocaleResources = (completeTranslations, operationalTranslations, publicTranslations = {}) => (
  mergeTranslationResources(
    completeTranslations,
    operationalTranslations,
    { publicHome: publicTranslations.home || {} },
  )
);

const resources = {
  it: {
    translation: composeLocaleResources(completeIt, operationalIt, publicIt),
  },
  en: {
    translation: composeLocaleResources(completeEn, operationalEn, publicEn),
  },
  de: {
    translation: composeLocaleResources(completeDe, operationalDe, publicDe),
  },
};

export const initializeI18n = ({ lng = 'it', useDetector = typeof window !== 'undefined' } = {}) => {
  if (i18next.isInitialized) return Promise.resolve(i18next);

  const instance = useDetector
    ? i18next.use(LanguageDetector)
    : i18next;

  return instance
    .use(initReactI18next)
    .init({
      resources,
      supportedLngs: SUPPORTED_LOCALE_CODES,
      nonExplicitSupportedLngs: true,
      load: 'languageOnly',
      fallbackLng: getFallbackLocales,
      lng: useDetector ? undefined : lng,
      ns: ['translation'],
      defaultNS: 'translation',
      interpolation: {
        escapeValue: false,
      },
      detection: useDetector ? {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
      } : undefined,
    });
};

export default i18next;
