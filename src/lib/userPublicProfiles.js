import { base44 } from '@/api/base44Client';

export const listUserPublicProfiles = async () => {
  try {
    return await base44.entities.UserPublicProfile.list();
  } catch (error) {
    if (error?.status === 403) {
      return [];
    }
    console.error('Failed to load UserPublicProfile:', error);
    return [];
  }
};

export const getDisplayNameFromProfile = (profile, fallback = '') => {
  if (!profile) return fallback;
  return profile.display_name || profile.full_name || fallback;
};

export const findProfileByEmail = (profiles = [], email) => {
  if (!email) return null;
  return profiles.find((profile) => profile.user_email === email) || null;
};

export const findProfileByUserId = (profiles = [], userId) => {
  if (!userId) return null;
  return profiles.find((profile) => profile.user_id === userId) || null;
};
