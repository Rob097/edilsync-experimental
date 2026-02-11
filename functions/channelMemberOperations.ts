import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { operation, data, id, channel_id } = await req.json();

    // LIST/FILTER - creatore e partecipanti possono leggere
    if (operation === 'list' || operation === 'filter') {
      if (!channel_id) {
        return Response.json({ error: 'channel_id is required' }, { status: 400 });
      }
      
      const channel = await base44.asServiceRole.entities.Channel.get(channel_id);
      const members = await base44.asServiceRole.entities.ChannelMember.filter({ channel_id });
      
      // Verifica se l'utente è creatore o membro
      const isCreator = channel.created_by === user.email;
      const isMember = members.some(m => m.user_email === user.email);
      
      if (!isCreator && !isMember) {
        return Response.json({ error: 'Forbidden: Not a channel member' }, { status: 403 });
      }
      
      return Response.json({ success: true, data: members });
    }

    // CREATE - creatore e partecipanti possono creare
    if (operation === 'create') {
      const channel = await base44.asServiceRole.entities.Channel.get(data.channel_id);
      const members = await base44.asServiceRole.entities.ChannelMember.filter({ channel_id: data.channel_id });
      
      const isCreator = channel.created_by === user.email;
      const isMember = members.some(m => m.user_email === user.email);
      
      if (!isCreator && !isMember) {
        return Response.json({ error: 'Forbidden: Only channel creator or members can add members' }, { status: 403 });
      }
      
      const member = await base44.asServiceRole.entities.ChannelMember.create(data);
      return Response.json({ success: true, data: member });
    }

    // UPDATE - creatore del channel, creatore del member, o il member stesso
    if (operation === 'update') {
      const member = await base44.asServiceRole.entities.ChannelMember.get(id);
      const channel = await base44.asServiceRole.entities.Channel.get(member.channel_id);
      
      const isChannelCreator = channel.created_by === user.email;
      const isMemberCreator = member.created_by === user.email;
      const isSelf = member.user_email === user.email;
      
      let canUpdate = isChannelCreator || isMemberCreator || isSelf;
      
      // Se il membro è una società, verifica che sia admin
      if (!canUpdate && member.company_id) {
        const membership = await base44.asServiceRole.entities.CompanyMember.filter({
          company_id: member.company_id,
          user_email: user.email,
          role: 'admin',
          status: 'active'
        });
        canUpdate = membership.length > 0;
      }
      
      if (!canUpdate) {
        return Response.json({ error: 'Forbidden: Cannot update this member' }, { status: 403 });
      }
      
      const updated = await base44.asServiceRole.entities.ChannelMember.update(id, data);
      return Response.json({ success: true, data: updated });
    }

    // DELETE - creatore del channel, creatore del member, o il member stesso
    if (operation === 'delete') {
      const member = await base44.asServiceRole.entities.ChannelMember.get(id);
      const channel = await base44.asServiceRole.entities.Channel.get(member.channel_id);
      
      const isChannelCreator = channel.created_by === user.email;
      const isMemberCreator = member.created_by === user.email;
      const isSelf = member.user_email === user.email;
      
      let canDelete = isChannelCreator || isMemberCreator || isSelf;
      
      // Se il membro è una società, verifica che sia admin
      if (!canDelete && member.company_id) {
        const membership = await base44.asServiceRole.entities.CompanyMember.filter({
          company_id: member.company_id,
          user_email: user.email,
          role: 'admin',
          status: 'active'
        });
        canDelete = membership.length > 0;
      }
      
      if (!canDelete) {
        return Response.json({ error: 'Forbidden: Cannot delete this member' }, { status: 403 });
      }
      
      await base44.asServiceRole.entities.ChannelMember.delete(id);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});