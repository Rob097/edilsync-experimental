export function isEnglishPublicPath(pathname = '') {
  return pathname === '/en' || pathname.startsWith('/en/');
}

export function localizePublicPath(path, pathnameOrLanguage = 'it') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const useEnglish = pathnameOrLanguage === 'en' || isEnglishPublicPath(pathnameOrLanguage);

  if (useEnglish) {
    if (normalizedPath === '/') return '/en';
    return normalizedPath === '/en' || normalizedPath.startsWith('/en/')
      ? normalizedPath
      : `/en${normalizedPath}`;
  }

  if (!normalizedPath.startsWith('/en')) {
    return normalizedPath;
  }

  const stripped = normalizedPath.replace(/^\/en/, '');
  return stripped || '/';
}