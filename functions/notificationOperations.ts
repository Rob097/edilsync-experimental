import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { operation, data, id } = await req.json();

    // CREATE - nessuna restrizione (sistema può creare)
    if (operation === 'create') {
      const notification = await base44.asServiceRole.entities.Notification.create(data);
      return Response.json({ success: true, data: notification });
    }

    // LIST/FILTER - solo l'utente destinatario
    if (operation === 'list' || operation === 'filter') {
      const notifications = await base44.asServiceRole.entities.Notification.filter({
        user_email: user.email
      });
      return Response.json({ success: true, data: notifications });
    }

    // GET - solo l'utente destinatario
    if (operation === 'get') {
      const notification = await base44.asServiceRole.entities.Notification.get(id);
      
      if (notification.user_email !== user.email) {
        return Response.json({ error: 'Forbidden: Not your notification' }, { status: 403 });
      }
      
      return Response.json({ success: true, data: notification });
    }

    // UPDATE - solo l'utente destinatario
    if (operation === 'update') {
      const notification = await base44.asServiceRole.entities.Notification.get(id);
      
      if (notification.user_email !== user.email) {
        return Response.json({ error: 'Forbidden: Not your notification' }, { status: 403 });
      }
      
      const updated = await base44.asServiceRole.entities.Notification.update(id, data);
      return Response.json({ success: true, data: updated });
    }

    // DELETE - solo l'utente destinatario
    if (operation === 'delete') {
      const notification = await base44.asServiceRole.entities.Notification.get(id);
      
      if (notification.user_email !== user.email) {
        return Response.json({ error: 'Forbidden: Not your notification' }, { status: 403 });
      }
      
      await base44.asServiceRole.entities.Notification.delete(id);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});