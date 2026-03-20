# EdilSync - Pricing Phase 1 Schema

## Scopo

Questo documento descrive l'implementazione tecnica della **Phase 1 - Add the Supabase billing/sponsorship model**.

La Phase 1 introduce solo le fondamenta dati.

Non introduce ancora:

- gating runtime definitivo
- edge functions applicative
- integrazione Stripe attiva
- modifiche UI nelle pagine normali

---

## Tabelle introdotte

## 1. `company_subscriptions`

Rappresenta lo stato corrente dell'abbonamento di una societa.

Contiene:

- piano corrente (`plan_code`)
- stato billing (`billing_status`)
- ciclo billing (`billing_cycle`)
- riferimenti Stripe
- periodo corrente di fatturazione
- flag di cancellazione a fine periodo

Scelta progettuale:

- una riga per societa
- le societa esistenti vengono inizializzate automaticamente come `free`

## 2. `project_sponsorships`

Rappresenta la sponsorizzazione di un progetto.

Contiene:

- progetto sponsorizzato
- societa sponsor
- stato (`active` / `ended`)
- data inizio e fine
- origine attivazione (`manual`, `project_creation`, `system`)

Scelta progettuale:

- un solo sponsor attivo per progetto
- vincolo realizzato con indice univoco parziale

## 3. `app_features`

Catalogo centralizzato delle macro feature prodotto congelate in Phase 0.

Scopo:

- avere un elenco unico e stabile delle feature governate dal pricing
- evitare logiche sparse e stringhe duplicate nel codice

## 4. `plan_feature_rules`

Mappa un piano a una feature.

Per ogni feature definisce:

- `enabled`
- `disabled`
- `limited`

Il campo `config_json` serve per i casi come:

- chat free solo `General`
- documenti free in modalita base
- billing free solo per upgrade
- un solo progetto non sponsorizzato

## 5. `stripe_events`

Tabella tecnica per il processamento idempotente dei webhook Stripe.

In Phase 1 viene introdotta solo come base dati.

Vera logica applicativa e webhook arriveranno nella Phase 6.

---

## Seed iniziale delle feature

Le feature seedate sono coerenti con la feature inventory congelata in Phase 0.

### Company

- `company_management`
- `company_members`
- `company_chat`
- `company_documents`
- `company_time_tracking`
- `company_operational_workspace`
- `company_billing`

### Project

- `project_creation`
- `project_sponsorship`
- `project_participants`
- `project_overview`
- `project_tasks`
- `project_milestones`
- `project_change_requests`
- `project_disputes`
- `project_calendar`
- `project_chat`
- `project_documents`
- `project_finance`
- `project_operational_workspace`

---

## Seed iniziale dei piani

La Phase 1 seeda due piani:

- `free`
- `paid`

Anche se oggi esistono solo questi due, la struttura resta predisposta per piani futuri grazie a:

- `plan_code` come stringa
- catalogo feature separato
- rules separate per piano e feature

---

## Decisioni importanti di schema

## 1. Nessun campo piano aggiunto a `companies`

Il piano non viene salvato direttamente nella tabella `companies` come fonte di verita.

Motivo:

- la fonte di verita deve essere `company_subscriptions`
- riduciamo ridondanza e futuri problemi di sync

## 2. Nessun campo sponsor aggiunto a `projects`

Lo sponsor attivo viene modellato nella tabella `project_sponsorships`.

Motivo:

- separa meglio stato progetto e stato commerciale
- rende piu pulita la gestione dello storico della sponsorizzazione

## 3. Le rules di piano non bastano da sole

`plan_feature_rules` definisce la disponibilita base di un piano.

Nelle fasi successive la sponsorizzazione di progetto potra fare override delle feature progettuali premium per tutti i partecipanti di quel progetto.

Questa logica verra implementata nella Phase 2.

---

## Policy introdotte

## `company_subscriptions`

Accesso limitato agli admin societa e agli admin globali.

Motivo:

- il billing non deve essere visibile ai membri normali

## `project_sponsorships`

Lettura consentita ai partecipanti del progetto.

Motivo:

- il progetto deve poter mostrare la card stato sponsor ai partecipanti

Scrittura limitata agli admin della societa sponsor e agli admin globali.

## `app_features` e `plan_feature_rules`

Lettura aperta agli utenti autenticati.

Motivo:

- queste informazioni possono essere usate anche lato client e lato backend come metadata di prodotto

Scrittura riservata agli admin globali.

## `stripe_events`

Accesso amministrativo soltanto.

---

## Dipendenze verso le fasi successive

La Phase 2 usera queste tabelle per:

- capability resolution
- gating backend
- future RLS premium-aware

La Phase 3 usera queste tabelle per:

- create project con auto-sponsorizzazione
- invite participant con regole free/paid/sponsored

La Phase 5 usera queste tabelle per:

- tab Fatturazione societa
- card sponsor del progetto

La Phase 6 usera queste tabelle per:

- checkout Stripe
- customer portal
- webhook reconciliation

---

## Limiti noti volutamente rimandati

In questa fase non vengono ancora implementati:

- controllo runtime del limite di 1 progetto non sponsorizzato
- sponsor card in UI
- downgrade behavior applicativo
- modalita operativa
- rimozione modalita essenziale

Questi aspetti verranno affrontati nelle fasi successive sopra descritte.