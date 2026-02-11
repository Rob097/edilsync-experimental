import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { operation, data, id, project_id } = await req.json();

    // LIST/FILTER - dipende dall'assegnatario
    if (operation === 'list' || operation === 'filter') {
      if (!project_id) {
        return Response.json({ error: 'project_id is required' }, { status: 400 });
      }
      
      const allRequests = await base44.asServiceRole.entities.ChangeRequest.filter({ project_id });
      const participation = await base44.asServiceRole.entities.ProjectParticipant.filter({
        project_id,
        user_email: user.email,
        status: 'active'
      });
      
      if (participation.length === 0) {
        return Response.json({ error: 'Forbidden: Not a project participant' }, { status: 403 });
      }
      
      // Filtra in base all'assegnatario
      const filtered = allRequests.filter(cr => {
        // Se non c'è assegnatario, tutti i partecipanti possono vedere
        if (!cr.assigned_participant_id) return true;
        
        // Se l'utente è l'assegnatario
        if (cr.assigned_user_email === user.email) return true;
        
        // Se è il creatore
        if (cr.created_by === user.email) return true;
        
        return false;
      });
      
      return Response.json({ success: true, data: filtered });
    }

    // CREATE - solo il committente (homeowner)
    if (operation === 'create') {
      const participation = await base44.asServiceRole.entities.ProjectParticipant.filter({
        project_id: data.project_id,
        user_email: user.email,
        project_role: 'homeowner',
        status: 'active'
      });
      
      if (participation.length === 0) {
        return Response.json({ error: 'Forbidden: Only homeowner can create change requests' }, { status: 403 });
      }
      
      const changeRequest = await base44.asServiceRole.entities.ChangeRequest.create(data);
      return Response.json({ success: true, data: changeRequest });
    }

    // UPDATE - creatore o assegnatario (con restrizioni per società)
    if (operation === 'update') {
      const changeRequest = await base44.asServiceRole.entities.ChangeRequest.get(id);
      
      const isCreator = changeRequest.created_by === user.email;
      const isAssignee = changeRequest.assigned_user_email === user.email;
      
      if (!isCreator && !isAssignee) {
        // Se l'assegnatario è una società, verifica che sia admin
        if (changeRequest.assigned_participant_type === 'company' && changeRequest.assigned_company_id) {
          const membership = await base44.asServiceRole.entities.CompanyMember.filter({
            company_id: changeRequest.assigned_company_id,
            user_email: user.email,
            role: 'admin',
            status: 'active'
          });
          
          if (membership.length === 0) {
            return Response.json({ error: 'Forbidden: Only creator, assignee, or company admin can update' }, { status: 403 });
          }
        } else {
          return Response.json({ error: 'Forbidden: Only creator or assignee can update' }, { status: 403 });
        }
      }
      
      const updated = await base44.asServiceRole.entities.ChangeRequest.update(id, data);
      return Response.json({ success: true, data: updated });
    }

    // DELETE - solo il creatore
    if (operation === 'delete') {
      const changeRequest = await base44.asServiceRole.entities.ChangeRequest.get(id);
      
      if (changeRequest.created_by !== user.email) {
        return Response.json({ error: 'Forbidden: Only creator can delete' }, { status: 403 });
      }
      
      await base44.asServiceRole.entities.ChangeRequest.delete(id);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});