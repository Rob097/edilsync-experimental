import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Valida se l'utente può eseguire un'azione su una ChangeRequest
 * Regole:
 * - Solo il committente può creare
 * - Il committente può aggiornare
 * - Se esiste assegnatario: solo assegnatario può leggere/aggiornare
 * - Se non esiste assegnatario: tutti i partecipanti possono leggere/aggiornare
 * - Se assegnatario è società: solo admin società possono aggiornare
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, project_id, change_request_id, assigned_participant_id, assigned_company_id } = await req.json();

    // Per CREATE: verifica che l'utente sia il committente (homeowner)
    if (action === 'create') {
      const participants = await base44.entities.ProjectParticipant.filter({
        project_id,
        user_email: user.email,
        project_role: 'homeowner',
        status: 'active'
      });

      if (participants.length === 0) {
        return Response.json({ 
          allowed: false, 
          reason: 'Solo il committente può creare una richiesta di modifica' 
        });
      }

      return Response.json({ allowed: true });
    }

    // Per READ e UPDATE: verifica l'accesso in base all'assegnatario
    if (action === 'read' || action === 'update') {
      // Se c'è un assegnatario
      if (assigned_participant_id) {
        // Verifica se l'utente è l'assegnatario personale
        const participant = await base44.entities.ProjectParticipant.filter({
          id: assigned_participant_id,
          user_email: user.email
        });

        if (participant.length > 0) {
          return Response.json({ allowed: true });
        }

        // Verifica se l'utente fa parte della società assegnataria
        if (assigned_company_id) {
          const companyMembers = await base44.entities.CompanyMember.filter({
            company_id: assigned_company_id,
            user_email: user.email,
            status: 'active'
          });

          // Per UPDATE: solo admin della società
          if (action === 'update') {
            const isAdmin = companyMembers.some(m => m.role === 'admin');
            if (!isAdmin) {
              return Response.json({ 
                allowed: false, 
                reason: 'Solo gli amministratori della società assegnataria possono aggiornare' 
              });
            }
          }

          if (companyMembers.length > 0) {
            return Response.json({ allowed: true });
          }
        }

        // Verifica se è il creatore (committente)
        if (change_request_id) {
          const changeRequests = await base44.asServiceRole.entities.ChangeRequest.filter({ id: change_request_id });
          if (changeRequests.length > 0 && changeRequests[0].created_by === user.email) {
            return Response.json({ allowed: true });
          }
        }

        return Response.json({ 
          allowed: false, 
          reason: 'Solo l\'assegnatario può accedere a questa richiesta' 
        });
      }

      // Se non c'è assegnatario: tutti i partecipanti al progetto possono accedere
      const participants = await base44.entities.ProjectParticipant.filter({
        project_id,
        user_email: user.email,
        status: 'active'
      });

      if (participants.length === 0) {
        return Response.json({ 
          allowed: false, 
          reason: 'Devi essere un partecipante al progetto' 
        });
      }

      return Response.json({ allowed: true });
    }

    return Response.json({ allowed: false, reason: 'Azione non riconosciuta' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});