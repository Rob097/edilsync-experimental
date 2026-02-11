import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { operation, data, id, channel_id } = await req.json();

    // LIST/FILTER - tutti i partecipanti del channel possono leggere
    if (operation === 'list' || operation === 'filter') {
      if (!channel_id) {
        return Response.json({ error: 'channel_id is required' }, { status: 400 });
      }
      
      const members = await base44.asServiceRole.entities.ChannelMember.filter({ channel_id });
      const isMember = members.some(m => m.user_email === user.email);
      
      if (!isMember) {
        return Response.json({ error: 'Forbidden: Not a channel member' }, { status: 403 });
      }
      
      const messages = await base44.asServiceRole.entities.Message.filter({ channel_id });
      return Response.json({ success: true, data: messages });
    }

    // CREATE - tutti i partecipanti possono creare
    if (operation === 'create') {
      const members = await base44.asServiceRole.entities.ChannelMember.filter({ channel_id: data.channel_id });
      const isMember = members.some(m => m.user_email === user.email);
      
      if (!isMember) {
        return Response.json({ error: 'Forbidden: Not a channel member' }, { status: 403 });
      }
      
      const message = await base44.asServiceRole.entities.Message.create(data);
      return Response.json({ success: true, data: message });
    }

    // UPDATE - solo il creatore
    if (operation === 'update') {
      const message = await base44.asServiceRole.entities.Message.get(id);
      
      if (message.created_by !== user.email) {
        return Response.json({ error: 'Forbidden: Only creator can update' }, { status: 403 });
      }
      
      const updated = await base44.asServiceRole.entities.Message.update(id, data);
      return Response.json({ success: true, data: updated });
    }

    // DELETE - solo il creatore
    if (operation === 'delete') {
      const message = await base44.asServiceRole.entities.Message.get(id);
      
      if (message.created_by !== user.email) {
        return Response.json({ error: 'Forbidden: Only creator can delete' }, { status: 403 });
      }
      
      await base44.asServiceRole.entities.Message.delete(id);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});