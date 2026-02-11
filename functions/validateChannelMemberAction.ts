import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Valida se l'utente può eseguire un'azione su ChannelMember
 * Regole:
 * - Creatore channel e partecipanti possono creare/leggere
 * - Possono aggiornare/eliminare: creatore channel, creatore member, il member stesso
 * - Se member è società: solo admin società possono aggiornare/eliminare
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, channel_id, member_id, member_user_email, member_company_id } = await req.json();

    // Per UPDATE/DELETE
    if (action === 'update' || action === 'delete') {
      // Verifica se è il creatore del channel
      const channels = await base44.asServiceRole.entities.Channel.filter({ id: channel_id });
      if (channels.length > 0 && channels[0].created_by === user.email) {
        return Response.json({ allowed: true });
      }

      // Verifica se è il creatore del member
      if (member_id) {
        const members = await base44.asServiceRole.entities.ChannelMember.filter({ id: member_id });
        if (members.length > 0 && members[0].created_by === user.email) {
          return Response.json({ allowed: true });
        }
      }

      // Verifica se è il member stesso
      if (member_user_email === user.email) {
        return Response.json({ allowed: true });
      }

      // Verifica se è admin della società del member
      if (member_company_id) {
        const memberships = await base44.entities.CompanyMember.filter({
          company_id: member_company_id,
          user_email: user.email,
          role: 'admin',
          status: 'active'
        });

        if (memberships.length > 0) {
          return Response.json({ allowed: true });
        }
      }

      return Response.json({ 
        allowed: false, 
        reason: 'Non hai i permessi per modificare questo membro del canale' 
      });
    }

    return Response.json({ allowed: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});