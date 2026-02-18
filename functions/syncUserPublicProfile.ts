// @ts-nocheck
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    if (payload.sync_all === true) {
      const allUsers = await base44.asServiceRole.entities.User.list();
      const results = [];

      for (const user of allUsers) {
        const result = await upsertUserPublicProfile(base44, user);
        results.push(result);
      }

      return Response.json({ success: true, synced: results.length, results });
    }

    if (payload.event) {
      const { event, data, old_data } = payload;

      if (event.entity_name !== 'User') {
        return Response.json({ success: true, skipped: true, reason: 'Unsupported entity event' });
      }

      if (event.event_type === 'delete') {
        const deleted = await deleteUserPublicProfile(base44, data?.id || old_data?.id, data?.email || old_data?.email);
        return Response.json({ success: true, deleted });
      }

      const userRecord = data?.id
        ? data
        : await findUser(base44, data?.email || old_data?.email || payload.user_email);

      if (!userRecord) {
        return Response.json({ success: true, skipped: true, reason: 'User not found' });
      }

      const result = await upsertUserPublicProfile(base44, userRecord);
      return Response.json({ success: true, result });
    }

    const userRecord = payload.user_id
      ? await findUserById(base44, payload.user_id)
      : await findUser(base44, payload.user_email);

    if (!userRecord) {
      return Response.json({ success: true, skipped: true, reason: 'User not found' });
    }

    const result = await upsertUserPublicProfile(base44, userRecord);
    return Response.json({ success: true, result });
  } catch (error) {
    console.error('Error in syncUserPublicProfile:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function findUser(base44, email) {
  if (!email) return null;
  const users = await base44.asServiceRole.entities.User.filter({ email });
  return users[0] || null;
}

async function findUserById(base44, userId) {
  if (!userId) return null;
  const users = await base44.asServiceRole.entities.User.filter({ id: userId });
  return users[0] || null;
}

async function upsertUserPublicProfile(base44, user) {
  if (!user?.id || !user?.email) {
    return { skipped: true, reason: 'missing user id/email' };
  }

  const profileData = {
    user_id: user.id,
    user_email: user.email,
    display_name: user.display_name || user.full_name || user.email,
    full_name: user.full_name || null,
    avatar_url: user.avatar_url || null,
  };

  const existingProfiles = await base44.asServiceRole.entities.UserPublicProfile.filter({
    user_id: user.id,
  });

  if (existingProfiles.length > 0) {
    await base44.asServiceRole.entities.UserPublicProfile.update(existingProfiles[0].id, profileData);
    return { user_id: user.id, action: 'updated' };
  }

  await base44.asServiceRole.entities.UserPublicProfile.create(profileData);
  return { user_id: user.id, action: 'created' };
}

async function deleteUserPublicProfile(base44, userId, userEmail) {
  if (!userId && !userEmail) {
    return { skipped: true, reason: 'missing user id/email' };
  }

  const byUserId = userId
    ? await base44.asServiceRole.entities.UserPublicProfile.filter({ user_id: userId })
    : [];

  const byEmail = userEmail
    ? await base44.asServiceRole.entities.UserPublicProfile.filter({ user_email: userEmail })
    : [];

  const profiles = [...byUserId, ...byEmail].filter(
    (profile, index, arr) => arr.findIndex((p) => p.id === profile.id) === index
  );

  for (const profile of profiles) {
    await base44.asServiceRole.entities.UserPublicProfile.delete(profile.id);
  }

  return { removed: profiles.length };
}