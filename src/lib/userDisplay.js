export const getFullNameFromUser = (user) => {
  if (!user) return null;
  const fullName = typeof user.full_name === 'string' ? user.full_name.trim() : '';
  const displayName = typeof user.display_name === 'string' ? user.display_name.trim() : '';
  return fullName || displayName || null;
};

export const getUserDisplayName = (user, emailFallback = null) => {
  return getFullNameFromUser(user) || emailFallback || '';
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const sanitizeFallbackName = (fallbackName, email) => {
  const normalizedFallbackName = typeof fallbackName === 'string' ? fallbackName.trim() : '';
  if (!normalizedFallbackName) return '';
  return normalizeEmail(normalizedFallbackName) === normalizeEmail(email) ? '' : normalizedFallbackName;
};

export const getUserDisplayNameByIdentity = ({ email = null, userId = null, fallbackName = null } = {}, users = []) => {
  const normalizedEmail = normalizeEmail(email);
  const matchedUser = users.find((user) => {
    if (userId && user?.id === userId) {
      return true;
    }
    return normalizedEmail && normalizeEmail(user?.email) === normalizedEmail;
  });

  const resolvedFallbackName = sanitizeFallbackName(fallbackName, email);
  return getUserDisplayName(matchedUser, resolvedFallbackName || email || '');
};

export const getUserDisplayNameByEmail = (email, users = []) => {
  return getUserDisplayNameByIdentity({ email }, users);
};
