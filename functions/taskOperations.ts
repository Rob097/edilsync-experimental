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
      
      const tasks = await base44.asServiceRole.entities.Task.filter({ project_id });
      return Response.json({ success: true, data: tasks });
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
      }
      
      const task = await base44.asServiceRole.entities.Task.create(data);
      return Response.json({ success: true, data: task });
    }

    // UPDATE - solo il creatore o l'assegnatario
    if (operation === 'update') {
      const task = await base44.asServiceRole.entities.Task.get(id);
      
      const isCreator = task.created_by === user.email;
      const isAssignee = task.assigned_user_email === user.email;
      
      if (!isCreator && !isAssignee) {
        return Response.json({ error: 'Forbidden: Only creator or assignee can update' }, { status: 403 });
      }
      
      const updated = await base44.asServiceRole.entities.Task.update(id, data);
      return Response.json({ success: true, data: updated });
    }

    // DELETE - solo il creatore
    if (operation === 'delete') {
      const task = await base44.asServiceRole.entities.Task.get(id);
      
      if (task.created_by !== user.email) {
        return Response.json({ error: 'Forbidden: Only creator can delete' }, { status: 403 });
      }
      
      await base44.asServiceRole.entities.Task.delete(id);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});