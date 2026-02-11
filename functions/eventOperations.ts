import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { operation, data, id } = await req.json();

    // CREATE - dipende dal tipo di owner
    if (operation === 'create') {
      if (data.owner_user_id) {
        // Solo l'utente proprietario può creare
        if (data.owner_user_id !== user.id) {
          return Response.json({ error: 'Forbidden: Can only create events for yourself' }, { status: 403 });
        }
      } else if (data.owner_company_id) {
        // Tutti i partecipanti della società possono creare
        const membership = await base44.asServiceRole.entities.CompanyMember.filter({
          company_id: data.owner_company_id,
          user_email: user.email,
          status: 'active'
        });
        
        if (membership.length === 0) {
          return Response.json({ error: 'Forbidden: Not a company member' }, { status: 403 });
        }
      } else if (data.owner_project_id) {
        // Tutti i partecipanti al progetto possono creare
        const participation = await base44.asServiceRole.entities.ProjectParticipant.filter({
          project_id: data.owner_project_id,
          user_email: user.email,
          status: 'active'
        });
        
        if (participation.length === 0) {
          return Response.json({ error: 'Forbidden: Not a project participant' }, { status: 403 });
        }
      }
      
      const event = await base44.asServiceRole.entities.Event.create(data);
      return Response.json({ success: true, data: event });
    }

    // LIST - eventi dove l'utente è coinvolto
    if (operation === 'list' || operation === 'filter') {
      const allEvents = await base44.asServiceRole.entities.Event.list();
      const eventParticipants = await base44.asServiceRole.entities.EventParticipant.filter({
        user_email: user.email
      });
      const participantEventIds = eventParticipants.map(ep => ep.event_id);
      
      const filtered = allEvents.filter(e => {
        // Eventi personali
        if (e.owner_user_id === user.id) return true;
        
        // Eventi dove è partecipante
        if (participantEventIds.includes(e.id)) return true;
        
        return false;
      });
      
      // Aggiungi anche eventi di società e progetti
      const companyMemberships = await base44.asServiceRole.entities.CompanyMember.filter({
        user_email: user.email,
        status: 'active'
      });
      const companyIds = companyMemberships.map(m => m.company_id);
      
      const projectParticipations = await base44.asServiceRole.entities.ProjectParticipant.filter({
        user_email: user.email,
        status: 'active'
      });
      const projectIds = projectParticipations.map(p => p.project_id);
      
      const allEventsFiltered = allEvents.filter(e => {
        if (filtered.find(f => f.id === e.id)) return true;
        if (e.owner_company_id && companyIds.includes(e.owner_company_id)) return true;
        if (e.owner_project_id && projectIds.includes(e.owner_project_id)) return true;
        return false;
      });
      
      return Response.json({ success: true, data: allEventsFiltered });
    }

    // GET - verifica accesso
    if (operation === 'get') {
      const event = await base44.asServiceRole.entities.Event.get(id);
      
      // Verifica se l'utente può leggere
      let canRead = false;
      
      if (event.owner_user_id === user.id) {
        canRead = true;
      } else if (event.owner_company_id) {
        const membership = await base44.asServiceRole.entities.CompanyMember.filter({
          company_id: event.owner_company_id,
          user_email: user.email,
          status: 'active'
        });
        canRead = membership.length > 0;
      } else if (event.owner_project_id) {
        const participation = await base44.asServiceRole.entities.ProjectParticipant.filter({
          project_id: event.owner_project_id,
          user_email: user.email,
          status: 'active'
        });
        canRead = participation.length > 0;
      }
      
      // Verifica se è partecipante
      const eventParticipant = await base44.asServiceRole.entities.EventParticipant.filter({
        event_id: id,
        user_email: user.email
      });
      if (eventParticipant.length > 0) canRead = true;
      
      if (!canRead) {
        return Response.json({ error: 'Forbidden: Cannot read this event' }, { status: 403 });
      }
      
      return Response.json({ success: true, data: event });
    }

    // UPDATE/DELETE - dipende dal tipo di owner
    if (operation === 'update' || operation === 'delete') {
      const event = await base44.asServiceRole.entities.Event.get(id);
      let canModify = false;
      
      if (event.owner_user_id) {
        canModify = event.owner_user_id === user.id;
      } else if (event.owner_company_id) {
        const membership = await base44.asServiceRole.entities.CompanyMember.filter({
          company_id: event.owner_company_id,
          user_email: user.email,
          status: 'active'
        });
        canModify = membership.length > 0;
      } else if (event.owner_project_id) {
        const participation = await base44.asServiceRole.entities.ProjectParticipant.filter({
          project_id: event.owner_project_id,
          user_email: user.email,
          status: 'active'
        });
        canModify = participation.length > 0;
      }
      
      if (!canModify) {
        return Response.json({ error: 'Forbidden: Cannot modify this event' }, { status: 403 });
      }
      
      if (operation === 'update') {
        const updated = await base44.asServiceRole.entities.Event.update(id, data);
        return Response.json({ success: true, data: updated });
      } else {
        await base44.asServiceRole.entities.Event.delete(id);
        return Response.json({ success: true });
      }
    }

    return Response.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});