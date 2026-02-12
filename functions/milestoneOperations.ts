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
      
      const milestones = await base44.asServiceRole.entities.Milestone.filter({ project_id });
      return Response.json({ success: true, data: milestones });
    }

    // CREATE - creatore del progetto o partecipanti possono creare
    if (operation === 'create') {
      const project = await base44.asServiceRole.entities.Project.get(data.project_id);
      const isProjectCreator = project.created_by === user.email;
      
      if (!isProjectCreator) {
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
            return Response.json({ error: 'Forbidden: Only company admins can create milestones' }, { status: 403 });
          }
        }
      }
      
      const milestone = await base44.asServiceRole.entities.Milestone.create(data);
      return Response.json({ success: true, data: milestone });
    }

    // UPDATE - tutti i partecipanti possono aggiornare (con restrizioni per società)
    if (operation === 'update') {
      const milestone = await base44.asServiceRole.entities.Milestone.get(id);
      const participation = await base44.asServiceRole.entities.ProjectParticipant.filter({
        project_id: milestone.project_id,
        user_email: user.email,
        status: 'active'
      });
      
      if (participation.length === 0) {
        return Response.json({ error: 'Forbidden: Not a project participant' }, { status: 403 });
      }
      
      // Se il partecipante è una società, verifica che sia admin o creatore
      const userParticipation = participation[0];
      const isCreator = milestone.created_by === user.email;
      
      if (userParticipation.participant_type === 'company' && !isCreator) {
        const membership = await base44.asServiceRole.entities.CompanyMember.filter({
          company_id: userParticipation.company_id,
          user_email: user.email,
          role: 'admin',
          status: 'active'
        });
        
        if (membership.length === 0) {
          return Response.json({ error: 'Forbidden: Only company admins or creator can update' }, { status: 403 });
        }
      }
      
      const updated = await base44.asServiceRole.entities.Milestone.update(id, data);
      return Response.json({ success: true, data: updated });
    }

    // DELETE - solo il creatore
    if (operation === 'delete') {
      const milestone = await base44.asServiceRole.entities.Milestone.get(id);
      
      if (milestone.created_by !== user.email) {
        return Response.json({ error: 'Forbidden: Only creator can delete' }, { status: 403 });
      }
      
      await base44.asServiceRole.entities.Milestone.delete(id);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});