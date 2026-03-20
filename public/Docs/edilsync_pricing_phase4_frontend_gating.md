# EdilSync - Pricing Phase 4 Frontend Gating

## Scopo

La **Phase 4 - Refactor frontend gating around macro-features** allinea la UI della modalita normale al modello pricing/access gia reso server-authoritative nelle fasi precedenti.

Questa fase non introduce nuovi diritti backend.

Usa invece le funzioni SQL gia presenti per rendere il frontend coerente con:

- feature `enabled`
- feature `limited`
- feature `disabled`

---

## Principio applicato

Il frontend non decide piu in modo hardcoded se una sezione e premium.

Ora legge il capability model dal database tramite:

- `resolve_company_feature_access(...)`
- `resolve_project_feature_access(...)`

e costruisce la UI partendo da quei risultati.

---

## Layer condiviso introdotto

## `src/hooks/useFeatureAccess.js`

Nuovo hook shared che:

- interroga le RPC Supabase di feature access
- normalizza le risposte in una `featureMap`
- espone helper come:
  - `isFeatureAccessible`
  - `isFeatureFullyEnabled`
  - `isFeatureLimited`

## `src/components/ui/FeatureGateCard.jsx`

Nuovo componente shared per mostrare placeholder bloccati per feature premium non disponibili.

Questo serve a rispettare il contratto UX:

- le restrizioni di piano vanno mostrate
- le restrizioni di ruolo restano invece nascoste

---

## Project gating introdotto

In [src/pages/ProjectDetail.jsx](src/pages/ProjectDetail.jsx) il frontend usa i macro-feature di progetto per governare:

- `project_milestones`
- `project_chat`
- `project_documents`
- `project_finance`

### Milestone

- se `enabled/limited`: la sezione milestone resta utilizzabile
- se `disabled`: la sezione resta visibile ma mostra un gate premium
- le task non mostrano piu filtro milestone ne campo milestone nei form quando la feature non e disponibile

### Chat progetto

- `enabled`: esperienza completa
- `limited`: modalita `general_only`
  - niente creazione nuovi canali
  - niente canali custom/diretti/avanzati visibili

### Documenti progetto

- `enabled`: UI documentale completa
- `limited` con `mode=basic_chronological`: vista forzata semplice a lista cronologica
  - niente cartelle
  - niente filtri avanzati
  - niente griglia avanzata

### Finanza progetto

- se la feature premium e `disabled`, la sezione resta visibile ma bloccata da placeholder
- se la feature e disponibile, restano comunque validi i permessi di ruolo esistenti
- quindi:
  - piano/sponsorship restriction = visibile
  - role restriction = nascosta

---

## Company gating introdotto

In [src/pages/CompanyDetail.jsx](src/pages/CompanyDetail.jsx) il frontend usa i macro-feature di societa per governare:

- `company_time_tracking`
- `company_chat`
- `company_documents`

### Timbrature societa

- se `enabled`: sezione completa
- se `disabled`: placeholder premium visibile
- inoltre il frontend non carica piu le `work_sessions` quando la feature non e accessibile, evitando esposizione di dati premium

### Chat societa

- `enabled`: esperienza completa
- `limited`: solo canale generale
  - niente nuovi canali
  - niente canali custom

### Documenti societa

- se `limited` in basic mode, viene usata la stessa presentazione semplificata cronologica introdotta per i documenti progetto

---

## Componenti adattati

- `src/api/appClient.js`
- `src/hooks/useFeatureAccess.js`
- `src/components/ui/FeatureGateCard.jsx`
- `src/components/messaging/ChannelList.jsx`
- `src/components/messaging/ProjectMessaging.jsx`
- `src/components/messaging/MessageInput.jsx`
- `src/components/project/DocumentList.jsx`
- `src/components/project/TaskDialog.jsx`
- `src/components/project/TaskList.jsx`
- `src/components/project/TaskBoard.jsx`
- `src/pages/ProjectDetail.jsx`
- `src/pages/CompanyDetail.jsx`

---

## Risultato della fase

Alla fine della Phase 4:

- il frontend normale legge i macro-feature dal backend invece di dedurli a mano
- milestone e finanza progetto non spariscono piu semplicemente: mostrano un gate coerente con il contratto UX
- chat free viene ridotta al solo canale generale
- documenti free passano a una modalita semplificata cronologica
- le timbrature societarie non vengono piu lette lato client quando la societa non ha entitlement

Questa fase prepara il terreno per la **Phase 5**, dove la UI di billing e sponsorship diventera esplicita e azionabile.