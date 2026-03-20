# EdilSync - Pricing Phase 3 Server Writes

## Scopo

La **Phase 3 - Move critical writes from FE to BE** sposta i write piu sensibili dal frontend alle edge functions.

In questa fase interveniamo solo sulla **modalita normale**.

Restano fuori:

- adattamento della modalita operativa
- refactor / rimozione della modalita essenziale

---

## Flussi spostati dal frontend al backend

## 1. Creazione societa

Nuova edge function:

- `createCompanyWithInitialization`

Responsabilita:

- creare la societa
- creare il primo admin societario
- creare il canale `General`
- collegare il creator al canale
- creare la subscription `free`
- sincronizzare gli accessi utente

## 2. Creazione progetto

Nuova edge function:

- `createProjectWithContext`

Responsabilita:

- leggere il contesto attivo reale dell'utente dal database
- verificare che in contesto societa l'utente sia admin
- applicare il limite di 1 progetto non sponsorizzato
- creare progetto, partecipante creator e canale `General`
- invitare l'homeowner se la societa crea il progetto come contractor
- auto-sponsorizzare il progetto se la societa owner e paid
- sincronizzare gli accessi utente coinvolti

## 3. Invito partecipante di progetto

Nuova edge function:

- `inviteProjectParticipantWithValidation`

Responsabilita:

- validare che l'invitante sia davvero un partecipante attivo del progetto
- validare che abbia il diritto `can_invite` o sia homeowner
- applicare la regola contractor -> solo subcontractor
- applicare la regola no personal participants diversi da homeowner
- impedire homeowner duplicati
- impedire invitati duplicati
- applicare la regola del progetto non sponsorizzato owned da societa free -> puo invitare solo homeowner
- creare il participant
- collegarlo al canale `General`
- inviare notifiche ed email
- sincronizzare gli accessi dei destinatari

## 4. Invito membro societa

Nuova edge function:

- `inviteCompanyMemberWithValidation`

Responsabilita:

- verificare che l'utente sia admin della societa
- impedire duplicati active/invited
- creare il membro invitato
- collegarlo al canale `General`
- inviare notifica/email
- sincronizzare gli accessi dell'utente invitato

---

## Utility condivise introdotte

## `_shared/supabase.ts`

Contiene:

- client service-role
- response helpers
- autenticazione edge-function basata su bearer token
- invocazione interna di altre edge functions

## `_shared/access.ts`

Contiene:

- sincronizzazione accessi utente
- sincronizzazione accessi membri societa
- check admin societa

Questa scelta evita di duplicare la logica nei quattro endpoint.

---

## Modifiche al frontend normale

I seguenti componenti ora invocano edge functions invece di scrivere direttamente sulle tabelle:

- `src/pages/NewCompany.jsx`
- `src/pages/NewProject.jsx`
- `src/components/project/InviteParticipantDialog.jsx`
- `src/components/company/InviteMemberDialog.jsx`

Il frontend conserva il comportamento utente generale, ma il backend diventa la fonte di verita.

---

## Cosa NON viene ancora spostato

In questa fase restano ancora lato frontend altri write non prioritari, per esempio:

- task
- documenti
- messaggi
- eventi
- dispute
- finanza di progetto dal punto di vista del form submit

Questi flussi potranno essere ulteriormente spostati nelle fasi successive se necessario.

La priorita qui era chiudere i write che toccano direttamente:

- ownership
- membership
- sponsorship path
- access grants

---

## Risultato della fase

Alla fine della Phase 3:

- il frontend normale non crea piu direttamente societa
- il frontend normale non crea piu direttamente progetti
- il frontend normale non invita piu direttamente partecipanti di progetto
- il frontend normale non invita piu direttamente membri societa

Questo riduce in modo sostanziale la possibilita di aggirare il modello pricing/access dal client.