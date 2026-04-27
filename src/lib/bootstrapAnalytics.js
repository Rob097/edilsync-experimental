const CLARITY_ID = 'vqmmnj2of6';
const GTAG_ID = 'G-9GBB0XLF1R';

let scheduled = false;

function appendScript(src, attributes = {}) {
  if (document.querySelector(`script[src="${src}"]`)) {
    return;
  }

  const script = document.createElement('script');
  script.src = src;
  Object.entries(attributes).forEach(([name, value]) => {
    if (value === true) {
      script.setAttribute(name, '');
    } else {
      script.setAttribute(name, String(value));
    }
  });

  document.head.appendChild(script);
}

function loadAnalytics() {
  if (typeof window === 'undefined') {
    return;
  }

  window.clarity = window.clarity || function clarityProxy(...args) {
    (window.clarity.q = window.clarity.q || []).push(args);
  };

  appendScript(`https://www.clarity.ms/tag/${CLARITY_ID}`, { async: true });

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtagProxy(...args) {
    window.dataLayer.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GTAG_ID);

  appendScript(`https://www.googletagmanager.com/gtag/js?id=${GTAG_ID}`, { async: true });
}

export function scheduleAnalyticsBootstrap() {
  if (scheduled || typeof window === 'undefined' || !import.meta.env.PROD) {
    return;
  }

  scheduled = true;

  const deferLoad = () => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(loadAnalytics, { timeout: 3000 });
      return;
    }

    window.setTimeout(loadAnalytics, 1200);
  };

  if (document.readyState === 'complete') {
    deferLoad();
    return;
  }

  window.addEventListener('load', deferLoad, { once: true });
}