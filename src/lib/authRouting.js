export const APP_AUTH_PATH = '/app';

export const AUTH_TAB_QUERY_KEY = 'auth';
export const AUTH_NOTICE_QUERY_KEY = 'notice';
export const AUTH_EMAIL_QUERY_KEY = 'email';

export const AUTH_SIGNIN_TAB = 'signin';
export const AUTH_SIGNUP_TAB = 'signup';

export const AUTH_CONFIRM_EMAIL_NOTICE = 'confirm-email';

export function normalizeAuthTab(value) {
  return value === AUTH_SIGNUP_TAB ? AUTH_SIGNUP_TAB : AUTH_SIGNIN_TAB;
}

export function buildAuthSearchParams({ tab = AUTH_SIGNIN_TAB, notice, email } = {}) {
  const searchParams = new URLSearchParams();
  const normalizedTab = normalizeAuthTab(tab);

  if (normalizedTab === AUTH_SIGNUP_TAB) {
    searchParams.set(AUTH_TAB_QUERY_KEY, normalizedTab);
  }

  if (notice) {
    searchParams.set(AUTH_NOTICE_QUERY_KEY, notice);
  }

  if (email) {
    searchParams.set(AUTH_EMAIL_QUERY_KEY, email);
  }

  return searchParams;
}

export function buildAppAuthPath(options) {
  const searchParams = buildAuthSearchParams(options);
  const query = searchParams.toString();

  return query ? `${APP_AUTH_PATH}?${query}` : APP_AUTH_PATH;
}

export const PUBLIC_SIGNUP_PATH = buildAppAuthPath({ tab: AUTH_SIGNUP_TAB });