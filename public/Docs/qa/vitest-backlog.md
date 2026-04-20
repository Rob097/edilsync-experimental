# Vitest Backlog

Questa lista raccoglie i test da implementare nel layer unitario e di logica pura.

## Obiettivo del layer

- validare logica deterministica senza I/O remoto
- isolare matrici permessi, mapping, state transitions e helper riusati in piu schermate
- intercettare regressioni veloci in CI base

## Suite da implementare

### Auth e bootstrap

1. Estendere `src/api/appClient.js` con test su `getUserRecord()`:
   - utente autenticato con record esistente
   - utente autenticato senza record `public.users`
   - bind di `auth_user_id` quando il record esiste ma non e legato
   - recovery da `409 conflict` su insert concorrente
2. Aggiungere test per `src/lib/AuthContext.jsx`:
   - `checkUserAuth()` in successo e fallimento
   - `signInWithPassword()` aggiorna `user`, `isAuthenticated`, `authError`
   - `signUpWithPassword()` gestisce caso auto-login e caso conferma email
   - `logout()` resetta stato locale

### Contesti e filtri

3. Estrarre e testare helper di filtro per dashboard, projects e calendar:
   - contesto personale mostra solo record personali e project participation rilevanti
   - contesto societa filtra per `active_company_id`
   - cambio contesto cambia l'insieme dei risultati attesi
4. Aggiungere test per eventuali selector di `operativa/useOperativeData.js`:
   - today tasks
   - today events
   - filtri per membership societaria

### Ruoli, compatibilita e feature access

5. Portare `src/lib/domainRoles.js` a copertura completa:
   - `APPLICATION_ROLES`
   - `COMPANY_TYPES`
   - `COMPANY_MEMBER_ROLES`
   - `PROJECT_PARTICIPATION_ROLES`
   - `getCompatibleProjectRolesForCompanyType()` per tutti i company type
   - `isCompanyTypeCompatibleWithProjectRole()` per matrice completa
   - label IT/EN per tutti i valori
6. Testare `src/hooks/useFeatureAccess.js`:
   - default access state
   - `isFeatureAccessible`, `isFeatureFullyEnabled`, `isFeatureLimited`
   - `isProjectBlockedForSponsorLoss`
   - `toFeatureMap()` con feature mancanti o duplicate

### Finance e pricing helpers

7. Espandere `src/lib/financePermissions.test.js`:
   - homeowner personale
   - contractor societario admin
   - contractor societario member
   - subcontractor
   - contesto personale vs societario
   - sponsored vs unsponsored
   - casi limite `null/undefined`
8. Espandere `src/components/project/financeUtils.test.js`:
   - totali budget, costi, avanzamento
   - zeri, negativi, vuoti
   - arrotondamenti e formattazione
9. Se presente logica condivisa di billing summary, estrarre helper e coprire:
   - `active`, `free`, `past_due`, `canceled`, `unpaid`
   - CTA attese per free vs paid

### Notifiche, dispute, forms, env

10. Estrarre da `src/pages/Notifications.jsx` helper testabili per:
   - icon mapping
   - color mapping
   - route target per `project_invite`, `event_*`, `message_mention`, `dispute_*`, `project_sponsorship_*`, `company_plan_*`
11. Testare defaults di `src/components/settings/NotificationPreferences.jsx` contro `entities/NotificationPreference.json`.
12. Aggiungere test per `src/lib/disputeFromTask.js`:
   - payload creato da task bloccato
   - campi `task_id`, `notificationType`, `actionType`
13. Aggiungere test per validazione form pubblici:
   - email invalida
   - messaggio troppo corto
   - form valido
14. Mantenere e rinforzare i test di `src/lib/frontend-env.js` per evitare variabili frontend con nomi da segreto.

## Regole di implementazione

1. Ogni suite deve elencare nei commenti iniziali gli `Scenario ID` coperti.
2. Le matrici devono usare cataloghi importati dal codice, non stringhe duplicate a mano.
3. Dove una pagina contiene troppa logica inline, prima si estrae l'helper, poi si testa.