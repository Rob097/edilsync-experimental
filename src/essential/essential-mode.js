export const ESSENTIAL_MODE_STORAGE_KEY = 'edilsync:ui-mode';

export const getUiMode = () => {
  if (typeof window === 'undefined') return 'normal';
  const value = window.localStorage.getItem(ESSENTIAL_MODE_STORAGE_KEY);
  return value === 'essential' ? 'essential' : 'normal';
};

export const isEssentialModeEnabled = () => getUiMode() === 'essential';

export const setEssentialMode = (enabled) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ESSENTIAL_MODE_STORAGE_KEY, enabled ? 'essential' : 'normal');
};

export const isEssentialPath = (pathname = '') => pathname.startsWith('/essenziale');
