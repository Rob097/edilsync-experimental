# EdilSync - Modello Pricing Attuale

## Stato del documento

Questo documento e la fonte canonica attuale del pricing di EdilSync.

Il rollout pricing e completo.

I documenti `edilsync_pricing_phase*.md` restano utili come archivio tecnico di implementazione, ma non sono piu il modo principale in cui il pricing va raccontato o compreso.

---

## Sintesi rapida

- ci si puo registrare gratuitamente
- si possono creare societa gratuitamente
- una societa free puo usare il prodotto con funzionalita limitate
- una societa con abbonamento attivo sblocca le funzionalita complete per se stessa
- un cantiere puo essere sponsorizzato da una societa con abbonamento attivo
- lo sponsor sblocca tutte le funzionalita del cantiere sponsorizzato per tutti i partecipanti, anche se appartengono ad altre societa
- la sponsorizzazione vale solo per quel cantiere e non trasforma globalmente le altre societa in societa paid

---

## Principio base

Il pricing lavora su due livelli distinti:

1. **Piano della societa**
2. **Sponsorizzazione del cantiere**

Il piano della societa sblocca le funzionalita della societa stessa.

La sponsorizzazione del cantiere sblocca invece le funzionalita del cantiere per tutti i partecipanti di quel solo cantiere.

---

## Livelli di accesso

## 1. Privato

Il privato usa EdilSync gratuitamente nel proprio contesto personale.

Puo:

- registrarsi gratuitamente
- usare il prodotto in contesto personale
- creare e gestire i propri cantieri come committente
- invitare societa nel cantiere

Nel modello attuale il privato non sblocca premium societario per nessun altro soggetto.

## 2. Societa free

Una societa puo essere creata gratuitamente.

La societa free:

- puo entrare nel prodotto senza abbonamento
- puo partecipare ai cantieri
- puo creare cantieri
- ha funzionalita limitate a livello societario e di cantiere non sponsorizzato

Nel comportamento attuale, la societa free puo possedere un solo cantiere non sponsorizzato alla volta.

## 3. Societa paid

Una societa con abbonamento attivo sblocca le funzionalita complete per se stessa.

Questo include il pieno accesso alle superfici societarie e la possibilita di sponsorizzare un cantiere.

Se una societa paid crea un nuovo cantiere, il cantiere viene sponsorizzato automaticamente.

## 4. Cantiere sponsorizzato

Un cantiere sponsorizzato eredita il premium dal suo sponsor attivo.

Questo significa che:

- tutte le funzionalita del cantiere si sbloccano per tutti i partecipanti
- lo sblocco vale anche per partecipanti appartenenti ad altre societa
- una societa free invitata in quel cantiere usa il premium solo dentro quel cantiere
- le funzionalita societarie fuori da quel cantiere restano quelle del suo piano reale

---

## Cosa sblocca il piano societario

Il piano societario riguarda la singola societa.

In termini di prodotto, sblocca il blocco completo delle funzionalita societarie, tra cui in generale:

- gestione societa completa
- membri societa
- chat interna societaria completa
- documenti societari completi
- timbrature
- workspace operativo societario completo
- fatturazione e abbonamento

---

## Cosa sblocca la sponsorizzazione del cantiere

La sponsorizzazione riguarda il singolo cantiere.

Sblocca per tutti i partecipanti del cantiere le superfici premium progettuali, tra cui in generale:

- milestone
- economia di progetto
- chat di progetto avanzata
- documenti di progetto avanzati
- workspace operativo progetto completo

Lo sponsor non cambia il piano globale delle altre societa partecipanti.

---

## Regole da tenere ferme

- il piano commerciale e associato alla societa, non al ruolo contractor come concetto globale
- un cantiere puo avere un solo sponsor attivo
- lo sponsor deve essere una societa con abbonamento attivo
- la perdita di piano o di sponsorizzazione non elimina i dati, ma rimuove l'accesso alle superfici premium
- i dati premium restano preservati e tornano disponibili se il diritto viene ripristinato

---

## Come leggere i documenti pricing del repository

Usare questi documenti in questo ordine:

1. `public/Docs/edilsync_pricing_model.md`
   Fonte canonica attuale del modello commerciale e dei suoi effetti sul prodotto.
2. `public/Docs/edilsync_pricing_access_model.md`
   Razionalizzazione storica iniziale utile per capire il ragionamento di partenza.

---

## Formula corta da usare anche nel sito e nella documentazione interna

EdilSync e gratuito per registrarsi e partire.

Le societa possono essere create gratis con funzionalita limitate.

Una societa con abbonamento attivo sblocca le funzionalita complete per se stessa.

Un cantiere sponsorizzato da una societa con abbonamento attivo sblocca tutte le funzionalita del cantiere per tutti i suoi partecipanti, anche se appartengono ad altre societa.