import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import completeIt from '@i18n/complete/it.json';
import completeEn from '@i18n/complete/en.json';
import operationalIt from '@i18n/operational/it.json';
import operationalEn from '@i18n/operational/en.json';
import publicIt from '@i18n/public/it.json';
import publicEn from '@i18n/public/en.json';

const mergeTranslationResources = (...parts) => Object.assign({}, ...parts);

const resources = {
  it: {
    translation: mergeTranslationResources(
      completeIt,
      operationalIt,
      { publicHome: publicIt.home },
    ),
  },
  en: {
    translation: mergeTranslationResources(
      completeEn,
      operationalEn,
      { publicHome: publicEn.home },
    ),
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
      supportedLngs: ['it', 'en'],
      nonExplicitSupportedLngs: true,
      load: 'languageOnly',
      fallbackLng: 'it',
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
