import { useEffect } from 'react';
import { DEFAULT_LOCALE, getLocaleConfig, normalizeLocale } from '@/components/i18n/localeConfig';

const DEFAULT_TITLE = 'EdilSync';
const DEFAULT_DESCRIPTION =
  'EdilSync allinea impresa, committente, subappaltatori e tecnici in un workspace unico e tracciabile.';

function ensureMeta(nameOrProperty, content, isProperty = false) {
  const attr = isProperty ? 'property' : 'name';
  let node = document.head.querySelector(`meta[${attr}="${nameOrProperty}"]`);

  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(attr, nameOrProperty);
    document.head.appendChild(node);
  }

  node.setAttribute('content', content || '');
}

function ensureLink(rel, href, extras = {}) {
  const selector = Object.entries({ rel, ...extras })
    .map(([k, v]) => `${k}="${v}"`)
    .join('][');

  let node = document.head.querySelector(`link[${selector}]`);
  if (!node) {
    node = document.createElement('link');
    node.setAttribute('rel', rel);
    Object.entries(extras).forEach(([k, v]) => node.setAttribute(k, v));
    document.head.appendChild(node);
  }
  node.setAttribute('href', href);
}

function ensureManagedAlternateLink(href, hreflang) {
  let node = document.head.querySelector(`link[rel="alternate"][hreflang="${hreflang}"][data-public-seo="true"]`);

  if (!node) {
    node = document.createElement('link');
    node.setAttribute('rel', 'alternate');
    node.setAttribute('hreflang', hreflang);
    node.setAttribute('data-public-seo', 'true');
    document.head.appendChild(node);
  }

  node.setAttribute('href', href);
}

function clearManagedAlternateLinks() {
  document.head
    .querySelectorAll('link[rel="alternate"][data-public-seo="true"]')
    .forEach((node) => node.remove());
}

function getResolvedAlternatePaths(alternatePathsByLocale, alternateItPath, alternateEnPath) {
  if (alternatePathsByLocale && typeof alternatePathsByLocale === 'object') {
    return alternatePathsByLocale;
  }

  return {
    it: alternateItPath,
    en: alternateEnPath,
  };
}

export default function usePublicSeo({
  title,
  description,
  canonicalPath,
  locale = 'it',
  alternatePathsByLocale,
  alternateItPath,
  alternateEnPath,
  robots = 'index,follow',
}) {
  useEffect(() => {
    const normalizedLocale = normalizeLocale(locale);
    const localeConfig = getLocaleConfig(normalizedLocale);
    const resolvedAlternatePaths = getResolvedAlternatePaths(alternatePathsByLocale, alternateItPath, alternateEnPath);
    const finalTitle = title ? `${title} | ${DEFAULT_TITLE}` : DEFAULT_TITLE;
    const finalDescription = description || DEFAULT_DESCRIPTION;
    const origin = window.location.origin;

    document.title = finalTitle;
    ensureMeta('description', finalDescription);
    ensureMeta('robots', robots);
    ensureMeta('og:title', finalTitle, true);
    ensureMeta('og:description', finalDescription, true);
    ensureMeta('og:type', 'website', true);
    ensureMeta('og:locale', localeConfig.ogLocale, true);

    const canonicalHref = canonicalPath ? `${origin}${canonicalPath}` : window.location.href;
    ensureLink('canonical', canonicalHref);

    clearManagedAlternateLinks();

    Object.entries(resolvedAlternatePaths || {}).forEach(([localeCode, path]) => {
      if (!path) {
        return;
      }

      const alternateLocaleConfig = getLocaleConfig(localeCode);
      ensureManagedAlternateLink(`${origin}${path}`, alternateLocaleConfig.hreflang);
    });

    const defaultAlternatePath = resolvedAlternatePaths?.[DEFAULT_LOCALE] || canonicalPath;
    if (defaultAlternatePath) {
      ensureManagedAlternateLink(`${origin}${defaultAlternatePath}`, 'x-default');
    }
  }, [title, description, canonicalPath, locale, alternatePathsByLocale, alternateItPath, alternateEnPath, robots]);
}
