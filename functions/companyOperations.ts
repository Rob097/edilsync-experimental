import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { operation, data, id, query } = await req.json();

    // CREATE - tutti possono creare una società
    if (operation === 'create') {
      const company = await base44.asServiceRole.entities.Company.create(data);
      return Response.json({ success: true, data: company });
    }

    // LIST/READ - solo i partecipanti possono leggere
    if (operation === 'list' || operation === 'filter') {
      const allCompanies = await base44.asServiceRole.entities.Company.list();
      const memberships = await base44.asServiceRole.entities.CompanyMember.filter({
        user_email: user.email,
        status: 'active'
      });
      const userCompanyIds = memberships.map(m => m.company_id);
      
      let filtered = allCompanies.filter(c => userCompanyIds.includes(c.id));
      
      if (operation === 'filter' && query) {
        filtered = filtered.filter(c => {
          for (const [key, value] of Object.entries(query)) {
            if (c[key] !== value) return false;
          }
          return true;
        });
      }
      
      return Response.json({ success: true, data: filtered });
    }

    // GET - solo i partecipanti possono leggere
    if (operation === 'get') {
      const company = await base44.asServiceRole.entities.Company.get(id);
      const membership = await base44.asServiceRole.entities.CompanyMember.filter({
        company_id: id,
        user_email: user.email,
        status: 'active'
      });
      
      if (membership.length === 0) {
        return Response.json({ error: 'Forbidden: Not a company member' }, { status: 403 });
      }
      
      return Response.json({ success: true, data: company });
    }

    // UPDATE - solo gli admin possono aggiornare
    if (operation === 'update') {
      const membership = await base44.asServiceRole.entities.CompanyMember.filter({
        company_id: id,
        user_email: user.email,
        role: 'admin',
        status: 'active'
      });
      
      if (membership.length === 0) {
        return Response.json({ error: 'Forbidden: Only company admins can update' }, { status: 403 });
      }
      
      const updated = await base44.asServiceRole.entities.Company.update(id, data);
      return Response.json({ success: true, data: updated });
    }

    // DELETE - solo gli admin possono eliminare
    if (operation === 'delete') {
      const membership = await base44.asServiceRole.entities.CompanyMember.filter({
        company_id: id,
        user_email: user.email,
        role: 'admin',
        status: 'active'
      });
      
      if (membership.length === 0) {
        return Response.json({ error: 'Forbidden: Only company admins can delete' }, { status: 403 });
      }
      
      await base44.asServiceRole.entities.Company.delete(id);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});