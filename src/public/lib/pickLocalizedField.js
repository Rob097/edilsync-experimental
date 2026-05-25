import { getFallbackLocales, normalizeLocale } from '@/components/i18n/localeConfig';

export function pickLocalizedField(record, locale, field) {
  const localeCandidates = [normalizeLocale(locale), ...getFallbackLocales(locale)]
    .filter((candidate, index, values) => values.indexOf(candidate) === index);

  for (const candidate of localeCandidates) {
    const value = record?.[`${field}_${candidate}`];

    if (typeof value === 'string') {
      if (value.trim()) {
        return value;
      }

      continue;
    }

    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return '';
}