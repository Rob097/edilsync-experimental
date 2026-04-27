export const PUBLIC_PRERENDER_DATA_KEY = '__PUBLIC_PRERENDER_DATA__';

const readGlobalPrerenderData = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window[PUBLIC_PRERENDER_DATA_KEY] ?? null;
};

export const readPublicPrerenderData = (key) => readGlobalPrerenderData()?.[key];