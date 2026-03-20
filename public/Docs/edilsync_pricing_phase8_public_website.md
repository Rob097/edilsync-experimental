# EdilSync - Pricing Phase 8 Public Website Alignment

## Scopo

La Phase 8 allinea il sito pubblico al contratto pricing ormai implementato in app, backend e billing.

Prima di questa fase il sito pubblico continuava a comunicare un modello ormai superato:

- "paga il contractor"
- trial di 30 giorni
- progetti illimitati
- utenti illimitati

Queste promesse non erano piu coerenti con il rollout reale basato su:

- societa free o paid
- sponsorship progetto come meccanismo di sblocco premium progettuale
- privato sempre free
- limiti specifici sui progetti non sponsorizzati

---

## Messaggio pubblico introdotto

Il sito pubblico comunica ora il modello corretto:

- il privato resta free
- la societa puo restare free oppure passare a Pro
- il premium societario appartiene alla societa paid
- il premium progettuale si sblocca tramite sponsorship attiva del progetto
- homeowner, subappaltatori e professionisti possono entrare gratis nei progetti a cui sono invitati

Il sito non promette piu trial separati ne claim di "illimitato" non garantiti dal contratto prodotto.

---

## Aree aggiornate

### 1. Pricing page

Aggiornata:

- `src/public/pages/PricingPage.jsx`

Allineamenti principali:

- piano societa paid a `€19/mese` o `€190/anno`
- distinzione tra premium societario e premium di progetto
- spiegazione del ruolo della sponsorship progetto
- rimozione di claim su progetti illimitati, utenti illimitati e trial 30 giorni

### 2. Home page pubblica

Aggiornati i contenuti localizzati:

- `src/public/i18n/home.it.json`
- `src/public/i18n/home.en.json`

Allineamenti principali:

- CTA non piu basate su free trial
- pricing block coerente con company + sponsorship
- rimozione del messaggio "contractor pays"

### 3. FAQ pubblica

Aggiornata:

- `src/public/pages/FaqPage.jsx`

Allineamenti principali:

- costo corretto della societa Pro
- spiegazione del fatto che non esiste un trial separato
- chiarimento su homeowner, subappaltatori e professionisti gratuiti su invito

### 4. Landing pages e pagine marketing

Aggiornate:

- `src/public/pages/HowItWorksPage.jsx`
- `src/public/pages/StaticMarketingPage.jsx`
- `src/public/pages/ContractorsPage.jsx`
- `src/public/pages/TransparencyPage.jsx`
- `src/public/pages/SubcontractorsPage.jsx`
- `src/public/pages/ProfessionalsPage.jsx`
- `src/public/pages/DisputeProtectionPage.jsx`
- `src/public/pages/TeamCoordinationPage.jsx`

Allineamenti principali:

- CTA non piu basate su trial 30 giorni
- copy aggiornata sul fatto che l accesso gratuito dei collaboratori avviene dentro progetti invitati
- messaggi premium ricondotti al binomio societa paid + sponsorship progetto

---

## Decisioni di comunicazione deliberate

La Phase 8 non prova a spiegare tutto il contratto prodotto in ogni pagina.

La scelta e stata:

- mantenere il sito comprensibile commercialmente
- eliminare promesse sbagliate o troppo larghe
- introdurre il modello company + sponsorship come schema pubblico coerente

I dettagli edge-case, come il blocco per perdita sponsor o il limite di un solo progetto non sponsorizzato, restano documentati nelle fasi tecniche e nel prodotto, ma non sono stati trasformati in copy invasiva sulle landing generiche.

---

## Stato finale di fase

La Phase 8 e completata.

Risultato operativo:

- il sito pubblico non contraddice piu il contratto pricing implementato
- il modello commerciale pubblico e coerente con Supabase, frontend applicativo e Stripe
- il linguaggio di acquisizione evita claim non supportati dal prodotto reale