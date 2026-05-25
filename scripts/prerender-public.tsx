import fs from 'node:fs/promises';
import path from 'node:path';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { JSDOM } from 'jsdom';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import TurndownService from 'turndown';
import { loadEnv } from 'vite';
import i18next, { initializeI18n } from '../src/components/i18n/i18nConfig.jsx';
import { getAllLocaleConfigs } from '../src/components/i18n/localeConfig.js';
import { contentClient } from '../src/public/api/contentClient.js';
import { getMarkdownAssetPath } from '../src/public/lib/agentDiscovery.js';
import { localizePublicPath } from '../src/public/lib/localePath.js';
import { pickLocalizedField } from '../src/public/lib/pickLocalizedField.js';
import { getPublicCopy } from '../src/public/lib/publicTranslations.js';
import PublicPrerenderRouter from '../src/public/PublicPrerenderRouter.jsx';
import { PUBLIC_PRERENDER_DATA_KEY } from '../src/public/prerenderData.js';

const distDir = path.resolve(process.cwd(), 'dist');
const templatePath = path.join(distDir, 'index.html');
const PUBLIC_LOCALES = getAllLocaleConfigs().map(({ code }) => code);

const turndownService = new TurndownService({
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '_',
  headingStyle: 'atx',
});

turndownService.remove([
  'button',
  'form',
  'header',
  'footer',
  'nav',
  'noscript',
  'script',
  'style',
  'svg',
]);

const getDefaultDescription = (locale) => {
  const copy = getPublicCopy(locale, 'home');
  return copy?.seo?.description || 'EdilSync';
};

const getCopyMeta = (locale, group, selectors = {}) => {
  const copy = getPublicCopy(locale, group);
  const rawTitle = selectors.title?.(copy) ?? copy?.seoTitle ?? copy?.title ?? '';
  const rawDescription = selectors.description?.(copy) ?? copy?.seoDescription ?? copy?.subtitle ?? getDefaultDescription(locale);

  return {
    title: formatTitle(rawTitle),
    description: rawDescription,
  };
};

const STATIC_ROUTE_DEFINITIONS = [
  {
    path: '/',
    getMeta: (locale) => getCopyMeta(locale, 'home', {
      title: (copy) => copy?.seo?.title,
      description: (copy) => copy?.seo?.description,
    }),
  },
  { path: '/funzionalita', getMeta: (locale) => getCopyMeta(locale, 'featuresPage') },
  { path: '/come-funziona', getMeta: (locale) => getCopyMeta(locale, 'howItWorksPage') },
  { path: '/contractors', getMeta: (locale) => getCopyMeta(locale, 'contractorsPage') },
  { path: '/per-committenti', getMeta: (locale) => getCopyMeta(locale, 'homeownersPage') },
  { path: '/per-subappaltatori', getMeta: (locale) => getCopyMeta(locale, 'subcontractorsPage') },
  { path: '/per-tecnici', getMeta: (locale) => getCopyMeta(locale, 'professionalsPage') },
  { path: '/dispute-protection', getMeta: (locale) => getCopyMeta(locale, 'disputeProtectionPage') },
  { path: '/transparency', getMeta: (locale) => getCopyMeta(locale, 'transparencyPage') },
  { path: '/team-coordination', getMeta: (locale) => getCopyMeta(locale, 'teamCoordinationPage') },
  { path: '/prezzi', getMeta: (locale) => getCopyMeta(locale, 'pricingPage') },
  { path: '/faq', getMeta: (locale) => getCopyMeta(locale, 'faqPage') },
  {
    path: '/contatti',
    getMeta: (locale) => getCopyMeta(locale, 'contact', {
      description: (copy) => copy?.subtitle,
    }),
  },
  { path: '/privacy', getMeta: (locale) => getCopyMeta(locale, 'privacyPolicyPage') },
  { path: '/termini', getMeta: (locale) => getCopyMeta(locale, 'termsOfServicePage') },
  { path: '/cookie', getMeta: (locale) => getCopyMeta(locale, 'cookiePolicyPage') },
];

const buildStaticRoutes = () => STATIC_ROUTE_DEFINITIONS.flatMap(({ path: routePath, getMeta }) => (
  PUBLIC_LOCALES.map((locale) => ({
    path: localizePublicPath(routePath, locale),
    locale,
    ...getMeta(locale),
  }))
));

const getSiteOrigin = () => process.env.PUBLIC_SITE_ORIGIN || 'https://edilsync.rdlabs.digital';

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
  const routes = PUBLIC_LOCALES.map((locale) => {
    const copy = getPublicCopy(locale, 'blogIndex');

    return {
      path: localizePublicPath('/blog', locale),
      locale,
      title: formatTitle(copy?.seoTitle),
      description: copy?.seoDescription || copy?.subtitle || getDefaultDescription(locale),
      data: { blogPosts: posts },
    };
  });

  posts.forEach((post) => {
    PUBLIC_LOCALES.forEach((locale) => {
      routes.push({
        path: localizePublicPath(`/blog/${post.slug}`, locale),
        locale,
        title: formatTitle(pickLocalizedField(post, locale, 'seo_title') || pickLocalizedField(post, locale, 'title')),
        description: pickLocalizedField(post, locale, 'seo_description') || pickLocalizedField(post, locale, 'excerpt') || getDefaultDescription(locale),
        data: { blogPost: post },
      });
    });
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

const getMarkdownOutputPath = (routePath) => path.join(
  distDir,
  getMarkdownAssetPath(routePath).replace(/^\//, ''),
);

const upsertHeadTag = (html, marker, tag) => {
  if (html.includes(marker)) {
    const expression = new RegExp(`${marker}[^>]*>`, 'i');
    return html.replace(expression, tag);
  }

  return html.replace('</head>', `  ${tag}\n  </head>`);
};

const injectHeadPreloads = (html, route) => {
  if (route.path !== localizePublicPath('/', route.locale)) {
    return html;
  }

  const preloadTag = '<link rel="preload" as="image" href="/images/optimized/hero-image-1120.webp" imagesrcset="/images/optimized/hero-image-672.webp 672w, /images/optimized/hero-image-1120.webp 1120w" imagesizes="(max-width: 767px) calc(100vw - 3rem), (max-width: 1279px) 560px, 640px" fetchpriority="high" />';
  return html.replace('</head>', `  ${preloadTag}\n  </head>`);
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
  return injectHeadPreloads(nextHtml, route);
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

const yamlString = (value) => JSON.stringify(value ?? '');

const collapseBlankLines = (value) => value.replace(/\n{3,}/g, '\n\n').trim();

const buildMarkdownDocument = (html, route) => {
  const dom = new JSDOM(html);
  const { document } = dom.window;
  const main = document.querySelector('main') ?? document.querySelector('#root');

  if (!main) {
    return null;
  }

  const mainClone = main.cloneNode(true);
  mainClone
    .querySelectorAll('button, form, header, footer, nav, noscript, script, style, svg, [aria-hidden="true"]')
    .forEach((node) => node.remove());

  const markdownBody = collapseBlankLines(turndownService.turndown(mainClone.innerHTML || mainClone.textContent || ''));
  if (!markdownBody) {
    return null;
  }

  const canonicalUrl = `${getSiteOrigin()}${route.path}`;

  return [
    '---',
    `title: ${yamlString(route.title)}`,
    `description: ${yamlString(route.description)}`,
    `url: ${yamlString(canonicalUrl)}`,
    `lang: ${yamlString(route.locale)}`,
    '---',
    '',
    markdownBody,
    '',
  ].join('\n');
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
  const publicRoutes = [...buildStaticRoutes(), ...(await buildBlogRoutes())];

  for (const route of publicRoutes) {
    const html = await renderRoute(route, template);
    const outputPath = getOutputPath(route.path);
    const markdownOutputPath = getMarkdownOutputPath(route.path);
    const markdown = buildMarkdownDocument(html, route);

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, html, 'utf8');

    if (markdown) {
      await fs.mkdir(path.dirname(markdownOutputPath), { recursive: true });
      await fs.writeFile(markdownOutputPath, markdown, 'utf8');
    }
  }

  console.log(`Prerendered ${publicRoutes.length} public routes.`);
}

main().catch((error) => {
  console.error('Public prerender failed.');
  console.error(error);
  process.exit(1);
});