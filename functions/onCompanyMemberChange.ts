import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Gestisce l'aggiunta/rimozione automatica ai canali General quando un membro viene aggiunto/rimosso da una società
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    // Handle create event - add member to General channel
    if (event.type === 'create' && data && data.status === 'active') {
      const { company_id, user_email, id: member_id } = data;

      // Find General channel for the company
      const channels = await base44.asServiceRole.entities.Channel.filter({
        company_id,
        name: 'General',
        type: 'company',
      });

      if (channels.length > 0) {
        const generalChannel = channels[0];

        // Check if member is already in channel
        const existingMembers = await base44.asServiceRole.entities.ChannelMember.filter({
          channel_id: generalChannel.id,
          user_email,
        });

        if (existingMembers.length === 0) {
          // Add member to General channel
          await base44.asServiceRole.entities.ChannelMember.create({
            channel_id: generalChannel.id,
            project_id: null,
            participant_id: member_id,
            user_email,
            company_id,
          });
        }
      }
    }

    // Handle update event - if status changed to inactive, remove from channel
    if (event.type === 'update' && data && old_data) {
      if (old_data.status === 'active' && data.status !== 'active') {
        const { company_id, user_email } = data;

        // Find General channel
        const channels = await base44.asServiceRole.entities.Channel.filter({
          company_id,
          name: 'General',
          type: 'company',
        });

        if (channels.length > 0) {
          const generalChannel = channels[0];

          // Remove member from channel
          const channelMembers = await base44.asServiceRole.entities.ChannelMember.filter({
            channel_id: generalChannel.id,
            user_email,
          });

          for (const member of channelMembers) {
            await base44.asServiceRole.entities.ChannelMember.delete(member.id);
          }
        }
      }
    }

    // Handle delete event - remove from channel
    if (event.type === 'delete' && old_data) {
      const { company_id, user_email } = old_data;

      // Find General channel
      const channels = await base44.asServiceRole.entities.Channel.filter({
        company_id,
        name: 'General',
        type: 'company',
      });

      if (channels.length > 0) {
        const generalChannel = channels[0];

        // Remove member from channel
        const channelMembers = await base44.asServiceRole.entities.ChannelMember.filter({
          channel_id: generalChannel.id,
          user_email,
        });

        for (const member of channelMembers) {
          await base44.asServiceRole.entities.ChannelMember.delete(member.id);
        }
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error in onCompanyMemberChange:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});