import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Valida se l'utente può eseguire un'azione su Milestone
 * Regole:
 * - Tutti i partecipanti possono creare/leggere/aggiornare
 * - Se partecipante è società: solo admin società possono creare/aggiornare
 * - Solo il creatore può eliminare
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, project_id } = await req.json();

    // Per CREATE e UPDATE: verifica se l'utente partecipa come società
    if (action === 'create' || action === 'update') {
      // Ottieni i partecipanti dell'utente nel progetto
      const userParticipants = await base44.entities.ProjectParticipant.filter({
        project_id,
        user_email: user.email,
        status: 'active'
      });

      // Se partecipa come società, deve essere admin
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
              reason: 'Solo gli amministratori della società possono creare/aggiornare milestone' 
            });
          }
        }
      }
    }

    return Response.json({ allowed: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});