// @ts-nocheck
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));

    const operation = payload?.event?.operation;
    const eventData = payload?.data || {};
    const oldData = payload?.old_data || {};

    const userIdsToSync = new Set<string>();
    const userEmailsToSync = new Set<string>();
    const profileUserIdsToDelete = new Set<string>();
    const profileEmailsToDelete = new Set<string>();

    // Case 1: Automation from User entity
    if (payload?.event?.entity_name === 'User') {
      if (operation === 'delete') {
        if (oldData?.id) profileUserIdsToDelete.add(oldData.id);
        if (oldData?.email) profileEmailsToDelete.add(oldData.email);
      } else {
        if (eventData?.id) userIdsToSync.add(eventData.id);
        if (eventData?.email) userEmailsToSync.add(eventData.email);
      }
    }

    // Case 2: Manual single user
    if (payload.user_id) userIdsToSync.add(payload.user_id);
    if (payload.user_email) userEmailsToSync.add(payload.user_email);

    // Case 3: Bulk full sync
    if (payload.sync_all === true) {
      const users = await base44.asServiceRole.entities.User.list();
      for (const user of users) {
        if (user?.id) userIdsToSync.add(user.id);
      }
    }

    const deleted: Array<{ user_id?: string; user_email?: string; deleted: boolean }> = [];

    // Handle deletions first
    for (const userId of profileUserIdsToDelete) {
      const profiles = await base44.asServiceRole.entities.UserPublicProfile.filter({ user_id: userId });
      for (const profile of profiles) {
        await base44.asServiceRole.entities.UserPublicProfile.delete(profile.id);
      }
      deleted.push({ user_id: userId, deleted: profiles.length > 0 });
    }

    for (const userEmail of profileEmailsToDelete) {
      const profiles = await base44.asServiceRole.entities.UserPublicProfile.filter({ user_email: userEmail });
      for (const profile of profiles) {
        await base44.asServiceRole.entities.UserPublicProfile.delete(profile.id);
      }
      deleted.push({ user_email: userEmail, deleted: profiles.length > 0 });
    }

    const synced = [];
    const syncedEmails = new Set<string>();

    for (const userId of userIdsToSync) {
      const result = await syncByUserId(base44, userId);
      synced.push(result);
      if (typeof result?.user_email === 'string' && result.user_email) {
        syncedEmails.add(result.user_email);
      }
    }

    for (const userEmail of userEmailsToSync) {
      if (syncedEmails.has(userEmail)) continue;
      const result = await syncByUserEmail(base44, userEmail);
      synced.push(result);
      if (typeof result?.user_email === 'string' && result.user_email) {
        syncedEmails.add(result.user_email);
      }
    }

    return Response.json({
      success: true,
      synced,
      deleted,
    });
  } catch (error) {
    console.error('Error in syncUserPublicProfile:', error);
    return Response.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
});

async function syncByUserId(base44: any, userId: string) {
  if (!userId) return { skipped: true, reason: 'missing user_id' };

  const users = await base44.asServiceRole.entities.User.filter({ id: userId });
  const user = users?.[0];

  if (!user) {
    const profiles = await base44.asServiceRole.entities.UserPublicProfile.filter({ user_id: userId });
    for (const profile of profiles) {
      await base44.asServiceRole.entities.UserPublicProfile.delete(profile.id);
    }
    return { user_id: userId, deleted_orphan_profiles: profiles.length };
  }

  return upsertPublicProfile(base44, user);
}

async function syncByUserEmail(base44: any, userEmail: string) {
  if (!userEmail) return { skipped: true, reason: 'missing user_email' };

  const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
  const user = users?.[0];

  if (!user) {
    const profiles = await base44.asServiceRole.entities.UserPublicProfile.filter({ user_email: userEmail });
    for (const profile of profiles) {
      await base44.asServiceRole.entities.UserPublicProfile.delete(profile.id);
    }
    return { user_email: userEmail, deleted_orphan_profiles: profiles.length };
  }

  return upsertPublicProfile(base44, user);
}

async function upsertPublicProfile(base44: any, user: any) {
  const profilePayload = {
    user_id: user.id,
    user_email: user.email,
    display_name: user.display_name || user.full_name || user.email,
    full_name: user.full_name || null,
  };

  const existingByUserId = await base44.asServiceRole.entities.UserPublicProfile.filter({ user_id: user.id });
  const existing = existingByUserId?.[0] || null;

  if (existing) {
    await base44.asServiceRole.entities.UserPublicProfile.update(existing.id, profilePayload);
    return {
      user_id: user.id,
      user_email: user.email,
      action: 'updated',
    };
  }

  await base44.asServiceRole.entities.UserPublicProfile.create(profilePayload);
  return {
    user_id: user.id,
    user_email: user.email,
    action: 'created',
  };
}
