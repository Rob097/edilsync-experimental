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
      
      const comments = await base44.asServiceRole.entities.DocumentComment.filter({ project_id });
      return Response.json({ success: true, data: comments });
    }

    // CREATE - tutti i partecipanti possono creare
    if (operation === 'create') {
      const participation = await base44.asServiceRole.entities.ProjectParticipant.filter({
        project_id: data.project_id,
        user_email: user.email,
        status: 'active'
      });
      
      if (participation.length === 0) {
        return Response.json({ error: 'Forbidden: Not a project participant' }, { status: 403 });
      }
      
      const comment = await base44.asServiceRole.entities.DocumentComment.create(data);
      return Response.json({ success: true, data: comment });
    }

    // UPDATE - solo il creatore
    if (operation === 'update') {
      const comment = await base44.asServiceRole.entities.DocumentComment.get(id);
      
      if (comment.created_by !== user.email) {
        return Response.json({ error: 'Forbidden: Only creator can update' }, { status: 403 });
      }
      
      const updated = await base44.asServiceRole.entities.DocumentComment.update(id, data);
      return Response.json({ success: true, data: updated });
    }

    // DELETE - solo il creatore
    if (operation === 'delete') {
      const comment = await base44.asServiceRole.entities.DocumentComment.get(id);
      
      if (comment.created_by !== user.email) {
        return Response.json({ error: 'Forbidden: Only creator can delete' }, { status: 403 });
      }
      
      await base44.asServiceRole.entities.DocumentComment.delete(id);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});