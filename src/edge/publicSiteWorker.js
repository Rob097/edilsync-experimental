import {
  INTERNAL_MARKDOWN_PREFIX,
  buildPublicLinkHeaderValues,
  estimateMarkdownTokens,
  getMarkdownAssetPath,
  isMarkdownRequest,
  isPublicDocumentPath,
  isSensitiveWellKnownPath,
  normalizePathname,
} from '../public/lib/agentDiscovery.js';

const UNSUPPORTED_AGENT_ENDPOINT_MESSAGE =
  'EdilSync non pubblica discovery AI, API o superfici MCP sull\'origine pubblica. Le superfici applicative autenticate restano private.';

function appendVary(headers, token) {
  const currentValue = headers.get('Vary');
  if (!currentValue) {
    headers.set('Vary', token);
    return;
  }

  const values = currentValue
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (!values.includes(token.toLowerCase())) {
    headers.set('Vary', `${currentValue}, ${token}`);
  }
}

function cloneResponse(response, mutateHeaders) {
  const headers = new Headers(response.headers);
  mutateHeaders(headers);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function withPublicDiscoveryHeaders(response, pathname) {
  return cloneResponse(response, (headers) => {
    appendVary(headers, 'Accept');

    buildPublicLinkHeaderValues(pathname).forEach((value) => {
      headers.append('Link', value);
    });
  });
}

function isHtmlResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('text/html');
}

function isMarkdownAssetResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  return response.ok && !contentType.includes('text/html');
}

async function serveMarkdownDocument(request, env, pathname) {
  const markdownUrl = new URL(request.url);
  markdownUrl.pathname = getMarkdownAssetPath(pathname);

  const markdownAsset = await env.ASSETS.fetch(
    new Request(markdownUrl.toString(), {
      method: 'GET',
      headers: request.headers,
    }),
  );

  if (!isMarkdownAssetResponse(markdownAsset)) {
    return null;
  }

  const markdown = await markdownAsset.text();
  const headers = new Headers(markdownAsset.headers);
  headers.set('Content-Type', 'text/markdown; charset=utf-8');
  headers.set('X-Markdown-Tokens', String(estimateMarkdownTokens(markdown)));
  appendVary(headers, 'Accept');

  return new Response(request.method === 'HEAD' ? null : markdown, {
    status: 200,
    headers,
  });
}

function unsupportedWellKnownResponse(request, pathname) {
  const body = JSON.stringify({
    error: 'not_found',
    path: pathname,
    message: UNSUPPORTED_AGENT_ENDPOINT_MESSAGE,
  });

  return new Response(request.method === 'HEAD' ? null : body, {
    status: 404,
    headers: {
      'Cache-Control': 'public, max-age=300',
      'Content-Type': 'application/json; charset=utf-8',
      'X-Robots-Tag': 'noindex',
    },
  });
}

export default {
  async fetch(request, env) {
    if (!env?.ASSETS) {
      return new Response('Static assets binding is not configured.', { status: 500 });
    }

    const url = new URL(request.url);
    const pathname = normalizePathname(url.pathname);

    if (pathname.startsWith(INTERNAL_MARKDOWN_PREFIX)) {
      return new Response('Not Found', { status: 404 });
    }

    if (isSensitiveWellKnownPath(pathname)) {
      return unsupportedWellKnownResponse(request, pathname);
    }

    const supportsBodyNegotiation = request.method === 'GET' || request.method === 'HEAD';
    if (supportsBodyNegotiation && isPublicDocumentPath(pathname) && isMarkdownRequest(request.headers)) {
      const markdownResponse = await serveMarkdownDocument(request, env, pathname);
      if (markdownResponse) {
        return withPublicDiscoveryHeaders(markdownResponse, pathname);
      }
    }

    const assetResponse = await env.ASSETS.fetch(request);
    if (supportsBodyNegotiation && isPublicDocumentPath(pathname) && isHtmlResponse(assetResponse)) {
      return withPublicDiscoveryHeaders(assetResponse, pathname);
    }

    return assetResponse;
  },
};