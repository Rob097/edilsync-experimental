import {
  DEFAULT_LOCALE,
  getAllLocaleConfigs,
  getLocaleConfig,
  normalizeLocale,
} from '@/components/i18n/localeConfig';

const PUBLIC_LOCALE_CONFIGS = getAllLocaleConfigs();
const NON_DEFAULT_PUBLIC_LOCALES = PUBLIC_LOCALE_CONFIGS.filter(({ isDefaultPublicLocale }) => !isDefaultPublicLocale);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizePublicPath = (pathname = '') => {
  if (!pathname) {
    return '/';
  }

  return pathname.startsWith('/') ? pathname : `/${pathname}`;
};

export function detectPublicLocale(pathname = '') {
  const normalizedPath = normalizePublicPath(pathname);
  const matchedLocale = NON_DEFAULT_PUBLIC_LOCALES.find(({ publicPrefix }) => (
    normalizedPath === publicPrefix || normalizedPath.startsWith(`${publicPrefix}/`)
  ));

  return matchedLocale?.code || DEFAULT_LOCALE;
}

export function isLocalizedPublicPath(pathname = '', locale = DEFAULT_LOCALE) {
  return detectPublicLocale(pathname) === normalizeLocale(locale);
}

export function isEnglishPublicPath(pathname = '') {
  return isLocalizedPublicPath(pathname, 'en');
}

export function stripPublicLocalePrefix(pathname = '') {
  const normalizedPath = normalizePublicPath(pathname);
  const matchedLocale = detectPublicLocale(normalizedPath);
  const { publicPrefix } = getLocaleConfig(matchedLocale);

  if (!publicPrefix) {
    return normalizedPath;
  }

  const stripped = normalizedPath.replace(new RegExp(`^${escapeRegExp(publicPrefix)}(?=/|$)`), '');
  return stripped || '/';
}

export function getPublicBasePath(locale = DEFAULT_LOCALE) {
  return getLocaleConfig(locale).publicPrefix;
}

export function localizePublicPath(path, pathnameOrLanguage = DEFAULT_LOCALE) {
  const locale = typeof pathnameOrLanguage === 'string' && pathnameOrLanguage.startsWith('/')
    ? detectPublicLocale(pathnameOrLanguage)
    : normalizeLocale(pathnameOrLanguage);
  const normalizedPath = stripPublicLocalePrefix(normalizePublicPath(path));
  const basePath = getPublicBasePath(locale);

  if (!basePath) {
    return normalizedPath;
  }

  return normalizedPath === '/' ? basePath : `${basePath}${normalizedPath}`;
}

export function getPublicAlternatePaths(path) {
  const normalizedPath = stripPublicLocalePrefix(normalizePublicPath(path));

  return Object.fromEntries(
    PUBLIC_LOCALE_CONFIGS.map(({ code }) => [code, localizePublicPath(normalizedPath, code)])
  );
}

export function getPublicPageSeoData(locale, path) {
  const normalizedLocale = normalizeLocale(locale);

  return {
    locale: normalizedLocale,
    basePath: getPublicBasePath(normalizedLocale),
    canonicalPath: localizePublicPath(path, normalizedLocale),
    alternatePathsByLocale: getPublicAlternatePaths(path),
  };
}

export function getPublicLocaleVariant(locale, values = {}) {
  const normalizedLocale = normalizeLocale(locale);

  if (values[normalizedLocale] !== undefined) {
    return values[normalizedLocale];
  }

  if (normalizedLocale !== DEFAULT_LOCALE && values.en !== undefined) {
    return values.en;
  }

  if (values[DEFAULT_LOCALE] !== undefined) {
    return values[DEFAULT_LOCALE];
  }

  return Object.values(values)[0];
}