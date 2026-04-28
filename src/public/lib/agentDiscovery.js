export const INTERNAL_MARKDOWN_PREFIX = '/__agent_markdown';

const PROTECTED_PREFIXES = ['/app', '/web-admin', '/operativa', '/api'];
const SENSITIVE_WELL_KNOWN_PREFIXES = ['/.well-known/agent-skills', '/.well-known/mcp'];
const SENSITIVE_WELL_KNOWN_PATHS = new Set([
  '/.well-known/api-catalog',
  '/.well-known/openid-configuration',
  '/.well-known/oauth-authorization-server',
  '/.well-known/oauth-protected-resource',
]);

const STATIC_ASSET_EXTENSIONS = [
  '.avif',
  '.css',
  '.csv',
  '.eot',
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.js',
  '.json',
  '.map',
  '.mjs',
  '.mp3',
  '.mp4',
  '.otf',
  '.pdf',
  '.png',
  '.svg',
  '.ttf',
  '.txt',
  '.wav',
  '.webm',
  '.webmanifest',
  '.webp',
  '.woff',
  '.woff2',
  '.xml',
  '.zip',
];

const matchesPrefix = (pathname, prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`);

const localePath = (locale, pathname) => (locale === 'en' ? `/en${pathname}` : pathname);

export function normalizePathname(pathname) {
  if (!pathname) {
    return '/';
  }

  const normalized = pathname.replace(/\/+/g, '/');
  if (normalized.length > 1 && normalized.endsWith('/')) {
    return normalized.slice(0, -1);
  }

  return normalized;
}

export function getLocaleFromPath(pathname) {
  return normalizePathname(pathname).startsWith('/en') ? 'en' : 'it';
}

export function hasStaticAssetExtension(pathname) {
  const normalized = normalizePathname(pathname).toLowerCase();
  return STATIC_ASSET_EXTENSIONS.some((extension) => normalized.endsWith(extension));
}

export function isSensitiveWellKnownPath(pathname) {
  const normalized = normalizePathname(pathname);

  if (SENSITIVE_WELL_KNOWN_PATHS.has(normalized)) {
    return true;
  }

  return SENSITIVE_WELL_KNOWN_PREFIXES.some((prefix) => matchesPrefix(normalized, prefix));
}

export function isProtectedPath(pathname) {
  const normalized = normalizePathname(pathname);
  return PROTECTED_PREFIXES.some((prefix) => matchesPrefix(normalized, prefix));
}

export function isPublicDocumentPath(pathname) {
  const normalized = normalizePathname(pathname);

  if (normalized.startsWith(INTERNAL_MARKDOWN_PREFIX)) {
    return false;
  }

  if (normalized.startsWith('/cdn-cgi/')) {
    return false;
  }

  if (isSensitiveWellKnownPath(normalized)) {
    return false;
  }

  if (isProtectedPath(normalized)) {
    return false;
  }

  return !hasStaticAssetExtension(normalized);
}

export function isMarkdownRequest(headers) {
  const accept = headers.get('accept') || '';
  return accept
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .some((value) => value.startsWith('text/markdown'));
}

export function getMarkdownAssetPath(pathname) {
  const normalized = normalizePathname(pathname);
  if (normalized === '/') {
    return `${INTERNAL_MARKDOWN_PREFIX}/index.md`;
  }

  return `${INTERNAL_MARKDOWN_PREFIX}${normalized}.md`;
}

function formatLinkHeader(href, rel, attributes = {}) {
  const params = [`rel="${rel}"`];

  Object.entries(attributes).forEach(([key, value]) => {
    if (value) {
      params.push(`${key}="${String(value).replaceAll('"', '\\"')}"`);
    }
  });

  return `<${href}>; ${params.join('; ')}`;
}

export function buildPublicLinkHeaderValues(pathname) {
  const normalized = normalizePathname(pathname);
  const locale = getLocaleFromPath(normalized);

  return [
    formatLinkHeader(normalized, 'alternate', { type: 'text/markdown' }),
    formatLinkHeader(localePath(locale, '/faq'), 'help'),
    formatLinkHeader(localePath(locale, '/come-funziona'), 'about'),
    formatLinkHeader(localePath(locale, '/privacy'), 'privacy-policy'),
    formatLinkHeader(localePath(locale, '/termini'), 'terms-of-service'),
  ];
}

export function estimateMarkdownTokens(markdown) {
  const normalized = markdown.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return 0;
  }

  return Math.ceil(normalized.length / 4);
}