export const ESSENTIAL_MODE_STORAGE_KEY = 'edilsync:ui-mode';

export const UI_MODES = {
  NORMAL: 'normal',
  ESSENTIAL: 'essential',
  OPERATIONAL: 'operational',
};

const ACTIVE_UI_MODES = [UI_MODES.NORMAL, UI_MODES.OPERATIONAL];

const normalizeMode = (value) => {
  if (value === UI_MODES.ESSENTIAL) {
    return UI_MODES.NORMAL;
  }

  return ACTIVE_UI_MODES.includes(value) ? value : UI_MODES.NORMAL;
};

export const getUiMode = () => {
  if (typeof window === 'undefined') return UI_MODES.NORMAL;
  const value = window.localStorage.getItem(ESSENTIAL_MODE_STORAGE_KEY);
  const normalizedMode = normalizeMode(value);

  if (normalizedMode !== value) {
    window.localStorage.setItem(ESSENTIAL_MODE_STORAGE_KEY, normalizedMode);
  }

  return normalizedMode;
};

export const isEssentialModeEnabled = () => false;

export const isOperationalModeEnabled = () => getUiMode() === UI_MODES.OPERATIONAL;

export const setUiMode = (mode) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ESSENTIAL_MODE_STORAGE_KEY, normalizeMode(mode));
};

export const setEssentialMode = (enabled) => {
  setUiMode(UI_MODES.NORMAL);
};

export const setOperationalMode = (enabled) => {
  setUiMode(enabled ? UI_MODES.OPERATIONAL : UI_MODES.NORMAL);
};

export const isEssentialPath = (pathname = '') => pathname.startsWith('/essenziale');

export const isOperationalPath = (pathname = '') => pathname.startsWith('/operativa');
