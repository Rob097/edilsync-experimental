function getLocaleTag(locale = 'it') {
  return locale === 'en' ? 'en-GB' : 'it-IT';
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
  return locale === 'en' ? `${roundedMinutes} min read` : `${roundedMinutes} min di lettura`;
}

export function getBlogMetaItems(post, locale = 'it') {
  const items = [];
  const formattedDate = formatBlogDate(post?.published_at || post?.created_date, locale);
  const formattedReadingTime = formatReadingTime(post?.reading_time_minutes, locale);

  if (formattedDate) items.push(formattedDate);
  if (formattedReadingTime) items.push(formattedReadingTime);

  return items;
}