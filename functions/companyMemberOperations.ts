import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { operation, data, id, company_id } = await req.json();

    // LIST/FILTER - tutti i partecipanti possono leggere
    if (operation === 'list' || operation === 'filter') {
      if (!company_id) {
        return Response.json({ error: 'company_id is required' }, { status: 400 });
      }
      
      const membership = await base44.asServiceRole.entities.CompanyMember.filter({
        company_id,
        user_email: user.email,
        status: 'active'
      });
      
      if (membership.length === 0) {
        return Response.json({ error: 'Forbidden: Not a company member' }, { status: 403 });
      }
      
      const members = await base44.asServiceRole.entities.CompanyMember.filter({ company_id });
      return Response.json({ success: true, data: members });
    }

    // CREATE - permetti se non ci sono membri (setup iniziale) o se l'utente è admin
    if (operation === 'create') {
      const existingMembers = await base44.asServiceRole.entities.CompanyMember.filter({
        company_id: data.company_id
      });
      
      // Se non ci sono membri, è il setup iniziale - permetti
      if (existingMembers.length > 0) {
        const membership = await base44.asServiceRole.entities.CompanyMember.filter({
          company_id: data.company_id,
          user_email: user.email,
          role: 'admin',
          status: 'active'
        });
        
        if (membership.length === 0) {
          return Response.json({ error: 'Forbidden: Only company admins can add members' }, { status: 403 });
        }
      }
      
      const member = await base44.asServiceRole.entities.CompanyMember.create(data);
      return Response.json({ success: true, data: member });
    }

    // UPDATE - solo gli admin possono aggiornare
    if (operation === 'update') {
      const member = await base44.asServiceRole.entities.CompanyMember.get(id);
      const membership = await base44.asServiceRole.entities.CompanyMember.filter({
        company_id: member.company_id,
        user_email: user.email,
        role: 'admin',
        status: 'active'
      });
      
      if (membership.length === 0) {
        return Response.json({ error: 'Forbidden: Only company admins can update members' }, { status: 403 });
      }
      
      const updated = await base44.asServiceRole.entities.CompanyMember.update(id, data);
      return Response.json({ success: true, data: updated });
    }

    // DELETE - solo gli admin possono rimuovere (ma non se stessi)
    if (operation === 'delete') {
      const member = await base44.asServiceRole.entities.CompanyMember.get(id);
      
      if (member.user_email === user.email) {
        return Response.json({ error: 'Forbidden: Cannot remove yourself' }, { status: 403 });
      }
      
      const membership = await base44.asServiceRole.entities.CompanyMember.filter({
        company_id: member.company_id,
        user_email: user.email,
        role: 'admin',
        status: 'active'
      });
      
      if (membership.length === 0) {
        return Response.json({ error: 'Forbidden: Only company admins can remove members' }, { status: 403 });
      }
      
      await base44.asServiceRole.entities.CompanyMember.delete(id);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});