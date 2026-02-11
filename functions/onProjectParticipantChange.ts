import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Gestisce l'aggiunta/rimozione automatica ai canali General quando un partecipante viene aggiunto/rimosso da un progetto
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    // Handle create event - add participant to General channel
    if (event.type === 'create' && data && data.status === 'active') {
      const { project_id, user_email, company_id, id: participant_id } = data;

      // Find General channel for the project
      const channels = await base44.asServiceRole.entities.Channel.filter({
        project_id,
        name: 'General',
        type: 'general',
      });

      if (channels.length > 0) {
        const generalChannel = channels[0];

        // Check if participant is already in channel
        const existingMembers = await base44.asServiceRole.entities.ChannelMember.filter({
          channel_id: generalChannel.id,
          user_email,
        });

        if (existingMembers.length === 0) {
          // Add participant to General channel
          await base44.asServiceRole.entities.ChannelMember.create({
            channel_id: generalChannel.id,
            project_id,
            participant_id,
            user_email,
            company_id: company_id || null,
          });
        }
      }
    }

    // Handle update event - if status changed to inactive/removed, remove from channel
    if (event.type === 'update' && data && old_data) {
      if (old_data.status === 'active' && (data.status === 'removed' || data.status === 'declined')) {
        const { project_id, user_email } = data;

        // Find General channel
        const channels = await base44.asServiceRole.entities.Channel.filter({
          project_id,
          name: 'General',
          type: 'general',
        });

        if (channels.length > 0) {
          const generalChannel = channels[0];

          // Remove participant from channel
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
      const { project_id, user_email } = old_data;

      // Find General channel
      const channels = await base44.asServiceRole.entities.Channel.filter({
        project_id,
        name: 'General',
        type: 'general',
      });

      if (channels.length > 0) {
        const generalChannel = channels[0];

        // Remove participant from channel
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
    console.error('Error in onProjectParticipantChange:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});