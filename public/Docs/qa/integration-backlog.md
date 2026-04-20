# Backend Integration Backlog

Questa lista raccoglie i test da implementare contro il branch `qa` usando backend reale, Auth reale, database reale e edge functions reali.

## Obiettivo del layer

- validare workflow di business completi lato backend
- verificare denial path, side effects, sync accessi, notifiche e billing
- provare i contratti delle edge functions senza passare per la UI

## Suite da implementare

### Company bootstrap e membership

1. `createCompanyWithInitialization`:
   - crea `company`
   - crea `company_subscription` free
   - crea canale `General`
   - crea `company_member` owner admin
   - sincronizza accesso utente
   - fallisce con payload invalido
2. `inviteCompanyMemberWithValidation`:
   - invita utente esistente
   - invita email non registrata
   - rifiuta duplicate invite
   - rifiuta ruolo non valido
   - rifiuta chiamante non admin
   - genera notifiche ed email dove previsto
   - aggiorna membership e access sync all'attivazione

### Project bootstrap e partecipanti

3. `createProjectWithContext`:
   - progetto personale homeowner
   - progetto societario contractor
   - contractor invita homeowner in creazione
   - owner free bloccato al secondo progetto non sponsorizzato
   - societa paid crea progetto con auto sponsorship
   - chiamante non admin in company context viene rifiutato
4. `inviteProjectParticipantWithValidation`:
   - invito homeowner
   - invito subcontractor company
   - invito architect/engineer/surveyor/designer/consultant/supplier dove compatibile
   - rifiuto per company type incompatibile
   - rifiuto duplicate participant
   - rifiuto secondo homeowner
   - blocco inviti individuali in project free non sponsorizzato
   - blocco inviti personali in stato `blocked_for_sponsor_loss`
   - verifica notifiche e side effects

### Access sync e notifiche

5. `syncUserAccess`:
   - sync per un solo email
   - sync batch per societa
   - aggiunge `company_ids`
   - aggiunge `admin_company_ids`
   - aggiunge `project_ids`
   - rimuove accessi dopo disattivazione membership/participant
6. `sendNotificationOrEmail`:
   - solo notifica in-app
   - solo email
   - entrambi
   - opt-out email rispettato
   - deduplica entro finestra
   - fallback webhook se Resend non configurato

### Billing e Stripe

7. `createStripeCheckoutSession`:
   - crea sessione per societa free
   - rifiuta chiamanti non admin
   - applica rate limit user/company
   - salva metadata attesa
8. `createStripeBillingPortalSession`:
   - riusa customer esistente
   - crea customer se assente
   - rifiuta non-admin
9. `handleStripeWebhook`:
   - firma invalida
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - idempotenza `stripe_events`
   - downgrade con revoca sponsorship attive
10. `syncStripeCompanySubscription`:
   - riallinea stato locale a Stripe
   - gestisce customer/subscription mancanti
   - corregge drift dopo webhook perso

### Altre function operative

11. `notifyProjectSponsorshipParticipants`:
   - activation
   - revocation
   - solo partecipanti attivi
12. `notifyDisputeParticipants`:
   - dispute opened
   - dispute status changed
   - dispute commented
13. `notifyTaskBlockedResponsible`:
   - task blocked notifica il destinatario corretto
14. `submitDemoRequest`:
   - payload valido
   - payload invalido
   - consegna verso canale configurato

## Regole di implementazione

1. Ogni suite deve creare dati univoci e pulirli in modo esplicito.
2. Le asserzioni non devono fermarsi al `success: true`: devono verificare il grafo dati risultante.
3. Ogni denial path importante deve essere testato insieme al success path.