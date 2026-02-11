import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Valida se l'utente può eseguire un'azione su Channel
 * Regole:
 * - Channel progetto: tutti partecipanti possono creare/leggere
 * - Se partecipante è società: solo admin società possono creare/aggiornare
 * - Solo creatore può aggiornare/eliminare
 * - Channel società: tutti membri possono creare/leggere/aggiornare/eliminare
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, project_id, company_id, channel_id } = await req.json();

    // Se è un channel di società
    if (company_id) {
      const memberships = await base44.entities.CompanyMember.filter({
        company_id,
        user_email: user.email,
        status: 'active'
      });

      if (memberships.length === 0) {
        return Response.json({ 
          allowed: false, 
          reason: 'Devi essere membro della società' 
        });
      }

      // Tutti i membri possono fare tutto sui channel della società
      return Response.json({ allowed: true });
    }

    // Se è un channel di progetto
    if (project_id) {
      // Per CREATE: verifica se partecipa come società e se è admin
      if (action === 'create') {
        const userParticipants = await base44.entities.ProjectParticipant.filter({
          project_id,
          user_email: user.email,
          status: 'active'
        });

        for (const participant of userParticipants) {
          if (participant.participant_type === 'company' && participant.company_id) {
            const memberships = await base44.entities.CompanyMember.filter({
              company_id: participant.company_id,
              user_email: user.email,
              role: 'admin',
              status: 'active'
            });

            if (memberships.length === 0) {
              return Response.json({ 
                allowed: false, 
                reason: 'Solo gli amministratori della società possono creare canali' 
              });
            }
          }
        }
      }

      // Per UPDATE: verifica se partecipa come società e se è admin
      if (action === 'update') {
        // Prima verifica se è il creatore
        if (channel_id) {
          const channels = await base44.asServiceRole.entities.Channel.filter({ id: channel_id });
          if (channels.length > 0 && channels[0].created_by === user.email) {
            return Response.json({ allowed: true });
          }
        }

        // Altrimenti verifica se è admin di società partecipante
        const userParticipants = await base44.entities.ProjectParticipant.filter({
          project_id,
          user_email: user.email,
          status: 'active'
        });

        for (const participant of userParticipants) {
          if (participant.participant_type === 'company' && participant.company_id) {
            const memberships = await base44.entities.CompanyMember.filter({
              company_id: participant.company_id,
              user_email: user.email,
              role: 'admin',
              status: 'active'
            });

            if (memberships.length > 0) {
              return Response.json({ allowed: true });
            }
          }
        }

        return Response.json({ 
          allowed: false, 
          reason: 'Solo il creatore o gli admin della società possono aggiornare il canale' 
        });
      }
    }

    return Response.json({ allowed: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});