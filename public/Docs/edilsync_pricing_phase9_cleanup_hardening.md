# EdilSync - Pricing Phase 9 Cleanup And Hardening

## Scopo

La Phase 9 chiude il rollout pricing/access con una passata finale di cleanup e hardening.

Dopo le fasi 0-8 il modello commerciale e autorizzativo era corretto, ma restavano due rischi residui:

- superfici utente ancora esposte a modalita non piu parte del rollout attivo
- stato UI locale o URL legacy che potevano riportare l utente in percorsi non piu supportati dal rollout normale

Questa fase non introduce nuove capability di pricing.
Serve a rendere piu coerente e robusto il prodotto risultante.

---

## Cleanup modalita UI

Il rollout iniziale era stato vincolato alla sola modalita normale, con modalita operativa da adattare successivamente e modalita essenziale da rimuovere in uno step finale dedicato.

La Phase 9 completa questo cleanup sul prodotto attivo.

### 1. Essential mode rimosso dalle entry point attive

Aggiornati:

- `src/Layout.jsx`
- `src/operativa/OperativeLayout.jsx`
- `src/components/tour/tours/onboardingTour.jsx`
- `src/public/pages/FeaturesPage.jsx`

Effetti principali:

- il menu utente della UI normale non offre piu il passaggio a `Essential Mode`
- la modalita operativa non offre piu un ritorno alla modalita essenziale
- il tour iniziale non presenta piu `Essential Mode` come superficie consigliata
- la pagina pubblica delle feature non pubblicizza piu una modalita essenziale attiva

### 2. Messaging pubblico allineato

La pagina feature pubblica presenta ora:

- workspace normale
- modalita operativa
- accesso contestuale per ruolo

In questo modo il sito descrive solo superfici realmente rilevanti nel prodotto attivo.

---

## Hardening compatibilita runtime

Aggiornati:

- `src/essential/essential-mode.js`
- `src/App.jsx`

### 1. Normalizzazione dello stato locale

Lo storage locale della UI poteva contenere ancora il valore legacy `essential`.

Ora il runtime:

- normalizza automaticamente `essential -> normal`
- riscrive il valore normalizzato in localStorage
- impedisce che uno stato locale vecchio riporti l utente in una modalita non piu supportata dal rollout attivo

### 2. Redirect sicuri per path legacy

I path legacy `essenziale/*` non aprono piu la superficie essenziale nel flusso attivo.

Ora vengono reindirizzati verso:

- `/app`

Questo preserva compatibilita minima per bookmark o link storici senza mantenere la modalita come entry point ufficiale.

---

## Scelta deliberata di cleanup

La Phase 9 non elimina ancora tutto il codice storico sotto `src/essential/`.

La scelta e intenzionale:

- rimuovere prima le entry point attive e il messaging utente
- mantenere temporaneamente il codice legacy fuori dal percorso principale per ridurre blast radius
- chiudere il rollout con un prodotto coerente e piu sicuro senza introdurre una refactor distruttiva non necessaria

In altre parole: la modalita essenziale non fa piu parte del prodotto esposto, anche se parte del codice storico resta nel repository come materiale legacy non attivato.

---

## Stato finale di fase

La Phase 9 e completata.

Risultato operativo:

- il rollout pricing/access in modalita normale e chiuso end-to-end
- il prodotto attivo non espone piu entry point incoerenti verso `Essential Mode`
- gli URL legacy e lo stato UI locale vengono gestiti in modo sicuro
- il sito pubblico e l onboarding descrivono solo superfici coerenti con il rollout finale