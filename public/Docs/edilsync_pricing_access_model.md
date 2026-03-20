# EdilSync - Modello Pricing e Accessi

> Nota: questo documento resta utile come analisi e razionalizzazione iniziale.
>
> Il documento canonico congelato per l'implementazione e ora `public/Docs/edilsync_pricing_phase0_contract.md`.

## Scopo di questo documento

Questo documento riassume e formalizza in modo semplice il ragionamento fatto sul pricing di EdilSync.

L'obiettivo e definire:

- chi paga
- chi puo usare il prodotto gratis
- quali funzionalita dipendono dal piano della societa
- come funziona tutto dentro ai progetti
- quali casi limite vanno gestiti

Il punto di partenza e questo:

**in EdilSync il ruolo `contractor` non e un ruolo globale. E un ruolo contestuale dentro a uno specifico progetto.**

Per questo motivo, il pricing non deve dipendere direttamente dal fatto che una societa sia o non sia `contractor` in generale.

---

## Idea base

La regola principale consigliata e questa:

**il piano e associato alla societa, non al ruolo di progetto.**

Quindi:

- il privato usa EdilSync gratis
- una societa puo avere un piano `free` oppure `paid`
- il progetto puo essere normale oppure sponsorizzato da una societa `paid`
- i diritti del committente sono separati dai diritti premium del progetto

---

## Concetti chiave

## 1. Privato

Il privato e una persona fisica che usa EdilSync nel proprio contesto personale.

Nel modello consigliato:

- il privato non paga
- il privato puo creare progetti
- il privato puo essere committente del progetto
- il privato puo invitare societa nel progetto
- il privato non sblocca automaticamente le funzionalita premium per le societa invitate

## 2. Societa

La societa e l'unita commerciale e operativa del sistema.

Una societa puo avere:

- piano `free`
- piano `paid`
- in futuro altri piani

## 3. Committente

Ogni progetto ha un solo committente canonico.

Il committente puo essere:

- una persona fisica
- una societa

Il committente ha sempre i diritti che servono per governare il progetto dal lato owner.

Importante:

**essere committente non significa automaticamente sbloccare le feature premium condivise del progetto.**

## 4. Sponsor del progetto

Per rendere il modello semplice e coerente, conviene introdurre il concetto di:

**societa sponsor del progetto**

Una societa sponsor e una societa con piano `paid` che abilita le funzionalita premium condivise in quello specifico progetto.

Quindi bisogna separare:

- diritti del committente
- diritti del ruolo di progetto
- diritti derivanti dal fatto che una societa sia sponsor `paid`

---

## Regole consigliate

## Regola 1 - Il privato e sempre free

Il privato puo:

- creare progetti
- essere committente
- invitare societa
- vedere e usare il progetto come owner

Il privato non abilita il premium per le societa invitate.

## Regola 2 - La societa ha un piano proprio

Ogni societa sceglie un proprio piano.

Il piano determina:

- le feature aziendali disponibili
- le feature di orchestrazione progetto disponibili
- la capacita di sponsorizzare o meno un progetto

## Regola 3 - Una societa `free` puo creare progetti

Una societa `free` puo creare infiniti progetti, ma con limiti.

Puo:

- creare il progetto
- invitare il committente, se non e gia lei il committente
- lavorare nei propri progetti con funzionalita limitate
- accettare inviti a infiniti progetti

Non puo:

- invitare altre societa nel progetto, salvo i casi esplicitamente concessi al committente se vuoi mantenerli
- sponsorizzare premium il progetto
- usare le feature aziendali e progettuali avanzate riservate al piano `paid`

## Regola 4 - Una societa `paid` sblocca il progetto che sponsorizza

Una societa `paid` puo:

- usare tutte le feature aziendali
- creare infiniti progetti
- invitare altre societa nei progetti
- sponsorizzare il progetto

Se un progetto e sponsorizzato da una societa `paid`, le altre societa invitate in quello specifico progetto possono usare le feature operative premium del progetto, ma non acquisiscono automaticamente i diritti aziendali completi.

Quindi una societa invitata in un progetto sponsorizzato:

- puo usare meglio quel progetto
- non diventa automaticamente una societa `paid`
- non sblocca funzioni trasversali fuori da quel progetto

## Regola 5 - Un solo committente canonico per progetto

Per semplificare prodotto, pricing e permessi, e consigliato avere:

- un solo committente principale per progetto

Il committente puo essere:

- un privato
- una societa

Se servono piu referenti lato committenza, e meglio modellarli come:

- membri della societa owner
- oppure referenti collegati

ma non come piu committenti canonici distinti.

## Regola 6 - Solo il committente puo essere partecipante personale

Per semplificare molto il prodotto, e consigliato questo vincolo:

- se il committente e una persona fisica, e l'unico partecipante `personal` del progetto
- tutti gli altri partecipanti entrano come societa

Questa scelta riduce complessita su:

- pricing
- inviti
- permessi
- casi ambigui con professionisti singoli

Se un professionista lavora da solo, puo usare una societa monoutente.

---

## Cosa cambia tra piano Free e Paid

## Piano Free per societa

### A livello aziendale

Molte feature aziendali possono essere bloccate.

Esempi sensati di blocco:

- gestione avanzata del team aziendale
- workspace societa completo
- funzioni trasversali multi-progetto
- funzioni amministrative o configurazioni avanzate

### A livello progetto

Una societa `free` puo:

- creare infiniti progetti
- invitare il committente
- lavorare nei progetti dove e presente
- accettare infiniti inviti

Ma non dovrebbe poter:

- invitare altre societa, tranne eventuali eccezioni volute lato committente
- usare il progetto come hub multi-azienda completo
- usare tutte le funzioni premium di orchestrazione

## Piano Paid per societa

### A livello aziendale

Tutte le feature aziendali sono attive.

### A livello progetto

La societa `paid` puo:

- creare infiniti progetti
- usare tutte le feature di progetto disponibili per il proprio ruolo
- invitare altre societa
- sponsorizzare il progetto

Le societa invitate in quel progetto possono ricevere le feature premium operative del progetto, ma solo in quel progetto.

Non ottengono automaticamente:

- diritti di invitare altre societa
- feature aziendali globali
- premium su tutti gli altri progetti

---

## Distinzione fondamentale: diritti del committente e diritti sponsor

Questo e il punto piu importante di tutto il modello.

## Diritti del committente

Il committente deve poter fare tutto cio che gli compete come owner del progetto.

Per esempio:

- vedere tutto il progetto
- approvare o rifiutare decisioni e change request
- coordinare dal lato owner
- avere visibilita completa di avanzamento e documentazione

## Diritti sponsor

I diritti sponsor servono invece a sbloccare il progetto come ambiente premium multi-azienda.

Per esempio:

- invitare altre societa con piena operativita nel progetto
- sbloccare funzioni avanzate operative condivise
- usare il progetto come workspace premium strutturato

Quindi:

**il committente non deve automaticamente coincidere con lo sponsor premium del progetto.**

---

## Funzionalita da lasciare disponibili alle societa non abbonate

Una societa non abbonata, se invitata nel progetto, deve comunque poter collaborare davvero.

Ha senso lasciarle disponibili:

- visione del progetto, secondo il proprio ruolo
- task assegnati
- chat di progetto
- documenti rilevanti
- calendario e scadenze rilevanti
- caricamento di evidenze, foto e documentazione di base

Se blocchi anche queste cose, l'invito al progetto perde senso.

---

## Funzionalita da riservare al piano Paid o alla sponsorship premium

Ha invece senso inibire alle societa `free`:

- invito di altre societa
- piena orchestrazione multi-azienda del progetto
- funzioni finance avanzate
- setup avanzato e amministrazione economica
- funzioni aziendali trasversali
- gestione completa del proprio workspace societa

In breve:

- la societa `free` puo partecipare
- la societa `paid` puo orchestrare

---

## Esempi concreti

## Esempio 1 - Privato crea progetto e invita una societa

### Scenario

Mario e un privato. Crea un progetto per ristrutturare casa sua.

Poi invita la societa `EdilRossi`.

### Risultato consigliato

- Mario usa tutto gratis come committente
- Mario puo vedere e governare il progetto dal lato owner
- `EdilRossi` entra nel progetto
- se `EdilRossi` ha piano `free`, lavora con accesso base o limitato
- se `EdilRossi` ha piano `paid`, puo usare le feature premium previste per il suo ruolo

Il fatto che il progetto sia nato da un privato non rende automaticamente premium il progetto per la societa invitata.

## Esempio 2 - Societa Free crea progetto come impresa e invita il committente

### Scenario

La societa `Impresa Bianchi`, con piano `free`, crea un progetto.

Invita il committente privato.

### Risultato consigliato

- la societa puo creare il progetto
- puo invitare il committente
- il committente ha i suoi diritti da owner lato committenza
- la societa `free` usa il progetto con i limiti del piano `free`
- la societa non puo invitare altre societa
- il progetto non e sponsorizzato premium

## Esempio 3 - Societa Free crea progetto indicando se stessa come committente

### Scenario

La societa `Immobiliare Alfa`, con piano `free`, crea un progetto come proprietaria/committente.

Poi invita una impresa esecutrice.

### Risultato consigliato

- `Immobiliare Alfa` e il committente canonico del progetto
- ha i diritti del committente
- puo coordinare il progetto dal lato owner
- il progetto non diventa automaticamente premium
- l'impresa invitata non riceve automaticamente tutte le feature premium
- per sbloccare il progetto come ambiente premium condiviso serve una societa sponsor `paid`

Questo caso e importante per evitare che una societa `free` aggiri il piano `paid` dichiarandosi owner del progetto.

## Esempio 4 - Societa Paid crea progetto e invita altre societa

### Scenario

La societa `Impresa Verdi`, con piano `paid`, crea un progetto e invita:

- committente
- elettricista
- idraulico
- studio tecnico

### Risultato consigliato

- `Impresa Verdi` usa tutte le feature del proprio piano
- il progetto e sponsorizzato premium
- le altre societa invitate possono usare le feature premium operative di quel progetto
- le societa invitate non possono a loro volta invitare altre societa, a meno che non abbiano un proprio abbonamento o un permesso specifico che vuoi introdurre in futuro

## Esempio 5 - Una societa Paid disattiva il proprio abbonamento

### Scenario

La societa sponsor `paid` disattiva il proprio abbonamento.

### Risultato consigliato

Non conviene bloccare brutalmente l'accesso al progetto a tutti gli altri.

Meglio fare cosi:

- il committente continua ad accedere sempre
- il progetto perde lo stato di progetto premium sponsorizzato
- le societa invitate mantengono almeno accesso base o in lettura
- le feature premium condivise vengono disattivate o degradate
- un'altra societa puo diventare sponsor `paid` del progetto

Questo evita lock-in troppo aggressivo e rende il sistema piu credibile.

---

## Risposte sintetiche alle domande principali

## Chi paga?

Paga la societa che sceglie un piano `paid`.

## Il privato paga?

No.

## Il committente ha sempre tutti i diritti?

Si, ma nei limiti del ruolo di committente.

Non significa automaticamente sbloccare il premium condiviso per tutte le societa del progetto.

## Una societa free puo creare progetti?

Si.

## Una societa free puo invitare altre societa?

Idealmente no, salvo eccezioni molto deliberate.

## Una societa paid puo invitare altre societa?

Si.

## Una societa invitata in un progetto sponsorizzato diventa paid?

No.

Sblocca solo le feature premium di quel progetto specifico.

## Ci possono essere piu committenti in un progetto?

La scelta consigliata e no.

Meglio un solo committente canonico per progetto.

## Ci possono essere altri privati nel progetto oltre al committente?

La scelta consigliata e no.

Se il committente e una persona, e l'unico partecipante personale del progetto.

---

## Modello finale consigliato in una frase

**Privato sempre gratis, societa con piano proprio, un solo committente per progetto, e feature premium condivise abilitate solo se esiste una societa sponsor `paid` per quel progetto.**

---

## Punti ancora da confermare

I punti che andranno decisi in modo definitivo sono questi:

1. una societa `free` puo invitare solo il committente oppure anche altri soggetti in casi particolari?
    - Solo committente a meno che lei non sia il committente stesso
2. quali feature operative restano disponibili a una societa `free` invitata?
    - Da valutare
3. quali feature premium condivise si sbloccano esattamente in un progetto sponsorizzato?
    - Da valutare
4. quanto deve durare un eventuale periodo di degradazione quando uno sponsor `paid` disattiva l'abbonamento?
    - Da valutare
5. vuoi davvero eliminare tutti i partecipanti `personal` diversi dal committente anche lato modello dati futuro?
    - Non eliminare ma magari nascondere la possibilità di invitare utenti personal da UI per il momento.

Finche questi punti non sono fissati, il modello generale resta comunque valido, ma alcune regole operative dovranno ancora essere definite meglio.