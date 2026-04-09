# EdilSync - Analisi workflow documentale e approvazioni

Data: 2026-04-09

## Scopo del documento

Questo documento riassume l'analisi svolta sul controllo documentale in EdilSync, con particolare attenzione a:

- stati del documento
- revisioni
- approvazioni e respingimenti
- relazione tra stato documento e ruoli di società / progetto

Importante:

- ad oggi EdilSync non implementa ancora un vero workflow approvativo documentale basato sui ruoli
- alcune basi tecniche esistono già
- il modello discusso in questa analisi rappresenta uno sviluppo futuro, non il comportamento attuale dell'app

## Sintesi esecutiva

Lo stato documentale oggi è presente soprattutto come metadato manuale del record documento.

Il sistema ha già alcune fondamenta corrette:

- versionamento base dei documenti
- tracciamento revisioni
- storico eventi automatico
- tabella per approvazioni documentali

Tuttavia, oggi manca ancora la parte centrale del processo:

- chi può mandare un documento in revisione
- chi può approvarlo
- chi può respingerlo
- chi può archiviarlo
- come queste regole cambiano in base al tipo di documento
- come queste regole cambiano in base al ruolo nel progetto e nella società

Quindi, allo stato attuale, non c'è ancora un workflow di approvazione formale. C'è un insieme di campi e strutture che preparano il terreno, ma non c'è ancora un motore di business coerente sopra di essi.

## Stato attuale nell'app

### 1. Stati disponibili

Nel modello dati del documento esiste già un campo `document_status` con questi valori:

- `draft`
- `in_review`
- `approved`
- `rejected`
- `superseded`
- `archived`

Questo è definito a schema nella migrazione di base del document control.

### 2. Dove vengono usati oggi

Nell'interfaccia attuale il campo stato è gestito in modo manuale nel dialog di upload / modifica documento.

In particolare:

- se il documento è considerato `technical`, l'utente vede e può modificare direttamente il campo stato
- se il documento non è `technical`, lo stato viene di fatto mantenuto su `draft`

Questo significa che oggi il ciclo degli stati non è governato da un workflow, ma da una modifica manuale del documento stesso.

### 3. Chi può cambiare lo stato oggi

Dal punto di vista dei permessi dati, la situazione attuale è sostanzialmente questa:

- i documenti possono essere aggiornati dall'autore del record
- non esiste ancora una regola server-side che impedisca all'autore di spostare liberamente lo stato
- non esiste ancora una funzione backend dedicata a validare le transizioni di stato

In pratica, oggi il cambio stato non è ancora un atto approvativo. È un aggiornamento del documento.

### 4. Revisioni oggi

Le revisioni sono già gestite meglio degli stati.

Quando un documento viene sostituito con un nuovo file:

- la revisione precedente viene marcata come non corrente
- lo stato della revisione precedente viene portato a `superseded`
- la nuova revisione viene creata come record separato
- la catena revisionale è mantenuta tramite `parent_document_id`, `root_document_id` e `revision_number`

Questa parte è già coerente con un vero sistema di revisione documentale.

### 5. Storico eventi oggi

Esiste già una tabella `document_revision_events` che registra automaticamente eventi come:

- creazione documento
- creazione revisione
- sostituzione file
- cambio stato
- aggiornamento metadati

Questo è un punto forte dell'architettura attuale, perché permette di costruire in futuro un audit trail più serio senza ripartire da zero.

### 6. Approvazioni oggi

Esiste già anche una tabella `document_approvals`, con campi pensati per:

- stato approvazione (`pending`, `approved`, `rejected`)
- richiedente
- revisore
- nota di revisione
- data revisione

Però, ad oggi:

- questa tabella non è ancora al centro del workflow UI
- non è ancora il motore principale delle decisioni documentali
- non esiste ancora una politica completa che leghi approvazioni, ruoli e transizioni di stato

Quindi la tabella c'è, ma il processo applicativo sopra di essa non è ancora completato.

## Cosa NON è vero oggi

Per evitare ambiguità, è importante esplicitare cosa oggi non è ancora implementato:

- non esiste ancora un workflow formale "bozza -> in revisione -> approvato / respinto -> archiviato"
- non esiste ancora una distinzione rigorosa tra autore del documento e approvatore del documento
- non esiste ancora una regola per cui solo certi ruoli possano approvare o respingere
- non esiste ancora una differenziazione seria delle regole per tipo documento
- non esiste ancora un assegnatario approvativo calcolato in automatico
- non esiste ancora un blocco backend che vieti transizioni di stato non consentite
- non esistono ancora pulsanti di workflow dedicati come `Invia in revisione`, `Approva`, `Respingi`, `Archivia`

In altre parole: oggi c'è controllo base del documento, ma non ancora governance documentale completa.

## Perché il modello attuale non basta

Il motivo principale è che uno stato documentale, da solo, non equivale a un processo.

Per avere un vero workflow servono almeno tre cose:

### 1. Regole di transizione

Bisogna poter dire con precisione:

- chi può passare da `draft` a `in_review`
- chi può passare da `in_review` a `approved`
- chi può passare da `in_review` a `rejected`
- chi può archiviare

Oggi queste regole non sono ancora centralizzate nel backend.

### 2. Separazione tra autore e approvatore

In un processo approvativo serio, di norma:

- l'autore prepara e propone
- un soggetto diverso verifica e decide

Oggi questa separazione non è ancora garantita dal sistema.

### 3. Dipendenza dal contesto

In EdilSync i permessi dipendono dal contesto. Anche i documenti devono seguire questo principio.

Per esempio:

- un documento di società non segue necessariamente le stesse regole di un documento di progetto
- un documento tecnico non segue le stesse regole di una foto di cantiere
- un subappaltatore non dovrebbe approvare il proprio elaborato come decisione finale
- un `project_manager` del contractor potrebbe poter approvare documenti di un subappaltatore
- un `technical_office` potrebbe poter fare revisione tecnica ma non approvazione contrattuale

Questo livello di granularità oggi non è ancora modellato nel flusso applicativo.

## Base tecnica già disponibile

L'analisi ha evidenziato che l'app dispone già di una base solida per costruire il workflow futuro.

### 1. Scope documento

I documenti possono già appartenere a uno dei due scope:

- progetto
- società

Questa distinzione è importante perché i permessi futuri dovranno cambiare in base allo scope.

### 2. Ruoli società

Nel modello attuale esistono già ruoli interni di società, tra cui:

- `owner_admin`
- `project_manager`
- `site_manager`
- `crew_leader`
- `technical_office`
- `safety_manager`
- `worker`
- `backoffice`
- `external_consultant`

Esiste inoltre il ruolo base di membership società (`admin` / `member`).

### 3. Ruoli progetto

Nel progetto esistono già ruoli contestuali come:

- `homeowner`
- `contractor`
- `subcontractor`
- `architect`
- `engineer`
- `surveyor`
- `designer`
- `consultant`
- `supplier`

Questa combinazione tra ruolo società e ruolo progetto è esattamente il punto di partenza corretto per un workflow documentale contestuale.

### 4. Strutture dati già utili

Le tabelle già presenti e riusabili sono:

- `project_documents`
- `document_revision_events`
- `document_approvals`

Questo significa che il futuro sviluppo non richiederà di riscrivere tutto da zero.

## Direzione proposta per lo sviluppo futuro

La proposta emersa dall'analisi è di non trattare più `document_status` come un campo liberamente editabile, ma come il risultato di un workflow gestito dal backend.

### Principio guida

Il frontend non dovrebbe più decidere direttamente lo stato finale del documento.

Il frontend dovrebbe solo invocare azioni di business, ad esempio:

- `Invia in revisione`
- `Approva`
- `Respingi`
- `Archivia`
- `Crea nuova revisione`

La decisione su cosa sia consentito dovrebbe essere presa lato server in base a:

- scope del documento
- tipo documento / workflow class
- stato corrente
- ruolo società dell'utente
- ruolo progetto dell'utente
- eventuale relazione tra azienda emittente e azienda ricevente

## Classificazione futura dei documenti

Una parte centrale della proposta è introdurre una classificazione più utile al workflow, distinta dalla semplice categoria visuale.

L'idea è aggiungere un concetto come `workflow_class` o `approval_profile`, ad esempio:

- `informational`
- `technical_submission`
- `design_deliverable`
- `contractual`
- `safety`
- `as_built`

Questa classificazione servirebbe a decidere automaticamente chi può:

- proporre il documento
- richiedere revisione
- approvare
- respingere
- archiviare

## Esempio di logica futura

Di seguito una direzione ragionata, da considerare come proposta di prodotto e non come comportamento già attivo.

### Informational

Esempi:

- foto
- report operativi
- allegati informativi

Proposta:

- autore può creare bozza
- autore o `project_manager` o `site_manager` può inviare in revisione
- `project_manager`, `site_manager`, `owner_admin` possono approvare
- archiviazione riservata a ruoli più alti

### Technical submission

Esempi:

- tavole esecutive
- modelli IFC
- documenti tecnici emessi da impresa o studio

Proposta:

- autore prepara la bozza
- `technical_office` o autore invia in revisione
- approvazione finale affidata al soggetto ricevente o responsabile di controllo
- stessa parte emittente non dovrebbe auto-approvare come decisione finale

### Design deliverable

Esempi:

- elaborati di progetto
- documentazione professionale emessa da architetto / ingegnere / geometra

Proposta:

- i professionisti possono emettere
- il committente o il soggetto capofila può approvare
- l'autore non dovrebbe chiudere da solo l'iter approvativo

### Contractual

Esempi:

- contratti
- allegati commerciali
- ordini e documenti amministrativi formali

Proposta:

- creazione da `backoffice`, `owner_admin`, `project_manager`
- approvazione da `owner_admin` o soggetto titolato nel contesto progetto

### Safety

Esempi:

- documentazione sicurezza
- verbali o allegati HSE

Proposta:

- revisione tecnica possibile per `safety_manager`
- approvazione finale da ruolo responsabile del contesto

### As-built

Esempi:

- elaborati finali aggiornati
- documentazione conclusiva di commessa

Proposta:

- creazione da `technical_office`, progettisti o figure tecniche abilitate
- approvazione da responsabile tecnico / project manager / committente a seconda del processo

## Transizioni consigliate per il futuro

Per lo sviluppo futuro, la proposta è rendere esplicite e limitate le transizioni.

### Transizioni principali

- `draft -> in_review`
  - azione: richiesta revisione
  - consentita a autore o editor abilitato

- `in_review -> approved`
  - azione: approvazione
  - consentita solo ad approvatore compatibile con il workflow

- `in_review -> rejected`
  - azione: respingimento
  - consentita solo ad approvatore compatibile
  - con nota obbligatoria

- `approved -> archived`
  - azione: archiviazione
  - consentita a ruoli di controllo / amministrazione

- `approved -> superseded`
  - non come azione manuale
  - solo quando nasce una nuova revisione che sostituisce la precedente

### Principio importante

Un documento approvato non dovrebbe essere semplicemente "editato" per cambiarne il contenuto. Dovrebbe nascere una nuova revisione.

## Architettura futura consigliata

### 1. Backend first

Le regole del workflow dovrebbero vivere in funzioni server-side dedicate, ad esempio:

- `requestDocumentReview`
- `approveDocument`
- `rejectDocument`
- `archiveDocument`
- `createDocumentRevision`

Queste funzioni dovrebbero:

- validare il token utente
- ricostruire contesto documento
- risolvere ruolo società e ruolo progetto
- verificare se la transizione è consentita
- aggiornare il documento
- creare o aggiornare record in `document_approvals`
- scrivere evento in `document_revision_events`

### 2. Frontend guidato da azioni

L'interfaccia non dovrebbe più mostrare una select libera di stato come meccanismo principale.

Dovrebbe invece mostrare pulsanti contestuali, ad esempio:

- `Invia in revisione`
- `Approva`
- `Respingi`
- `Archivia`
- `Nuova revisione`

Mostrando solo le azioni che l'utente è autorizzato a eseguire.

### 3. Uso reale di `document_approvals`

La tabella `document_approvals` dovrebbe diventare il registro centrale delle decisioni, non un contenitore secondario non ancora sfruttato.

## Perché questo sviluppo è stato considerato complesso

Durante l'analisi è emerso che fare questo cambiamento "bene" richiede diverse decisioni di prodotto e di dominio, non solo sviluppo UI.

Le complessità principali sono:

- definire con precisione i tipi documentali che richiedono approvazione
- capire quando contano i ruoli società e quando contano i ruoli progetto
- gestire i casi in cui autore e approvatore appartengono a società diverse
- stabilire se certe approvazioni possano essere monostadio o multistadio
- evitare di introdurre un flusso troppo rigido per documenti che non ne hanno bisogno

Per questo motivo la conclusione dell'analisi è che il tema va trattato come sviluppo funzionale dedicato, non come semplice rifinitura del campo stato esistente.

## Conclusione

Ad oggi EdilSync ha già una buona base per il controllo documentale:

- revisioni
- eventi
- stati
- tabella approvazioni

Ma non ha ancora un workflow documentale completo basato sui ruoli e sul contesto.

La proposta emersa dall'analisi è:

- non considerare l'attuale sistema come workflow approvativo finito
- trattare il tema come sviluppo futuro dedicato
- progettare prima matrice ruoli / documenti / transizioni
- spostare poi le decisioni di stato dal frontend al backend

Questo documento serve quindi a fissare un punto chiaro:

- oggi il comportamento non è ancora quello di un vero sistema di approvazione documentale
- la direzione futura è stata analizzata
- l'implementazione completa richiederà un intervento strutturato di prodotto, schema, backend e frontend