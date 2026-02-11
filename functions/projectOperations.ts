import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { operation, data, id, query } = await req.json();

    // CREATE - tutti possono creare
    if (operation === 'create') {
      const project = await base44.asServiceRole.entities.Project.create(data);
      return Response.json({ success: true, data: project });
    }

    // LIST/FILTER - solo i partecipanti possono leggere
    if (operation === 'list' || operation === 'filter') {
      const allProjects = await base44.asServiceRole.entities.Project.list();
      const participations = await base44.asServiceRole.entities.ProjectParticipant.filter({
        user_email: user.email,
        status: 'active'
      });
      const userProjectIds = participations.map(p => p.project_id);
      
      let filtered = allProjects.filter(p => userProjectIds.includes(p.id));
      
      if (operation === 'filter' && query) {
        filtered = filtered.filter(p => {
          for (const [key, value] of Object.entries(query)) {
            if (p[key] !== value) return false;
          }
          return true;
        });
      }
      
      return Response.json({ success: true, data: filtered });
    }

    // GET - solo i partecipanti possono leggere
    if (operation === 'get') {
      const project = await base44.asServiceRole.entities.Project.get(id);
      const participation = await base44.asServiceRole.entities.ProjectParticipant.filter({
        project_id: id,
        user_email: user.email,
        status: 'active'
      });
      
      if (participation.length === 0) {
        return Response.json({ error: 'Forbidden: Not a project participant' }, { status: 403 });
      }
      
      return Response.json({ success: true, data: project });
    }

    // UPDATE - tutti i partecipanti possono aggiornare (con restrizioni per società)
    if (operation === 'update') {
      const participation = await base44.asServiceRole.entities.ProjectParticipant.filter({
        project_id: id,
        user_email: user.email,
        status: 'active'
      });
      
      if (participation.length === 0) {
        return Response.json({ error: 'Forbidden: Not a project participant' }, { status: 403 });
      }
      
      // Se il partecipante è una società, verifica che sia admin
      const userParticipation = participation[0];
      if (userParticipation.participant_type === 'company') {
        const membership = await base44.asServiceRole.entities.CompanyMember.filter({
          company_id: userParticipation.company_id,
          user_email: user.email,
          role: 'admin',
          status: 'active'
        });
        
        if (membership.length === 0) {
          return Response.json({ error: 'Forbidden: Only company admins can update project' }, { status: 403 });
        }
      }
      
      const updated = await base44.asServiceRole.entities.Project.update(id, data);
      return Response.json({ success: true, data: updated });
    }

    // DELETE - solo il creatore può eliminare
    if (operation === 'delete') {
      const project = await base44.asServiceRole.entities.Project.get(id);
      
      if (project.created_by !== user.email) {
        return Response.json({ error: 'Forbidden: Only project creator can delete' }, { status: 403 });
      }
      
      await base44.asServiceRole.entities.Project.delete(id);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});