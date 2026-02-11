import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { operation, data, id, project_id } = await req.json();

    // LIST/FILTER - tutti i partecipanti possono leggere
    if (operation === 'list' || operation === 'filter') {
      if (!project_id) {
        return Response.json({ error: 'project_id is required' }, { status: 400 });
      }
      
      const participation = await base44.asServiceRole.entities.ProjectParticipant.filter({
        project_id,
        user_email: user.email,
        status: 'active'
      });
      
      if (participation.length === 0) {
        return Response.json({ error: 'Forbidden: Not a project participant' }, { status: 403 });
      }
      
      const participants = await base44.asServiceRole.entities.ProjectParticipant.filter({ project_id });
      return Response.json({ success: true, data: participants });
    }

    // CREATE - tutti i partecipanti possono creare (con restrizioni per società)
    if (operation === 'create') {
      const participation = await base44.asServiceRole.entities.ProjectParticipant.filter({
        project_id: data.project_id,
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
          return Response.json({ error: 'Forbidden: Only company admins can add participants' }, { status: 403 });
        }
      }
      
      const participant = await base44.asServiceRole.entities.ProjectParticipant.create(data);
      return Response.json({ success: true, data: participant });
    }

    // UPDATE - solo il creatore del progetto o del partecipante
    if (operation === 'update') {
      const participant = await base44.asServiceRole.entities.ProjectParticipant.get(id);
      const project = await base44.asServiceRole.entities.Project.get(participant.project_id);
      
      const isProjectCreator = project.created_by === user.email;
      const isParticipantCreator = participant.created_by === user.email;
      
      if (!isProjectCreator && !isParticipantCreator) {
        return Response.json({ error: 'Forbidden: Only project or participant creator can update' }, { status: 403 });
      }
      
      const updated = await base44.asServiceRole.entities.ProjectParticipant.update(id, data);
      return Response.json({ success: true, data: updated });
    }

    // DELETE - solo il creatore del progetto o del partecipante
    if (operation === 'delete') {
      const participant = await base44.asServiceRole.entities.ProjectParticipant.get(id);
      const project = await base44.asServiceRole.entities.Project.get(participant.project_id);
      
      const isProjectCreator = project.created_by === user.email;
      const isParticipantCreator = participant.created_by === user.email;
      
      if (!isProjectCreator && !isParticipantCreator) {
        return Response.json({ error: 'Forbidden: Only project or participant creator can delete' }, { status: 403 });
      }
      
      await base44.asServiceRole.entities.ProjectParticipant.delete(id);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});