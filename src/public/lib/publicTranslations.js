import {
  ArrowRight,
  Bell,
  BellRing,
  Building2,
  CalendarDays,
  Camera,
  ChartNoAxesColumn,
  CheckCheck,
  CircleCheck,
  Clock3,
  Eye,
  FileText,
  FolderOpen,
  Globe,
  Layers,
  ListChecks,
  LockKeyhole,
  MessageCircle,
  MessagesSquare,
  Navigation,
  Scale,
  Shield,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import publicIt from '../../../i18n/public/it.json';
import publicEn from '../../../i18n/public/en.json';
import publicDe from '../../../i18n/public/de.json';
import { DEFAULT_LOCALE, getFallbackLocales, normalizeLocale } from '@/components/i18n/localeConfig';
import { localizePublicPath } from '@/public/lib/localePath';

const PUBLIC_TRANSLATIONS_BY_LOCALE = {
  it: publicIt,
  en: publicEn,
  de: publicDe,
};

const PUBLIC_ICON_BY_NAME = {
  ArrowRight,
  Bell,
  BellRing,
  Building2,
  CalendarDays,
  Camera,
  ChartNoAxesColumn,
  CheckCheck,
  CircleCheck,
  Clock3,
  Eye,
  FileText,
  FolderOpen,
  Globe,
  Layers,
  ListChecks,
  LockKeyhole,
  MessageCircle,
  MessagesSquare,
  Navigation,
  Scale,
  Shield,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  Zap,
};

const revivedGroupCache = new Map();

const mergeWithFallback = (primaryValue, fallbackValue) => {
  if (primaryValue === undefined) {
    return fallbackValue;
  }

  if (fallbackValue === undefined) {
    return primaryValue;
  }

  if (Array.isArray(primaryValue) || Array.isArray(fallbackValue)) {
    return primaryValue;
  }

  if (
    primaryValue &&
    fallbackValue &&
    typeof primaryValue === 'object' &&
    typeof fallbackValue === 'object'
  ) {
    const merged = { ...fallbackValue };

    Object.keys(primaryValue).forEach((key) => {
      merged[key] = mergeWithFallback(primaryValue[key], fallbackValue[key]);
    });

    return merged;
  }

  return primaryValue;
};

const reviveLocalizedEntries = (value, locale) => {
  if (Array.isArray(value)) {
    return value.map((entry) => reviveLocalizedEntries(entry, locale));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const revivedEntries = Object.entries(value).map(([key, entryValue]) => {
    if (key === 'icon' && typeof entryValue === 'string' && PUBLIC_ICON_BY_NAME[entryValue]) {
      return [key, PUBLIC_ICON_BY_NAME[entryValue]];
    }

    if (key === 'href' && typeof entryValue === 'string' && entryValue.startsWith('/')) {
      return [key, localizePublicPath(entryValue, locale)];
    }

    return [key, reviveLocalizedEntries(entryValue, locale)];
  });

  return Object.fromEntries(revivedEntries);
};

const getLocaleCandidates = (locale) => {
  const safeLocale = normalizeLocale(locale);
  return [safeLocale, ...getFallbackLocales(safeLocale)]
    .filter((candidate, index, values) => values.indexOf(candidate) === index);
};

const getMergedGroup = (locale, group) => (
  getLocaleCandidates(locale)
    .reverse()
    .reduce((mergedGroup, candidate) => {
      const candidateGroup = PUBLIC_TRANSLATIONS_BY_LOCALE[candidate]?.[group];
      return mergeWithFallback(candidateGroup, mergedGroup);
    }, undefined)
);

export const getPublicTranslations = (locale = DEFAULT_LOCALE) => {
  const safeLocale = normalizeLocale(locale);
  return PUBLIC_TRANSLATIONS_BY_LOCALE[safeLocale] || PUBLIC_TRANSLATIONS_BY_LOCALE[DEFAULT_LOCALE];
};

export const getPublicCopy = (locale = DEFAULT_LOCALE, group) => {
  const safeLocale = normalizeLocale(locale);
  const cacheKey = `${safeLocale}:${group}`;

  if (!revivedGroupCache.has(cacheKey)) {
    const localizedGroup = getMergedGroup(safeLocale, group) || getPublicTranslations(DEFAULT_LOCALE)[group];
    revivedGroupCache.set(cacheKey, reviveLocalizedEntries(localizedGroup, safeLocale));
  }

  return revivedGroupCache.get(cacheKey);
};