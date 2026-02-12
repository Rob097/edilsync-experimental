import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { operation, data, id, project_id, company_id } = await req.json();

    // LIST/FILTER - dipende dal contesto
    if (operation === 'list' || operation === 'filter') {
      let channels = [];
      
      if (project_id) {
        // Canali di progetto
        const participation = await base44.asServiceRole.entities.ProjectParticipant.filter({
          project_id,
          user_email: user.email,
          status: 'active'
        });
        
        if (participation.length === 0) {
          return Response.json({ error: 'Forbidden: Not a project participant' }, { status: 403 });
        }
        
        channels = await base44.asServiceRole.entities.Channel.filter({ project_id });
      } else if (company_id) {
        // Canali di società
        const membership = await base44.asServiceRole.entities.CompanyMember.filter({
          company_id,
          user_email: user.email,
          status: 'active'
        });
        
        if (membership.length === 0) {
          return Response.json({ error: 'Forbidden: Not a company member' }, { status: 403 });
        }
        
        channels = await base44.asServiceRole.entities.Channel.filter({ company_id });
      }
      
      return Response.json({ success: true, data: channels });
    }

    // CREATE - dipende dal contesto
    if (operation === 'create') {
      if (data.project_id) {
        // Canale di progetto - verifica che sia partecipante o creatore del progetto
        const project = await base44.asServiceRole.entities.Project.get(data.project_id);
        const isProjectCreator = project.created_by === user.email;
        
        if (!isProjectCreator) {
          const participation = await base44.asServiceRole.entities.ProjectParticipant.filter({
            project_id: data.project_id,
            user_email: user.email,
            status: 'active'
          });
          
          if (participation.length === 0) {
            return Response.json({ error: 'Forbidden: Not a project participant' }, { status: 403 });
          }
          
          // Se il partecipante è una società, verifica che sia admin
          const userParticipation = participation[0];
          if (userParticipation.participant_type === 'company') {
            const membership = await base44.asServiceRole.entities.CompanyMember.filter({
              company_id: userParticipation.company_id,
              user_email: user.email,
              role: 'admin',
              status: 'active'
            });
            
            if (membership.length === 0) {
              return Response.json({ error: 'Forbidden: Only company admins can create channels' }, { status: 403 });
            }
          }
        }
      } else if (data.company_id) {
        // Canale di società - verifica che sia membro o creatore della società
        const company = await base44.asServiceRole.entities.Company.get(data.company_id);
        const isCompanyCreator = company.created_by === user.email;
        
        if (!isCompanyCreator) {
          const membership = await base44.asServiceRole.entities.CompanyMember.filter({
            company_id: data.company_id,
            user_email: user.email,
            status: 'active'
          });
          
          if (membership.length === 0) {
            return Response.json({ error: 'Forbidden: Not a company member' }, { status: 403 });
          }
        }
      }
      
      const channel = await base44.asServiceRole.entities.Channel.create(data);
      return Response.json({ success: true, data: channel });
    }

    // UPDATE - dipende dal contesto
    if (operation === 'update') {
      const channel = await base44.asServiceRole.entities.Channel.get(id);
      
      if (channel.company_id) {
        // Canale di società - tutti possono aggiornare
        const membership = await base44.asServiceRole.entities.CompanyMember.filter({
          company_id: channel.company_id,
          user_email: user.email,
          status: 'active'
        });
        
        if (membership.length === 0) {
          return Response.json({ error: 'Forbidden: Not a company member' }, { status: 403 });
        }
      } else if (channel.project_id) {
        // Canale di progetto - solo creatore o admin di società
        const isCreator = channel.created_by === user.email;
        
        if (!isCreator) {
          const participation = await base44.asServiceRole.entities.ProjectParticipant.filter({
            project_id: channel.project_id,
            user_email: user.email,
            status: 'active'
          });
          
          if (participation.length === 0) {
            return Response.json({ error: 'Forbidden: Not a project participant' }, { status: 403 });
          }
          
          // Se il partecipante è una società, verifica che sia admin
          const userParticipation = participation[0];
          if (userParticipation.participant_type === 'company') {
            const membership = await base44.asServiceRole.entities.CompanyMember.filter({
              company_id: userParticipation.company_id,
              user_email: user.email,
              role: 'admin',
              status: 'active'
            });
            
            if (membership.length === 0) {
              return Response.json({ error: 'Forbidden: Only creator or company admin can update' }, { status: 403 });
            }
          } else {
            return Response.json({ error: 'Forbidden: Only creator can update' }, { status: 403 });
          }
        }
      }
      
      const updated = await base44.asServiceRole.entities.Channel.update(id, data);
      return Response.json({ success: true, data: updated });
    }

    // DELETE - dipende dal contesto
    if (operation === 'delete') {
      const channel = await base44.asServiceRole.entities.Channel.get(id);
      
      if (channel.company_id) {
        // Canale di società - tutti possono eliminare
        const membership = await base44.asServiceRole.entities.CompanyMember.filter({
          company_id: channel.company_id,
          user_email: user.email,
          status: 'active'
        });
        
        if (membership.length === 0) {
          return Response.json({ error: 'Forbidden: Not a company member' }, { status: 403 });
        }
      } else {
        // Canale di progetto - solo creatore
        if (channel.created_by !== user.email) {
          return Response.json({ error: 'Forbidden: Only creator can delete' }, { status: 403 });
        }
      }
      
      await base44.asServiceRole.entities.Channel.delete(id);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});