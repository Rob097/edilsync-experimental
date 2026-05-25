import { getPublicCopy } from '@/public/lib/publicTranslations';
import { getLocaleConfig, normalizeLocale } from '@/components/i18n/localeConfig';

function getLocaleTag(locale = 'it') {
  return getLocaleConfig(locale).readingTimeLocale;
}

export function formatBlogDate(value, locale = 'it') {
  if (!value) return '';

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return '';

  return new Intl.DateTimeFormat(getLocaleTag(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsedDate);
}

export function formatReadingTime(minutes, locale = 'it') {
  if (!minutes || Number.isNaN(Number(minutes))) return '';

  const roundedMinutes = Math.max(1, Math.round(Number(minutes)));
  const copy = getPublicCopy(locale, 'blogMeta');
  return `${roundedMinutes} ${copy?.minReadLabel || (normalizeLocale(locale) === 'it' ? 'min di lettura' : 'min read')}`;
}

export function getBlogMetaItems(post, locale = 'it') {
  const items = [];
  const formattedDate = formatBlogDate(post?.published_at || post?.created_date, locale);
  const formattedReadingTime = formatReadingTime(post?.reading_time_minutes, locale);

  if (formattedDate) items.push(formattedDate);
  if (formattedReadingTime) items.push(formattedReadingTime);

  return items;
}