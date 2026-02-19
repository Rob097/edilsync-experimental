export const getFullNameFromUser = (user) => {
  if (!user) return null;
  const fullName = typeof user.full_name === 'string' ? user.full_name.trim() : '';
  const displayName = typeof user.display_name === 'string' ? user.display_name.trim() : '';
  return fullName || displayName || null;
};

export const getUserDisplayName = (user, emailFallback = null) => {
  return getFullNameFromUser(user) || emailFallback || '';
};

export const getUserDisplayNameByEmail = (email, users = []) => {
  if (!email) return '';
  const normalizedEmail = String(email).trim().toLowerCase();
  const matchedUser = users.find(
    (user) => String(user?.email || '').trim().toLowerCase() === normalizedEmail,
  );
  return getUserDisplayName(matchedUser, email);
};
