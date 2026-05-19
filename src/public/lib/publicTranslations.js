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
import publicIt from '@i18n/public/it.json';
import publicEn from '@i18n/public/en.json';

const PUBLIC_TRANSLATIONS_BY_LOCALE = {
  it: publicIt,
  en: publicEn,
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

const normalizeLocale = (locale) => (locale === 'en' ? 'en' : 'it');

const reviveIcons = (value) => {
  if (Array.isArray(value)) {
    return value.map(reviveIcons);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const revivedEntries = Object.entries(value).map(([key, entryValue]) => {
    if (key === 'icon' && typeof entryValue === 'string' && PUBLIC_ICON_BY_NAME[entryValue]) {
      return [key, PUBLIC_ICON_BY_NAME[entryValue]];
    }

    return [key, reviveIcons(entryValue)];
  });

  return Object.fromEntries(revivedEntries);
};

export const getPublicTranslations = (locale = 'it') => {
  const safeLocale = normalizeLocale(locale);
  return PUBLIC_TRANSLATIONS_BY_LOCALE[safeLocale] || PUBLIC_TRANSLATIONS_BY_LOCALE.it;
};

export const getPublicCopy = (locale = 'it', group) => {
  const safeLocale = normalizeLocale(locale);
  const cacheKey = `${safeLocale}:${group}`;

  if (!revivedGroupCache.has(cacheKey)) {
    const localizedGroup = getPublicTranslations(safeLocale)[group] || getPublicTranslations('it')[group];
    revivedGroupCache.set(cacheKey, reviveIcons(localizedGroup));
  }

  return revivedGroupCache.get(cacheKey);
};