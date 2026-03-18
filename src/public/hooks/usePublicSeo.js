import { useEffect } from 'react';

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

export default function usePublicSeo({
  title,
  description,
  canonicalPath,
  locale = 'it',
  alternateItPath,
  alternateEnPath,
  robots = 'index,follow',
}) {
  useEffect(() => {
    const finalTitle = title ? `${title} | ${DEFAULT_TITLE}` : DEFAULT_TITLE;
    const finalDescription = description || DEFAULT_DESCRIPTION;
    const origin = window.location.origin;

    document.title = finalTitle;
    ensureMeta('description', finalDescription);
    ensureMeta('robots', robots);
    ensureMeta('og:title', finalTitle, true);
    ensureMeta('og:description', finalDescription, true);
    ensureMeta('og:type', 'website', true);
    ensureMeta('og:locale', locale === 'en' ? 'en_US' : 'it_IT', true);

    const canonicalHref = canonicalPath ? `${origin}${canonicalPath}` : window.location.href;
    ensureLink('canonical', canonicalHref);

    if (alternateItPath) {
      ensureLink('alternate', `${origin}${alternateItPath}`, { hreflang: 'it' });
    }

    if (alternateEnPath) {
      ensureLink('alternate', `${origin}${alternateEnPath}`, { hreflang: 'en' });
    }

    if (alternateItPath || alternateEnPath) {
      ensureLink('alternate', canonicalHref, { hreflang: 'x-default' });
    }
  }, [title, description, canonicalPath, locale, alternateItPath, alternateEnPath, robots]);
}
