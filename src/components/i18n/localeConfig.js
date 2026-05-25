export const DEFAULT_LOCALE = 'it';

export const LOCALE_CONFIG = {
  it: {
    code: 'it',
    nativeLabel: 'Italiano',
    appLocale: 'it-IT',
    publicPrefix: '',
    hreflang: 'it',
    ogLocale: 'it_IT',
    readingTimeLocale: 'it-IT',
    isDefaultPublicLocale: true,
  },
  en: {
    code: 'en',
    nativeLabel: 'English',
    appLocale: 'en-US',
    publicPrefix: '/en',
    hreflang: 'en',
    ogLocale: 'en_US',
    readingTimeLocale: 'en-GB',
    isDefaultPublicLocale: false,
  },
  de: {
    code: 'de',
    nativeLabel: 'Deutsch',
    appLocale: 'de-DE',
    publicPrefix: '/de',
    hreflang: 'de',
    ogLocale: 'de_DE',
    readingTimeLocale: 'de-DE',
    isDefaultPublicLocale: false,
  },
};

export const SUPPORTED_LOCALE_CODES = Object.keys(LOCALE_CONFIG);

export const normalizeLocale = (lng) => {
  if (!lng || typeof lng !== 'string') {
    return DEFAULT_LOCALE;
  }

  const base = lng.toLowerCase().split('-')[0];
  return LOCALE_CONFIG[base] ? base : DEFAULT_LOCALE;
};

export const getLocaleConfig = (lng) => LOCALE_CONFIG[normalizeLocale(lng)];

export const getFallbackLocales = (lng) => {
  const normalized = normalizeLocale(lng);

  if (normalized === DEFAULT_LOCALE) {
    return [DEFAULT_LOCALE];
  }

  if (normalized === 'en') {
    return [DEFAULT_LOCALE];
  }

  return ['en', DEFAULT_LOCALE];
};

export const getAllLocaleConfigs = () => SUPPORTED_LOCALE_CODES.map((code) => LOCALE_CONFIG[code]);