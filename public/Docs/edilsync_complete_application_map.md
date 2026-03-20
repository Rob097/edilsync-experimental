# EdilSync - Mappa Completa dell'Applicazione

## Scopo del documento

Questo documento riassume in modo strutturato l'architettura funzionale di EdilSync cosi come emerge dalla codebase attuale.

Serve come base condivisa per:

- allineamento interno sul prodotto
- onboarding di team e stakeholder
- progettazione futura del sito pubblico e delle landing pages
- chiarimento dei ruoli, dei contesti e dei permessi
- distinzione tra feature gia operative, feature mature ma evolvibili e aree predisposte

Il focus di EdilSync non e solo la gestione di attivita o documenti: il cuore del prodotto e la gestione contestuale delle relazioni tra persone, societa e progetti edilizi.

---

## 1. Visione di Prodotto

EdilSync e una piattaforma SaaS per il coordinamento di cantieri e ristrutturazioni residenziali, pensata per ridurre frammentazione, ritardi, incomprensioni e perdita di controllo informativo tra committenti, imprese, subappaltatori e professionisti.

La piattaforma non tratta l'utente come un ruolo fisso globale, ma come una persona che puo operare in piu contesti:

- come privato
- come rappresentante di una o piu societa
- come partecipante a uno o piu progetti
- con ruoli diversi a seconda del progetto e del contesto attivo

Il principio chiave e questo:

**i permessi non dipendono solo dall'utente, ma dal contesto in cui sta operando in quel momento.**

---

## 2. Principi Fondanti del Modello

### 2.1 Persona unica, account unico

Ogni utente e una persona fisica con un solo account.

La persona puo:

- lavorare come privato
- appartenere a una o piu societa
- amministrare una o piu societa
- partecipare a progetti come individuo o come societa
- ricevere inviti, notifiche e accessi diversi a seconda dei contesti

### 2.2 Contesto attivo

Ogni utente ha un contesto attivo salvato sul profilo:

- `personal`
- `company` con `active_company_id`

Il contesto attivo cambia:

- interfaccia
- dati mostrati
- navigazione utile
- notifiche visibili
- eventi visibili in calendario
- progetti mostrati in elenco
- messaggi e canali rilevanti
- permessi effettivi su alcuni moduli, soprattutto finance e operativita

### 2.3 Progetto come contenitore relazionale

Il progetto non e solo una scheda cantiere. E il contenitore delle relazioni operative tra:

- committente
- contractor
- subappaltatori
- progettisti e consulenti
- fornitori
- documenti
- attivita
- milestone
- varianti
- dispute
- calendario
- messaggistica
- dati economici

### 2.4 Multi-tenant e sicurezza dati

La piattaforma usa Supabase con RLS.

L'accesso ai dati e costruito su questi insiemi utente:

- `company_ids`
- `admin_company_ids`
- `project_ids`

Questi insiemi vengono sincronizzati automaticamente da membership e partecipazioni tramite la function backend `syncUserAccess`.

---

## 3. Attori e Oggetti Dominanti

### 3.1 Persona / User

Campi e comportamenti rilevanti:

- email, nome, display name, telefono
- ruolo applicativo generale: `admin` oppure `normal`
- contesto attivo: personale o societario
- societa accessibili
- societa amministrate
- progetti accessibili
- preferenze di notifica
- stato dei tour guidati

### 3.2 Societa / Company

La societa e l'entita operativa formale nel cantiere.

Una societa puo:

- avere membri attivi o invitati
- avere amministratori e membri normali
- avere un ruolo operativo interno per ciascun membro
- partecipare a progetti con un ruolo di progetto coerente con il proprio tipo societario
- possedere documenti propri
- avere canali chat interni
- avere timbrature e presenze
- avere costi, tariffe e visibilita economica in progetto

### 3.3 Project

Ogni progetto rappresenta un cantiere o una commessa reale.

Attributi principali:

- nome
- indirizzo
- descrizione
- stato
- date di inizio e fine
- owner personale o owner societario

Stati progetto attualmente gestiti:

- `planning`
- `in_progress`
- `completed`
- `on_hold`

### 3.4 Partecipazione al progetto / ProjectParticipant

La partecipazione al progetto definisce:

- se il partecipante e una persona o una societa
- il ruolo nel progetto
- lo stato della partecipazione
- l'eventuale societa che lo ha invitato come subappaltatore
- la facolta di invitare altri partecipanti

Stati partecipazione:

- `active`
- `invited`
- `declined`
- `removed`

### 3.5 Membership societaria / CompanyMember

La membership societaria definisce:

- legame utente-societa
- ruolo amministrativo interno: `admin` o `member`
- ruolo operativo interno: `owner_admin`, `project_manager`, `site_manager`, `crew_leader`, `technical_office`, `safety_manager`, `worker`, `backoffice`, `external_consultant`
- stato membership: `active`, `invited`, `inactive`

---

## 4. Tipologie di Utenti e Figure Funzionali

EdilSync non usa classi utente rigide lato dominio, ma supporta figure funzionali chiare.

### 4.1 Committente / Homeowner

Puo essere:

- persona fisica in contesto personale
- societa invitata o creata come owner del progetto

Di norma puo:

- creare un progetto da contesto personale
- essere invitato come committente da un contractor che crea il progetto in contesto societario
- vedere l'intero progetto nel suo contesto attivo se e partecipante attivo
- invitare altri partecipanti
- aprire e gestire change request dal lato decisionale
- vedere il modulo finance in sola lettura avanzata
- aprire e seguire dispute

### 4.2 Contractor

E normalmente una societa.

Di norma puo:

- creare progetti da contesto societario se l'utente attivo e admin della societa
- invitare il committente in fase di creazione progetto
- invitare subappaltatori al progetto
- gestire attivita, milestone, documenti, chat e operativita
- usare il modulo finance con permessi che dipendono da admin/member e ruolo di progetto

### 4.3 Subcontractor

E normalmente una societa invitata dal contractor.

Di norma puo:

- entrare nel progetto tramite invito
- usare le aree progetto se partecipante attivo nel contesto corretto
- vedere task, documenti, chat, calendario e dispute del progetto
- non ha gli stessi permessi del committente sul processo di change request

### 4.4 Professionisti tecnici

Figure supportate come ruoli progetto:

- architect
- engineer
- surveyor
- designer
- consultant

Possono essere:

- persone invitate direttamente
- societa specialistiche

### 4.5 Fornitore / Supplier

Figura con ruolo progetto dedicato, pensata per accessi piu limitati e contestuali.

### 4.6 Membro societario operativo

Figure interne societarie come capo cantiere, responsabile commessa, operaio, backoffice o consulente esterno possono:

- usare il contesto societario
- timbrare entrata e uscita
- accedere a progetti della propria societa
- usare modalita operativa e documenti societari
- partecipare alla chat interna societaria

### 4.7 Admin di sistema

E il solo utente con accesso alla `SystemDashboard` e a statistiche globali di piattaforma.

---

## 5. Tipi di Societa Supportati

Tipologie di societa definite a dominio:

- general_contractor
- excavation
- demolition
- foundations
- concrete_structures
- metal_carpentry
- masonry
- roofing_tinsmithing
- waterproofing_insulation
- electrical_systems
- plumbing_hvac
- drywall
- flooring_cladding
- painting
- fixtures_windows
- blacksmith
- restoration
- architecture_studio
- engineering_studio
- surveying_studio
- design_studio
- supplier
- other

Il tipo societario non e solo descrittivo: influenza i ruoli progetto compatibili.

Esempi:

- `architecture_studio` e compatibile con `architect` e `consultant`
- `engineering_studio` e compatibile con `engineer` e `consultant`
- `supplier` e compatibile con `supplier`
- molte imprese specialistiche sono compatibili soprattutto con `subcontractor`
- `general_contractor` e `other` hanno compatibilita molto piu ampia

---

## 6. Ruoli e Permessi: i 4 Livelli Reali

### 6.1 Livello 1: ruolo applicativo globale

- `normal`
- `admin`

Influenza soprattutto l'accesso alla dashboard di sistema.

### 6.2 Livello 2: contesto attivo

- `personal`
- `company`

Influenza cosa l'utente vede e su quali entita opera davvero.

### 6.3 Livello 3: ruolo nella societa

Ruolo amministrativo:

- `admin`
- `member`

Ruolo operativo societario:

- owner_admin
- project_manager
- site_manager
- crew_leader
- technical_office
- safety_manager
- worker
- backoffice
- external_consultant

### 6.4 Livello 4: ruolo nel progetto

- homeowner
- contractor
- subcontractor
- architect
- engineer
- surveyor
- designer
- consultant
- supplier

### 6.5 Regola chiave

Il permesso finale e il risultato combinato di:

- utente attuale
- contesto attivo
- membership societaria attuale
- partecipazione al progetto coerente con il contesto
- ruolo di progetto
- in finance, anche visibilita economica configurata

---

## 7. Cosa Vede l'Utente in Base al Contesto Attivo

### 7.1 Contesto personale

L'utente vede soprattutto:

- dashboard personale
- progetti in cui partecipa come persona
- societa di cui fa parte
- notifiche di contesto personale
- eventi personali e eventi in cui e invitato come persona
- possibilita di creare nuove societa
- possibilita di creare un progetto come committente personale

Nel contesto personale non sta agendo a nome della societa.

### 7.2 Contesto societario

L'utente vede soprattutto:

- dashboard societaria contestuale
- dettaglio della societa attiva
- progetti in cui partecipa la societa attiva
- notifiche di contesto societario per quella societa
- eventi della societa attiva
- chat interna societaria
- documenti societari
- operativita e timbrature della societa
- possibilita di passare alla modalita operativa

Le azioni compiute in questo contesto sono attribuite alla societa attiva quando il flusso lo prevede.

---

## 8. Cosa Puo Fare l'Utente in Base al Ruolo nella Societa

### 8.1 Company admin

Puo tipicamente:

- modificare la societa
- invitare membri alla societa
- assegnare ruolo admin/member ai membri invitati
- aprire canali interni societari
- gestire i partecipanti di canale societario
- creare progetti a nome della societa
- invitare partecipanti a progetto a nome della societa invitante, se ha i requisiti di progetto
- inserire o correggere timbrature manuali
- chiudere timbrature aperte di altri
- esportare timbrature in CSV, XML, JSON, TXT
- avere maggiori permessi nel finance se la societa attiva e contractor

### 8.2 Company member

Puo tipicamente:

- accedere al contesto societario
- vedere la societa e i suoi documenti
- usare la chat interna della societa
- timbrare la propria presenza
- lavorare sui progetti della societa nel limite del proprio ruolo di progetto
- nel finance contractor puo avere scope `contributor`, quindi vedere budget/costi/tariffe e registrare costi o sincronizzare ore, ma non gestire tutte le impostazioni

---

## 9. Cosa Puo Fare l'Utente in Base allo Stato della Partecipazione al Progetto

### 9.1 Invited

Se la partecipazione coerente col contesto e `invited`, l'utente vede il progetto ma non ha ancora accesso pieno alle sezioni operative.

Nel dettaglio progetto appare un banner di invito con possibilita di:

- accettare
- rifiutare

Quando accetta:

- lo stato diventa `active`
- viene inserito nel canale generale del progetto
- i dati utente vengono riallineati lato accesso

### 9.2 Active

Se la partecipazione coerente col contesto e `active`, l'utente puo accedere ai moduli progetto del proprio contesto.

### 9.3 Declined / Removed

L'accesso operativo decade o non si attiva.

---

## 10. Cosa Puo Fare l'Utente in Base al Ruolo Progetto

### 10.1 Homeowner

Tipicamente puo:

- invitare altri partecipanti
- vedere il progetto come partecipante principale di business
- creare change request
- rispondere alle change request pendenti
- vedere il finance con scope `viewer`
- vedere budget, costi e avanzamento economico
- aprire e seguire dispute

### 10.2 Contractor

Tipicamente puo:

- invitare altri partecipanti; in particolare subappaltatori
- operare nelle aree task, milestone, documenti, chat e dispute
- usare la finanza in modo manageriale se company admin o owner del progetto
- usare la finanza in modo contributor se member della societa contractor

### 10.3 Subcontractor

Tipicamente puo:

- usare il progetto da partecipante attivo
- vedere e gestire il lavoro assegnato
- usare documenti, chat, dispute e calendario
- non ha il potere tipico del committente sulle change request

### 10.4 Architetto / Ingegnere / Geometra / Designer / Consultant / Supplier

Tipicamente possono:

- accedere alle aree progetto se partecipanti attivi
- lavorare con documenti, calendario, chat, task e dispute in misura coerente al loro coinvolgimento
- avere visibilita modulata dal contesto e dalle RLS

---

## 11. Modalita di Utilizzo dell'App

EdilSync oggi espone tre superfici principali.

### 11.1 Modalita normale

E la superficie completa della piattaforma.

Navigazione principale:

- Dashboard
- Projects
- Calendar
- Companies o CompanyDetail a seconda del contesto
- Notifications
- Settings
- SystemDashboard per admin

### 11.2 Modalita operativa (`/operativa`)

E la superficie mobile-first e orientata alla produttivita quotidiana di cantiere.

Comprende:

- entry point operativo con scelta societa e progetto
- riepilogo giornata
- workspace societa
- workspace progetto

E particolarmente adatta per:

- operai
- capicantiere
- membri societari sul campo
- consultazione rapida documenti e chat
- timbrature e presenze
- gestione rapida task e aggiornamenti

---

## 12. Autenticazione, Profilo e Impostazioni Personali

### 12.1 Autenticazione

Autenticazione attuale:

- email + password
- registrazione con conferma email se richiesta dal provider

Login Google:

- previsto ma non ancora operativo nella UI corrente

### 12.2 Profilo utente

Modificabile da Settings:

- display name / nome visualizzato
- telefono

Email:

- mostrata ma non modificabile dal profilo

### 12.3 Lingue

Supporto attivo:

- Italiano
- English

La lingua e selezionabile dal menu utente.

### 12.4 Tour guidati

Esistono tour guidati per:

- onboarding generale
- progetti
- societa
- finance

Lo stato completato/dismissed e salvato nel profilo utente.

---

## 13. Area Societa

### 13.1 Elenco societa

Nel contesto personale l'utente vede l'elenco delle societa di cui e membro attivo.

Funzioni:

- ricerca per nome o P.IVA
- accesso al dettaglio societa
- creazione nuova societa

Nel contesto societario l'app reindirizza direttamente al dettaglio della societa attiva.

### 13.2 Creazione societa

La creazione di una nuova societa comporta automaticamente:

- creazione record societa
- aggiunta del creatore come `admin`
- attribuzione del ruolo operativo `owner_admin`
- creazione del canale generale societario
- inserimento del creatore nel canale generale
- aggiornamento immediato di `company_ids` e `admin_company_ids`

### 13.3 Dettaglio societa

Il dettaglio societa e organizzato in tre macro-tab:

- panoramica
- operativita
- info

Contenuti principali:

- dati societari: nome, P.IVA, indirizzo, telefono, email, descrizione
- indicatori rapidi: membri attivi, inviti pendenti, timbrature aperte
- quick actions per timbrature, chat interna, documenti, invito membri
- timbrature e presenze
- chat interna societaria
- documenti societari
- lista membri attivi
- lista inviti pendenti

### 13.4 Gestione membri societari

Gli admin societari possono:

- invitare un membro via email
- assegnare ruolo `admin` o `member`
- assegnare il ruolo operativo societario
- rimuovere membri

Quando un membro viene invitato:

- si crea una CompanyMember in stato `invited`
- si aggiunge il membro al canale generale societario
- si invia notifica `company_invite`
- si invia email coerente alle preferenze utente

---

## 14. Area Progetti

### 14.1 Elenco progetti

L'elenco progetti mostra solo i progetti rilevanti per il contesto attivo.

Funzioni:

- ricerca per nome o indirizzo
- filtri per stato
- visione del ruolo dell'utente nel progetto
- conteggio partecipanti

### 14.2 Creazione progetto

La creazione progetto dipende dal contesto.

Nel contesto personale:

- il ruolo del creatore e forzato a `homeowner`

Nel contesto societario:

- il creatore deve essere admin della societa attiva
- la societa crea il progetto come `contractor`
- puo invitare subito il committente tramite email

La creazione progetto genera automaticamente:

- record progetto
- partecipazione attiva del creatore/societa creatrice
- canale generale progetto
- membership del creatore nel canale generale
- aggiornamento immediato di `project_ids`

### 14.3 Dettaglio progetto

Il dettaglio progetto completo e organizzato in tre tab principali:

- `cantiere`
- `lavori`
- `info`

L'accesso pieno a questi contenuti esiste solo se il partecipante coerente col contesto e `active`.

Il dettaglio include:

- header con nome, indirizzo e stato progetto
- date progetto
- descrizione
- banner invito, se partecipazione invitata
- banner blocco progetto se esistono task bloccati

---

## 15. Modulo Cantiere / Overview Progetto

Nel tab `cantiere` il progetto offre:

- overview sintetica del progetto
- feed attivita

Il feed collega rapidamente alle entita rilevanti:

- foto / documenti
- change request
- task
- milestone
- messaggi

Questo rende il progetto leggibile come cronologia operativa, non solo come insieme di liste separate.

---

## 16. Modulo Task e Attivita

### 16.1 Stati task

- `not_started`
- `in_progress`
- `completed`
- `blocked`

### 16.2 Dati task principali

- titolo
- descrizione
- partecipante assegnato
- assegnazione a persona o societa
- area o stanza
- scadenza
- milestone collegata
- eventuale blocco con motivo e soggetto bloccante

### 16.3 Funzioni disponibili

- vista board
- vista lista
- filtro per milestone
- creazione task
- modifica task
- assegnazione a persona o societa del progetto
- blocco task con motivazione
- notifica al soggetto responsabile del blocco
- possibilita di creare una disputa collegata direttamente dal blocco task

### 16.4 Regole operative importanti

- un task puo essere assegnato sia a una persona sia a una societa partecipante
- se un task e bloccato, puo registrare `blocked_reason`, `blocked_by_email`, `blocked_by_name`, `blocked_date`
- il task bloccato alimenta anche banner di allerta a livello progetto
- gli assegnatari e gli admin della societa assegnata hanno diritti di update a livello RLS

---

## 17. Modulo Milestone

### 17.1 Stati milestone

- `pending`
- `in_progress`
- `completed`
- `delayed`

### 17.2 Funzioni disponibili

- vista timeline
- vista lista
- creazione milestone
- modifica milestone
- definizione ordine
- associazione task-milestone
- navigazione rapida dalle milestone alle task collegate
- eliminazione milestone con scelta tra:
  - rimuovere solo il collegamento dalle task
  - eliminare anche le task collegate

### 17.3 Vincoli attuali

- se l'utente sta operando come societa, la creazione e modifica richiedono admin societario
- la milestone mostra progressione delle task collegate

---

## 18. Modulo Change Request / Extra / Varianti

### 18.1 Stati change request

- `pending`
- `approved`
- `rejected`
- `clarification_needed`

### 18.2 Dati gestiti

- titolo
- descrizione
- impatto economico
- impatto temporale in giorni
- assegnazione a persona o societa
- richiedente
- nota di risposta
- timestamp risposta

### 18.3 Regole di processo attuali

- la creazione e riservata al committente del progetto
- la risposta alle richieste pendenti e gestita da chi ha potere di risposta lato homeowner/owner progetto
- la board offre vista per stato
- la lista offre lettura cronologica

### 18.4 Valore di prodotto

Questo modulo formalizza in modo tracciabile tutto cio che in cantiere spesso avviene in WhatsApp o verbalmente:

- extra
- richieste cliente
- piccole varianti
- impatti su costo e tempo
- esito approvativo o rifiuto

---

## 19. Modulo Dispute

Il modulo dispute e una delle parti piu distintive di EdilSync.

Serve a formalizzare i conflitti su:

- scope
- cost
- delay
- quality
- payment
- other

### 19.1 Entita del dominio dispute

- `dispute_cases`
- `dispute_events`
- `dispute_evidence_items`

### 19.2 Stati disputa

- `open`
- `awaiting_response`
- `in_review`
- `resolved`
- `closed_no_agreement`
- `escalated`

### 19.3 Funzioni disponibili

- apertura disputa da zero
- apertura disputa da task bloccato
- timeline eventi disputa
- commenti alla disputa
- allegazione prove
- snapshot di evidenze dal task sorgente
- note di risoluzione
- notifiche a stakeholder coinvolti

### 19.4 Perche e importante

EdilSync non si limita a coordinare il lavoro; cerca anche di proteggere le parti tramite:

- tracciamento contestuale
- cronologia eventi
- evidenze collegate
- storicizzazione delle responsabilita

---

## 20. Modulo Documenti

Il modulo documentale e disponibile sia a livello progetto sia a livello societa.

### 20.1 Scope documentale

- documenti di progetto
- documenti societari

### 20.2 Funzioni principali

- upload file
- modifica metadati documento
- anteprima documento
- download documento
- cancellazione documento
- commenti documento
- revisioni documento
- categorizzazione e filtraggio
- vista grid a cartelle
- vista lista

### 20.3 Categorie funzionali

L'app usa una normalizzazione che converge verso queste macro-categorie operative:

- `technical`
- `contract`
- `photo`
- `report`
- `other`

Nel modello dati storico compaiono anche categorie legacy come `project`, `permit`, `drawing`, poi normalizzate nella UI.

### 20.4 Metadati documentali avanzati

Per la documentazione tecnica sono previsti anche:

- disciplina
- area di lavoro
- fase progetto
- status documento
- tags
- catena revisioni
- numero revisione
- flag di revisione corrente
- formato modello 3D/BIM

### 20.5 Stati documento

- `draft`
- `in_review`
- `approved`
- `rejected`
- `superseded`
- `archived`

### 20.6 Commenti documento

Ogni documento puo avere:

- thread commenti dedicato
- autore email/nome
- timestamp

### 20.7 Revisioni

Quando un documento viene aggiornato con un nuovo file:

- la revisione precedente viene marcata come non corrente
- lo stato puo diventare `superseded`
- viene creata una nuova revisione collegata alla root document

---

## 21. BIM e Viewer 3D

Il modulo documenti supporta anche file BIM/3D.

Formati riconosciuti:

- IFC
- GLB
- GLTF

### 21.1 Supporto IFC

Per IFC esiste un viewer in-app dedicato (`InAppIfcViewer`) con:

- parsing IFC in-app
- telemetry di apertura viewer
- fallback automatico a viewer esterno in caso di errore o timeout
- supporto a worker statico dedicato

### 21.2 Supporto GLB/GLTF

Per GLB/GLTF esiste un viewer 3D basato su Three.js con:

- camera orbitale
- fit automatico del modello
- griglia e luci base

### 21.3 Implicazione di prodotto

EdilSync non e solo testo e task: puo diventare un punto di accesso unico anche per tavole, modelli e documentazione tecnica consultabile sul campo.

---

## 22. Modulo Messaggistica

La messaggistica e strutturata per canali e scope.

### 22.1 Scope chat supportati

- chat di progetto
- chat interna di societa

### 22.2 Oggetti principali

- `Channel`
- `ChannelMember`
- `Message`

### 22.3 Canale generale automatico

Alla creazione di progetto o societa viene creato automaticamente il canale `General`.

### 22.4 Funzioni disponibili

- lista canali
- selezione canale
- creazione canali aggiuntivi
- gestione membri canale
- lista messaggi ordinata cronologicamente
- input testo multi-linea
- invio rapido con Enter
- unread basato su `last_read_at`
- notifiche mention

### 22.5 Riferimenti strutturati nei messaggi

L'input messaggi supporta riferimenti strutturati a:

- utenti
- task
- milestone
- change request
- documenti

I riferimenti vengono renderizzati come badge cliccabili nel corpo del messaggio.

Questo rende la chat navigabile e contestuale, non solo conversazionale.

### 22.6 Notifiche di mention

Quando un utente viene menzionato:

- viene generata una `message_mention` notification
- il contesto notifica rispetta il contesto mittente
- il click porta al progetto e alla sezione chat, se applicabile

---

## 23. Modulo Calendario ed Eventi

Il calendario combina eventi e task con scadenza.

### 23.1 Dati mostrati

- eventi creati dall'utente o dalla societa
- eventi in cui l'utente o la societa sono partecipanti
- task con scadenza assegnati o rilevanti nel contesto

### 23.2 Viste principali

- vista mensile
- dettaglio giorno
- overlay eventi + task

### 23.3 Funzioni disponibili

- creazione evento
- modifica evento
- dettaglio evento
- selezione partecipanti
- navigazione tra mesi
- salto a oggi
- click su task dal calendario

### 23.4 Gestione conflitti

Il sistema rileva conflitti temporali tra eventi e puo:

- segnalarli in fase di creazione
- permettere prosecuzione consapevole
- annullare evento in conflitto nel flusso gestito
- notificare gli interessati

### 23.5 Partecipanti evento

Possono essere:

- utenti
- societa

con stato:

- `pending`
- `accepted`
- `declined`

---

## 24. Modulo Notifiche ed Email

### 24.1 Centro notifiche

La pagina Notifications mostra solo le notifiche del contesto attivo.

- contesto personale: notifiche personali o senza company context
- contesto societario: notifiche della societa attiva

Funzioni:

- lista ordinata per data
- mark as read singolo
- mark all as read
- navigazione contestuale in base al tipo

### 24.2 Tipi di notifica gestiti

Nel sistema applicativo e nel backend risultano gestiti almeno questi tipi:

- `project_invite`
- `company_invite`
- `task_assigned`
- `task_status_changed`
- `change_request_assigned`
- `change_request_status_changed`
- `milestone_status_changed`
- `event_invite`
- `event_updated`
- `event_cancelled`
- `conflict_resolved`
- `participant_declined`
- `message_mention`
- `document_comment`
- `dispute_opened`
- `dispute_status_changed`
- `dispute_commented`

### 24.3 Preferenze comunicative

Ogni utente puo configurare, per ogni tipo di azione:

- notifica in-app on/off
- email on/off

Le preferenze vengono salvate in `NotificationPreference`.

### 24.4 Invio email

La Edge Function `sendNotificationOrEmail`:

- legge le preferenze dell'utente
- crea notifica in-app se consentito
- invia email via Resend se configurato
- altrimenti usa un webhook email
- puo saltare il check preferenze in casi specifici, ad esempio email societarie di servizio

---

## 25. Modulo Finance di Progetto

Il modulo finance e uno dei moduli piu sofisticati lato permessi.

### 25.1 Obiettivo

Consentire il controllo economico di progetto senza esporre lo stesso livello di dettaglio a tutti.

### 25.2 Aree del finance

- impostazioni economiche progetto
- budget lines
- cost entries
- labor rates
- sincronizzazione costi da work sessions
- progress statements / SAL

### 25.3 Categorie costo

- labor
- materials
- equipment
- subcontract
- indirect
- extra
- adjustment

### 25.4 Permessi finance reali

Il sistema calcola permessi granulari con `getProjectFinancialPermissions`.

Possibili scope:

- `none`
- `viewer`
- `contributor`
- `manager`

### 25.5 Regole principali

Se il partecipante coerente col contesto non e attivo:

- nessun accesso finance

Se il ruolo progetto e `homeowner`:

- puo vedere sezione finance
- puo vedere budget
- puo vedere costi
- puo vedere progresso economico
- non gestisce impostazioni, budget o tariffe

Se il ruolo progetto e `contractor` e il contesto e societario con ruolo societario `member`:

- scope `contributor`
- puo vedere budget, costi, tariffe e progress
- puo registrare costi
- puo sincronizzare manodopera
- non puo gestire tutto il setup

Se il ruolo progetto e `contractor` e il contesto ha privilegi manageriali:

- scope `manager`
- puo vedere e gestire budget
- registrare costi
- gestire tariffe
- sincronizzare lavoro
- gestire progress statements
- gestire impostazioni finance

### 25.6 Funzioni finance presenti

- impostazione valuta
- modalita tracciamento budget
- metodo costo lavoro da work sessions
- visibilita economica progetto o company-scoped
- attivazione progress statements
- inserimento budget line
- inserimento cost entry manuale
- definizione labor rate per societa o utente
- sync costi lavoro da timbrature
- calcolo totali pianificati e registrati
- forecast base
- considerazione di extra approvati e valore dispute contestate
- gestione progress statements con stato

### 25.7 Significato strategico

Questo modulo collega il mondo operativo al controllo economico in modo nativo, senza richiedere sistemi separati gia nell'MVP evoluto.

---

## 26. Modulo Timbrature e Operativita Societaria

### 26.1 Obiettivo

Permettere alle societa di tracciare presenze e lavoro giornaliero con collegamento opzionale al progetto.

### 26.2 Funzioni disponibili

- clock-in live
- clock-out live
- note di entrata/uscita
- acquisizione GPS opzionale in entrata e uscita
- apertura sessione collegata o meno a progetto
- inserimento manuale admin
- chiusura manuale admin di sessioni aperte
- motivazione delle correzioni manuali
- filtri amministrativi per membro, progetto, data
- export timbrature in CSV, XML, JSON, TXT

### 26.3 Tipi sessione

- `live`
- `manual_admin`

### 26.4 Modalita sorgente registrata

- `normal`
- `essential`
- `operational`
- `api`

### 26.5 Relazione con il finance

Le work sessions possono essere trasformate in costi lavoro nel modulo finance, in base alle tariffe definite.

---

## 27. Modalita Operativa: Esperienza Quotidiana di Cantiere

La modalita operativa espone un'interfaccia piu rapida, compatta e mobile-oriented.

### 27.1 Entry operativo

Permette di:

- scegliere la societa attiva se l'utente appartiene a piu societa
- aprire il riepilogo giornata
- aprire il workspace societa
- entrare in un progetto operativo

### 27.2 Riepilogo giornata

Mostra:

- numero task di oggi
- numero eventi di oggi
- elenco task di oggi con link rapido al progetto

### 27.3 Workspace societa operativo

Tab principali:

- timbrature
- documenti
- chat

Consente:

- clock-in/out rapido
- consultazione documenti societari in vista cronologica o explorer
- upload rapido di documenti/foto societari
- chat interna societaria compatta

### 27.4 Workspace progetto operativo

Tab principali:

- today
- work
- docs
- chat

Contenuti e azioni principali:

- task di oggi o in corso
- milestone ordinate
- eventi progetto
- ultime modifiche e cronologia
- change request con risposta rapida se permessa
- documenti in ordine cronologico o per categoria
- upload rapido foto/documenti di cantiere
- chat di progetto in formato operativo
- accesso alle dispute con dialog rapido

Questa modalita e cruciale per l'uso sul campo e rende EdilSync piu vicino a un vero strumento di produzione, non solo di coordinamento desk.

---

## 28. Modalita supportate

Le superfici attive dell'applicazione sono due:

- modalita normale
- modalita operativa

La vecchia superficie semplificata non fa piu parte del prodotto attivo e non e piu presente nel repository applicativo.

- utenti meno tecnici
- stakeholder che vogliono poche scelte e molta chiarezza
- uso rapido da mobile senza entrare nella complessita della superficie completa

---

## 29. Dashboard Principale e Insight Utente

La dashboard normale mostra il perimetro di lavoro del contesto attivo.

Indicatori principali:

- numero progetti
- progetti in corso
- progetti completati
- numero societa, oppure membri attivi della societa corrente

Contenuti:

- progetti recenti del contesto
- societa dell'utente nel contesto personale
- badge contesto corrente

---

## 30. Dashboard di Sistema

Disponibile solo per `user.role === admin`.

Offre una panoramica globale della piattaforma su:

- utenti
- societa
- membri societari
- progetti
- task
- milestone
- change request
- messaggi
- documenti
- eventi
- notifiche

Mostra anche:

- distribuzioni per stato
- andamento attivita ultimi 30 giorni
- utenti piu attivi
- societa con piu progetti
- categorie documentali
- completion rate task
- impatti medi change request

---

## 31. Assistente AI

L'app include un assistente flottante contestuale.

Funzioni presenti nella UI:

- apertura chat laterale
- storico conversazioni
- nuova conversazione
- eliminazione conversazione lato client
- mantenimento del contesto personale o societario nella metadata chat
- input testuale
- supporto speech-to-text se disponibile nel browser
- link a connessione WhatsApp dell'assistente

Nota importante:

- dal README emerge che `edilsync_assistant` e ancora in modalita placeholder / estendibile

Quindi la superficie esiste ed e gia integrata, ma il valore finale dipende dall'evoluzione della logica agente.

---

## 32. Navigazione e Collegamenti Contestuali

EdilSync collega le entita tra loro in modo forte.

Esempi concreti:

- una notifica di invito progetto apre il dettaglio progetto corretto
- una notifica di mention puo aprire il progetto direttamente in chat
- il feed progetto porta a task, change request, documenti, milestone, messaggi
- una milestone puo portare alla lista task filtrata
- un documento linkato in chat si apre in preview
- un task bloccato puo generare disputa collegata
- il calendario unifica eventi e task con scadenza

Questo e un punto chiave per la futura comunicazione pubblica: EdilSync non ha moduli isolati, ma moduli interconnessi.

---

## 33. Flussi Principali End-to-End

### 33.1 Flusso creazione societa

1. Utente crea societa.
2. Diventa admin della societa.
3. Viene creato il canale generale societario.
4. I suoi accessi vengono sincronizzati.
5. Puo passare al contesto societario.

### 33.2 Flusso creazione progetto personale

1. Utente in contesto personale crea progetto.
2. Viene registrato come `homeowner` attivo.
3. Viene creato il canale generale progetto.
4. Il progetto compare nella dashboard e nell'elenco progetti del contesto personale.

### 33.3 Flusso creazione progetto societario

1. Admin societario crea progetto in contesto company.
2. La societa entra come `contractor` attivo.
3. Può invitare il committente via email.
4. Canale generale progetto creato automaticamente.

### 33.4 Flusso invito partecipante progetto

1. Partecipante autorizzato invita persona o societa.
2. Il ruolo progetto viene validato rispetto al tipo societario.
3. Il partecipante viene creato in stato `invited`.
4. Viene aggiunto al canale generale.
5. Partono notifica/e ed email coerenti.

### 33.5 Flusso gestione attivita e blocchi

1. Si crea una task.
2. La task viene assegnata a persona o societa.
3. Se si blocca, si indica motivo e soggetto bloccante.
4. Il sistema puo notificare il responsabile.
5. Opzionalmente si apre una disputa collegata.

### 33.6 Flusso documentale tecnico

1. Si carica un documento o modello.
2. Si classificano categoria e metadati.
3. Il documento e visibile nel relativo scope.
4. Puo ricevere commenti.
5. Puo essere revisionato creando una nuova versione.
6. Se e BIM, puo essere visualizzato in preview 3D o fallback viewer.

### 33.7 Flusso timbratura-finanza

1. Il membro societario apre una work session.
2. La collega opzionalmente a un progetto.
3. L'admin o il manager finance puo sincronizzare il lavoro in cost entries.
4. I costi alimentano il controllo economico di progetto.

---

## 34. Cosa Rende EdilSync Comodo per Ciascun Attore

### 34.1 Per il committente

- chiarezza sullo stato del progetto
- visibilita su attivita, documenti, eventi e dispute
- tracciabilita delle richieste di modifica
- visibilita economica senza bisogno di strumenti separati

### 34.2 Per l'impresa contractor

- gestione strutturata di progetto, team, subappalti e documenti
- chat di progetto con riferimenti reali a task e documenti
- controllo operativo e finanziario nello stesso ambiente
- protezione tramite documentazione, storici e dispute

### 34.3 Per il subappaltatore

- accesso contestuale solo a cio che serve
- task, documenti e chat rilevanti
- minore dispersione rispetto a email e WhatsApp

### 34.4 Per il tecnico progettista

- accesso a documentazione tecnica, calendario e confronto contestuale
- spazio unico dove coordinarsi con impresa e committente

### 34.5 Per la societa operativa sul campo

- timbrature e presenze
- modalita operativa rapida
- documenti e foto di cantiere
- chat interna societaria e chat progetto

---

## 35. Stato di Maturita per Area

### 35.1 Aree gia operative e ben presenti

- contesti personale/societa
- gestione societa e membri
- gestione progetti e partecipanti
- task
- milestone
- change request
- dispute
- documenti con revisioni e commenti
- chat per progetti e societa
- calendario ed eventi
- notifiche in-app ed email
- timbrature societarie
- modalita operativa
- dashboard di sistema

### 35.2 Aree presenti ma ancora evolvibili

- assistente AI, gia integrato ma ancora placeholder come logica di dominio
- esperienza BIM/IFC, gia presente ma da considerare area tecnica da consolidare nel tempo
- finanza, gia sostanziosa ma verosimilmente ancora in evoluzione rispetto a reporting piu avanzato

### 35.3 Aree da considerare meno mature o piu neutre lato marketing pubblico

- pagine legali attualmente strutturate come pagine applicative, ma non necessariamente definitive nei contenuti
- login Google indicato come prossimo step nella UI corrente

---

## 36. Sintesi Finale

EdilSync e oggi una piattaforma molto piu articolata di un semplice project manager per edilizia.

Le sue caratteristiche distintive sono:

- modello contestuale persona-societa-progetto
- coerenza tra ruolo utente, ruolo societa e ruolo progetto
- collaborazione strutturata, non solo chat libera
- documentazione e tracciabilita native
- gestione di varianti e dispute come parti centrali del processo
- superficie multipla: normale e operativa
- collegamento tra operativita di cantiere e controllo economico

In termini di posizionamento, EdilSync si presta bene a essere raccontato come:

- piattaforma di coordinamento contestuale per ristrutturazioni e cantieri residenziali
- workspace condiviso tra committente, impresa, subappaltatori e professionisti
- sistema di protezione documentale e operativa oltre che di comunicazione
- strumento capace di unire progetto, cantiere, societa, documenti, comunicazione e finanza in un unico flusso

---

## 37. Frasi guida utili per future landing pages

- Un solo spazio condiviso per committente, impresa, tecnici e subappaltatori.
- I permessi non sono rigidi: cambiano con il contesto in cui stai lavorando.
- EdilSync unisce progetto, societa, cantiere, documenti, chat e finanza.
- Meno caos tra chat, email e file sparsi. Piu tracciabilita e piu responsabilita chiare.
- Dalla timbratura in cantiere fino al controllo costi, tutto resta collegato.
- Varianti, dispute, documenti e messaggi vivono nello stesso contesto operativo.
