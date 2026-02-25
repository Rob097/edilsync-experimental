export const ESSENTIAL_MODE_STORAGE_KEY = 'edilsync:ui-mode';

export const UI_MODES = {
  NORMAL: 'normal',
  ESSENTIAL: 'essential',
  OPERATIONAL: 'operational',
};

const isValidMode = (value) => Object.values(UI_MODES).includes(value);

export const getUiMode = () => {
  if (typeof window === 'undefined') return UI_MODES.NORMAL;
  const value = window.localStorage.getItem(ESSENTIAL_MODE_STORAGE_KEY);
  return isValidMode(value) ? value : UI_MODES.NORMAL;
};

export const isEssentialModeEnabled = () => getUiMode() === UI_MODES.ESSENTIAL;

export const isOperationalModeEnabled = () => getUiMode() === UI_MODES.OPERATIONAL;

export const setUiMode = (mode) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ESSENTIAL_MODE_STORAGE_KEY, isValidMode(mode) ? mode : UI_MODES.NORMAL);
};

export const setEssentialMode = (enabled) => {
  setUiMode(enabled ? UI_MODES.ESSENTIAL : UI_MODES.NORMAL);
};

export const setOperationalMode = (enabled) => {
  setUiMode(enabled ? UI_MODES.OPERATIONAL : UI_MODES.NORMAL);
};

export const isEssentialPath = (pathname = '') => pathname.startsWith('/essenziale');

export const isOperationalPath = (pathname = '') => pathname.startsWith('/operativa');
