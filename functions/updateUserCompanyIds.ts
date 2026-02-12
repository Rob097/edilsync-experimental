import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data } = payload;

    // Get the user email from the member data
    const userEmail = data?.user_email;
    if (!userEmail) {
      return Response.json({ success: true, message: 'No user email to update' });
    }

    // Get all active memberships for this user
    const memberships = await base44.asServiceRole.entities.CompanyMember.filter({
      user_email: userEmail,
      status: 'active'
    });

    // Extract unique company IDs and admin company IDs
    const companyIds = [...new Set(memberships.map(m => m.company_id))];
    const companyIdsWithAdminRole = [...new Set(
      memberships.filter(m => m.role === 'admin').map(m => m.company_id)
    )];

    // Update user data with company_ids
    const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
    if (users.length > 0) {
      const user = users[0];
      await base44.asServiceRole.entities.User.update(user.id, {
        data: {
          ...(user.data || {}),
          company_ids: companyIds,
          company_ids_with_admin_role: companyIdsWithAdminRole
        }
      });
    }

    return Response.json({ 
      success: true, 
      message: `Updated company_ids for ${userEmail}`,
      company_ids: companyIds,
      company_ids_with_admin_role: companyIdsWithAdminRole
    });
  } catch (error) {
    console.error('Error updating user company IDs:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});