import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Valida se l'utente può eseguire un'azione su ProjectParticipant
 * Regole:
 * - Tutti i partecipanti possono creare nuovi partecipanti
 * - Se partecipante è società: solo admin società possono creare
 * - Solo il creatore del progetto o il creatore del partecipante possono aggiornare/rimuovere
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, project_id, participant_company_id, participant_id } = await req.json();

    // Per CREATE: verifica se è admin della società (se partecipante è società)
    if (action === 'create' && participant_company_id) {
      const memberships = await base44.entities.CompanyMember.filter({
        company_id: participant_company_id,
        user_email: user.email,
        role: 'admin',
        status: 'active'
      });

      if (memberships.length === 0) {
        return Response.json({ 
          allowed: false, 
          reason: 'Solo gli amministratori possono aggiungere la società come partecipante' 
        });
      }
    }

    // Per UPDATE/DELETE: verifica se è il creatore del progetto
    if (action === 'update' || action === 'delete') {
      const projects = await base44.asServiceRole.entities.Project.filter({ id: project_id });
      
      if (projects.length > 0 && projects[0].created_by === user.email) {
        return Response.json({ allowed: true });
      }

      // Oppure se è il creatore del partecipante
      if (participant_id) {
        const participants = await base44.asServiceRole.entities.ProjectParticipant.filter({ id: participant_id });
        
        if (participants.length > 0 && participants[0].created_by === user.email) {
          return Response.json({ allowed: true });
        }
      }

      return Response.json({ 
        allowed: false, 
        reason: 'Solo il creatore del progetto o del partecipante può modificarlo' 
      });
    }

    return Response.json({ allowed: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});