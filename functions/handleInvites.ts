/**
 * Backend function to handle invites for companies, projects, and events
 * Sends emails and creates notifications
 */

export async function handleCompanyInvite(request) {
  const { member_id } = request;
  
  try {
    const member = await base44.asServiceRole.entities.CompanyMember.read(member_id);
    if (!member) throw new Error('Member not found');

    const company = await base44.asServiceRole.entities.Company.read(member.company_id);
    const user = await base44.asServiceRole.entities.User.filter({ email: member.user_email })[0];

    // Send email invitation
    await base44.integrations.Core.SendEmail({
      to: member.user_email,
      subject: `Invito a far parte di ${company.name}`,
      body: `
        <h2>Invito a ${company.name}</h2>
        <p>Ciao,</p>
        <p>Sei stato invitato a far parte della società <strong>${company.name}</strong> come <strong>${member.role}</strong>.</p>
        ${company.description ? `<p><strong>Descrizione:</strong> ${company.description}</p>` : ''}
        <p>
          <a href="${process.env.APP_URL}/accept-company-invite?member_id=${member.id}&token=${generateToken(member.id)}" 
             style="background-color: #ef6144; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Accetta invito
          </a>
        </p>
        <p style="color: #666; font-size: 12px;">Se non riconosci questa azione, ignora questo messaggio.</p>
      `,
    });

    // Create in-app notification
    await base44.asServiceRole.entities.Notification.create({
      user_email: member.user_email,
      type: 'event_invite',
      title: `Invito a ${company.name}`,
      message: `Sei stato invitato a far parte di ${company.name} come ${member.role}`,
      related_event_id: member.company_id,
      is_read: false,
    });

    return { success: true, message: 'Invitation sent' };
  } catch (error) {
    console.error('Error in handleCompanyInvite:', error);
    throw error;
  }
}

export async function handleProjectInvite(request) {
  const { participant_id } = request;

  try {
    const participant = await base44.asServiceRole.entities.ProjectParticipant.read(participant_id);
    if (!participant) throw new Error('Participant not found');

    const project = await base44.asServiceRole.entities.Project.read(participant.project_id);

    if (participant.participant_type === 'company') {
      // Notify all company members
      const members = await base44.asServiceRole.entities.CompanyMember.filter({
        company_id: participant.company_id,
        status: 'active',
      });

      for (const member of members) {
        // Send email
        await base44.integrations.Core.SendEmail({
          to: member.user_email,
          subject: `Invito al progetto ${project.name}`,
          body: `
            <h2>Nuovo progetto: ${project.name}</h2>
            <p>Ciao,</p>
            <p>La tua società è stata invitata a partecipare al progetto <strong>${project.name}</strong> come <strong>${participant.project_role}</strong>.</p>
            ${project.description ? `<p><strong>Descrizione:</strong> ${project.description}</p>` : ''}
            <p><strong>Indirizzo:</strong> ${project.address}</p>
            <p>
              <a href="${process.env.APP_URL}/projects" 
                 style="background-color: #ef6144; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Visualizza progetto
              </a>
            </p>
          `,
        });

        // Create notification
        await base44.asServiceRole.entities.Notification.create({
          user_email: member.user_email,
          type: 'event_invite',
          title: `Invito progetto: ${project.name}`,
          message: `La tua società è stata invitata al progetto "${project.name}" come ${participant.project_role}`,
          related_event_id: participant.project_id,
          is_read: false,
        });
      }
    } else if (participant.participant_type === 'personal') {
      // Send email to individual
      await base44.integrations.Core.SendEmail({
        to: participant.user_email,
        subject: `Invito al progetto ${project.name}`,
        body: `
          <h2>Nuovo progetto: ${project.name}</h2>
          <p>Ciao,</p>
          <p>Sei stato invitato a partecipare al progetto <strong>${project.name}</strong> come <strong>${participant.project_role}</strong>.</p>
          ${project.description ? `<p><strong>Descrizione:</strong> ${project.description}</p>` : ''}
          <p><strong>Indirizzo:</strong> ${project.address}</p>
          <p>
            <a href="${process.env.APP_URL}/projects" 
               style="background-color: #ef6144; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Visualizza progetto
            </a>
          </p>
        `,
      });

      // Create notification
      await base44.asServiceRole.entities.Notification.create({
        user_email: participant.user_email,
        type: 'event_invite',
        title: `Invito progetto: ${project.name}`,
        message: `Sei stato invitato al progetto "${project.name}" come ${participant.project_role}`,
        related_event_id: participant.project_id,
        is_read: false,
      });
    }

    return { success: true, message: 'Project invitation sent' };
  } catch (error) {
    console.error('Error in handleProjectInvite:', error);
    throw error;
  }
}

export async function handleEventInvite(request) {
  const { event_participant_id } = request;

  try {
    const eventParticipant = await base44.asServiceRole.entities.EventParticipant.read(event_participant_id);
    if (!eventParticipant) throw new Error('Event participant not found');

    const event = await base44.asServiceRole.entities.Event.read(eventParticipant.event_id);
    const conflictEvent = eventParticipant.conflict_event_id 
      ? await base44.asServiceRole.entities.Event.read(eventParticipant.conflict_event_id)
      : null;

    if (eventParticipant.participant_type === 'user' && eventParticipant.user_email) {
      const conflictWarning = conflictEvent 
        ? `<p style="color: #d9553a; font-weight: bold;">⚠️ ATTENZIONE: Hai un conflitto con l'evento "${conflictEvent.title}" nello stesso orario.</p>`
        : '';

      await base44.integrations.Core.SendEmail({
        to: eventParticipant.user_email,
        subject: `Invito evento: ${event.title}`,
        body: `
          <h2>Invito a evento: ${event.title}</h2>
          <p>Ciao,</p>
          <p>Sei stato invitato all'evento <strong>${event.title}</strong>.</p>
          <p><strong>Data:</strong> ${new Date(event.start_datetime).toLocaleString('it-IT')}</p>
          ${event.location ? `<p><strong>Luogo:</strong> ${event.location}</p>` : ''}
          ${event.description ? `<p><strong>Descrizione:</strong> ${event.description}</p>` : ''}
          ${conflictWarning}
          <p>
            <a href="${process.env.APP_URL}/calendar" 
               style="background-color: #ef6144; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Visualizza calendario
            </a>
          </p>
        `,
      });
    } else if (eventParticipant.participant_type === 'company') {
      // Notify all company members
      const members = await base44.asServiceRole.entities.CompanyMember.filter({
        company_id: eventParticipant.company_id,
        status: 'active',
      });

      const conflictWarning = conflictEvent
        ? `<p style="color: #d9553a; font-weight: bold;">⚠️ ATTENZIONE: Alcuni membri hanno conflitti con l'evento "${conflictEvent.title}".</p>`
        : '';

      for (const member of members) {
        await base44.integrations.Core.SendEmail({
          to: member.user_email,
          subject: `Invito evento: ${event.title}`,
          body: `
            <h2>Invito a evento: ${event.title}</h2>
            <p>Ciao,</p>
            <p>La tua società è stata invitata all'evento <strong>${event.title}</strong>.</p>
            <p><strong>Data:</strong> ${new Date(event.start_datetime).toLocaleString('it-IT')}</p>
            ${event.location ? `<p><strong>Luogo:</strong> ${event.location}</p>` : ''}
            ${event.description ? `<p><strong>Descrizione:</strong> ${event.description}</p>` : ''}
            ${conflictWarning}
            <p>
              <a href="${process.env.APP_URL}/calendar" 
                 style="background-color: #ef6144; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Visualizza calendario
              </a>
            </p>
          `,
        });
      }
    }

    // Create in-app notification
    const notificationTitle = eventParticipant.participant_type === 'user'
      ? `Invito evento: ${event.title}`
      : `Evento: ${event.title}`;

    const notificationEmails = eventParticipant.participant_type === 'user'
      ? [eventParticipant.user_email]
      : (await base44.asServiceRole.entities.CompanyMember.filter({
          company_id: eventParticipant.company_id,
          status: 'active',
        })).map(m => m.user_email);

    for (const email of notificationEmails) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: email,
        type: 'event_invite',
        title: notificationTitle,
        message: `Invito a "${event.title}" - ${new Date(event.start_datetime).toLocaleDateString('it-IT')}`,
        related_event_id: event.id,
        is_read: false,
      });
    }

    return { success: true, message: 'Event invitation sent' };
  } catch (error) {
    console.error('Error in handleEventInvite:', error);
    throw error;
  }
}

export async function acceptCompanyInvite(request) {
  const { member_id } = request;

  try {
    await base44.asServiceRole.entities.CompanyMember.update(member_id, { status: 'active' });

    const member = await base44.asServiceRole.entities.CompanyMember.read(member_id);
    const company = await base44.asServiceRole.entities.Company.read(member.company_id);

    // Notify company admins
    const adminMembers = await base44.asServiceRole.entities.CompanyMember.filter({
      company_id: member.company_id,
      role: 'admin',
      status: 'active',
    });

    const user = await base44.asServiceRole.entities.User.filter({ email: member.user_email });
    const userName = user?.[0]?.display_name || user?.[0]?.full_name || member.user_email;

    for (const admin of adminMembers) {
      if (admin.user_email !== member.user_email) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: admin.user_email,
          type: 'participant_declined', // Reusing type for member accepted
          title: `${userName} ha accettato l'invito`,
          message: `${userName} è ora parte di ${company.name}`,
          related_event_id: member.company_id,
          is_read: false,
        });
      }
    }

    return { success: true, message: 'Invitation accepted' };
  } catch (error) {
    console.error('Error in acceptCompanyInvite:', error);
    throw error;
  }
}

export async function rejectCompanyInvite(request) {
  const { member_id } = request;

  try {
    const member = await base44.asServiceRole.entities.CompanyMember.read(member_id);
    const company = await base44.asServiceRole.entities.Company.read(member.company_id);

    await base44.asServiceRole.entities.CompanyMember.update(member_id, { status: 'inactive' });

    // Notify company admins
    const adminMembers = await base44.asServiceRole.entities.CompanyMember.filter({
      company_id: member.company_id,
      role: 'admin',
      status: 'active',
    });

    const user = await base44.asServiceRole.entities.User.filter({ email: member.user_email });
    const userName = user?.[0]?.display_name || user?.[0]?.full_name || member.user_email;

    for (const admin of adminMembers) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: admin.user_email,
        type: 'participant_declined',
        title: `${userName} ha rifiutato l'invito`,
        message: `${userName} ha rifiutato l'invito a ${company.name}`,
        related_event_id: member.company_id,
        is_read: false,
      });
    }

    return { success: true, message: 'Invitation rejected' };
  } catch (error) {
    console.error('Error in rejectCompanyInvite:', error);
    throw error;
  }
}

// Helper function to generate secure tokens (implement with proper token generation)
function generateToken(memberId) {
  // This is a simplified version. In production, use proper JWT or similar
  return Buffer.from(`${memberId}:${Date.now()}`).toString('base64');
}