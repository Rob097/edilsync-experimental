# EdilSync - Pricing Contract Phase 0

## Stato del documento

Questo documento e il contratto congelato della **Phase 0 - Freeze the contract**.

Serve come riferimento unico per le fasi successive di implementazione.

Da questo momento:

- le decisioni qui dentro si considerano bloccate salvo modifica esplicita
- backend, frontend, Stripe e sito pubblico dovranno allinearsi a questo documento
- in questa prima implementazione si lavora **solo nella modalita normale**
- la modalita operativa verra adattata in una fase finale dedicata
- la superficie legacy verra rimossa in uno step successivo separato

---

## Scopo

La Phase 0 non introduce ancora logiche runtime.

La sua funzione e definire in modo preciso:

- chi paga
- cosa sblocca il piano della societa
- cosa sblocca la sponsorizzazione di un progetto
- quali feature sono free e quali paid
- quali casi limite vanno implementati nelle fasi successive
- quali comportamenti UX sono da considerare parte del contratto prodotto

---

## Principi base

1. Il piano commerciale e associato alla **societa**, non al ruolo `contractor`.
2. Il premium progettuale e associato alla **sponsorizzazione del progetto**.
3. Un progetto puo avere **un solo sponsor attivo**.
4. Un progetto sponsorizzato sblocca le feature premium progettuali per **tutti i partecipanti del progetto**.
5. Le feature premium societarie restano invece legate solo alla societa con piano paid.
6. La perdita di piano o sponsorizzazione **non elimina dati**, ma rimuove accesso in lettura e scrittura alle aree premium.

---

## Attori principali

## 1. Privato

Il privato usa EdilSync nel proprio contesto personale.

Regole congelate:

- il privato e sempre free
- il privato puo creare progetti
- il privato puo essere homeowner del progetto
- il privato puo invitare societa nel progetto
- il privato puo avere **al massimo 1 progetto non sponsorizzato**
- se il suo progetto viene sponsorizzato, puo crearne un altro non sponsorizzato

## 2. Societa free

La societa free e una societa registrata senza abbonamento paid.

Regole congelate:

- puo partecipare ai progetti
- puo creare progetti
- puo avere **al massimo 1 progetto non sponsorizzato** di cui e owner
- se il suo progetto viene sponsorizzato, puo crearne un altro non sponsorizzato
- se viene invitata in un progetto sponsorizzato, ottiene solo le feature premium **progettuali** e solo in quel progetto
- non ottiene feature premium societarie

## 3. Societa paid

La societa paid e una societa con abbonamento attivo.

Regole congelate:

- sblocca le feature premium societarie
- puo sponsorizzare un progetto
- se crea un progetto, lo sponsorizza automaticamente
- se perde il piano paid, perde le feature premium societarie e i progetti sponsorizzati da lei perdono la sponsorizzazione

## 4. Homeowner

Ogni progetto ha **un solo homeowner canonico**.

Regole congelate:

- puo essere privato o societa
- per ora e l'unico attore personale ammesso nei nuovi flussi
- altri partecipanti personali vengono esclusi per ora dal refactor
- il homeowner ha i diritti da owner del progetto, ma non coincide automaticamente con lo sponsor

## 5. Sponsor del progetto

Lo sponsor e la societa paid che abilita il premium di progetto.

Regole congelate:

- un progetto puo avere un solo sponsor attivo
- lo sponsor sblocca le feature premium progettuali per tutti i partecipanti
- se lo sponsor esce dal progetto o perde il piano, il progetto smette di essere sponsorizzato
- nessun altro effetto automatico sullo storico dati, che resta nel database

---

## Stati del progetto

Ogni progetto, ai fini del pricing, si trova in uno di questi stati:

1. **Non sponsorizzato**
2. **Sponsorizzato**
3. **Bloccato per perdita sponsor**

### 1. Non sponsorizzato

Il progetto usa solo le feature free progettuali.

### 2. Sponsorizzato

Il progetto usa le feature free progettuali piu tutte le feature premium progettuali.

### 3. Bloccato per perdita sponsor

Questo stato speciale si applica quando:

- un progetto era sponsorizzato
- perde la sponsorizzazione
- il suo owner ha gia un altro progetto non sponsorizzato

In questo caso il progetto:

- non retrocede semplicemente a progetto free normale
- viene **inibito**
- mantiene i dati premium nel database
- permette solo le azioni strettamente necessarie a far rientrare uno sponsor
- deve comunque consentire l'invito di altre societa che possano sponsorizzarlo

---

## Macro feature inventory congelata

La feature inventory ufficiale e volutamente grossolana.

Le sotto-feature tecniche verranno gestite nelle fasi successive, ma non fanno parte del contratto commerciale di Phase 0.

## Feature societarie

1. Gestione societa
2. Membri societa
3. Chat interna societa
4. Documenti societa
5. Timbrature
6. Workspace operativo societa
7. Fatturazione e abbonamento

## Feature progettuali

1. Creazione e sponsorizzazione progetto
2. Partecipanti progetto
3. Panoramica e feed progetto
4. Attivita
5. Milestone
6. Varianti
7. Contestazioni
8. Calendario ed eventi
9. Chat di progetto
10. Documenti di progetto
11. Economia di progetto
12. Workspace operativo progetto

---

## Mappatura Free / Paid congelata

## Company Free

La societa free ha accesso a:

- Gestione societa
- Membri societa
- Chat interna societa **solo canale General**
- Documenti societa base
- Workspace operativo societa base
- Partecipazione ai progetti
- Creazione di 1 progetto non sponsorizzato alla volta

La societa free non ha accesso a:

- Timbrature
- Feature premium societarie
- Sponsorizzazione progetto
- Chat interna multi-canale
- Documenti societa avanzati

Nei propri progetti non sponsorizzati puo invitare **solo l'homeowner**.

## Company Paid

La societa paid ha accesso a:

- tutto il blocco free
- Timbrature
- Chat interna societa completa
- Documenti societa completi
- Workspace operativo societa completo
- Fatturazione e abbonamento
- Sponsorizzazione progetto

Se crea un progetto, lo sponsorizza automaticamente.

## Project Free

Un progetto non sponsorizzato ha accesso a:

- Partecipanti progetto
- Panoramica e feed progetto
- Attivita
- Varianti senza collegamento all'economia
- Contestazioni
- Calendario ed eventi
- Chat di progetto **solo canale General**
- Documenti di progetto base
- Workspace operativo progetto base

Un progetto non sponsorizzato non ha accesso a:

- Milestone
- Economia di progetto
- Chat progetto avanzata
- Documenti progetto avanzati

## Project Sponsored

Un progetto sponsorizzato ha accesso a:

- tutto il blocco free di progetto
- Milestone
- Economia di progetto
- Chat di progetto avanzata
- Documenti di progetto avanzati
- Workspace operativo progetto con feature premium progettuali

Le societa free invitate in un progetto sponsorizzato:

- sbloccano queste feature solo nel progetto sponsorizzato
- non ottengono feature premium societarie
- non cambiano stato di piano a livello globale

---

## Contratto UX congelato

## 1. Restrizioni di piano

Le feature premium bloccate per piano o sponsorizzazione:

- vanno mostrate in UI in forma bloccata
- devono far capire all'utente che la funzione esiste
- devono esporre CTA coerenti con il contesto

## 2. Restrizioni di ruolo

Le feature non disponibili solo per ruolo:

- non vanno mostrate
- non devono generare placeholder premium

## 3. Tab Fatturazione

La nuova sezione `Fatturazione` va nella pagina dettaglio societa.

Visibilita congelata:

- visibile solo agli admin della societa
- visibile sia in contesto societa sia in contesto privato quando l'admin apre il dettaglio di quella societa

## 4. Card stato sponsorizzazione progetto

Nel dettaglio progetto, prima della card descrizione, va mostrata una card con stato sponsorizzazione.

Stati previsti:

- progetto non sponsorizzato
- progetto sponsorizzato da societa X dal giorno Y

La card deve avere:

- icona info con modale `Cosa significa`
- CTA per sponsorizzare se l'utente e admin di una societa paid partecipante
- CTA per upgrade se l'utente e admin di una societa free partecipante

## 5. Modale Invita Partecipante

La modale di invito deve mostrare messaggi diversi in base a:

- progetto sponsorizzato + societa invitata free
- progetto sponsorizzato + societa invitata paid
- progetto non sponsorizzato + societa invitata free
- progetto non sponsorizzato + societa invitata paid

Comportamenti congelati:

- progetto sponsorizzato + societa free: messaggio che spiega che la societa avra le feature premium progettuali grazie alla sponsorizzazione
- progetto sponsorizzato + societa paid: nessun messaggio specifico necessario
- progetto non sponsorizzato + societa free: messaggio che spiega che potra partecipare solo con feature gratuite
- progetto non sponsorizzato + societa paid: messaggio/CTA che spiega che la societa potra sponsorizzare il progetto

---

## Casi limite congelati

## 1. Perdita sponsor

Se una societa sponsor:

- perde il piano paid
- oppure lascia il progetto

allora:

- il progetto perde la sponsorizzazione immediatamente
- le feature premium progettuali diventano invisibili/inaccessibili
- i dati premium restano nel database

## 2. Riattivazione successiva

Se una societa riattiva l'abbonamento o un progetto viene nuovamente sponsorizzato:

- i dati premium devono tornare disponibili
- lo stato dei dati deve essere preservato

## 3. Nessun grace period

Non esiste grace period.

La perdita del diritto produce effetto immediato.

## 4. Eliminazione dati

I dati premium non vanno eliminati a downgrade o perdita sponsor.

La cancellazione dati puo avvenire solo in eventuali flussi espliciti di eliminazione societa e con UX dedicata.

---

## Out of scope per le prime fasi

Questi temi vengono esplicitamente rimandati:

- adattamento modalita operativa
- rimozione superficie legacy
- cap di storage
- complessita fiscale / VAT internazionale
- piani paid multipli
- reintroduzione partecipanti personal oltre all'homeowner
- monetizzazione fine-grained delle contestazioni
- BIM come discriminante commerciale del primo rollout

---

## Artefatti che dovranno derivare da questo documento

Le fasi successive dovranno produrre, in quest'ordine:

1. matrice capability finale
2. schema database piani / sponsorship / feature rules
3. logiche backend autoritative
4. gating frontend in modalita normale
5. billing UX societa
6. sponsor UX progetto
7. integrazione Stripe
8. aggiornamento sito pubblico

---

## Decisione finale di Phase 0

La Phase 0 si considera completata quando questo documento e accettato come fonte di verita per:

- prodotto
- backend
- frontend
- billing
- sito pubblico

In caso di conflitto con documenti precedenti, prevale questo documento.