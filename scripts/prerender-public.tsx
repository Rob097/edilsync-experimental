import fs from 'node:fs/promises';
import path from 'node:path';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { loadEnv } from 'vite';
import i18next, { initializeI18n } from '../src/components/i18n/i18nConfig.jsx';
import { contentClient } from '../src/public/api/contentClient.js';
import PublicPrerenderRouter from '../src/public/PublicPrerenderRouter.jsx';
import { PUBLIC_PRERENDER_DATA_KEY } from '../src/public/prerenderData.js';

const distDir = path.resolve(process.cwd(), 'dist');
const templatePath = path.join(distDir, 'index.html');

const defaultDescriptionByLocale = {
  it: 'EdilSync aiuta impresa, committente, subappaltatori e tecnici a coordinare il cantiere in modo chiaro e tracciabile.',
  en: 'EdilSync helps contractors, clients, subcontractors, and professionals coordinate the worksite with clear traceability.',
};

const staticRoutes = [
  { path: '/', locale: 'it', title: 'EdilSync', description: defaultDescriptionByLocale.it },
  { path: '/en', locale: 'en', title: 'EdilSync', description: defaultDescriptionByLocale.en },
  { path: '/funzionalita', locale: 'it', title: 'Funzionalita | EdilSync', description: defaultDescriptionByLocale.it },
  { path: '/en/funzionalita', locale: 'en', title: 'Features | EdilSync', description: defaultDescriptionByLocale.en },
  { path: '/come-funziona', locale: 'it', title: 'Come Funziona | EdilSync', description: defaultDescriptionByLocale.it },
  { path: '/en/come-funziona', locale: 'en', title: 'How It Works | EdilSync', description: defaultDescriptionByLocale.en },
  { path: '/contractors', locale: 'it', title: 'Per i Contractor | EdilSync', description: defaultDescriptionByLocale.it },
  { path: '/en/contractors', locale: 'en', title: 'For Contractors | EdilSync', description: defaultDescriptionByLocale.en },
  { path: '/per-committenti', locale: 'it', title: 'Per i Committenti | EdilSync', description: defaultDescriptionByLocale.it },
  { path: '/en/per-committenti', locale: 'en', title: 'For Homeowners | EdilSync', description: defaultDescriptionByLocale.en },
  { path: '/per-subappaltatori', locale: 'it', title: 'Per i Subappaltatori | EdilSync', description: defaultDescriptionByLocale.it },
  { path: '/en/per-subappaltatori', locale: 'en', title: 'For Subcontractors | EdilSync', description: defaultDescriptionByLocale.en },
  { path: '/per-tecnici', locale: 'it', title: 'Per i Tecnici | EdilSync', description: defaultDescriptionByLocale.it },
  { path: '/en/per-tecnici', locale: 'en', title: 'For Professionals | EdilSync', description: defaultDescriptionByLocale.en },
  { path: '/dispute-protection', locale: 'it', title: 'Protezione Dispute | EdilSync', description: defaultDescriptionByLocale.it },
  { path: '/en/dispute-protection', locale: 'en', title: 'Dispute Protection | EdilSync', description: defaultDescriptionByLocale.en },
  { path: '/transparency', locale: 'it', title: 'Trasparenza Committente | EdilSync', description: defaultDescriptionByLocale.it },
  { path: '/en/transparency', locale: 'en', title: 'Client Transparency | EdilSync', description: defaultDescriptionByLocale.en },
  { path: '/team-coordination', locale: 'it', title: 'Coordinamento Squadra | EdilSync', description: defaultDescriptionByLocale.it },
  { path: '/en/team-coordination', locale: 'en', title: 'Team Coordination | EdilSync', description: defaultDescriptionByLocale.en },
  { path: '/prezzi', locale: 'it', title: 'Prezzi | EdilSync', description: defaultDescriptionByLocale.it },
  { path: '/en/prezzi', locale: 'en', title: 'Pricing | EdilSync', description: defaultDescriptionByLocale.en },
  { path: '/faq', locale: 'it', title: 'FAQ | EdilSync', description: 'Domande frequenti su EdilSync: piattaforma, prezzi, funzionalita, permessi, sicurezza e supporto.' },
  { path: '/en/faq', locale: 'en', title: 'FAQ | EdilSync', description: 'Frequently asked questions about EdilSync: platform, pricing, capabilities, permissions, security, and support.' },
  {
    path: '/contatti',
    locale: 'it',
    title: 'Contatti | EdilSync',
    description: 'Raccontaci il tuo cantiere e ti mostriamo come coordinare persone, tempi, documenti e varianti con EdilSync.',
  },
  {
    path: '/en/contatti',
    locale: 'en',
    title: 'Contact | EdilSync',
    description: 'Tell us about your worksite and we will show you how EdilSync can coordinate people, timelines, documents, and change requests.',
  },
  { path: '/privacy', locale: 'it', title: 'Privacy Policy | EdilSync', description: defaultDescriptionByLocale.it },
  { path: '/en/privacy', locale: 'en', title: 'Privacy Policy | EdilSync', description: defaultDescriptionByLocale.en },
  { path: '/termini', locale: 'it', title: 'Termini di Servizio | EdilSync', description: defaultDescriptionByLocale.it },
  { path: '/en/termini', locale: 'en', title: 'Terms of Service | EdilSync', description: defaultDescriptionByLocale.en },
  { path: '/cookie', locale: 'it', title: 'Cookie Policy | EdilSync', description: defaultDescriptionByLocale.it },
  { path: '/en/cookie', locale: 'en', title: 'Cookie Policy | EdilSync', description: defaultDescriptionByLocale.en },
];

const getSiteOrigin = () => process.env.PUBLIC_SITE_ORIGIN || 'https://edilsync.rdlabs.digital';

const pickLocalized = (post, locale, field) => {
  const preferred = post?.[`${field}_${locale}`];
  if (preferred && preferred.trim()) {
    return preferred;
  }

  return post?.[`${field}_it`] || post?.[`${field}_en`] || '';
};

const formatTitle = (value) => {
  if (!value) {
    return 'EdilSync';
  }

  return /edilsync/i.test(value) ? value : `${value} | EdilSync`;
};

const serializeForScript = (value) => JSON.stringify(value)
  .replaceAll('&', '\\u0026')
  .replaceAll('<', '\\u003c')
  .replaceAll('>', '\\u003e')
  .replaceAll('\u2028', '\\u2028')
  .replaceAll('\u2029', '\\u2029');

const buildBlogRoutes = async () => {
  const posts = await contentClient.listPublishedPosts();
  const routes = [
    {
      path: '/blog',
      locale: 'it',
      title: 'Blog | EdilSync',
      description: 'Approfondimenti EdilSync su coordinamento di cantiere, varianti, documentazione e lavoro condiviso.',
      data: { blogPosts: posts },
    },
    {
      path: '/en/blog',
      locale: 'en',
      title: 'Blog | EdilSync',
      description: 'EdilSync insights on worksite coordination, change requests, documentation, and shared execution.',
      data: { blogPosts: posts },
    },
  ];

  posts.forEach((post) => {
    routes.push(
      {
        path: `/blog/${post.slug}`,
        locale: 'it',
        title: formatTitle(pickLocalized(post, 'it', 'seo_title') || pickLocalized(post, 'it', 'title')),
        description: pickLocalized(post, 'it', 'seo_description') || pickLocalized(post, 'it', 'excerpt') || defaultDescriptionByLocale.it,
        data: { blogPost: post },
      },
      {
        path: `/en/blog/${post.slug}`,
        locale: 'en',
        title: formatTitle(pickLocalized(post, 'en', 'seo_title') || pickLocalized(post, 'en', 'title')),
        description: pickLocalized(post, 'en', 'seo_description') || pickLocalized(post, 'en', 'excerpt') || defaultDescriptionByLocale.en,
        data: { blogPost: post },
      },
    );
  });

  return routes;
};

const loadRuntimeEnv = () => {
  const mode = process.env.MODE || process.env.NODE_ENV || 'production';
  const loadedEnv = loadEnv(mode, process.cwd(), '');

  Object.entries(loadedEnv).forEach(([key, value]) => {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
};

const escapeHtml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const getOutputPath = (routePath) => {
  if (routePath === '/') {
    return templatePath;
  }

  const relativePath = routePath.replace(/^\//, '');
  return path.join(distDir, relativePath, 'index.html');
};

const upsertHeadTag = (html, marker, tag) => {
  if (html.includes(marker)) {
    const expression = new RegExp(`${marker}[^>]*>`, 'i');
    return html.replace(expression, tag);
  }

  return html.replace('</head>', `  ${tag}\n  </head>`);
};

const injectHead = (html, route) => {
  const canonicalUrl = `${getSiteOrigin()}${route.path}`;
  let nextHtml = html.replace(/<html[^>]*lang="[^"]*"[^>]*>/i, `<html lang="${route.locale}">`);
  nextHtml = nextHtml.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(route.title)}</title>`);
  nextHtml = upsertHeadTag(
    nextHtml,
    '<meta name="description"',
    `<meta name="description" content="${escapeHtml(route.description)}" />`,
  );
  nextHtml = upsertHeadTag(
    nextHtml,
    '<meta property="og:title"',
    `<meta property="og:title" content="${escapeHtml(route.title)}" />`,
  );
  nextHtml = upsertHeadTag(
    nextHtml,
    '<meta property="og:description"',
    `<meta property="og:description" content="${escapeHtml(route.description)}" />`,
  );
  nextHtml = upsertHeadTag(
    nextHtml,
    '<meta property="og:url"',
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
  );
  nextHtml = upsertHeadTag(
    nextHtml,
    '<meta property="og:type"',
    '<meta property="og:type" content="website" />',
  );
  nextHtml = upsertHeadTag(
    nextHtml,
    '<link rel="canonical"',
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
  );
  return nextHtml;
};

const injectPrerenderData = (html, data) => {
  if (!data) {
    return html;
  }

  return html.replace(
    '</head>',
    `  <script>window.${PUBLIC_PRERENDER_DATA_KEY}=${serializeForScript(data)};</script>\n  </head>`,
  );
};

const injectMarkup = (html, markup) => html.replace(
  '<div id="root"></div>',
  `<div id="root">${markup}</div>`,
);

async function renderRoute(route, template) {
  await initializeI18n({ lng: route.locale, useDetector: false });
  await i18next.changeLanguage(route.locale);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const markup = renderToString(
    <QueryClientProvider client={queryClient}>
      <StaticRouter location={route.path}>
        <PublicPrerenderRouter prerenderData={route.data ?? null} />
      </StaticRouter>
    </QueryClientProvider>,
  );

  return injectPrerenderData(injectHead(injectMarkup(template, markup), route), route.data);
}

async function main() {
  loadRuntimeEnv();

  const template = await fs.readFile(templatePath, 'utf8');
  const publicRoutes = [...staticRoutes, ...(await buildBlogRoutes())];

  for (const route of publicRoutes) {
    const html = await renderRoute(route, template);
    const outputPath = getOutputPath(route.path);

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, html, 'utf8');
  }

  console.log(`Prerendered ${publicRoutes.length} public routes.`);
}

main().catch((error) => {
  console.error('Public prerender failed.');
  console.error(error);
  process.exit(1);
});