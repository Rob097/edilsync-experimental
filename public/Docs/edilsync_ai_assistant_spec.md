# EdilSync - Specifica di Riferimento dell'Assistente AI

## Stato del documento

Questo documento e la fonte unica di riferimento per decidere quando l'assistente AI di EdilSync puo essere considerato davvero pronto.

Da questo momento il criterio e semplice:

- l'assistente non e pronto quando "risponde in modo plausibile"
- l'assistente e pronto solo quando e coerente con contesti, permessi, RLS, pricing, sponsorizzazioni, modalita operative e flussi reali dell'app
- ogni nuova implementazione dell'assistente va verificata contro questo documento
- questo file va aggiornato insieme al codice, non dopo

Obiettivo pratico:

- usare questo documento come contratto funzionale e tecnico
- usare questo documento come checklist di avanzamento
- chiudere i gap uno per volta fino ad allineamento completo

---

## Scopo dell'assistente

L'assistente di EdilSync non deve essere un chatbot generico.

Deve essere un assistente contestuale di cantiere che aiuta persone, imprese e partecipanti di progetto a:

- capire cosa sta succedendo nel contesto attivo
- trovare rapidamente dati gia presenti nell'app
- eseguire azioni consentite con gli stessi permessi dell'utente reale
- spiegare perche qualcosa e disponibile, limitato o bloccato
- restare coerente con il funzionamento reale di EdilSync, non con una logica parallela

In altre parole: l'assistente deve essere una superficie intelligente sopra EdilSync, non un sistema separato con privilegi propri.

---

## Decisioni Architetturali Congelate

### 1. L'assistente agisce come l'utente autenticato

Questa decisione e congelata.

Regola:

- ogni lettura o scrittura sulle tabelle di dominio deve avvenire con un client Supabase inizializzato con il JWT dell'utente corrente
- l'assistente deve vedere e poter fare solo cio che vedrebbe e potrebbe fare lo stesso utente nella stessa schermata e nello stesso contesto
- le RLS esistenti, le policy server-side e i controlli applicativi gia in uso restano la fonte primaria di autorizzazione

Conseguenze:

- niente query business con service role seguite da filtro applicativo
- niente scorciatoie "leggo tutto e poi decido cosa mostrare"
- niente risposte costruite con dati che l'utente non avrebbe potuto leggere direttamente

Eccezioni ammesse solo se esplicitamente documentate:

- bootstrap tecnico strettamente interno
- audit/telemetria isolati da tabelle di dominio
- rate limiting tecnico

Eccezioni vietate:

- lettura di progetti, task, milestone, documenti, chat, finanza, notifiche o membership con service role
- generazione embeddings su contenuti non leggibili dall'utente richiedente
- mutazioni business eseguite con permessi elevati

### 2. Il contesto e sempre esplicito

L'assistente deve ragionare sempre su tre coordinate minime:

- `context_type`: `personal`, `company`, `project`
- `context_id`
- `ui_mode`: almeno `normal` oppure `operational`

Il solo `context_type/context_id` non basta, perche alcune richieste devono seguire logiche diverse in modalita normale e in modalita operativa.

Esempio:

- "quali sono le scadenze di oggi?" in modalita normale deve seguire la logica del calendario
- la stessa domanda in operativa deve seguire la logica del riepilogo operativo giornaliero

### 3. Nessun cambio contesto nascosto

L'assistente non puo agire in un altro cantiere o per un'altra impresa solo perche l'utente lo cita nel testo.

Regola:

- se la richiesta riguarda un contesto diverso da quello attivo, l'assistente deve fermarsi
- puo chiedere all'utente di aprire il contesto corretto oppure usare un eventuale flusso esplicito di cambio target, se in futuro verra progettato

Esempio corretto:

- utente in contesto privato: "metti in corso la task XYZ del progetto 123"
- risposta corretta: "In questo momento sei nel contesto privato. Per modificare una task di quel cantiere devo operare nel contesto del progetto corretto. Apri quel cantiere o passa al contesto giusto e poi riprova."

### 4. Tool-first, non prompt-first

L'assistente non deve inventare accessi o logiche.

Per ogni famiglia di richiesta importante deve esistere un tool deterministico, con input e output chiari.

Regola:

- prima si definiscono i tool consentiti
- poi il modello li usa per leggere o agire
- il testo generato serve a spiegare il risultato, non a sostituire la logica di business

### 5. Le capability del prodotto restano vincolanti

L'assistente deve rispettare le stesse regole di piano, sponsorizzazione e limitazione gia presenti in EdilSync.

Quindi:

- se una feature e `disabled`, l'assistente non puo leggerla ne usarla
- se una feature e `limited`, l'assistente deve rispettare quel limite reale
- se una feature e nascosta per ruolo, l'assistente non la deve far emergere come se fosse semplicemente "premium"

### 6. Le azioni sono whitelistate e a rischio controllato

L'assistente potra eseguire azioni solo tramite tool espliciti.

Classi di rischio:

- basso rischio: azioni personali reversibili o molto locali
- medio rischio: scritture operative su task, commenti, eventi, messaggi
- alto rischio: approvazioni, finanza, sponsorship, billing, modifiche ampie o irreversibili

Per le azioni sensibili serve conferma esplicita prima della scrittura.

### 7. La risposta deve spiegare il perche

Se l'assistente non puo fare qualcosa, la risposta corretta non e "non trovo nulla" quando in realta il problema e autorizzativo o di piano.

Deve distinguere chiaramente:

- dato non esistente
- dato non visibile in questo contesto
- funzione non disponibile per ruolo
- funzione limitata dal piano o dalla sponsorizzazione
- richiesta ambigua che richiede un contesto piu preciso

---

## Fonti Autorevoli da cui deriva questa specifica

Documentazione prodotto e contratto:

- [edil_sync_product_domain_overview.md](./edil_sync_product_domain_overview.md)
- [edilsync_complete_application_map.md](./edilsync_complete_application_map.md)
- [edilsync_pricing_model.md](./edilsync_pricing_model.md)
- [edilsync_document_workflow_analysis.md](./edilsync_document_workflow_analysis.md)

Codice che definisce i comportamenti reali dell'app:

- [assistant.ts](../../supabase/functions/_shared/assistant.ts)
- [assistantEmbeddings.ts](../../supabase/functions/_shared/assistantEmbeddings.ts)
- [chat-agent/index.ts](../../supabase/functions/chat-agent/index.ts)
- [supabase.ts](../../supabase/functions/_shared/supabase.ts)
- [assistantContext.js](../../src/lib/assistantContext.js)
- [AssistantFloatingButton.jsx](../../src/components/assistant/AssistantFloatingButton.jsx)
- [useFeatureAccess.js](../../src/hooks/useFeatureAccess.js)
- [Calendar.jsx](../../src/pages/Calendar.jsx)
- [OperativeLayout.jsx](../../src/operativa/OperativeLayout.jsx)
- [OperativeDaySummary.jsx](../../src/operativa/pages/OperativeDaySummary.jsx)

Entita di dominio rilevanti:

- [Project.json](../../entities/Project.json)
- [ProjectParticipant.json](../../entities/ProjectParticipant.json)
- [CompanyMember.json](../../entities/CompanyMember.json)
- [Task.json](../../entities/Task.json)
- [Milestone.json](../../entities/Milestone.json)
- [ChangeRequest.json](../../entities/ChangeRequest.json)
- [DisputeCase.json](../../entities/DisputeCase.json)
- [ProjectDocument.json](../../entities/ProjectDocument.json)
- [DocumentComment.json](../../entities/DocumentComment.json)
- [Event.json](../../entities/Event.json)
- [Notification.json](../../entities/Notification.json)
- [WorkSession.json](../../entities/WorkSession.json)
- [BudgetLine.json](../../entities/BudgetLine.json)
- [CostEntry.json](../../entities/CostEntry.json)
- [ProgressStatement.json](../../entities/ProgressStatement.json)

Migrations e autorizzazioni pricing:

- [20260320103000_billing_sponsorship_foundation.sql](../../supabase/migrations/20260320103000_billing_sponsorship_foundation.sql)
- [20260320113000_pricing_authorization_foundation.sql](../../supabase/migrations/20260320113000_pricing_authorization_foundation.sql)
- [20260316161000_finance_permissions_alignment.sql](../../supabase/migrations/20260316161000_finance_permissions_alignment.sql)

---

## Stato Attuale Sintetico

Questa tabella fotografa il punto di partenza al momento della redazione del documento.

| Area | Stato attuale | Giudizio |
| --- | --- | --- |
| Accesso ai dati di dominio | Letture business via `adminClient` / service role | Non allineato |
| Isolamento per contesto attivo | Esiste una guardia di contesto di base | Parziale |
| Modalita operativa | Il resolver frontend non copre tutte le route operative | Non allineato |
| Tool di sola lettura | Presenti solo pochi tool generici | Parziale |
| Tool di scrittura | Assenti | Non iniziato |
| Coerenza con pricing e sponsorship | Non applicata in modo completo nell'assistente | Non allineato |
| Coerenza con milestone / finance | Rischio di bypass rispetto alle regole reali | Non allineato |
| Scadenze e lavoro di oggi | Non replicate le logiche reali di Calendar e Operativa | Non allineato |
| Embeddings e ricerca semantica | Presenti ma su perimetro limitato e non ancora coerenti con tutta la visibilita fine-grained | Parziale |
| Test di integrazione assistant | Mancanti sui casi piu sensibili | Non allineato |

---

## Modello di Contesto che l'Assistente Deve Rispettare

### Contesto personale

Qui l'utente agisce come persona fisica.

L'assistente deve poter aiutare su:

- notifiche personali
- inviti ricevuti
- progetti dove la persona partecipa come persona
- task assegnate direttamente alla persona
- eventi personali o comunque visibili nel contesto personale

L'assistente non deve:

- agire come una societa se il contesto attivo e personale
- trattare una societa accessibile come se fosse automaticamente il contesto corrente

### Contesto societa

Qui l'utente agisce per conto dell'impresa attiva.

L'assistente deve rispettare:

- `active_context = company`
- `active_company_id`
- ruolo societario reale dell'utente
- feature societarie disponibili per quella impresa

Qui l'assistente puo aiutare su:

- chat societaria
- documenti societari
- membri societa
- timbrature e work session, se il piano lo consente
- progetti accessibili da quella impresa

### Contesto progetto

Qui l'assistente lavora su un singolo cantiere.

Il progetto e leggibile o modificabile solo se l'utente puo operare su quel cantiere nel contesto attuale.

Il progetto deve ereditare correttamente:

- partecipazioni attive
- ruolo progetto della persona o della societa
- regole di sponsorship
- capability di progetto
- eventuali limiti di ruolo su finanza, milestone, chat avanzata, documenti avanzati

### Modalita UI

L'assistente deve sapere almeno se l'utente sta operando in:

- modalita normale
- modalita operativa

Questo non crea un nuovo contesto di sicurezza, ma cambia l'interpretazione di alcune richieste.

Esempi:

- "cosa devo fare oggi?" in operativa deve privilegiare task rilevanti oggi e task gia in corso
- la stessa domanda in modalita normale puo privilegiare calendario e scadenze con `due_date`

---

## Regole Universali di Comportamento

### 1. Mai oltre il contesto attivo

Se la richiesta e ambigua, l'assistente deve prima ancorarsi al contesto attivo.

### 2. Mai oltre i permessi reali

Se l'utente non potrebbe aprire o modificare un dato da UI, l'assistente non deve poterlo fare.

### 3. Mai oltre il piano reale

Se milestone, finanza, timbrature o chat avanzata non sono sbloccate, l'assistente non puo aggirare il vincolo.

### 4. Nessuna conoscenza implicita cross-cantiere

Se l'utente chiede "la task XYZ" e quella sigla non e univoca nel contesto, l'assistente deve chiedere quale task intende.

### 5. Prima query strutturata, poi semantica

Quando il dato esiste in una tabella precisa, si usa un tool strutturato.

La ricerca semantica serve per:

- documenti
- commenti
- note libere
- conoscenza non rigidamente tabellare

Non deve sostituire query chiare su task, milestone, costi o notifiche.

### 6. Le risposte devono essere operative

L'assistente deve privilegiare risposte come:

- cosa e urgente oggi
- cosa e bloccato
- chi e assegnato
- che impatto ha una modifica
- quale e il prossimo passo

Inutile invece produrre testo generico o narrativo se esiste un dato preciso.

### 7. Le azioni devono essere spiegate e tracciabili

Dopo una scrittura l'assistente deve restituire almeno:

- cosa ha fatto
- su quale entita
- in quale contesto
- eventuale conferma o warning

---

## Ambiti Funzionali che l'Assistente Deve Coprire

## 1. Orientamento e stato del contesto

L'assistente deve saper dire:

- in quale contesto sta operando
- se sta parlando come privato, impresa o cantiere
- quali limiti principali si applicano in quel contesto

Esempi:

- "Sto lavorando come impresa o come privato?"
- "Su quale cantiere mi stai rispondendo adesso?"
- "Perche non posso vedere la finanza di questo progetto?"

Done when:

- sa riportare il contesto corretto
- non confonde modalita operativa e contesto di sicurezza
- spiega le limitazioni senza inventare

## 2. Panoramica cantiere e partecipanti

L'assistente deve poter riassumere un progetto reale usando gli stessi dati dell'app.

Deve saper dire:

- stato del progetto
- principali partecipanti attivi
- homeowner, contractor, subappaltatori, professionisti presenti
- numero e stato di task, milestone, varianti, contestazioni, documenti recenti

Esempi:

- "Fammi il quadro del cantiere"
- "Chi sta lavorando su questo progetto?"
- "Chi e il contractor principale e chi sono i subappaltatori attivi?"

Vincoli:

- niente milestone se non leggibili
- niente dati economici se non leggibili
- i conteggi devono usare gli stati reali delle entita

## 3. Task, priorita e lavoro di oggi

Questo e uno dei casi d'uso principali.

L'assistente deve saper:

- elencare task aperte nel contesto attivo
- mostrare task assegnate all'utente o all'impresa attiva
- mostrare task bloccate con `blocked_reason`
- rispondere sulle scadenze di oggi seguendo la logica reale della schermata corretta
- aggiornare lo stato task quando l'utente ha davvero il permesso

Esempi di lettura:

- "Quali task ho oggi?"
- "Cosa e bloccato in questo cantiere?"
- "Quali task sono assegnate alla mia impresa?"
- "Quali scadono oggi?"

Esempi di azione:

- "Metti la task posa massetto in corso"
- "Segna questa task come completata"
- "Assegna la task all'impresa Rossi"

Regole obbligatorie:

- usare gli stati reali: `not_started`, `in_progress`, `completed`, `blocked`
- rispettare la logica `Calendar` in modalita normale
- rispettare la logica `OperativeDaySummary` in modalita operativa
- non agire su task fuori contesto o non univoche

## 4. Milestone

L'assistente deve saper:

- leggere milestone solo se il progetto le rende accessibili
- mostrare milestone in ritardo, in corso, completate
- spiegare la prossima milestone e le target date

Esempi:

- "Qual e la prossima milestone?"
- "Ci sono milestone in ritardo?"
- "Quante milestone abbiamo chiuso questo mese?"

Azioni future possibili:

- creare milestone
- cambiare stato milestone
- aggiornare target date

Solo se i permessi reali lo consentono.

## 5. Varianti / Change request

L'assistente deve supportare il flusso reale delle change request.

Letture richieste:

- richieste aperte
- richieste in attesa di risposta
- impatto su costi e tempi
- richieste assegnate all'utente o alla sua impresa

Azioni richieste, se consentite:

- aprire una change request
- aggiornare stato
- aggiungere una risposta o nota

Esempi:

- "Quante varianti sono in attesa?"
- "Mostrami quelle con impatto economico"
- "Apri una variante per spostamento impianto"

## 6. Contestazioni / Dispute

L'assistente deve poter gestire anche i casi critici di progetto.

Letture richieste:

- dispute aperte
- dispute in review o escalate
- collegamenti con task o change request
- impatto economico o temporale dichiarato

Azioni future possibili:

- aprire una contestazione
- aggiornare stato se il flusso lo consente
- aggiungere nota di risoluzione

Esempi:

- "Abbiamo contestazioni aperte?"
- "Qual e la disputa con impatto maggiore?"
- "Apri una contestazione per ritardo sulla consegna serramenti"

## 7. Documenti, revisioni e commenti

Il modulo documentale e centrale e richiede una distinzione importante.

Oggi l'app ha:

- documenti di progetto e di societa
- revisioni base
- commenti
- metadati di stato documento

Ma non ha ancora un workflow approvativo formale completo.

L'assistente quindi deve fare oggi:

- cercare documenti per nome, categoria, disciplina, area, tag, revisione
- trovare la revisione corrente
- leggere commenti accessibili
- aggiungere commenti se l'utente puo farlo
- spiegare con onesta che lo stato documento oggi e un metadato e non un workflow approvativo completo

Esempi:

- "Trova l'ultimo elaborato strutturale"
- "Qual e la revisione corrente del DWG del piano terra?"
- "Ci sono commenti aperti sul computo?"
- "Aggiungi un commento: verificare quota solaio"

Regola importante:

- l'assistente non deve raccontare un workflow documentale piu maturo di quello che l'app supporta davvero oggi

## 8. Chat e canali

L'assistente deve saper leggere e usare la messaggistica senza violare membership o limiti di piano.

Letture richieste:

- canali visibili nel contesto
- ultimi messaggi rilevanti
- menzioni dell'utente

Azioni future possibili:

- inviare un messaggio in un canale visibile
- preparare una bozza di messaggio da confermare

Esempi:

- "Nel canale General ci sono aggiornamenti importanti?"
- "Scrivi a General che domani si parte con il massetto"

Vincoli obbligatori:

- in company free solo canale `General` dove previsto dal contratto
- in project free solo canale `General`
- nessuna lettura di canali non appartenenti al contesto o senza membership coerente

## 9. Calendario ed eventi

L'assistente deve usare gli eventi reali visibili nel contesto.

Letture richieste:

- eventi di oggi
- prossimi sopralluoghi o appuntamenti
- conflitti temporali rilevanti

Azioni future possibili:

- creare evento
- aggiornare evento
- annullare evento se consentito

Esempi:

- "Che appuntamenti ho oggi?"
- "Crea un sopralluogo domani alle 9 al cantiere"
- "Ci sono conflitti questa settimana?"

## 10. Notifiche

L'assistente deve poter leggere le notifiche dell'utente e aiutarlo a smaltirle.

Letture richieste:

- notifiche non lette
- notifiche per tipo
- notifiche nel contesto attivo

Azioni future possibili:

- segnare notifiche come lette
- filtrare per tipo

Esempi:

- "Cosa devo ancora leggere?"
- "Segna come lette le notifiche sulle task"
- "Ho inviti in sospeso?"

## 11. Work session, timbrature e operativa

Nel contesto impresa e nella modalita operativa l'assistente deve coprire i flussi giornalieri di cantiere.

Letture richieste:

- chi e timbrato oggi
- work session aperte
- note di giornata
- ore registrate su un progetto, se leggibili

Azioni future possibili:

- clock in
- clock out
- inserimento nota a fine sessione
- inserimento manuale admin dove consentito

Esempi:

- "Sono timbrato?"
- "Chi e ancora in sessione aperta oggi?"
- "Chiudi la mia giornata e aggiungi nota: completato rilievo"

Vincoli:

- funzionalita subordinate al piano societario
- nessun bypass del ruolo societario o dei controlli admin/member

## 12. Finanza di progetto

Questa area e ad alta sensibilita.

L'assistente deve poterla trattare solo se l'utente ha davvero accesso in quel progetto.

Letture richieste:

- sintesi budget vs costi
- scostamenti per voce
- costi recenti
- SAL / progress statements accessibili
- eventuali collegamenti tra costi, task, milestone, change request, dispute

Azioni future possibili, solo se esplicitamente volute dal prodotto:

- inserire costo
- aggiornare costo
- creare o aggiornare SAL
- aggiungere nota finanziaria

Esempi:

- "Come siamo messi rispetto al budget?"
- "Quali voci stanno sforando?"
- "Quanto abbiamo maturato al SAL 5?"

Regola inderogabile:

- nessuna query finance puo passare fuori dai controlli reali di capability e RLS

## 13. Piani, sponsorship e feature access

L'assistente deve capire il perche delle limitazioni prodotto.

Deve saper dire:

- se una funzione e disponibile, limitata o disabilitata
- se il progetto e sponsorizzato oppure no
- se la societa e free o paid, per quanto riguarda la disponibilita delle funzioni rilevanti

Esempi:

- "Perche non vedo le milestone?"
- "Questo progetto e sponsorizzato?"
- "Perche posso usare la chat solo su General?"

L'assistente non deve:

- vendere feature in modo scollegato dal contesto
- parlare di upgrade quando il blocco e di ruolo e non di piano

## 14. Navigazione e guida dentro l'app

L'assistente deve anche aiutare a orientarsi nel prodotto.

Deve saper:

- spiegare dove trovare una funzione
- distinguere tra contesto privato, impresa e cantiere
- chiarire le differenze tra modalita normale e operativa

Esempi:

- "Dove trovo le timbrature?"
- "Come invito un subappaltatore?"
- "Qual e la differenza tra chat impresa e chat progetto?"

Questa parte e utile anche se non comporta scritture.

---

## Cosa l'Assistente Non Deve Fare

- non deve consultare dati di piu contesti contemporaneamente se il prodotto non lo prevede esplicitamente
- non deve aggirare limiti free/paid o sponsorship
- non deve trattare dati economici come se fossero sempre disponibili a tutti i partecipanti
- non deve assumere che la modalita operativa coincida sempre con il contesto progetto corretto
- non deve inventare workflow documentali, approvativi o finanziari piu maturi di quelli realmente esistenti
- non deve eseguire azioni ad alto impatto senza conferma esplicita
- non deve fare scritture massive o ambigue
- non deve rispondere con sicurezza quando la richiesta non e risolvibile in modo deterministico

---

## Requisiti di Ricerca Semantica e Memoria

La ricerca semantica e utile, ma subordinata alle regole di dominio.

### Quando serve

- recupero di documenti e revisioni per descrizione libera
- recupero di commenti e note
- recupero di testo non facilmente interrogabile con query rigide

### Quando non basta

- task di oggi
- task bloccate
- milestone in ritardo
- costo vs budget
- canali disponibili
- notifiche non lette

### Regole obbligatorie

- nessun contenuto indicizzato deve essere visibile tramite embeddings se non sarebbe leggibile tramite RLS nello stesso scenario
- se una stessa area ha visibilita diversa per ruoli o feature, le embeddings devono rispettare quella stessa granularita
- se l'indice embeddings e condiviso per solo `context_type/context_id`, ogni risultato recuperato va rifiltrato sul record sorgente reale (`source_type` + `source_id`) usando i permessi correnti dell'utente
- il sync avviato dal runtime assistant deve leggere le sorgenti con il client autenticato dell'utente; eventuali scritture tecniche dell'indice possono restare interne solo se non ampliano la visibilita finale dei risultati
- la risposta semantica deve chiarire se sta citando documenti, commenti o note
- quando possibile va riportato il riferimento al documento o all'entita trovata

### Nota pratica

Se il modello di accesso ai contenuti non e uniforme dentro lo stesso contesto, le embeddings condivise per solo `context_type/context_id` non sono sufficienti da sole. Serve una strategia coerente con la visibilita reale.

---

## Catalogo Minimo dei Tool Richiesti

I nomi sotto non sono obbligatori, ma il perimetro funzionale si.

### Fondazione contesto e capability

- `get_current_context_state`
- `get_context_capabilities`
- `explain_feature_availability`

### Letture progetto e operativita

- `get_project_overview`
- `list_context_participants`
- `get_today_deadlines`
- `list_tasks`
- `list_blocked_tasks`
- `list_milestones`
- `list_change_requests`
- `list_disputes`
- `list_recent_updates`

### Documenti e collaborazione

- `search_documents`
- `get_document_details`
- `list_document_comments`
- `list_channels`
- `list_recent_messages`
- `list_notifications`
- `list_events`

### Operativa impresa

- `list_work_sessions`
- `get_today_operational_summary`

### Finanza

- `get_finance_summary`
- `list_budget_variances`
- `list_cost_entries`
- `list_progress_statements`

### Azioni future whitelistate

- `update_task_status`
- `assign_task`
- `create_task`
- `add_document_comment`
- `send_channel_message`
- `mark_notification_read`
- `create_event`
- `update_event`
- `clock_in`
- `clock_out`
- `create_change_request`
- `update_change_request_status`

Tool ad alto rischio da decidere separatamente:

- scritture finance
- azioni di billing e sponsorship
- approvazioni documentali formali
- modifiche massive su task o milestone

---

## Esempi Canonici che l'Assistente Deve Gestire Correttamente

## Scenario 1 - Cambio stato task nel contesto corretto

Richiesta:

> "Metti in corso la task posa pavimento."

Comportamento corretto:

- verifica il contesto attivo
- trova la task in quel contesto
- se piu task corrispondono, chiede quale
- usa il tool di update solo se l'utente ha davvero permesso di aggiornare quella task
- aggiorna a `in_progress`
- restituisce conferma chiara

Comportamento scorretto:

- leggere con service role tutte le task del progetto
- scegliere in autonomia una task fuori contesto
- aggiornare con privilegi superiori a quelli dell'utente

## Scenario 2 - Task di oggi in modalita normale

Richiesta:

> "Quali sono le mie scadenze di oggi?"

Comportamento corretto:

- usa la stessa logica del calendario del contesto attivo
- considera `due_date`
- include task assegnate all'utente e, in contesto impresa, quelle assegnate alla societa attiva secondo la logica reale
- non include task fuori contesto

## Scenario 3 - Task di oggi in operativa

Richiesta:

> "Cosa devo seguire oggi in cantiere?"

Comportamento corretto:

- usa la logica del riepilogo operativo giornaliero
- include task rilevanti oggi
- include task gia `in_progress` se la logica operativa le considera da seguire oggi

## Scenario 4 - Finanza bloccata da capability

Richiesta:

> "Quanto stiamo sforando sul budget?"

Comportamento corretto:

- se la finanza non e disponibile in quel progetto per quell'utente, non risponde con dati economici
- spiega che la sezione non e accessibile nel contesto attuale

## Scenario 5 - Documenti e revisioni

Richiesta:

> "Trova l'ultima revisione del disegno strutturale del piano terra."

Comportamento corretto:

- cerca nel perimetro documentale leggibile
- privilegia la revisione corrente
- riporta nome documento, revisione, stato attuale e contesto corretto

## Scenario 6 - Chat limitata dal piano

Richiesta:

> "Apri gli ultimi messaggi dei canali progetto."

Comportamento corretto in progetto free:

- legge solo il perimetro consentito
- se il contratto consente solo `General`, non deve leggere o citare altri canali come disponibili

---

## Tracciamento di Implementazione

Legenda suggerita:

- `[ ]` non iniziato
- `[-]` parziale
- `[x]` allineato
- `[!]` decisione prodotto ancora da congelare

## P0 - Fondazione obbligatoria

- [ ] Sostituire le query business con client autenticato utente nei runtime assistant
- [ ] Eliminare l'uso del service role per letture e scritture di dominio assistant-driven
- [ ] Far arrivare all'assistente anche `ui_mode` oltre a `context_type/context_id`
- [ ] Allineare il resolver frontend alle route operative di progetto
- [ ] Introdurre un livello unico di risoluzione capability per i tool assistant
- [ ] Distinguere nei messaggi assistant tra `disabled`, `limited`, `not allowed by role`, `not found`
- [ ] Correggere i conteggi task sui reali stati dominio
- [ ] Definire policy chiara per eventuali eccezioni non-domain con service role
- [ ] Aggiungere audit dei tool eseguiti con `user_id`, contesto, esito e motivazione del rifiuto

## P1 - Letture coerenti con il prodotto

- [ ] Tool di stato contesto e capability
- [ ] Tool di panoramica progetto/cantiere
- [ ] Tool task e scadenze di oggi coerente con modalita normale
- [ ] Tool task e riepilogo giornaliero coerente con modalita operativa
- [ ] Tool partecipanti progetto e ruoli
- [ ] Tool milestone con rispetto capability reali
- [ ] Tool change request
- [ ] Tool dispute
- [ ] Tool documenti e revisioni
- [ ] Tool commenti documento
- [ ] Tool chat e canali con rispetto membership e limiti piano
- [ ] Tool notifiche
- [ ] Tool eventi calendario
- [ ] Tool work session e timbrature
- [ ] Tool finanza di progetto con rispetto capability reali
- [ ] Tool sponsorship, piano e spiegazione disponibilita feature

## P2 - Azioni whitelistate

- [ ] Aggiornamento stato task
- [ ] Assegnazione task
- [ ] Creazione task
- [ ] Inserimento commento documento
- [ ] Invio messaggio in chat
- [ ] Marcatura notifiche come lette
- [ ] Creazione evento
- [ ] Aggiornamento evento
- [ ] Clock in
- [ ] Clock out
- [ ] Apertura change request
- [ ] Cambio stato change request
- [ ] Apertura disputa
- [!] Eventuali scritture finance da approvare come scelta prodotto separata

## P3 - Ricerca semantica coerente

- [ ] Allineare la pipeline embeddings alla visibilita reale dei contenuti
- [ ] Evitare leakage premium o leakage di ruolo tramite retrieval semantico
- [ ] Coprire documenti, revisioni, commenti e note con riferimenti utili in risposta
- [ ] Definire quando usare semantic search e quando query strutturate

## P4 - UI, gating e UX

- [ ] Decidere se l'assistente stesso e una feature sempre disponibile o soggetta a gating dedicato
- [ ] Allineare visibilita della UI assistant alle decisioni di prodotto
- [ ] Mostrare badge di contesto corretti anche in operativa
- [ ] Introdurre conferma UI per azioni sensibili
- [ ] Rendere coerenti i messaggi di blocco, limite piano e limite ruolo

## P5 - Test e verifica

- [ ] Test integrazione su auth assistant con JWT utente reale
- [ ] Test su isolamento tra contesto privato, impresa e progetto
- [ ] Test su scadenze di oggi in modalita normale
- [ ] Test su scadenze di oggi in operativa
- [ ] Test su limiti free vs sponsored vs paid
- [ ] Test su milestone e finance non accessibili quando bloccate
- [ ] Test su chat general-only dove previsto
- [ ] Test su mutazioni task con permessi reali utente
- [ ] Test su retrieval semantico senza leakage
- [ ] Script QA dei principali scenari canonici

---

## Decisioni Ancora da Chiudere

Questi punti non bloccano la scrittura del documento, ma vanno congelati prima della produzione.

- [!] L'assistente e sempre visibile oppure ha una feature dedicata nel modello pricing?
- [!] Il cambio contesto su richiesta utente potra esistere? Se si, con quale UX e con quali paletti?
- [!] I messaggi in chat vengono inviati direttamente oppure solo come bozza da confermare?
- [!] Le scritture finance fanno parte del perimetro assistant oppure restano escluse dalla prima versione?
- [!] Le chat assistant, i log e le embeddings hanno quale politica di retention?

---

## Definizione di "Assistente Pronto"

L'assistente puo essere considerato pronto solo quando sono vere tutte queste condizioni:

- tutta la fondazione P0 e chiusa
- tutte le letture P1 previste per la prima release sono allineate
- le eventuali azioni P2 scelte per la prima release sono whitelistate, confermate dove serve e testate
- non esistono bypass noti di RLS, capability o pricing
- i casi canonici di questo documento passano in QA
- il comportamento dell'assistente e spiegabile file per file e test per test

Finche una di queste condizioni non e vera, l'assistente va considerato ancora in lavorazione.
