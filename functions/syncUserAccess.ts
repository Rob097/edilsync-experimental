import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Determine which users to sync
    const emailsToSync = new Set();

    // Case 1: Called by automation (has event/data/old_data)
    if (payload.event) {
      const { event, data, old_data } = payload;

      if (event.entity_name === 'CompanyMember') {
        // Sync the user referenced in this membership
        if (data?.user_email) emailsToSync.add(data.user_email);
        if (old_data?.user_email && old_data.user_email !== data?.user_email) {
          emailsToSync.add(old_data.user_email);
        }
      } else if (event.entity_name === 'ProjectParticipant') {
        if (data?.participant_type === 'personal' || old_data?.participant_type === 'personal') {
          // Personal participant: sync that user
          if (data?.user_email) emailsToSync.add(data.user_email);
          if (old_data?.user_email && old_data.user_email !== data?.user_email) {
            emailsToSync.add(old_data.user_email);
          }
        }
        if (data?.participant_type === 'company' || old_data?.participant_type === 'company') {
          // Company participant: sync all members of that company
          const companyId = data?.company_id || old_data?.company_id;
          if (companyId) {
            const members = await base44.asServiceRole.entities.CompanyMember.filter({
              company_id: companyId,
            });
            const activeMembers = members.filter(m => m.status === 'active' || m.status === 'invited');
            for (const member of activeMembers) {
              if (member.user_email) emailsToSync.add(member.user_email);
            }
          }
        }
      }
    }

    // Case 2: Called manually with user_email
    if (payload.user_email) {
      emailsToSync.add(payload.user_email);
    }

    // Case 3: Called manually with company_id (sync all members)
    if (payload.company_id) {
      const members = await base44.asServiceRole.entities.CompanyMember.filter({
        company_id: payload.company_id,
      });
      const activeMembers = members.filter(m => m.status === 'active' || m.status === 'invited');
      for (const member of activeMembers) {
        if (member.user_email) emailsToSync.add(member.user_email);
      }
    }

    // Case 4: Bulk sync all users
    if (payload.sync_all === true) {
      const allUsers = await base44.asServiceRole.entities.User.list();
      for (const u of allUsers) {
        if (u.email) emailsToSync.add(u.email);
      }
    }

    if (emailsToSync.size === 0) {
      return Response.json({ success: true, synced: [], message: 'No users to sync' });
    }

    // Preload all data once for efficiency
    const allCompanyMemberships = await base44.asServiceRole.entities.CompanyMember.list();
    const allProjectParticipants = await base44.asServiceRole.entities.ProjectParticipant.list();

    const syncResults = [];

    for (const userEmail of emailsToSync) {
      const result = await syncUser(base44, userEmail, allCompanyMemberships, allProjectParticipants);
      syncResults.push({ email: userEmail, ...result });
    }

    return Response.json({ success: true, synced: syncResults });

  } catch (error) {
    console.error('Error in syncUserAccess:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function syncUser(base44, userEmail, allCompanyMemberships, allProjectParticipants) {
  if (!userEmail) return { skipped: true, reason: 'no email' };

  // Find user
  const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
  if (users.length === 0) {
    return { skipped: true, reason: 'user not found' };
  }
  const user = users[0];

  // Calculate company IDs
  const userMemberships = allCompanyMemberships.filter(
    m => m.user_email === userEmail && (m.status === 'active' || m.status === 'invited')
  );
  const companyIds = [...new Set(userMemberships.map(m => m.company_id).filter(Boolean))];

  const adminMemberships = userMemberships.filter(m => m.role === 'admin' && m.status === 'active');
  const adminCompanyIds = [...new Set(adminMemberships.map(m => m.company_id).filter(Boolean))];

  // Calculate project IDs
  // 1. Personal participations
  const personalParticipations = allProjectParticipants.filter(
    p => p.participant_type === 'personal' &&
         p.user_email === userEmail &&
         (p.status === 'active' || p.status === 'invited')
  );
  const personalProjectIds = personalParticipations.map(p => p.project_id).filter(Boolean);

  // 2. Company participations (through user's companies)
  const companyParticipations = allProjectParticipants.filter(
    p => p.participant_type === 'company' &&
         companyIds.includes(p.company_id) &&
         (p.status === 'active' || p.status === 'invited')
  );
  const companyProjectIds = companyParticipations.map(p => p.project_id).filter(Boolean);

  const allProjectIds = [...new Set([...personalProjectIds, ...companyProjectIds])];

  // Update user
  await base44.asServiceRole.entities.User.update(user.id, {
    company_ids: companyIds,
    admin_company_ids: adminCompanyIds,
    project_ids: allProjectIds,
  });

  return {
    updated: true,
    company_ids: companyIds,
    admin_company_ids: adminCompanyIds,
    project_ids: allProjectIds,
  };
}