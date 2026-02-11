import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Valida se l'utente può eseguire un'azione su un CompanyMember
 * Regole:
 * - Solo admin della società può creare/aggiornare/eliminare membri
 * - Non può rimuovere se stesso
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, company_id, target_user_email } = await req.json();

    // Verifica che l'utente sia admin della società
    const memberships = await base44.entities.CompanyMember.filter({
      company_id,
      user_email: user.email,
      role: 'admin',
      status: 'active'
    });

    if (memberships.length === 0) {
      return Response.json({ 
        allowed: false, 
        reason: 'Solo gli amministratori possono gestire i membri' 
      });
    }

    // Verifica che non stia cercando di rimuovere se stesso
    if ((action === 'delete' || action === 'remove') && target_user_email === user.email) {
      return Response.json({ 
        allowed: false, 
        reason: 'Non puoi rimuovere te stesso dalla società' 
      });
    }

    return Response.json({ allowed: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});