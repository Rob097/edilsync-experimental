import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data } = payload;

    // Get the user email from the participant data
    const userEmail = data?.user_email;
    if (!userEmail) {
      return Response.json({ success: true, message: 'No user email to update' });
    }

    // Get all active participations for this user
    const participations = await base44.asServiceRole.entities.ProjectParticipant.filter({
      user_email: userEmail,
      status: 'active'
    });

    // Extract unique project IDs
    const projectIds = [...new Set(participations.map(p => p.project_id))];

    // Update user data with project_ids
    const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
    if (users.length > 0) {
      const user = users[0];
      await base44.asServiceRole.entities.User.update(user.id, {
        data: {
          ...(user.data || {}),
          project_ids: projectIds
        }
      });
    }

    return Response.json({ 
      success: true, 
      message: `Updated project_ids for ${userEmail}`,
      project_ids: projectIds
    });
  } catch (error) {
    console.error('Error updating user project IDs:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});