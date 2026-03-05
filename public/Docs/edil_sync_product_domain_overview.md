# EdilSync

## Cos’è EdilSync

**EdilSync** è un SaaS per la gestione strutturata di cantieri edili e ristrutturazioni, progettato per risolvere un problema preciso: **la complessità relazionale** tra persone, società e progetti nel settore edilizio.

Non è un gestionale generico, né un semplice project manager.
EdilSync è una **piattaforma contestuale**, dove **ruoli, permessi e responsabilità dipendono sempre dal contesto operativo**, non dall’utente in modo statico.

---

## Problema che risolve

Nel mondo reale dei cantieri:

- una persona può essere **privato**, **amministratore di un’impresa**, **professionista**
- una società può lavorare su più cantieri, con **subappalti a catena**
- le responsabilità cambiano **nel tempo** e **da progetto a progetto**
- i ruoli rigidi ("sei contractor", "sei cliente") **non funzionano**

La maggior parte dei software forza questi scenari dentro modelli statici.
EdilSync nasce per fare l’opposto.

---

## Principio fondamentale

> **I permessi dipendono sempre dal contesto, mai solo dall’utente.**

Non esistono ruoli globali rigidi.
Esistono **persone**, **società**, **progetti** e **relazioni contestuali** tra loro.

---

## Attori fondamentali

### Persona (User)

- È **sempre una persona fisica**
- Ha **un solo account**
- Può:
  - agire come privato cittadino
  - rappresentare una o più società
  - partecipare a progetti con ruoli diversi nel tempo

La persona **non ha un ruolo fisso**.
Il ruolo emerge dal **contesto in cui sta operando**.

---

### Società (Company)

Rappresenta un’**entità giuridica**.

Caratteristiche:

- collegata a una o più persone
- almeno un amministratore
- può partecipare a più progetti
- può assumere subappalti
- può avere membri con professioni diverse

La società è l’unità operativa nei cantieri.

---

## Tipologie di utenti (logiche, non tecniche)

Queste non sono classi rigide, ma **ruoli funzionali che emergono nei progetti**.

### Homeowner / Committente

Chi commissiona i lavori.

Può essere:

- un privato cittadino
- una società

Caratteristiche:

- esiste sempre almeno una persona di riferimento
- può creare progetti
- può invitare società
- coordina il cantiere

---

### Contractor / Main Contractor

Chi esegue i lavori principali.

- è **sempre una società** (serve P.IVA)
- può essere impresa specializzata o chiavi in mano
- può subappaltare parti del lavoro

---

### Subcontractor

- società o professionista
- lavora per conto di un’altra società
- entra nel progetto solo tramite invito
- ha accesso limitato al progetto

---

### Progettisti (Ingegnere, Architetto, Geometra, Designer)

- singolo professionista o studio
- strutturalmente identici alle altre società
- ruolo specifico nel progetto

---

## Il concetto chiave: il Contesto

### Contesto applicativo (User Context)

Ogni persona può usare EdilSync in contesti diversi nel tempo:

- oggi come homeowner
- domani come contractor
- in futuro come progettista

Il contesto:

- cambia l’interfaccia
- cambia le azioni disponibili
- **non crea account diversi**
- **non duplica dati**

È una **modalità operativa**, non un ruolo rigido.

---

### Contesto di società

Quando una persona agisce per conto di una società:

- le azioni sono attribuite alla società
- i permessi dipendono dal ruolo nella società (admin / membro)
- può essere associata una professione

Serve a:

- chiarire responsabilità
- evitare ambiguità nei cantieri
- tracciare chi fa cosa

---

### Contesto di progetto

Dentro ogni progetto:

- persone e società hanno ruoli specifici
- i ruoli devono essere coerenti con il contesto applicativo

Esempio:

- un homeowner non può essere subcontractor nello stesso progetto
- una società entra con un ruolo coerente con la sua natura

---

## Progetto (Project)

Un progetto rappresenta un **cantiere reale**.

Caratteristiche:

- indirizzo obbligatorio
- committente definito
- coinvolge persone e società
- supporta contractor, subappalti, progettisti

Il progetto è un **contenitore di relazioni**, non solo un oggetto.

---

## Ruoli e permessi

### Filosofia

- nessun super-ruolo hardcoded
- nessuna gerarchia fissa
- tutto è relazionale e contestuale

Livelli di permesso:

1. Applicazione
2. Società (admin / membro + professione)
3. Progetto (ruolo operativo)

---

## Scenari nativi supportati

EdilSync supporta nativamente:

- persone che cambiano ruolo nel tempo
- persone che rappresentano più società
- società con membri di professioni diverse
- subappalti multipli
- progetti complessi con molti attori
- responsabilità chiare e tracciabili

---

## Visione MVP

L’MVP di EdilSync deve concentrarsi su:

- modellazione corretta di persone, società e progetti
- gestione dei contesti
- ruoli e permessi contestuali
- inviti e partecipazioni ai progetti

Funzionalità future (non MVP):

- messaggistica
- documenti
- calendario
- timeline di cantiere

---

## Linee guida di design

- SaaS moderno, pulito, orientato alla chiarezza
- UI che rende evidente **in che contesto stai operando**
- colore principale del brand: **#ef6144**

