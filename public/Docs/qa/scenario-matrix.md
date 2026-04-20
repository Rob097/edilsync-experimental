# QA Scenario Matrix

Questa matrice elenca gli scenari da coprire per arrivare al 100% della copertura di business in QA.

## Legenda

- `Primary layer`: layer dove lo scenario deve essere provato in modo autorevole
- `Secondary layers`: layer utili per rinforzare regressioni o dettagliare edge case
- `Source`: file o documento da considerare fonte di verita

## Auth e bootstrap

| Scenario ID | Scenario | Primary layer | Secondary layers | Source |
| --- | --- | --- | --- | --- |
| `auth.signin.accepts-valid-password` | Login con email e password valida | Playwright | Integration | `src/components/auth/AuthScreen.jsx`, `src/lib/AuthContext.jsx` |
| `auth.signin.rejects-invalid-password` | Login con credenziali invalide | Playwright | Vitest | `src/components/auth/AuthScreen.jsx` |
| `auth.signup.creates-session-or-confirmation-path` | Signup con login automatico o conferma richiesta | Playwright | Integration | `src/lib/AuthContext.jsx`, `src/api/appClient.js` |
| `auth.session.restore-existing-session` | Ripristino sessione al refresh | Playwright | Vitest | `src/lib/AuthContext.jsx` |
| `auth.session.logout-clears-state` | Logout pulisce stato e torna alla schermata auth | Playwright | Vitest | `src/lib/AuthContext.jsx` |
| `auth.bootstrap.creates-public-user-record` | Creazione del record `public.users` se manca | Integration | Vitest | `src/api/appClient.js` |
| `auth.bootstrap.recovers-from-conflicting-user-insert` | Race condition sul bootstrap utente gestita con recovery da conflict | Vitest | Playwright | `src/api/appClient.js` |
| `auth.guards.redirect-unauthenticated-user` | Route protette reindirizzano a login se non autenticato | Playwright | Vitest | `src/App.jsx` |

## Contesti e routing

| Scenario ID | Scenario | Primary layer | Secondary layers | Source |
| --- | --- | --- | --- | --- |
| `context.switch.personal-to-company-updates-visible-data` | Cambio contesto personale -> societa aggiorna dati visibili | Playwright | Vitest | `src/Layout.jsx`, `src/pages/Dashboard.jsx` |
| `context.switch.company-to-personal-updates-visible-data` | Cambio contesto societa -> personale aggiorna dati visibili | Playwright | Vitest | `src/Layout.jsx`, `src/pages/Dashboard.jsx` |
| `context.company-switcher.changes-active-company` | Cambio societa attiva nel contesto company | Playwright | Vitest | `src/components/context/ContextSwitcher.jsx` |
| `routing.operativa.denies-personal-user` | Area operativa negata in contesto personale | Playwright | Vitest | `src/operativa/OperativeAppRouter.jsx` |
| `routing.system-dashboard.denies-non-admin` | System dashboard visibile solo ad admin di piattaforma | Playwright | pgTAP | `src/pages/SystemDashboard.jsx` |
| `routing.web-admin.denies-normal-user` | Web admin negato a utente non admin | Playwright | Vitest | `src/web-admin/components/WebAdminGuard.jsx` |
| `routing.public.locales-resolve-correctly` | Routing pubblico IT/EN coerente con i path localizzati | Playwright | Vitest | `src/public/PublicSiteRouter.jsx` |
| `routing.legacy-legal-pages-redirect` | Redirect legacy delle pagine legali | Playwright | Vitest | `src/public/PublicSiteRouter.jsx` |

## Societa e membership

| Scenario ID | Scenario | Primary layer | Secondary layers | Source |
| --- | --- | --- | --- | --- |
| `company.create.bootstraps-free-subscription` | Creazione societa genera subscription free | Integration | pgTAP | `supabase/functions/createCompanyWithInitialization/index.ts` |
| `company.create.bootstraps-general-channel` | Creazione societa genera canale General | Integration | Playwright | `supabase/functions/createCompanyWithInitialization/index.ts` |
| `company.create.assigns-owner-admin` | Creatore diventa owner_admin/admin | Integration | pgTAP | `supabase/functions/createCompanyWithInitialization/index.ts` |
| `company.detail.billing-tab-visible-only-to-admin` | Billing tab visibile solo ad admin societa | Playwright | Vitest | `src/pages/CompanyDetail.jsx` |
| `company.invite.existing-user-creates-invited-membership` | Invito membro esistente genera membership invited | Integration | Playwright | `supabase/functions/inviteCompanyMemberWithValidation/index.ts` |
| `company.invite.new-user-preserves-invitation-flow` | Invito membro nuovo gestisce utente non ancora registrato | Integration | Playwright | `supabase/functions/inviteCompanyMemberWithValidation/index.ts` |
| `company.invite.rejects-duplicate-membership` | Invito duplicato rifiutato | Integration | pgTAP | `supabase/functions/inviteCompanyMemberWithValidation/index.ts` |
| `company.membership.syncs-user-company-access` | Membership aggiorna `company_ids` e `admin_company_ids` | Integration | pgTAP | `supabase/functions/_shared/access.ts` |
| `company.membership.general-channel-auto-membership` | Attivazione membro aggiunge al canale General | Integration | Playwright | `supabase/functions/inviteCompanyMemberWithValidation/index.ts` |
| `company.features.gate-chat-documents-time-billing` | Gating delle feature company per piano | Playwright | Integration | `src/hooks/useFeatureAccess.js`, pricing docs |

## Progetti e partecipanti

| Scenario ID | Scenario | Primary layer | Secondary layers | Source |
| --- | --- | --- | --- | --- |
| `project.create.personal-homeowner-flow` | Creazione progetto da contesto personale | Integration | Playwright | `supabase/functions/createProjectWithContext/index.ts` |
| `project.create.company-contractor-flow` | Creazione progetto da contesto societario contractor | Integration | Playwright | `supabase/functions/createProjectWithContext/index.ts` |
| `project.create.company-flow-invites-homeowner` | Contractor puo invitare homeowner in creazione progetto | Integration | Playwright | `supabase/functions/createProjectWithContext/index.ts` |
| `project.create.free-owner-limited-to-one-unsponsored` | Owner free limitato a un solo progetto non sponsorizzato | Integration | pgTAP | pricing docs, `createProjectWithContext` |
| `project.create.paid-company-auto-sponsors-on-create` | Paid company auto-sponsorizza il progetto in creazione | Integration | Playwright | pricing docs, `createProjectWithContext` |
| `project.participant.rejects-duplicate-homeowner` | Un solo homeowner per progetto | Integration | pgTAP | `inviteProjectParticipantWithValidation` |
| `project.participant.rejects-duplicate-participant` | Duplicate participant rifiutato | Integration | pgTAP | `inviteProjectParticipantWithValidation` |
| `project.participant.contractor-can-invite-subcontractor-only-as-company` | Contractor invita subappaltatori nel formato corretto | Integration | Playwright | `inviteProjectParticipantWithValidation` |
| `project.participant.enforces-company-type-role-compatibility` | Compatibilita tra tipo societa e ruolo progetto | Integration | Vitest | `src/lib/domainRoles.js`, `inviteProjectParticipantWithValidation` |
| `project.participant.free-unsponsored-allows-homeowner-only` | In free unsponsored owner-owned project gli inviti individuali sono limitati all'homeowner | Integration | Playwright | pricing docs, `inviteProjectParticipantWithValidation` |

## Pricing, sponsorship e feature access

| Scenario ID | Scenario | Primary layer | Secondary layers | Source |
| --- | --- | --- | --- | --- |
| `pricing.company-plan.active-is-entitled` | Solo `plan_code=paid` e `billing_status=active` danno entitlement | pgTAP | Integration | pricing authorization migration |
| `pricing.company-plan.past-due-is-not-entitled` | `past_due` non abilita feature premium | pgTAP | Integration | pricing docs, Stripe docs |
| `pricing.project.resolve-effective-plan-from-sponsor` | Piano effettivo progetto derivato dal sponsor valido | pgTAP | Integration | pricing authorization migration |
| `pricing.project.resolve-sponsor-invalid-when-unpaid` | Sponsor non valido se la societa non e paid active | pgTAP | Integration | downgrade visibility migration |
| `pricing.project.resolve-sponsor-invalid-when-not-participant` | Sponsor non valido se non e piu partecipante attivo | pgTAP | Integration | downgrade visibility migration |
| `pricing.sponsor-loss.transitions-to-blocked-state` | Perdita sponsor porta a `blocked_for_sponsor_loss` quando previsto | pgTAP | Playwright | downgrade visibility migration |
| `pricing.sponsor-loss.blocks-personal-invites` | Progetto bloccato puo invitare solo company fino al ripristino sponsorship | Integration | Playwright | `inviteProjectParticipantWithValidation` |
| `pricing.feature-access.enabled-limited-disabled` | Risoluzione feature access per tutti gli stati enabled/limited/disabled | pgTAP | Vitest | `src/hooks/useFeatureAccess.js`, pricing migrations |
| `pricing.gates.project-milestones-chat-documents-finance` | Gating macro-feature sul progetto | Playwright | Integration | `src/pages/ProjectDetail.jsx`, pricing docs |
| `pricing.gates.company-chat-documents-time-billing` | Gating macro-feature sulla societa | Playwright | Integration | `src/pages/CompanyDetail.jsx`, pricing docs |

## Billing e Stripe

| Scenario ID | Scenario | Primary layer | Secondary layers | Source |
| --- | --- | --- | --- | --- |
| `billing.checkout.creates-stripe-session` | Checkout session creata con metadata corretta | Integration | Playwright | `createStripeCheckoutSession` |
| `billing.checkout.applies-rate-limit` | Checkout soggetto a rate limiting | Integration | pgTAP | `createStripeCheckoutSession`, rate limit migration |
| `billing.portal.creates-or-reuses-customer` | Billing portal usa customer esistente o lo crea | Integration | Playwright | `createStripeBillingPortalSession` |
| `billing.webhook.rejects-invalid-signature` | Webhook rifiuta firma non valida | Integration | pgTAP | `handleStripeWebhook` |
| `billing.webhook.is-idempotent-on-stripe-events` | Evento Stripe duplicato non crea side effects doppi | Integration | pgTAP | `handleStripeWebhook`, `stripe_events` |
| `billing.webhook.activates-paid-plan` | Checkout completato attiva piano paid | Integration | Playwright | `handleStripeWebhook`, billing docs |
| `billing.webhook.cancellation-downgrades-company` | Cancellazione Stripe riporta la societa a free/canceled | Integration | Playwright | `handleStripeWebhook`, billing docs |
| `billing.webhook.revokes-active-sponsorships-on-plan-loss` | Perdita piano paid revoca sponsorship attive | Integration | pgTAP | `handleStripeWebhook`, pricing docs |
| `billing.sync.manual-reconciliation-fixes-drift` | Sync manuale corregge drift tra Stripe e stato locale | Integration | Playwright | `syncStripeCompanySubscription`, `CompanyBillingSection` |

## Notifiche ed email

| Scenario ID | Scenario | Primary layer | Secondary layers | Source |
| --- | --- | --- | --- | --- |
| `notifications.preferences.owner-can-read-and-update-self` | Utente puo leggere e aggiornare solo le proprie preferenze | pgTAP | Playwright | `entities/NotificationPreference.json` |
| `notifications.delivery.respects-email-opt-out` | Email non inviata quando l'utente ha opt-out | Integration | Playwright | `sendNotificationOrEmail`, preferences schema |
| `notifications.delivery.deduplicates-same-event-window` | Deduplica entro finestra temporale | Integration | pgTAP | `sendNotificationOrEmail` |
| `notifications.routing.message-mention-targets-project-chat` | Notifica mention apre la chat corretta | Playwright | Vitest | `src/pages/Notifications.jsx` |
| `notifications.routing.event-targets-calendar-context` | Notifiche evento aprono calendario/progetto corretto | Playwright | Vitest | `src/pages/Notifications.jsx` |
| `notifications.routing.billing-targets-company-detail` | Notifiche piano societa aprono Company Detail corretto | Playwright | Vitest | `src/pages/Notifications.jsx` |
| `notifications.sponsorship.activation-fans-out-to-active-participants` | Attivazione sponsorship notifica solo i partecipanti attivi | Integration | Playwright | `notifyProjectSponsorshipParticipants` |
| `notifications.disputes.open-status-comment-fan-out` | Dispute opened/status/commented arrivano ai soggetti giusti | Integration | Playwright | `notifyDisputeParticipants` |
| `notifications.task-blocked.routes-to-responsible` | Task blocked notifica il responsabile corretto | Integration | Playwright | `notifyTaskBlockedResponsible` |

## Task, milestone, eventi e calendario

| Scenario ID | Scenario | Primary layer | Secondary layers | Source |
| --- | --- | --- | --- | --- |
| `tasks.create.assign-user-or-company` | Creazione task con assegnazione user o company | Playwright | Integration | `TaskDialog.jsx` |
| `tasks.status.transition-updates-board` | Cambio stato task riflette board e overview | Playwright | Vitest | `TaskBoard.jsx`, `ProjectOverview.jsx` |
| `tasks.block.stores-reason-and-notifies` | Blocco task salva motivo e invia notifica | Playwright | Integration | `ProjectOverview.jsx`, `notifyTaskBlockedResponsible` |
| `milestones.feature-gated-in-free-projects` | Milestone non disponibili dove la feature e bloccata | Playwright | Integration | `ProjectDetail.jsx`, pricing docs |
| `milestones.link-and-unlink-tasks` | Task collegati e scollegati alle milestone correttamente | Playwright | Vitest | `MilestoneDialog.jsx` |
| `events.create.invites-participants` | Creazione evento con partecipanti | Playwright | Integration | `EventDialog.jsx` |
| `events.update-and-cancel-send-notifications` | Update e cancel evento notificano correttamente | Playwright | Integration | `EventDetailDialog.jsx` |
| `events.accept-conflict-cancels-related-event` | Accettazione con conflitto puo cancellare evento collegato | Playwright | Integration | `EventDetailDialog.jsx` |
| `calendar.filters-by-context-and-participation` | Calendario filtra eventi e task per contesto attivo | Playwright | Vitest | `Calendar.jsx` |

## Messaging, documenti, BIM, finance, operativa, public, admin

| Scenario ID | Scenario | Primary layer | Secondary layers | Source |
| --- | --- | --- | --- | --- |
| `messaging.channels.project-and-company-respect-scope` | Canali progetto e societa rispettano scope e membership | Playwright | pgTAP | messaging components |
| `messaging.limited-mode.general-only` | In modalita limited restano disponibili solo i canali concessi | Playwright | Integration | pricing docs, messaging UI |
| `messaging.mentions-create-notifications-with-linked-artifacts` | Mention di utenti e artefatti generano notifiche corrette | Playwright | Integration | `MessageInput.jsx` |
| `documents.upload.preview-comment-flow` | Upload, preview e commento documento | Playwright | Integration | document components |
| `documents.revisions.keep-single-current-revision` | Una sola current revision per root document | pgTAP | Playwright | document migrations |
| `documents.bim-files-require-premium-access` | IFC/GLB/GLTF richiedono feature premium attiva | pgTAP | Playwright | BIM gating migration |
| `finance.permissions.follow-role-and-context` | Visibilita finance dipende da ruolo e contesto | Vitest | Playwright | finance permissions files |
| `finance.work-session-cost-sync-respects-uniqueness` | Una work session produce al massimo un cost entry dedicato | pgTAP | Integration | finance migration |
| `operativa.entry-loads-company-workspaces-only` | Entry operativa mostra solo workspace societari disponibili | Playwright | Integration | `OperativeEntry.jsx` |
| `operativa.day-summary-shows-today-tasks-and-events` | Riepilogo operativo mostra task ed eventi del giorno | Playwright | Vitest | `OperativeDaySummary.jsx` |
| `settings.profile-language-and-preferences-persist` | Profilo, lingua e preferenze persistono | Playwright | Integration | `Settings.jsx` |
| `public.pricing-copy-matches-real-billing-model` | Pricing page coerente con piano free/paid/sponsorship reale | Playwright | Vitest | public pricing page, pricing docs |
| `public.contact-and-demo-request-validate-and-submit` | Contatto e demo request validano e inviano correttamente | Playwright | Integration | public contact pages, `submitDemoRequest` |
| `webadmin.admin-can-access-hidden-area` | Admin puo entrare nel web admin | Playwright | Integration | `WebAdminRouter.jsx` |
| `webadmin.normal-user-is-blocked` | Utente normale viene bloccato nel web admin | Playwright | Vitest | `WebAdminGuard.jsx` |

## Uso della matrice

1. Prima di implementare un test, associare il file o la suite a uno o piu `Scenario ID`.
2. Se uno scenario nuovo emerge da codice o documentazione, aggiungerlo qui prima di scrivere il test.
3. Se una business rule cambia, aggiornare questa matrice, la suite corrispondente e il PR template.