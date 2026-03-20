export const UI_MODE_STORAGE_KEY = 'edilsync:ui-mode';

export const UI_MODES = {
	NORMAL: 'normal',
	OPERATIONAL: 'operational',
};

const normalizeMode = (value) => {
	if (value === 'essential') {
		return UI_MODES.NORMAL;
	}

	return Object.values(UI_MODES).includes(value) ? value : UI_MODES.NORMAL;
};

export const getUiMode = () => {
	if (typeof window === 'undefined') return UI_MODES.NORMAL;
	const value = window.localStorage.getItem(UI_MODE_STORAGE_KEY);
	const normalizedMode = normalizeMode(value);

	if (normalizedMode !== value) {
		window.localStorage.setItem(UI_MODE_STORAGE_KEY, normalizedMode);
	}

	return normalizedMode;
};

export const isOperationalModeEnabled = () => getUiMode() === UI_MODES.OPERATIONAL;

export const setUiMode = (mode) => {
	if (typeof window === 'undefined') return;
	window.localStorage.setItem(UI_MODE_STORAGE_KEY, normalizeMode(mode));
};

export const setOperationalMode = (enabled) => {
	setUiMode(enabled ? UI_MODES.OPERATIONAL : UI_MODES.NORMAL);
};

export const isOperationalPath = (pathname = '') => pathname.startsWith('/operativa');