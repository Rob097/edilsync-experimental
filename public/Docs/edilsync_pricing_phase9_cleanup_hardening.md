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

Il rollout iniziale era stato vincolato alla sola modalita normale, con modalita operativa da adattare successivamente e una superficie legacy da ritirare in uno step finale dedicato.

La Phase 9 completa questo cleanup sul prodotto attivo.

### 1. Modalita legacy rimossa dalle entry point attive

Aggiornati:

- `src/Layout.jsx`
- `src/operativa/OperativeLayout.jsx`
- `src/components/tour/tours/onboardingTour.jsx`
- `src/public/pages/FeaturesPage.jsx`

Effetti principali:

- il menu utente della UI normale non offre piu il passaggio alla superficie legacy
- la modalita operativa non offre piu un ritorno a una modalita rimossa
- il tour iniziale non presenta piu una terza superficie applicativa non supportata
- la pagina pubblica delle feature non pubblicizza piu una modalita non attiva

### 2. Messaging pubblico allineato

La pagina feature pubblica presenta ora:

- workspace normale
- modalita operativa
- accesso contestuale per ruolo

In questo modo il sito descrive solo superfici realmente rilevanti nel prodotto attivo.

---

## Hardening compatibilita runtime

Aggiornati:

- `src/App.jsx`
- `src/lib/ui-mode.js`

### 1. Normalizzazione dello stato locale

Lo storage locale della UI poteva contenere ancora un valore legacy non piu supportato.

Ora il runtime:

- normalizza automaticamente i valori legacy verso `normal`
- riscrive il valore normalizzato in localStorage
- impedisce che uno stato locale vecchio riporti l utente in una modalita non piu supportata dal rollout attivo

### 2. Redirect sicuri per path legacy

I path legacy non aprono piu una superficie dedicata nel flusso attivo.

Questo preserva compatibilita minima per stato locale storico senza mantenere una terza modalita come entry point ufficiale.

---

## Chiusura del cleanup

Il cleanup e stato poi completato con la rimozione del codice legacy residuo e dei riferimenti documentali o runtime rimasti nel repository.

---

## Stato finale di fase

La Phase 9 e completata.

Risultato operativo:

- il rollout pricing/access in modalita normale e chiuso end-to-end
- il prodotto attivo espone solo modalita normale e modalita operativa
- lo stato UI locale legacy viene gestito in modo sicuro
- il sito pubblico e l onboarding descrivono solo superfici coerenti con il rollout finale